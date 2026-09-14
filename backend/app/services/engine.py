"""
EnergyIQ Assessment Engine — PURE FUNCTION, NO I/O.

All inputs are passed explicitly; config values come from the app_config DB
table (never hardcoded here). This module contains no side effects, making it
fully unit-testable without any database or HTTP dependencies.
"""
from __future__ import annotations

import math
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _pick_kit_size(value: float, sizes: list[float]) -> Optional[float]:
    """Return smallest kit size >= value, or None if none fits."""
    sorted_sizes = sorted(sizes)
    for s in sorted_sizes:
        if s >= value:
            return s
    return None


def _npv(annual_savings: float, rate: float, years: int = 20,
         battery_replacement_cost: float = 0.0, battery_replacement_year: int = 11) -> float:
    """Net present value over `years` at `rate`; capex excluded (paid at t=0)."""
    total = 0.0
    for t in range(1, years + 1):
        discount = (1 + rate) ** t
        cf = annual_savings
        if t == battery_replacement_year and battery_replacement_cost > 0:
            cf -= battery_replacement_cost
        total += cf / discount
    return total


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_assessment(
    *,
    lat: float,
    lng: float,
    roof_area_m2: Optional[float],
    roof_tilt: int,
    azimuth: int,  # internal 0=NORTH clockwise
    shading_self: str,
    # Consumption — at least one must resolve to a daily_kwh
    monthly_kwh: Optional[float],
    monthly_bill_ksh: Optional[float],
    appliances: Optional[list[dict]],  # [{watts, hours_per_day}]
    tariff_type: str,
    has_genset: bool,
    genset_monthly_fuel_ksh: Optional[float],
    backup_hours_goal: int,
    language: str,
    # PVGIS data
    E_y: float,            # annual kWh/kWp (losses already included)
    E_m: list[float],      # monthly kWh/kWp list[12] (losses already included)
    # Config dict from app_config table
    cfg: dict[str, Any],
) -> dict[str, Any]:
    """
    Compute a solar feasibility assessment.

    Returns a dict matching AssessmentResult schema.
    All monetary/tariff constants come from `cfg`.
    PVGIS E_y/E_m already include losses — do NOT apply extra derate.
    """
    # -----------------------------------------------------------------------
    # 0. Pull config constants
    # -----------------------------------------------------------------------
    tariff_key = f"tariff_{tariff_type}_effective_ksh_per_kwh"
    tariff_ksh_kwh: float = float(cfg[tariff_key])

    diesel_price: float = float(cfg["diesel_price_ksh_per_litre"])
    genset_lph: float = float(cfg["genset_litres_per_kwh"])
    genset_maint: float = float(cfg["genset_maintenance_ksh_per_kwh"])
    pv_cost_kwp: float = float(cfg["pv_cost_ksh_per_kwp_installed"])
    bat_cost_kwh: float = float(cfg["battery_cost_ksh_per_kwh_installed"])
    panel_m2_kwp: float = float(cfg["panel_m2_per_kwp"])
    sc_battery: float = float(cfg["self_consumption_with_battery"])
    sc_grid: float = float(cfg["self_consumption_grid_tie"])
    bat_dod: float = float(cfg["battery_dod"])
    bat_replace_yr: int = int(cfg["battery_replacement_year"])
    evening_factor: float = float(cfg["evening_peak_factor"])
    discount_rate: float = float(cfg["discount_rate"])
    sizing_headroom: float = float(cfg["sizing_headroom"])
    kit_sizes_kwp: list[float] = [float(x) for x in cfg["standard_kit_sizes_kwp"]]
    bat_kit_sizes: list[float] = [float(x) for x in cfg["battery_kit_sizes_kwh"]]
    min_bill_ksh: float = float(cfg["min_bill_for_recommendation_ksh"])
    data_last_updated: str = str(cfg.get("data_last_updated", ""))

    # -----------------------------------------------------------------------
    # 1. Resolve daily_kwh from whichever source was provided
    # -----------------------------------------------------------------------
    if appliances:
        daily_kwh: float = sum(
            float(a["watts"]) * float(a["hours_per_day"]) / 1000.0
            for a in appliances
        )
        _monthly_kwh: float = daily_kwh * 30
    elif monthly_kwh:
        _monthly_kwh = float(monthly_kwh)
        daily_kwh = _monthly_kwh / 30.0
    elif monthly_bill_ksh:
        _monthly_kwh = float(monthly_bill_ksh) / tariff_ksh_kwh
        daily_kwh = _monthly_kwh / 30.0
    else:
        raise ValueError("No consumption source provided")

    # Effective monthly bill for financials
    _monthly_bill: float = float(monthly_bill_ksh) if monthly_bill_ksh else (_monthly_kwh * tariff_ksh_kwh)

    # -----------------------------------------------------------------------
    # 2. Sizing
    # -----------------------------------------------------------------------
    avg_daily_yield_kwp: float = E_y / 365.0
    required_kwp: float = (daily_kwh / avg_daily_yield_kwp) * sizing_headroom

    roof_max_kwp: Optional[float] = None
    roof_limited: bool = False
    if roof_area_m2 is not None:
        roof_max_kwp = float(roof_area_m2) / panel_m2_kwp

    if roof_max_kwp is not None:
        kwp_raw = min(required_kwp, roof_max_kwp)
        if roof_max_kwp < required_kwp:
            roof_limited = True
    else:
        kwp_raw = required_kwp

    # Snap to nearest standard kit size
    best_size = _pick_kit_size(kwp_raw, kit_sizes_kwp)
    if best_size is not None:
        # Don't exceed roof if roof is limiting
        if roof_max_kwp is not None and best_size > roof_max_kwp:
            recommended_kwp = roof_max_kwp
        else:
            recommended_kwp = best_size
    else:
        # kwp_raw exceeds all standard sizes — use largest or roof_max
        recommended_kwp = kwp_raw if roof_max_kwp is None else min(kwp_raw, roof_max_kwp)

    # Battery sizing
    evening_avg_load_kw: float = (daily_kwh / 24.0) * evening_factor
    battery_kwh_raw: float = (float(backup_hours_goal) * evening_avg_load_kw) / bat_dod

    bat_best = _pick_kit_size(battery_kwh_raw, bat_kit_sizes)
    battery_kwh: float = bat_best if bat_best is not None else battery_kwh_raw

    # -----------------------------------------------------------------------
    # 3. Production (no extra derate — E_y/E_m already include losses)
    # -----------------------------------------------------------------------
    annual_kwh: float = E_y * recommended_kwp
    monthly_prod: list[dict] = [
        {"month": i + 1, "kwh": round(E_m[i] * recommended_kwp, 1)}
        for i in range(12)
    ]

    # Coverage
    coverage_pct: int = min(
        100,
        round(annual_kwh * sc_battery / (_monthly_kwh * 12) * 100),
    )

    # -----------------------------------------------------------------------
    # 4. Financials
    # -----------------------------------------------------------------------
    genset_cost_per_kwh: float = (diesel_price * genset_lph) + genset_maint
    genset_kwh_month: float = 0.0
    if has_genset and genset_monthly_fuel_ksh:
        genset_kwh_month = (float(genset_monthly_fuel_ksh) / diesel_price) / genset_lph

    avoided_ksh_per_kwh: float = tariff_ksh_kwh + (
        genset_kwh_month * genset_cost_per_kwh / _monthly_kwh
        if has_genset and _monthly_kwh > 0
        else 0.0
    )

    savings_annual_grid: float = annual_kwh * sc_grid * avoided_ksh_per_kwh
    savings_annual_hybrid: float = annual_kwh * sc_battery * avoided_ksh_per_kwh

    capex_grid: float = recommended_kwp * pv_cost_kwp
    capex_hybrid: float = capex_grid + battery_kwh * bat_cost_kwh

    payback_grid: float = capex_grid / savings_annual_grid if savings_annual_grid > 0 else 999.0
    payback_hybrid: float = capex_hybrid / savings_annual_hybrid if savings_annual_hybrid > 0 else 999.0

    # Monthly savings point estimate (grid-tie as primary)
    monthly_savings_mid: float = savings_annual_grid / 12.0
    monthly_savings_low: float = monthly_savings_mid * 0.90
    monthly_savings_high: float = monthly_savings_mid * 1.10

    # NPV over 20 years
    bat_replace_cost: float = battery_kwh * bat_cost_kwh
    npv_grid = _npv(savings_annual_grid, discount_rate) - capex_grid
    npv_hybrid = _npv(
        savings_annual_hybrid, discount_rate,
        battery_replacement_cost=bat_replace_cost,
        battery_replacement_year=bat_replace_yr,
    ) - capex_hybrid

    # -----------------------------------------------------------------------
    # 5. Verdict (first match wins)
    # -----------------------------------------------------------------------
    if shading_self == "heavy":
        verdict_code = "caution"
        verdict_reason = (
            "Shading concerns - a site survey is essential before you commit"
        )
    elif _monthly_bill < min_bill_ksh:
        verdict_code = "caution"
        verdict_reason = "Your usage is small - consider a smaller system first"
    elif roof_max_kwp is not None and roof_max_kwp < required_kwp * 0.7:
        verdict_code = "explore"
        verdict_reason = "Your roof can only fit a partial system"
    elif payback_grid <= 5 or payback_hybrid <= 7:
        verdict_code = "strong_yes"
        verdict_reason = "Solar is a strong yes for you"
    elif payback_grid <= 8 or payback_hybrid <= 12:
        verdict_code = "explore"
        verdict_reason = "Worth exploring - get real quotes"
    else:
        verdict_code = "caution"
        verdict_reason = "Payback looks long at current prices - check financing options"

    # -----------------------------------------------------------------------
    # 6. Recommendations (2-4 items, rule-based)
    # -----------------------------------------------------------------------
    recommendations: list[str] = []
    recommendations.append("Face your panels north for maximum yield in Kenya.")
    if has_genset:
        recommendations.append(
            "A hybrid system suits you well because you already run a generator."
        )
    else:
        recommendations.append(
            "Start with a grid-tie system now and add battery storage later."
        )
    if payback_grid > 8 and payback_hybrid > 12:
        recommendations.append(
            "Ask your bank or SACCO about asset-finance products for solar."
        )
    if shading_self == "some":
        recommendations.append(
            "Trim trees on the north side of your roof to reduce shading losses."
        )

    # -----------------------------------------------------------------------
    # 7. Assemble result
    # -----------------------------------------------------------------------
    return {
        "sizing": {
            "recommended_kwp": round(recommended_kwp, 2),
            "battery_kwh": round(battery_kwh, 2),
            "annual_kwh": round(annual_kwh, 1),
            "coverage_pct": coverage_pct,
            "roof_limited": roof_limited,
            "roof_max_kwp": round(roof_max_kwp, 2) if roof_max_kwp is not None else None,
        },
        "financials": {
            "capex_grid_tie_ksh": round(capex_grid),
            "capex_hybrid_ksh": round(capex_hybrid),
            "savings_annual_grid_tie_ksh": round(savings_annual_grid),
            "savings_annual_hybrid_ksh": round(savings_annual_hybrid),
            "payback_grid_tie_yrs": round(payback_grid, 1),
            "payback_hybrid_yrs": round(payback_hybrid, 1),
            "monthly_savings_low_ksh": round(monthly_savings_low),
            "monthly_savings_high_ksh": round(monthly_savings_high),
            "npv_grid_tie_ksh": round(npv_grid),
            "npv_hybrid_ksh": round(npv_hybrid),
            "avoided_ksh_per_kwh": round(avoided_ksh_per_kwh, 2),
        },
        "monthly_production": monthly_prod,
        "verdict": {"code": verdict_code, "reason": verdict_reason},
        "recommendations": recommendations,
        "data_last_updated": data_last_updated,
        # narrative filled in by narrative.py after engine returns
    }
