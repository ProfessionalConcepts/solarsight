"""PVGIS v5.2 integration with Redis and PostgreSQL caching and fallback."""
from __future__ import annotations

import asyncio
import json
import logging
from decimal import Decimal
from typing import Any, Optional

import httpx
import redis.asyncio as aioredis
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import IrradianceCache

logger = logging.getLogger("energyiq.irradiance")

PVGIS_BASE_URL = "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc"
CACHE_TTL_SECONDS = 90 * 86400  # 90 days


def internal_to_pvgis_azimuth(internal_azimuth: int) -> int:
    """
    Convert internal compass azimuth (0=NORTH clockwise)
    to PVGIS azimuth (0=SOUTH, -90=EAST, 90=WEST, 180=NORTH).
    """
    pvgs = (internal_azimuth + 180) % 360
    if pvgs > 180:
        pvgs -= 360
    return pvgs


async def get_solar_irradiance(
    lat: float,
    lng: float,
    tilt: int,
    azimuth: int,  # internal 0=NORTH
    loss: int = 14,
    db: Optional[AsyncSession] = None,
    redis: Optional[aioredis.Redis] = None,
) -> dict[str, Any]:
    """
    Fetch annual (E_y) and monthly (E_m) solar yield from PVGIS or cache.
    Returns:
      {
        "source": "PVGIS v5.2",
        "E_y": float,           # kWh/yr per kWp (losses already included)
        "E_m": list[float],     # 12 monthly kWh/kWp values
        "peak_sun_hours_daily": float,
      }
    """
    lat_key = round(lat, 2)
    lng_key = round(lng, 2)
    pvgs_azimuth = internal_to_pvgis_azimuth(azimuth)
    redis_key = f"pvgis:{lat_key}:{lng_key}:{tilt}:{pvgs_azimuth}:{loss}"

    # 1. Check Redis cache
    if redis:
        try:
            cached_data = await redis.get(redis_key)
            if cached_data:
                logger.info("PVGIS cache hit in Redis for %s,%s", lat_key, lng_key)
                return json.loads(cached_data)
        except Exception as e:
            logger.warning("Redis read failed: %s", e)

    # 2. Check DB irradiance_cache
    if db:
        try:
            stmt = select(IrradianceCache).where(
                IrradianceCache.lat_key == Decimal(str(lat_key)),
                IrradianceCache.lng_key == Decimal(str(lng_key)),
            )
            result = await db.execute(stmt)
            cache_row = result.scalar_one_or_none()
            if cache_row and cache_row.payload:
                payload = cache_row.payload
                # If specific tilt/azimuth matched or generic payload
                if "E_y" in payload and "E_m" in payload:
                    logger.info("PVGIS cache hit in DB for %s,%s", lat_key, lng_key)
                    if redis:
                        try:
                            await redis.setex(redis_key, CACHE_TTL_SECONDS, json.dumps(payload))
                        except Exception:
                            pass
                    return payload
        except Exception as e:
            logger.warning("DB cache read failed: %s", e)

    # 3. Call PVGIS API with httpx (10s timeout, 1 retry)
    params = {
        "lat": lat,
        "lon": lng,
        "peakpower": 1,
        "loss": loss,
        "slope": tilt,
        "azimuth": pvgs_azimuth,
        "outputformat": "json",
    }

    raw_payload: Optional[dict[str, Any]] = None
    last_error: Optional[Exception] = None

    async with httpx.AsyncClient(timeout=10.0) as client:
        for attempt in range(2):
            try:
                resp = await client.get(PVGIS_BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    outputs = data.get("outputs", {})
                    totals = outputs.get("totals", {}).get("fixed", {})
                    monthly = outputs.get("monthly", {}).get("fixed", [])

                    E_y = float(totals.get("E_y", 0.0))
                    E_m = [float(m.get("E_m", 0.0)) for m in monthly]
                    if not E_m or len(E_m) != 12:
                        # Fallback average if monthly is weird
                        E_m = [round(E_y / 12, 1)] * 12

                    peak_sun_hours_daily = round(E_y / 365.0, 2)

                    raw_payload = {
                        "source": "PVGIS v5.2",
                        "annual_kwh_per_kwp": round(E_y, 1),
                        "peak_sun_hours_daily": peak_sun_hours_daily,
                        "E_y": round(E_y, 1),
                        "E_m": E_m,
                    }
                    break
                else:
                    logger.warning("PVGIS HTTP error: status=%d", resp.status_code)
            except Exception as exc:
                last_error = exc
                logger.warning("PVGIS attempt %d failed: %s", attempt + 1, exc)
                if attempt == 0:
                    await asyncio.sleep(1.0)

    # 4. If PVGIS succeeded, store in DB and Redis
    if raw_payload:
        if redis:
            try:
                await redis.setex(redis_key, CACHE_TTL_SECONDS, json.dumps(raw_payload))
            except Exception as e:
                logger.warning("Redis write failed: %s", e)

        if db:
            try:
                stmt = select(IrradianceCache).where(
                    IrradianceCache.lat_key == Decimal(str(lat_key)),
                    IrradianceCache.lng_key == Decimal(str(lng_key)),
                )
                res = await db.execute(stmt)
                existing = res.scalar_one_or_none()
                if existing:
                    existing.payload = raw_payload
                else:
                    db.add(
                        IrradianceCache(
                            lat_key=Decimal(str(lat_key)),
                            lng_key=Decimal(str(lng_key)),
                            payload=raw_payload,
                        )
                    )
                await db.commit()
            except Exception as e:
                logger.warning("DB cache write failed: %s", e)
                await db.rollback()

        return raw_payload

    # 5. On failure, search for nearest cached point in DB within 0.05 degrees (~5km)
    if db:
        try:
            stmt = select(IrradianceCache).where(
                IrradianceCache.lat_key >= Decimal(str(round(lat_key - 0.05, 2))),
                IrradianceCache.lat_key <= Decimal(str(round(lat_key + 0.05, 2))),
                IrradianceCache.lng_key >= Decimal(str(round(lng_key - 0.05, 2))),
                IrradianceCache.lng_key <= Decimal(str(round(lng_key + 0.05, 2))),
            )
            res = await db.execute(stmt)
            fallback_row = res.scalars().first()
            if fallback_row and fallback_row.payload:
                logger.warning("Using nearby fallback irradiance cache for %s,%s", lat_key, lng_key)
                return fallback_row.payload
        except Exception as e:
            logger.warning("Fallback query failed: %s", e)

    # 6. If no fallback exists, raise 503
    logger.error("PVGIS service unavailable and no cache found: %s", last_error)
    raise HTTPException(
        status_code=503,
        detail="Sunlight data is currently unavailable for this location. Please try again in a few moments.",
    )
