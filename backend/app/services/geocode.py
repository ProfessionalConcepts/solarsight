"""Geocoding service integrating Nominatim (OSM) and GeoJS with caching and rate limiting."""
from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any, Optional

import httpx
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger("energyiq.geocode")

NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
GEOJS_URL = "https://get.geojs.io/v1/ip/geo.json"

_last_nominatim_call = 0.0
_nominatim_lock = asyncio.Lock()


async def _rate_limit_nominatim() -> None:
    """Enforce max 1 request per second to Nominatim per OSM usage policy."""
    global _last_nominatim_call
    async with _nominatim_lock:
        now = time.monotonic()
        elapsed = now - _last_nominatim_call
        if elapsed < 1.05:
            await asyncio.sleep(1.05 - elapsed)
        _last_nominatim_call = time.monotonic()


def _get_headers() -> dict[str, str]:
    return {
        "User-Agent": f"EnergyIQ/1.0 ({settings.CONTACT_EMAIL})",
        "Accept-Language": "en,sw",
    }


async def search_places(
    query: str,
    redis: Optional[aioredis.Redis] = None,
) -> list[dict[str, Any]]:
    """Search Kenyan locations via Nominatim with 24h caching."""
    q_norm = query.strip().lower()
    if not q_norm:
        return []

    cache_key = f"nominatim:search:{q_norm}"
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning("Redis search cache error: %s", e)

    await _rate_limit_nominatim()

    params = {
        "q": query,
        "countrycodes": "ke",
        "format": "json",
        "limit": 5,
        "addressdetails": 1,
    }

    results = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(NOMINATIM_SEARCH_URL, params=params, headers=_get_headers())
            if resp.status_code == 200:
                data = resp.json()
                for item in data:
                    results.append({
                        "label": item.get("display_name", ""),
                        "lat": float(item["lat"]),
                        "lng": float(item["lon"]),
                        "type": item.get("type", ""),
                    })
    except Exception as exc:
        logger.error("Nominatim search failed: %s", exc)

    if redis and results:
        try:
            await redis.setex(cache_key, 86400, json.dumps(results))  # 24h
        except Exception:
            pass

    return results


async def reverse_geocode(
    lat: float,
    lng: float,
    redis: Optional[aioredis.Redis] = None,
) -> str:
    """Reverse geocode lat/lng to human-readable label (e.g., 'Kilimani, Nairobi')."""
    lat_r = round(lat, 4)
    lng_r = round(lng, 4)
    cache_key = f"nominatim:rev:{lat_r}:{lng_r}"

    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return cached.decode("utf-8") if isinstance(cached, bytes) else str(cached)
        except Exception as e:
            logger.warning("Redis rev cache error: %s", e)

    await _rate_limit_nominatim()

    params = {
        "lat": lat,
        "lon": lng,
        "format": "json",
        "addressdetails": 1,
    }

    label = f"{lat_r}, {lng_r}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(NOMINATIM_REVERSE_URL, params=params, headers=_get_headers())
            if resp.status_code == 200:
                data = resp.json()
                addr = data.get("address", {})
                parts = []
                for k in ["suburb", "neighbourhood", "village", "town", "city", "county"]:
                    if k in addr and addr[k] not in parts:
                        parts.append(addr[k])
                if parts:
                    label = ", ".join(parts[:2])
                else:
                    label = data.get("display_name", label).split(",")[0]
    except Exception as exc:
        logger.error("Nominatim reverse geocode failed: %s", exc)

    if redis:
        try:
            await redis.setex(cache_key, 86400, label)  # 24h
        except Exception:
            pass

    return label


async def ip_geolocation_fallback() -> dict[str, Any]:
    """Fallback IP geolocation via GeoJS when browser GPS is blocked."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(GEOJS_URL)
            if resp.status_code == 200:
                data = resp.json()
                lat = float(data.get("latitude", -1.2921))
                lng = float(data.get("longitude", 36.8219))
                city = data.get("city", "Nairobi")
                return {
                    "lat": lat,
                    "lng": lng,
                    "label": f"{city}, Kenya (approximate)",
                }
    except Exception as exc:
        logger.error("GeoJS lookup failed: %s", exc)

    # Nairobi default
    return {
        "lat": -1.2921,
        "lng": 36.8219,
        "label": "Nairobi, Kenya",
    }
