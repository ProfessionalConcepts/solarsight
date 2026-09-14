"""Pydantic v2 schemas for installer and config endpoints."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class InstallerPublic(BaseModel):
    id: int
    name: str
    area: str  # "{county}, {town}"
    rating_avg: Optional[float]
    rating_count: int
    epra_verified: bool

    model_config = {"from_attributes": True}


class InstallerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    county: Optional[str] = None
    town: Optional[str] = None
    lat: float = Field(..., ge=-5.0, le=5.5)
    lng: float = Field(..., ge=33.0, le=42.0)
    service_radius_km: int = 50
    epra_license_no: Optional[str] = None
    epra_verified: bool = False
    product_types: list[str] = []
    size_min_kw: float = 0.5
    size_max_kw: float = 20.0
    lead_fee_ksh: int = 500
    active: bool = True


class InstallerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    county: Optional[str] = None
    town: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    service_radius_km: Optional[int] = None
    epra_license_no: Optional[str] = None
    epra_verified: Optional[bool] = None
    product_types: Optional[list[str]] = None
    size_min_kw: Optional[float] = None
    size_max_kw: Optional[float] = None
    lead_fee_ksh: Optional[int] = None
    active: Optional[bool] = None
