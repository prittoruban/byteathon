"""
Unit tests for Step 7: Secondary-Market Recovery & Arbitrage Protocol
"""

import pytest
from backend.app.secondary_recovery import (
    determine_quality_grade,
    evaluate_food_safety_compliance,
    evaluate_secondary_market_arbitrage,
    FOOD_SAFETY_MIN_BUFFER_HOURS,
)


@pytest.fixture
def primary_supermarket():
    return {
        "id": "48ee5000-503e-4b8d-a7bc-272532eaf258",
        "name": "FreshMart Hypermarket (Prime Retail)",
        "type": "primary_retail",
        "location": "Mumbai Central Hub",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "offered_price_per_kg": 42.0,
        "demand_crop": "Tomato",
        "demand_kg": 5000.0,
    }


@pytest.fixture
def secondary_puree_processor():
    return {
        "id": "d46dcda9-7559-45d5-b859-505cb8704dcc",
        "name": "Apex Agro Puree & Sauce Corp",
        "type": "secondary_processor",
        "location": "Thane Industrial Zone",
        "latitude": 19.2183,
        "longitude": 72.9781,
        "offered_price_per_kg": 26.5,
        "demand_crop": "Tomato",
        "demand_kg": 8000.0,
    }


def test_scenario_diversion_is_beneficial(primary_supermarket, secondary_puree_processor):
    """
    Mandatory Step 7 Verification — Test scenario where diversion IS beneficial:
    High thermal stress causes produce to degrade to Grade C. Primary supermarket
    rejects or penalizes by 80%, while secondary processor accepts for puree,
    delivering superior net margin.
    """
    result = evaluate_secondary_market_arbitrage(
        crop_type="Tomato",
        quantity_kg=4000.0,
        initial_shelf_life_days=14.0,
        remaining_shelf_life_days=2.0,  # 48 hours left, but in 36°C heat
        current_temp_celsius=36.0,
        current_humidity_pct=70.0,
        vehicle_lat=19.98,
        vehicle_lon=73.79,
        primary_buyer=primary_supermarket,
        secondary_buyer=secondary_puree_processor,
        cost_per_km=15.0,
    )

    # 1. Diversion must be identified as beneficial
    assert result.is_diversion_beneficial is True
    assert result.recommended_action == "DIVERT_TO_SECONDARY_PROCESSOR"

    # 2. Secondary net margin must exceed primary net margin
    assert result.secondary_processor_option.net_margin > result.primary_retail_option.net_margin
    assert result.arbitrage_net_difference > 0

    # 3. FSSAI food safety requirements must be respected
    assert result.food_safety.is_compliant is True

    # 4. Explainable rationale must cite the economic arbitrage gain
    assert "BENEFICIAL" in result.decision_rationale
    assert "Arbitrage Gain" in result.decision_rationale


def test_scenario_diversion_is_not_beneficial(primary_supermarket, secondary_puree_processor):
    """
    Mandatory Step 7 Verification — Test scenario where diversion is NOT beneficial:
    Cold chain is intact (8°C). Produce arrives in Grade A prime condition.
    Primary retail contract price (₹42/kg) delivers significantly higher profit than
    secondary processor (₹26.50/kg).
    """
    result = evaluate_secondary_market_arbitrage(
        crop_type="Tomato",
        quantity_kg=4000.0,
        initial_shelf_life_days=14.0,
        remaining_shelf_life_days=10.0,  # Plentiful 240 hours remaining
        current_temp_celsius=8.0,        # Cold chain preserved
        current_humidity_pct=85.0,
        vehicle_lat=19.98,
        vehicle_lon=73.79,
        primary_buyer=primary_supermarket,
        secondary_buyer=secondary_puree_processor,
        cost_per_km=15.0,
    )

    # 1. Diversion must NOT be beneficial
    assert result.is_diversion_beneficial is False
    assert result.recommended_action == "MAINTAIN_PRIMARY_RETAIL"

    # 2. Primary retail net margin must surpass secondary processor
    assert result.primary_retail_option.net_margin > result.secondary_processor_option.net_margin
    assert result.arbitrage_net_difference < 0

    # 3. Quality grade must be Grade A Prime
    assert result.primary_retail_option.arrival_quality_grade == "GRADE_A_PRIME"
    assert result.primary_retail_option.quality_penalty_pct == 0.0

    # 4. Rationale must explain why primary contract is maintained
    assert "DIVERSION NOT BENEFICIAL" in result.decision_rationale
    assert "Maintain primary retail contract" in result.decision_rationale


def test_food_safety_hazard_rejection(primary_supermarket, secondary_puree_processor):
    """
    Step 7 Mandatory Requirement — Respect applicable food-safety requirements:
    When produce is severely spoiled (< 4h remaining life), secondary processor
    MUST legally reject the cargo under FSSAI regulations.
    """
    # Extremely spoiled cargo (only 1 hour remaining biological life)
    safety_check = evaluate_food_safety_compliance(
        crop_type="Tomato",
        arrival_sl_hours=1.5,
        current_temp_celsius=38.0,
        exposure_hours=12.0,
    )

    assert safety_check.is_compliant is False
    assert safety_check.status == "FOOD_SAFETY_HAZARD_REJECTED"
    assert safety_check.microbial_risk_index == "CRITICAL_SPOILAGE"
    assert "FSSAI" in safety_check.regulatory_standard

    # Arbitrage engine must also reject diversion when food safety is breached
    result = evaluate_secondary_market_arbitrage(
        crop_type="Tomato",
        quantity_kg=4000.0,
        initial_shelf_life_days=14.0,
        remaining_shelf_life_days=0.1,  # ~2.4 hours remaining life
        current_temp_celsius=40.0,
        current_humidity_pct=70.0,
        vehicle_lat=19.98,
        vehicle_lon=73.79,
        primary_buyer=primary_supermarket,
        secondary_buyer=secondary_puree_processor,
    )

    assert result.food_safety.is_compliant is False
    assert result.is_diversion_beneficial is False
    assert "FOOD SAFETY" in result.decision_rationale


def test_quality_grade_tiers():
    """Verify tiered quality price deductions across degradation levels."""
    # Grade A: 80 hours left of 100 hours initial (80% retention)
    grade_a = determine_quality_grade("Tomato", 80.0, 100.0)
    assert grade_a.grade == "GRADE_A_PRIME"
    assert grade_a.primary_retail_penalty_pct == 0.0

    # Grade B: 30 hours left of 100 hours initial (30 hours buffer, commercial quick-sale)
    grade_b = determine_quality_grade("Tomato", 30.0, 100.0)
    assert grade_b.grade == "GRADE_B_COMMERCIAL"
    assert grade_b.primary_retail_penalty_pct == 25.0

    # Grade C: 12 hours left of 100 hours initial (rejected by retail, accepted by puree factory)
    grade_c = determine_quality_grade("Tomato", 12.0, 100.0)
    assert grade_c.grade == "GRADE_C_PROCESSING_ONLY"
    assert grade_c.primary_retail_penalty_pct == 80.0
    assert grade_c.secondary_processor_penalty_pct == 0.0

    # Grade D: 2 hours left (< 4h food safety minimum)
    grade_d = determine_quality_grade("Tomato", 2.0, 100.0)
    assert grade_d.grade == "GRADE_D_SPOILED"
    assert grade_d.fssai_compliant_for_processing is False
