"""Pydantic v2 schemas for leads."""
from __future__ import annotations

import re
import uuid
from typing import Optional

from pydantic import BaseModel, Field, field_validator

_KE_PHONE_RE = re.compile(r'^(?:\+?254|0)([17]\d{8})$')


def normalise_phone(v: str) -> str:
    m = _KE_PHONE_RE.match(v.strip())
    if not m:
        raise ValueError("Invalid Kenyan phone number. Expected +254XXXXXXXXX or 07XXXXXXXX")
    return f"+254{m.group(1)}"


class LeadCreate(BaseModel):
    assessment_id: uuid.UUID
    name: str = Field(..., min_length=2, max_length=120)
    phone: str
    consent: bool

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalise_phone(v)

    @field_validator("consent")
    @classmethod
    def must_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Consent is required to submit a lead")
        return v


class MatchedInstaller(BaseModel):
    name: str
    whatsapp: Optional[str]


class LeadResponse(BaseModel):
    lead_id: uuid.UUID
    matched_installers: list[str]
    message: str


class LeadAdminItem(BaseModel):
    lead_id: uuid.UUID
    name: str
    phone: str
    status: str
    created_at: str
    assessment_id: uuid.UUID
    monthly_bill_ksh: Optional[float]
    recommended_kwp: Optional[float]
    installers: list[dict]
