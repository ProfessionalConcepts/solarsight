"""Pydantic v2 schemas for app_config admin endpoints."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ConfigItem(BaseModel):
    key: str
    value: Any


class ConfigUpdate(BaseModel):
    updates: dict[str, Any]
