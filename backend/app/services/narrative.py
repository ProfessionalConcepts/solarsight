"""Template-based narrative generator for solar assessment reports.

Strict Rule: Pure template interpolation only. Numbers come directly from the
assessment engine. Never invent or hallucinate figures.
"""
from __future__ import annotations

from typing import Any


def format_currency_ksh(amount: float) -> str:
    """Format number as KSh with thousand separators e.g. KSh 6,000."""
    return f"KSh {int(round(amount)):,}"


def generate_narrative(
    *,
    monthly_bill_ksh: float,
    recommended_kwp: float,
    coverage_pct: int,
    monthly_savings_low: float,
    monthly_savings_high: float,
    payback_grid: float,
    payback_hybrid: float,
    battery_kwh: float,
    installer_count: int = 3,
) -> dict[str, str]:
    """
    Interpolate engine numbers into deterministic English and Swahili templates.
    Swahili copy is annotated for native-speaker verification prior to full launch.
    """
    bill_str = format_currency_ksh(monthly_bill_ksh)
    savings_low_str = f"{int(round(monthly_savings_low)):,}"
    savings_high_str = f"{int(round(monthly_savings_high)):,}"
    kwp_str = f"{recommended_kwp:.1f}".rstrip("0").rstrip(".")
    bat_str = f"{battery_kwh:.1f}".rstrip("0").rstrip(".")
    grid_years = f"{payback_grid:.1f}".rstrip("0").rstrip(".")
    hybrid_years = f"{payback_hybrid:.1f}".rstrip("0").rstrip(".")

    en = (
        f"Based on your {bill_str} monthly bill, a {kwp_str} kWp solar system could cover about "
        f"{coverage_pct}% of your electricity. In a good month you would save around "
        f"KSh {savings_low_str}-{savings_high_str}. Expect lower output in April-May and November "
        f"because of the rains - that is normal. Without batteries the system pays for itself in "
        f"about {grid_years} years; adding a {bat_str} kWh battery pushes that to about {hybrid_years} "
        f"years but keeps your lights on during blackouts. Up to {installer_count} vetted installers "
        f"can give you exact prices for free."
    )

    # NOTE: Swahili strings should undergo final native-speaker review before launch. [REVIEW_NEEDED]
    sw = (
        f"Kulingana na bili yako ya {bill_str} kila mwezi, mfumo wa jua wa {kwp_str} kWp ungeweza "
        f"kutoa takriban {coverage_pct}% ya umeme wako. Kwa mwezi mzuri, ungeweza kuokoa takribani "
        f"KSh {savings_low_str}-{savings_high_str}. Kuna miezi ya Aprili-Mei na Novemba utazalisha "
        f"kidogo kwa sababu ya mvua - hilo ni la kawaida. Bila betri mfumo huu unalipa gharama zake "
        f"kwa takriban miaka {grid_years}; ukiongeza betri ya {bat_str} kWh inachukua takriban miaka "
        f"{hybrid_years} lakini taa zako zitawaka wakati wa kukatika kwa umeme. Mafundi {installer_count} "
        f"walioidhinishwa wanaweza kukupa makadirio kamili bila malipo."
    )

    return {"en": en, "sw": sw}
