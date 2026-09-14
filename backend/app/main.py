"""SolarSight FastAPI Application.

Kenyan Geospatial Solar Feasibility Platform.
NOTE: Register with the ODPC once past prototype scale (Kenya Data Protection Act 2019).
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.dependencies import get_redis
from app.routers import admin, assess, health, leads

# Structured logging without PII
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("energyiq.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SolarSight API starting up...")
    try:
        redis = await get_redis()
        await redis.ping()
        logger.info("Redis connection established.")
    except Exception as exc:
        logger.warning("Redis initial ping failed: %s", exc)
    yield
    logger.info("SolarSight API shutting down...")


app = FastAPI(
    title="SolarSight API",
    version="1.0.0",
    description="Solar Feasibility Assessment Engine for Kenyan Homes, Farms, and SMEs",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized error response shape per spec
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        content = exc.detail
    else:
        content = {
            "error": {
                "code": "http_error",
                "message": str(exc.detail),
            }
        }
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_err = errors[0] if errors else {}
    msg = first_err.get("msg", "Validation error")
    loc = " -> ".join(str(l) for l in first_err.get("loc", []))
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "validation_error",
                "message": f"{loc}: {msg}" if loc else msg,
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled API error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": {
                "code": "service_unavailable",
                "message": "SolarSight could not complete the assessment because a backend service is unavailable. Please try again shortly.",
            }
        },
    )


# Mount routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(assess.router, prefix="/api")
app.include_router(leads.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
