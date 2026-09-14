"""Seed app_config and sample installers.

Revision ID: 002_seed_data
Revises: 001_initial_schema
Create Date: 2026-09-02
"""
import json
from alembic import op
import sqlalchemy as sa

revision = '002_seed_data'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

DEFAULT_CONFIGS = {
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

# ---------------------------------------------------------------------------
# SAMPLE INSTALLERS (Clearly labelled SAMPLE per MVP spec)
# Real EPRA-licensed installers entered later through admin panel.
# ---------------------------------------------------------------------------
SAMPLE_INSTALLERS = [
    {
        "name": "Solar Kenya Solutions [SAMPLE]",
        "phone": "+254711234567",
        "whatsapp": "+254711234567",
        "county": "Nairobi",
        "town": "Westlands",
        "lat": -1.2678,
        "lng": 36.8122,
        "radius": 60,
        "epra_no": "EPRA/SOL/2023/0481",
        "verified": True,
        "types": "{pv_hybrid,pv_gridtie,pumping}",
        "min_kw": 1.0,
        "max_kw": 30.0,
        "rating": 4.85,
        "reviews": 32,
    },
    {
        "name": "Nairobi Solar Hub [SAMPLE]",
        "phone": "+254722345678",
        "whatsapp": "+254722345678",
        "county": "Nairobi",
        "town": "Kilimani",
        "lat": -1.2921,
        "lng": 36.7850,
        "radius": 50,
        "epra_no": "EPRA/SOL/2022/1029",
        "verified": True,
        "types": "{pv_hybrid,pv_gridtie,water_heating}",
        "min_kw": 0.5,
        "max_kw": 15.0,
        "rating": 4.70,
        "reviews": 19,
    },
    {
        "name": "Greenlight Power KE [SAMPLE]",
        "phone": "+254733456789",
        "whatsapp": "+254733456789",
        "county": "Nairobi",
        "town": "Industrial Area",
        "lat": -1.3105,
        "lng": 36.8450,
        "radius": 75,
        "epra_no": "EPRA/SOL/2021/0192",
        "verified": True,
        "types": "{pv_hybrid,pv_gridtie}",
        "min_kw": 2.0,
        "max_kw": 50.0,
        "rating": 4.90,
        "reviews": 45,
    },
    {
        "name": "Sunshine Systems Nairobi [SAMPLE]",
        "phone": "+254701234890",
        "whatsapp": "+254701234890",
        "county": "Nairobi",
        "town": "Karen",
        "lat": -1.3195,
        "lng": 36.7065,
        "radius": 45,
        "epra_no": "EPRA/SOL/2023/0890",
        "verified": False,
        "types": "{pv_hybrid,pumping}",
        "min_kw": 1.0,
        "max_kw": 20.0,
        "rating": 4.50,
        "reviews": 12,
    },
    {
        "name": "PowerAfrica Solar Ltd [SAMPLE]",
        "phone": "+254712987654",
        "whatsapp": "+254712987654",
        "county": "Nairobi",
        "town": "CBD",
        "lat": -1.286389,
        "lng": 36.817223,
        "radius": 50,
        "epra_no": "EPRA/SOL/2020/0044",
        "verified": True,
        "types": "{pv_hybrid,pv_gridtie,water_heating}",
        "min_kw": 0.5,
        "max_kw": 25.0,
        "rating": 4.65,
        "reviews": 28,
    },
    {
        "name": "Solaris Kenya [SAMPLE]",
        "phone": "+254721445566",
        "whatsapp": "+254721445566",
        "county": "Nairobi",
        "town": "Gigiri",
        "lat": -1.2333,
        "lng": 36.8000,
        "radius": 50,
        "epra_no": "EPRA/SOL/2024/0012",
        "verified": True,
        "types": "{pv_hybrid,pv_gridtie}",
        "min_kw": 1.5,
        "max_kw": 40.0,
        "rating": 4.95,
        "reviews": 38,
    },
    {
        "name": "BrightSun Installers [SAMPLE]",
        "phone": "+254734889900",
        "whatsapp": "+254734889900",
        "county": "Nairobi",
        "town": "Parklands",
        "lat": -1.2612,
        "lng": 36.8188,
        "radius": 40,
        "epra_no": "EPRA/SOL/2023/0551",
        "verified": False,
        "types": "{pv_hybrid,water_heating}",
        "min_kw": 0.5,
        "max_kw": 10.0,
        "rating": 4.30,
        "reviews": 8,
    },
    {
        "name": "EcoSolar Nairobi [SAMPLE]",
        "phone": "+254705112233",
        "whatsapp": "+254705112233",
        "county": "Nairobi",
        "town": "Langata",
        "lat": -1.3400,
        "lng": 36.7700,
        "radius": 50,
        "epra_no": "EPRA/SOL/2022/0762",
        "verified": True,
        "types": "{pv_hybrid,pv_gridtie}",
        "min_kw": 0.5,
        "max_kw": 15.0,
        "rating": 4.75,
        "reviews": 21,
    },
    {
        "name": "AfriSolar Technologies [SAMPLE]",
        "phone": "+254716778899",
        "whatsapp": "+254716778899",
        "county": "Nairobi",
        "town": "South C",
        "lat": -1.3200,
        "lng": 36.8300,
        "radius": 55,
        "epra_no": "EPRA/SOL/2021/0411",
        "verified": True,
        "types": "{pv_hybrid,pv_gridtie,pumping}",
        "min_kw": 1.0,
        "max_kw": 30.0,
        "rating": 4.80,
        "reviews": 24,
    },
    {
        "name": "PV Kenya Ltd [SAMPLE]",
        "phone": "+254728990011",
        "whatsapp": "+254728990011",
        "county": "Nairobi",
        "town": "Kasarani",
        "lat": -1.2200,
        "lng": 36.9000,
        "radius": 50,
        "epra_no": "EPRA/SOL/2023/0677",
        "verified": False,
        "types": "{pv_hybrid,pv_gridtie}",
        "min_kw": 0.5,
        "max_kw": 20.0,
        "rating": 4.40,
        "reviews": 15,
    },
]


def upgrade() -> None:
    # 1. Seed app_config
    for k, v in DEFAULT_CONFIGS.items():
        val_json = json.dumps(v)
        op.execute(
            sa.text("INSERT INTO app_config (key, value) VALUES (:k, :v) ON CONFLICT (key) DO UPDATE SET value = :v")
            .bindparams(k=k, v=val_json)
        )

    # 2. Seed SAMPLE installers
    for inst in SAMPLE_INSTALLERS:
        op.execute(
            sa.text("""
                INSERT INTO installers (
                    name, phone, whatsapp, county, town, geom, service_radius_km,
                    epra_license_no, epra_verified, product_types, size_min_kw,
                    size_max_kw, rating_avg, rating_count, lead_fee_ksh, active
                ) VALUES (
                    :name, :phone, :whatsapp, :county, :town,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :radius, :epra_no, :verified, :types, :min_kw,
                    :max_kw, :rating, :reviews, 500, true
                )
            """).bindparams(
                name=inst["name"],
                phone=inst["phone"],
                whatsapp=inst["whatsapp"],
                county=inst["county"],
                town=inst["town"],
                lng=inst["lng"],
                lat=inst["lat"],
                radius=inst["radius"],
                epra_no=inst["epra_no"],
                verified=inst["verified"],
                types=inst["types"],
                min_kw=inst["min_kw"],
                max_kw=inst["max_kw"],
                rating=inst["rating"],
                reviews=inst["reviews"],
            )
        )


def downgrade() -> None:
    op.execute("DELETE FROM installers WHERE name LIKE '%[SAMPLE]%';")
    op.execute("DELETE FROM app_config;")
