"""Lead creation and public installer discovery endpoints."""
from __future__ import annotations

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Assessment, Lead, LeadMatch
from app.db.session import get_db
from app.dependencies import check_rate_limit
from app.schemas.installer import InstallerPublic
from app.schemas.lead import LeadCreate, LeadResponse
from app.services import matching

logger = logging.getLogger("energyiq.leads")
router = APIRouter(tags=["leads"])


@router.post(
    "/leads",
    status_code=status.HTTP_201_CREATED,
    response_model=LeadResponse,
    summary="Submit lead for installer quote matching",
)
async def create_lead(
    payload: LeadCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # 1. Rate limiting (3/min per IP)
    await check_rate_limit(request, limit=3, window_seconds=60)

    # 2. Verify assessment exists
    stmt = select(Assessment).where(Assessment.id == payload.assessment_id)
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "assessment_not_found", "message": "Assessment not found."}},
        )

    # 3. Extract lat, lng, kwp
    lat = float(assessment.lat)
    lng = float(assessment.lng)
    kwp = 3.0
    if assessment.result and "sizing" in assessment.result:
        kwp = float(assessment.result["sizing"].get("recommended_kwp", 3.0))

    # 4. Find matched installers via PostGIS
    matched = await matching.match_installers_for_lead(
        db,
        lat=lat,
        lng=lng,
        kwp=kwp,
    )

    lead_status = "matched" if matched else "unmatched"
    lead_id = uuid.uuid4()

    new_lead = Lead(
        id=lead_id,
        assessment_id=payload.assessment_id,
        name=payload.name,
        phone=payload.phone,
        consent=payload.consent,
        status=lead_status,
    )
    db.add(new_lead)
    await db.flush()

    matched_names: list[str] = []
    if matched:
        for installer_data in matched:
            matched_names.append(installer_data["name"])
            lead_match = LeadMatch(
                lead_id=lead_id,
                installer_id=installer_data["id"],
                status="notified",
                fee_ksh=installer_data["lead_fee_ksh"],
            )
            db.add(lead_match)

    await db.commit()

    message = (
        f"Matched with {len(matched_names)} verified local installers."
        if matched_names
        else "We are currently expanding our installer network in your area. Your inquiry has been recorded."
    )

    return LeadResponse(
        lead_id=lead_id,
        matched_installers=matched_names,
        message=message,
    )


@router.get(
    "/installers/near",
    response_model=list[InstallerPublic],
    summary="Get public list of nearby installers",
)
async def get_nearby_installers_endpoint(
    lat: float = Query(..., ge=-5.0, le=5.5),
    lng: float = Query(..., ge=33.0, le=42.0),
    kwp: float = Query(3.0, ge=0.5, le=50.0),
    db: AsyncSession = Depends(get_db),
):
    installers = await matching.get_nearby_installers(db, lat=lat, lng=lng, kwp=kwp)
    return installers
