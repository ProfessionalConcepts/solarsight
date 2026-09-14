"""Pydantic v2 schemas for assessment input and output."""
from __future__ import annotations

import uuid
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------

class ApplianceItem(BaseModel):
    name: str
    watts: float = Field(gt=0)
    hours_per_day: float = Field(gt=0, le=24)


class AssessmentInput(BaseModel):
    # Location (step 1)
    lat: float = Field(..., ge=-5.0, le=5.5, description="Latitude (Kenya bounds)")
    lng: float = Field(..., ge=33.0, le=42.0, description="Longitude (Kenya bounds)")
    location_label: Optional[str] = None

    # Roof (step 2)
    roof_area_m2: Optional[float] = Field(None, ge=4, le=2000)
    roof_tilt: int = Field(default=10, ge=0, le=45)
    azimuth: int = Field(default=0, ge=0, lt=360, description="Internal: 0=NORTH clockwise")
    shading_self: Literal["none", "some", "heavy"] = "none"

    # Energy consumption (step 3)
    monthly_kwh: Optional[float] = Field(None, ge=10, le=50000)
    monthly_bill_ksh: Optional[float] = Field(None, ge=500, le=500_000)
    appliances: Optional[list[ApplianceItem]] = None
    tariff_type: Literal["domestic", "small_commercial", "commercial"] = "domestic"

    # Genset
    has_genset: bool = False
    genset_monthly_fuel_ksh: Optional[float] = Field(None, ge=0)

    # Battery / backup
    backup_hours_goal: int = Field(default=6, ge=1, le=24)

    # Meta
    property_type: Optional[str] = None
    language: str = Field(default="en", max_length=5)

    @model_validator(mode="after")
    def require_consumption_source(self) -> "AssessmentInput":
        if not any([self.monthly_kwh, self.monthly_bill_ksh, self.appliances]):
            raise ValueError(
                "Provide at least one of: monthly_kwh, monthly_bill_ksh, or appliances"
            )
        return self


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class MonthlyProduction(BaseModel):
    month: int
    kwh: float


class FinancialsOut(BaseModel):
    capex_grid_tie_ksh: float
    capex_hybrid_ksh: float
    savings_annual_grid_tie_ksh: float
    savings_annual_hybrid_ksh: float
    payback_grid_tie_yrs: float
    payback_hybrid_yrs: float
    monthly_savings_low_ksh: float
    monthly_savings_high_ksh: float
    npv_grid_tie_ksh: float
    npv_hybrid_ksh: float
    avoided_ksh_per_kwh: float


class SizingOut(BaseModel):
    recommended_kwp: float
    battery_kwh: float
    annual_kwh: float
    coverage_pct: int
    roof_limited: bool
    roof_max_kwp: Optional[float]


class VerdictOut(BaseModel):
    code: Literal["strong_yes", "explore", "caution"]
    reason: str


class NarrativeOut(BaseModel):
    en: str
    sw: str


class AssessmentResult(BaseModel):
    sizing: SizingOut
    financials: FinancialsOut
    monthly_production: list[MonthlyProduction]
    verdict: VerdictOut
    recommendations: list[str]
    narrative: NarrativeOut
    data_last_updated: str


class AssessmentResponse(BaseModel):
    assessment_id: uuid.UUID
    result: AssessmentResult


class AssessmentDetail(AssessmentResponse):
    lat: float
    lng: float
    location_label: Optional[str]
    created_at: Any
