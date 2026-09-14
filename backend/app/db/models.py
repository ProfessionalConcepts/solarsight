"""SQLAlchemy ORM models — EnergyIQ data layer."""
import uuid
from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import (
    DECIMAL,
    TIMESTAMP,
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lat = Column(DECIMAL(9, 6), nullable=False)
    lng = Column(DECIMAL(9, 6), nullable=False)
    location_label = Column(Text)
    roof_area_m2 = Column(DECIMAL)
    roof_tilt = Column(Integer, default=10)
    azimuth = Column(Integer, default=0)  # internal: 0=NORTH clockwise
    shading_self = Column(
        String(10),
        CheckConstraint("shading_self IN ('none','some','heavy')"),
    )
    monthly_kwh = Column(DECIMAL)
    monthly_bill_ksh = Column(DECIMAL)
    tariff_type = Column(
        String(20),
        CheckConstraint("tariff_type IN ('domestic','small_commercial','commercial')"),
    )
    has_genset = Column(Boolean, default=False)
    genset_monthly_fuel_ksh = Column(DECIMAL)
    backup_hours_goal = Column(Integer, default=6)
    property_type = Column(String(20))
    result = Column(JSONB)
    language = Column(String(5), default="en")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    leads = relationship("Lead", back_populates="assessment")


class IrradianceCache(Base):
    __tablename__ = "irradiance_cache"

    lat_key = Column(DECIMAL(6, 2), primary_key=True)
    lng_key = Column(DECIMAL(6, 2), primary_key=True)
    payload = Column(JSONB, nullable=False)
    fetched_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Installer(Base):
    __tablename__ = "installers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    phone = Column(String(15))
    whatsapp = Column(String(15))
    county = Column(Text)
    town = Column(Text)
    geom = Column(Geography("POINT", srid=4326))
    service_radius_km = Column(Integer, default=50)
    epra_license_no = Column(Text)
    epra_verified = Column(Boolean, default=False)
    product_types = Column(ARRAY(Text))
    size_min_kw = Column(DECIMAL, default=0.5)
    size_max_kw = Column(DECIMAL, default=20)
    rating_avg = Column(DECIMAL(3, 2))
    rating_count = Column(Integer, default=0)
    lead_fee_ksh = Column(Integer, default=500)
    active = Column(Boolean, default=True)

    lead_matches = relationship("LeadMatch", back_populates="installer")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"))
    name = Column(Text)
    phone = Column(String(15))
    consent = Column(Boolean, nullable=False)
    status = Column(
        String(20),
        CheckConstraint(
            "status IN ('new','matched','contacted','quoted','won','lost','unmatched')"
        ),
        default="new",
    )
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    assessment = relationship("Assessment", back_populates="leads")
    lead_matches = relationship("LeadMatch", back_populates="lead")


class LeadMatch(Base):
    __tablename__ = "lead_matches"

    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), primary_key=True)
    installer_id = Column(Integer, ForeignKey("installers.id"), primary_key=True)
    status = Column(String(20), default="notified")
    fee_ksh = Column(Integer)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="lead_matches")
    installer = relationship("Installer", back_populates="lead_matches")


class AppConfig(Base):
    __tablename__ = "app_config"

    key = Column(Text, primary_key=True)
    value = Column(JSONB, nullable=False)
    updated_at = Column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now()
    )
