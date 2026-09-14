"""Assessment endpoints and geocoding proxies."""
from __future__ import annotations

import json
import logging
import uuid
from decimal import Decimal
from typing import Any, Optional

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.config import get_config
from app.db.models import Assessment
from app.db.session import get_db
from app.dependencies import check_rate_limit, get_redis
from app.schemas.assessment import AssessmentInput
from app.services import engine, geocode, irradiance, narrative

logger = logging.getLogger("energyiq.assess")
router = APIRouter(tags=["assessment"])


@router.post(
    "/assess",
    status_code=status.HTTP_201_CREATED,
    summary="Compute solar assessment and store report",
)
async def create_assessment(
    payload: AssessmentInput,
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    # 1. Rate limiting (5 per min per IP)
    await check_rate_limit(request, limit=5, window_seconds=60)

    # 2. Strict Kenya Bounds check
    if not (-5.0 <= payload.lat <= 5.5 and 33.0 <= payload.lng <= 42.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "out_of_bounds", "message": "SolarSight is currently available in Kenya only."}},
        )

    # 3. Idempotency check per (lat, lng, bill/kwh) within 60s
    bill_or_kwh = payload.monthly_bill_ksh or payload.monthly_kwh or 0
    idemp_key = f"idemp:{round(payload.lat, 4)}:{round(payload.lng, 4)}:{round(bill_or_kwh, 1)}"
    try:
        cached_idemp = await redis.get(idemp_key)
        if cached_idemp:
            logger.info("Returning idempotent assessment result")
            data = json.loads(cached_idemp)
            return data
    except Exception as exc:
        logger.warning("Idempotency check error: %s", exc)

    # 4. Fetch App Config
    cfg = await get_config(db, redis)

    # 5. Fetch Solar Irradiance (PVGIS + Cache)
    loss = int(cfg.get("pvgis_system_loss_pct", 14))
    sun_data = await irradiance.get_solar_irradiance(
        lat=payload.lat,
        lng=payload.lng,
        tilt=payload.roof_tilt,
        azimuth=payload.azimuth,
        loss=loss,
        db=db,
        redis=redis,
    )

    # 6. Execute Pure Assessment Engine
    appliance_dicts = (
        [a.model_dump() for a in payload.appliances] if payload.appliances else None
    )

    try:
        result = engine.run_assessment(
            lat=payload.lat,
            lng=payload.lng,
            roof_area_m2=payload.roof_area_m2,
            roof_tilt=payload.roof_tilt,
            azimuth=payload.azimuth,
            shading_self=payload.shading_self,
            monthly_kwh=payload.monthly_kwh,
            monthly_bill_ksh=payload.monthly_bill_ksh,
            appliances=appliance_dicts,
            tariff_type=payload.tariff_type,
            has_genset=payload.has_genset,
            genset_monthly_fuel_ksh=payload.genset_monthly_fuel_ksh,
            backup_hours_goal=payload.backup_hours_goal,
            language=payload.language,
            E_y=sun_data["E_y"],
            E_m=sun_data["E_m"],
            cfg=cfg,
        )
    except Exception as exc:
        logger.error("Engine execution error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "calculation_error", "message": str(exc)}},
        )

    # 7. Add irradiance metadata
    result["irradiance"] = {
        "source": sun_data.get("source", "PVGIS v5.2"),
        "annual_kwh_per_kwp": sun_data["annual_kwh_per_kwp"],
        "peak_sun_hours_daily": sun_data["peak_sun_hours_daily"],
    }

    # 8. Generate Narrative (template interpolation)
    bill_val = payload.monthly_bill_ksh or (
        (payload.monthly_kwh or 0) * float(cfg.get(f"tariff_{payload.tariff_type}_effective_ksh_per_kwh", 19.5))
    )
    narrative_texts = narrative.generate_narrative(
        monthly_bill_ksh=bill_val,
        recommended_kwp=result["sizing"]["recommended_kwp"],
        coverage_pct=result["sizing"]["coverage_pct"],
        monthly_savings_low=result["financials"]["monthly_savings_low_ksh"],
        monthly_savings_high=result["financials"]["monthly_savings_high_ksh"],
        payback_grid=result["financials"]["payback_grid_tie_yrs"],
        payback_hybrid=result["financials"]["payback_hybrid_yrs"],
        battery_kwh=result["sizing"]["battery_kwh"],
        installer_count=3,
    )
    result["narrative"] = narrative_texts

    # 9. Add assumptions and disclaimer per spec
    result["assumptions"] = [
        f"effective tariff KSh {cfg.get(f'tariff_{payload.tariff_type}_effective_ksh_per_kwh', 19.5)}/kWh",
        f"self-consumption with battery {int(float(cfg.get('self_consumption_with_battery', 0.75)) * 100)}%",
        f"self-consumption grid-tie {int(float(cfg.get('self_consumption_grid_tie', 0.55)) * 100)}%",
        f"prices last updated {cfg.get('data_last_updated', '2025-06-01')}",
    ]
    result["disclaimer"] = "These are estimates from satellite data. A site survey by a vetted installer confirms the final design and price."

    # 10. Persist Assessment to Database
    assessment_id = uuid.uuid4()
    assessment_row = Assessment(
        id=assessment_id,
        lat=Decimal(str(payload.lat)),
        lng=Decimal(str(payload.lng)),
        location_label=payload.location_label,
        roof_area_m2=Decimal(str(payload.roof_area_m2)) if payload.roof_area_m2 is not None else None,
        roof_tilt=payload.roof_tilt,
        azimuth=payload.azimuth,
        shading_self=payload.shading_self,
        monthly_kwh=Decimal(str(payload.monthly_kwh)) if payload.monthly_kwh is not None else None,
        monthly_bill_ksh=Decimal(str(payload.monthly_bill_ksh)) if payload.monthly_bill_ksh is not None else None,
        tariff_type=payload.tariff_type,
        has_genset=payload.has_genset,
        genset_monthly_fuel_ksh=Decimal(str(payload.genset_monthly_fuel_ksh)) if payload.genset_monthly_fuel_ksh is not None else None,
        backup_hours_goal=payload.backup_hours_goal,
        property_type=payload.property_type,
        result=result,
        language=payload.language,
    )
    persisted = True
    try:
        db.add(assessment_row)
        await db.commit()
    except Exception as exc:
        persisted = False
        await db.rollback()
        logger.error("Assessment persistence failed; returning computed report: %s", exc)

    response_payload = {
        "assessment_id": str(assessment_id),
        "result": result,
        "persisted": persisted,
    }

    # 11. Save 60s idempotency cache
    try:
        await redis.setex(idemp_key, 60, json.dumps(response_payload))
    except Exception:
        pass

    return response_payload


@router.get("/assessments/{assessment_id}")
async def get_assessment_by_id(
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Assessment).where(Assessment.id == assessment_id)
    res = await db.execute(stmt)
    assessment = res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "not_found", "message": "Assessment report not found."}},
        )

    return {
        "assessment_id": str(assessment.id),
        "lat": float(assessment.lat),
        "lng": float(assessment.lng),
        "location_label": assessment.location_label,
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
        "result": assessment.result,
    }


# ---------------------------------------------------------------------------
# Geocoding Proxies for Frontend
# ---------------------------------------------------------------------------

@router.get("/geocode/search")
async def geocode_search(
    q: str,
    redis: aioredis.Redis = Depends(get_redis),
):
    """Proxy Nominatim place search with caching and 1 req/sec rate limiting."""
    results = await geocode.search_places(q, redis=redis)
    return {"results": results}


@router.get("/geocode/reverse")
async def geocode_reverse(
    lat: float,
    lng: float,
    redis: aioredis.Redis = Depends(get_redis),
):
    """Reverse geocode lat/lng to human label."""
    label = await geocode.reverse_geocode(lat, lng, redis=redis)
    return {"label": label}


@router.get("/geocode/ip")
async def geocode_ip():
    """IP fallback geolocation when GPS is denied."""
    data = await geocode.ip_geolocation_fallback()
    return data
