"""FastAPI dependencies: DB session, Redis client, rate limiter, admin token verification."""
from __future__ import annotations

import logging
from typing import Optional

import redis.asyncio as aioredis
from fastapi import Header, HTTPException, Request, status
from app.config import settings

logger = logging.getLogger("energyiq.deps")

_redis_pool: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(settings.REDIS_URL, decode_responses=False)
    return _redis_pool


async def check_rate_limit(request: Request, limit: int = 5, window_seconds: int = 60) -> None:
    """Redis sliding window / token bucket rate limiter per client IP."""
    try:
        redis = await get_redis()
        client_ip = request.client.host if request.client else "unknown"
        # Forwarded header support if behind proxy
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        route_key = request.url.path
        key = f"rate_limit:{client_ip}:{route_key}"
        current = await redis.incr(key)
        if current == 1:
            await redis.expire(key, window_seconds)

        if current > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"error": {"code": "rate_limit_exceeded", "message": "Too many requests. Please wait a minute and try again."}},
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Rate limit check failed, allowing request: %s", exc)


def verify_admin_token(authorization: Optional[str] = Header(None)) -> str:
    """Validate Bearer token for admin operations."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "unauthorized", "message": "Admin authorization token required."}},
        )
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "invalid_auth_header", "message": "Invalid Authorization header format. Expected Bearer <token>"}},
        )
    token = parts[1].strip()
    if token != settings.ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "forbidden", "message": "Invalid admin token."}},
        )
    return token
