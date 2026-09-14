"""Unit tests for EnergyIQ Assessment Engine — Golden cases and edge cases."""
from __future__ import annotations

import json
from pathlib import Path
import pytest

from app.schemas.assessment import AssessmentInput
from app.schemas.lead import LeadCreate
from app.services.engine import run_assessment

# Standard config dictionary matching app_config seed
BASE_CONFIG = {
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


@pytest.fixture
def pvgis_nairobi_data():
    fixture_path = Path(__file__).parent / "fixtures" / "pvgis_nairobi.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    totals = data["outputs"]["totals"]["fixed"]
    monthly = data["outputs"]["monthly"]["fixed"]
    return {
        "E_y": totals["E_y"],
        "E_m": [m["E_m"] for m in monthly],
    }


# ===========================================================================
# Golden Case 1: Nairobi Home
# ===========================================================================
def test_golden_case_1_nairobi_home(pvgis_nairobi_data):
    """
    lat -1.2921, lng 36.8219, bill 6000 KSh, domestic, 60 m2 usable roof,
    tilt 15, north-facing (azimuth 0), no genset.
    Expect:
    - required_kwp between 2.4 and 3.6
    - roof not limiting
    - grid-tie payback between 5 and 8 years
    - hybrid payback between 8 and 12 years
    - coverage_pct 90-100
    """
    res = run_assessment(
        lat=-1.2921,
        lng=36.8219,
        roof_area_m2=60.0,
        roof_tilt=15,
        azimuth=0,
        shading_self="none",
        monthly_kwh=None,
        monthly_bill_ksh=6000.0,
        appliances=None,
        tariff_type="domestic",
        has_genset=False,
        genset_monthly_fuel_ksh=None,
        backup_hours_goal=6,
        language="en",
        E_y=pvgis_nairobi_data["E_y"],
        E_m=pvgis_nairobi_data["E_m"],
        cfg=BASE_CONFIG,
    )

    sizing = res["sizing"]
    financials = res["financials"]

    # 1. required / recommended kwp
    assert 2.4 <= sizing["recommended_kwp"] <= 3.6
    # 2. roof not limiting
    assert sizing["roof_limited"] is False
    # 3. grid-tie payback 5-8 yrs
    assert 5.0 <= financials["payback_grid_tie_yrs"] <= 8.0
    # 4. hybrid payback 8-12 yrs
    assert 8.0 <= financials["payback_hybrid_yrs"] <= 12.0
    # 5. coverage_pct 90-100%
    assert 90 <= sizing["coverage_pct"] <= 100


# ===========================================================================
# Golden Case 2: Nakuru SME
# ===========================================================================
def test_golden_case_2_nakuru_sme(pvgis_nairobi_data):
    """
    lat -0.28, lng 36.07, bill 30000 KSh, small commercial, 150 m2 roof.
    Expect:
    - required_kwp between 13 and 18 (with lower solar / Nakuru yield or kit snapping)
    - roof not limiting
    - verdict strong_yes or explore
    """
    # Nakuru irradiance typically ~1450 - 1500 kWh/kWp
    E_y_nakuru = 1450.0
    E_m_nakuru = [round(E_y_nakuru / 12, 1)] * 12

    res = run_assessment(
        lat=-0.28,
        lng=36.07,
        roof_area_m2=150.0,
        roof_tilt=10,
        azimuth=0,
        shading_self="none",
        monthly_kwh=None,
        monthly_bill_ksh=30000.0,
        appliances=None,
        tariff_type="small_commercial",
        has_genset=False,
        genset_monthly_fuel_ksh=None,
        backup_hours_goal=6,
        language="en",
        E_y=E_y_nakuru,
        E_m=E_m_nakuru,
        cfg=BASE_CONFIG,
    )

    sizing = res["sizing"]
    verdict = res["verdict"]

    assert 13.0 <= sizing["recommended_kwp"] <= 18.0
    assert sizing["roof_limited"] is False
    assert verdict["code"] in ["strong_yes", "explore"]


# ===========================================================================
# Golden Case 3: Kisumu home with generator
# ===========================================================================
def test_golden_case_3_kisumu_genset(pvgis_nairobi_data):
    """
    lat -0.09, lng 34.77, bill 8000 KSh plus 8000 KSh monthly generator fuel.
    Expect:
    - avoided cost per kWh above 30
    - payback shorter than the no-genset equivalent
    """
    res_genset = run_assessment(
        lat=-0.09,
        lng=34.77,
        roof_area_m2=80.0,
        roof_tilt=10,
        azimuth=0,
        shading_self="none",
        monthly_kwh=None,
        monthly_bill_ksh=8000.0,
        appliances=None,
        tariff_type="domestic",
        has_genset=True,
        genset_monthly_fuel_ksh=8000.0,
        backup_hours_goal=6,
        language="en",
        E_y=pvgis_nairobi_data["E_y"],
        E_m=pvgis_nairobi_data["E_m"],
        cfg=BASE_CONFIG,
    )

    res_no_genset = run_assessment(
        lat=-0.09,
        lng=34.77,
        roof_area_m2=80.0,
        roof_tilt=10,
        azimuth=0,
        shading_self="none",
        monthly_kwh=None,
        monthly_bill_ksh=8000.0,
        appliances=None,
        tariff_type="domestic",
        has_genset=False,
        genset_monthly_fuel_ksh=None,
        backup_hours_goal=6,
        language="en",
        E_y=pvgis_nairobi_data["E_y"],
        E_m=pvgis_nairobi_data["E_m"],
        cfg=BASE_CONFIG,
    )

    financials_genset = res_genset["financials"]
    financials_no_genset = res_no_genset["financials"]

    assert financials_genset["avoided_ksh_per_kwh"] > 30.0
    assert financials_genset["payback_hybrid_yrs"] < financials_no_genset["payback_hybrid_yrs"]


# ===========================================================================
# Golden Case 4: Tiny Roof
# ===========================================================================
def test_golden_case_4_tiny_roof(pvgis_nairobi_data):
    """
    required_kwp ~ 3.0, roof 12 m2 (12 / 5 = 2.4 kWp max).
    Expect:
    - roof_limited is True
    - verdict is explore with roof-limitation reason
    """
    res = run_assessment(
        lat=-1.2921,
        lng=36.8219,
        roof_area_m2=12.0,  # Max 2.4 kWp
        roof_tilt=10,
        azimuth=0,
        shading_self="none",
        monthly_kwh=None,
        monthly_bill_ksh=8500.0,
        appliances=None,
        tariff_type="domestic",
        has_genset=False,
        genset_monthly_fuel_ksh=None,
        backup_hours_goal=6,
        language="en",
        E_y=pvgis_nairobi_data["E_y"],
        E_m=pvgis_nairobi_data["E_m"],
        cfg=BASE_CONFIG,
    )

    assert res["sizing"]["roof_limited"] is True
    assert res["sizing"]["recommended_kwp"] <= 2.4
    assert res["verdict"]["code"] == "explore"
    assert "roof" in res["verdict"]["reason"].lower()


# ===========================================================================
# Golden Case 5: Heavy Shading
# ===========================================================================
def test_golden_case_5_heavy_shading(pvgis_nairobi_data):
    """
    shading heavy, otherwise good case.
    Expect:
    - verdict caution with survey reason regardless of payback
    """
    res = run_assessment(
        lat=-1.2921,
        lng=36.8219,
        roof_area_m2=100.0,
        roof_tilt=10,
        azimuth=0,
        shading_self="heavy",
        monthly_kwh=None,
        monthly_bill_ksh=8000.0,
        appliances=None,
        tariff_type="domestic",
        has_genset=False,
        genset_monthly_fuel_ksh=None,
        backup_hours_goal=6,
        language="en",
        E_y=pvgis_nairobi_data["E_y"],
        E_m=pvgis_nairobi_data["E_m"],
        cfg=BASE_CONFIG,
    )

    assert res["verdict"]["code"] == "caution"
    assert "survey" in res["verdict"]["reason"].lower()


# ===========================================================================
# Edge Cases: Validation Rules
# ===========================================================================
def test_edge_case_coordinates_outside_kenya():
    """Coordinates outside Kenya bounds must raise ValidationError."""
    with pytest.raises(Exception):
        AssessmentInput(
            lat=52.52,  # Berlin
            lng=13.405,
            monthly_bill_ksh=5000,
        )


def test_edge_case_invalid_phone_rejected():
    """Invalid phone format must raise ValidationError."""
    import uuid
    with pytest.raises(Exception):
        LeadCreate(
            assessment_id=uuid.uuid4(),
            name="John Doe",
            phone="12345",  # Invalid
            consent=True,
        )


def test_edge_case_missing_consent_rejected():
    """Consent false must be rejected."""
    import uuid
    with pytest.raises(Exception):
        LeadCreate(
            assessment_id=uuid.uuid4(),
            name="John Doe",
            phone="+254711223344",
            consent=False,
        )
