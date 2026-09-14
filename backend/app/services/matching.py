"""PostGIS installer matching service."""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("energyiq.matching")


async def match_installers_for_lead(
    db: AsyncSession,
    *,
    lat: float,
    lng: float,
    kwp: float,
) -> list[dict[str, Any]]:
    """
    Find up to 3 active, geographical matched installers capable of servicing this system size.
    Prefers EPRA-verified installers, ordered by rating.
    """
    query = text("""
        SELECT id, name, phone, whatsapp, county, town, epra_verified, rating_avg, lead_fee_ksh
        FROM installers
        WHERE active = true
          AND ST_DWithin(geom, ST_MakePoint(:lng, :lat)::geography, service_radius_km * 1000)
          AND size_min_kw <= :kwp
          AND size_max_kw >= :kwp
          AND 'pv_hybrid' = ANY(product_types)
        ORDER BY epra_verified DESC, rating_avg DESC NULLS LAST
        LIMIT 3
    """)

    result = await db.execute(query, {"lng": lng, "lat": lat, "kwp": kwp})
    rows = result.mappings().all()

    matched = []
    for r in rows:
        matched.append({
            "id": r["id"],
            "name": r["name"],
            "phone": r["phone"],
            "whatsapp": r["whatsapp"],
            "county": r["county"],
            "town": r["town"],
            "epra_verified": bool(r["epra_verified"]),
            "rating_avg": float(r["rating_avg"]) if r["rating_avg"] is not None else None,
            "lead_fee_ksh": int(r["lead_fee_ksh"]) if r["lead_fee_ksh"] is not None else 500,
        })
    return matched


async def get_nearby_installers(
    db: AsyncSession,
    *,
    lat: float,
    lng: float,
    kwp: float,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """Get public listing of nearby active installers."""
    query = text("""
        SELECT id, name, county, town, rating_avg, rating_count, epra_verified
        FROM installers
        WHERE active = true
          AND ST_DWithin(geom, ST_MakePoint(:lng, :lat)::geography, service_radius_km * 1000)
          AND size_min_kw <= :kwp
          AND size_max_kw >= :kwp
        ORDER BY epra_verified DESC, rating_avg DESC NULLS LAST
        LIMIT :limit
    """)

    result = await db.execute(query, {"lng": lng, "lat": lat, "kwp": kwp, "limit": limit})
    rows = result.mappings().all()

    installers = []
    for r in rows:
        area_parts = [p for p in [r["town"], r["county"]] if p]
        installers.append({
            "id": r["id"],
            "name": r["name"],
            "area": ", ".join(area_parts) if area_parts else "Nairobi, Kenya",
            "rating_avg": float(r["rating_avg"]) if r["rating_avg"] is not None else None,
            "rating_count": int(r["rating_count"]) if r["rating_count"] is not None else 0,
            "epra_verified": bool(r["epra_verified"]),
        })
    return installers
