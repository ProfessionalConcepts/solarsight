"""Helper to fetch app_config values from DB with Redis caching."""
import json
import logging
from typing import Any

import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AppConfig

_CONFIG_CACHE_TTL = 300  # 5 minutes
logger = logging.getLogger("energyiq.config")

DEFAULT_CONFIG: dict[str, Any] = {
    "tariff_domestic_effective_ksh_per_kwh": 19.5,
    "tariff_small_commercial_effective_ksh_per_kwh": 22.0,
    "tariff_commercial_effective_ksh_per_kwh": 24.0,
    "diesel_price_ksh_per_litre": 189,
    "genset_litres_per_kwh": 0.4,
    "genset_maintenance_ksh_per_kwh": 8,
    "pv_cost_ksh_per_kwp_installed": 130000,
    "battery_cost_ksh_per_kwh_installed": 85000,
    "panel_m2_per_kwp": 5.0,
    "self_consumption_with_battery": 0.75,
    "self_consumption_grid_tie": 0.55,
    "battery_dod": 0.9,
    "battery_replacement_year": 11,
    "evening_peak_factor": 1.5,
    "discount_rate": 0.08,
    "pvgis_system_loss_pct": 14,
    "sizing_headroom": 1.10,
    "standard_kit_sizes_kwp": [0.5, 1, 1.5, 2, 3, 5, 8, 10, 15, 20],
    "battery_kit_sizes_kwh": [2.5, 5, 7.5, 10, 15],
    "min_bill_for_recommendation_ksh": 3000,
    "data_last_updated": "2025-06-01",
}


async def get_config(db: AsyncSession, redis: aioredis.Redis) -> dict[str, Any]:
    """Return full app_config dict, cached in Redis for 5 minutes."""
    try:
        raw = await redis.get("app_config:all")
        if raw:
            return json.loads(raw)
    except Exception as exc:
        logger.warning("Config Redis read failed; using database config: %s", exc)

    try:
        rows = (await db.execute(select(AppConfig))).scalars().all()
        cfg = {row.key: row.value for row in rows}
    except Exception as exc:
        logger.warning("Database config read failed; using built-in defaults: %s", exc)
        return DEFAULT_CONFIG.copy()
    try:
        await redis.setex("app_config:all", _CONFIG_CACHE_TTL, json.dumps(cfg))
    except Exception as exc:
        logger.warning("Config Redis write failed; continuing without cache: %s", exc)
    return cfg


async def invalidate_config_cache(redis: aioredis.Redis) -> None:
    """Bust the config cache after admin updates."""
    try:
        await redis.delete("app_config:all")
    except Exception as exc:
        logger.warning("Config Redis invalidation failed: %s", exc)
