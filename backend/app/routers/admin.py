"""Admin endpoints: lead inbox with WhatsApp forward URLs, installer CRUD, config manager."""
from __future__ import annotations

import urllib.parse
from decimal import Decimal
from typing import Any, Optional

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.config import invalidate_config_cache
from app.db.models import AppConfig, Assessment, Installer, Lead, LeadMatch
from app.db.session import get_db
from app.dependencies import get_redis, verify_admin_token
from app.schemas.config import ConfigUpdate
from app.schemas.installer import InstallerCreate, InstallerUpdate

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(verify_admin_token)],
)


@router.get("/leads", summary="Lead inbox with assessment summaries and WhatsApp forward links")
async def get_admin_leads(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Lead)
        .options(
            selectinload(Lead.assessment),
            selectinload(Lead.lead_matches).selectinload(LeadMatch.installer),
        )
        .order_by(Lead.created_at.desc())
    )
    res = await db.execute(stmt)
    leads = res.scalars().all()

    output = []
    for lead in leads:
        assessment = lead.assessment
        kwp = None
        bill = None
        location_label = "Kenya"
        if assessment:
            bill = float(assessment.monthly_bill_ksh) if assessment.monthly_bill_ksh else None
            location_label = assessment.location_label or "Kenya"
            if assessment.result and "sizing" in assessment.result:
                kwp = assessment.result["sizing"].get("recommended_kwp")

        installer_links = []
        for lm in lead.lead_matches:
            inst = lm.installer
            if not inst:
                continue

            clean_wa = (inst.whatsapp or inst.phone or "").replace("+", "").replace(" ", "").replace("-", "")
            summary_msg = (
                f"Hello {inst.name}, SolarSight Verified Solar Lead:\n"
                f"• Customer: {lead.name}\n"
                f"• Phone: {lead.phone}\n"
                f"• Location: {location_label}\n"
                f"• System Size: {kwp or 'N/A'} kWp\n"
                f"• Monthly Bill: KSh {int(bill):, if bill else 'N/A'}\n"
                f"Please contact them to schedule a free site survey."
            )
            encoded_msg = urllib.parse.quote(summary_msg)
            forward_url = f"https://wa.me/{clean_wa}?text={encoded_msg}" if clean_wa else None

            installer_links.append({
                "installer_id": inst.id,
                "name": inst.name,
                "whatsapp": inst.whatsapp,
                "phone": inst.phone,
                "match_status": lm.status,
                "forward_url": forward_url,
            })

        output.append({
            "lead_id": str(lead.id),
            "name": lead.name,
            "phone": lead.phone,
            "consent": lead.consent,
            "status": lead.status,
            "created_at": lead.created_at.isoformat() if lead.created_at else None,
            "assessment_id": str(lead.assessment_id),
            "location_label": location_label,
            "monthly_bill_ksh": bill,
            "recommended_kwp": kwp,
            "matched_installers": installer_links,
        })

    return {"leads": output}


@router.patch("/leads/{lead_id}/status")
async def update_lead_status(
    lead_id: str,
    status_update: dict[str, str],
    db: AsyncSession = Depends(get_db),
):
    new_status = status_update.get("status")
    if new_status not in ["new", "matched", "contacted", "quoted", "won", "lost", "unmatched"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    stmt = update(Lead).where(Lead.id == lead_id).values(status=new_status)
    await db.execute(stmt)
    await db.commit()
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Installer CRUD
# ---------------------------------------------------------------------------

@router.get("/installers", summary="List all installers (admin)")
async def get_admin_installers(db: AsyncSession = Depends(get_db)):
    query = text("""
        SELECT id, name, phone, whatsapp, county, town, service_radius_km,
               epra_license_no, epra_verified, product_types, size_min_kw,
               size_max_kw, rating_avg, rating_count, lead_fee_ksh, active,
               ST_X(geom::geometry) as lng, ST_Y(geom::geometry) as lat
        FROM installers
        ORDER BY id ASC
    """)
    res = await db.execute(query)
    rows = res.mappings().all()
    return {"installers": [dict(r) for r in rows]}


@router.post("/installers", status_code=status.HTTP_201_CREATED, summary="Create new installer")
async def create_installer(
    payload: InstallerCreate,
    db: AsyncSession = Depends(get_db),
):
    query = text("""
        INSERT INTO installers (
            name, phone, whatsapp, county, town, geom, service_radius_km,
            epra_license_no, epra_verified, product_types, size_min_kw,
            size_max_kw, lead_fee_ksh, active
        ) VALUES (
            :name, :phone, :whatsapp, :county, :town,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :service_radius_km, :epra_license_no, :epra_verified,
            :product_types, :size_min_kw, :size_max_kw, :lead_fee_ksh, :active
        ) RETURNING id
    """)
    res = await db.execute(
        query,
        {
            "name": payload.name,
            "phone": payload.phone,
            "whatsapp": payload.whatsapp,
            "county": payload.county,
            "town": payload.town,
            "lng": payload.lng,
            "lat": payload.lat,
            "service_radius_km": payload.service_radius_km,
            "epra_license_no": payload.epra_license_no,
            "epra_verified": payload.epra_verified,
            "product_types": payload.product_types,
            "size_min_kw": payload.size_min_kw,
            "size_max_kw": payload.size_max_kw,
            "lead_fee_ksh": payload.lead_fee_ksh,
            "active": payload.active,
        },
    )
    await db.commit()
    new_id = res.scalar_one()
    return {"id": new_id, "status": "created"}


@router.patch("/installers/{installer_id}", summary="Update installer")
async def update_installer(
    installer_id: int,
    payload: InstallerUpdate,
    db: AsyncSession = Depends(get_db),
):
    updates_dict = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates_dict:
        return {"status": "no_change"}

    # Handle geometry update if coords provided
    lat = updates_dict.pop("lat", None)
    lng = updates_dict.pop("lng", None)

    if updates_dict:
        stmt = update(Installer).where(Installer.id == installer_id).values(**updates_dict)
        await db.execute(stmt)

    if lat is not None and lng is not None:
        geom_query = text("""
            UPDATE installers
            SET geom = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
            WHERE id = :id
        """)
        await db.execute(geom_query, {"lng": lng, "lat": lat, "id": installer_id})

    await db.commit()
    return {"status": "updated"}


@router.delete("/installers/{installer_id}", summary="Delete installer")
async def delete_installer(
    installer_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = delete(Installer).where(Installer.id == installer_id)
    await db.execute(stmt)
    await db.commit()
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# Config Management
# ---------------------------------------------------------------------------

@router.get("/config", summary="Get all app config values")
async def get_admin_config(db: AsyncSession = Depends(get_db)):
    stmt = select(AppConfig).order_by(AppConfig.key.asc())
    res = await db.execute(stmt)
    rows = res.scalars().all()
    return {row.key: {"value": row.value, "updated_at": row.updated_at.isoformat() if row.updated_at else None} for row in rows}


@router.patch("/config", summary="Update app config items")
async def update_admin_config(
    payload: ConfigUpdate,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    for key, val in payload.updates.items():
        stmt = select(AppConfig).where(AppConfig.key == key)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            existing.value = val
        else:
            db.add(AppConfig(key=key, value=val))

    await db.commit()
    await invalidate_config_cache(redis)
    return {"status": "config_updated"}
