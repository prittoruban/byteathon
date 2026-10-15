"""
Unit tests for Step 5: Arrhenius Spoilage-Risk Engine
"""

import pytest
from backend.app.spoilage_engine import (
    CROP_KINETIC_DATABASE,
    SpoilageEvaluationRequest,
    TemperatureSpikeSimulationRequest,
    calculate_arrhenius_decay_rate,
    calculate_spoilage_risk,
    simulate_temperature_spike,
    get_crop_kinetics,
)


def test_crop_kinetics_database_coverage():
    """Verify primary crops have calibrated kinetic profiles."""
    crops = ["tomato", "potato", "onion", "mango", "cabbage"]
    for crop in crops:
        params = get_crop_kinetics(crop)
        assert params.crop_name.lower() == crop
        assert params.activation_energy_j_mol > 30000.0  # Real biological range
        assert params.base_decay_rate_per_day > 0.0
        assert params.optimal_temp_celsius >= 0.0


def test_arrhenius_rate_monotonic_increase():
    """Verify that as temperature rises, Arrhenius reaction rate k(T) increases exponentially."""
    params = get_crop_kinetics("tomato")
    
    k_cold, accel_cold, _ = calculate_arrhenius_decay_rate(params, 10.0)  # optimal
    k_warm, accel_warm, _ = calculate_arrhenius_decay_rate(params, 25.0)
    k_hot, accel_hot, _ = calculate_arrhenius_decay_rate(params, 38.0)

    assert k_cold < k_warm < k_hot
    assert accel_cold < accel_warm < accel_hot
    assert round(accel_cold, 2) == 1.0  # At reference 10°C, acceleration is exactly 1.0
    assert accel_warm > 2.5
    assert accel_hot > 7.0


def test_simulated_temperature_spike_increases_risk_appropriately():
    """
    Mandatory Step 5 Verification:
    Verify that a simulated temperature increase changes the estimated risk appropriately.
    """
    # Consignment of Tomatoes with 3 days (72h) remaining shelf life, 12h transit remaining
    req = TemperatureSpikeSimulationRequest(
        crop_type="Tomato",
        remaining_shelf_life_days=3.0,
        initial_shelf_life_days=14.0,
        baseline_temp_celsius=10.0,   # Optimal cold-chain
        elevated_temp_celsius=36.0,   # AC failure in summer ambient transit
        spike_duration_hours=8.0,
        humidity_pct=85.0,
        transit_hours_remaining=12.0,
    )

    result = simulate_temperature_spike(req)
    
    baseline = result["baseline_cold_chain"]
    spiked = result["spiked_condition"]

    # 1. Decay rate must be substantially higher under elevated temperature
    assert spiked["k_decay_rate_per_day"] > (baseline["k_decay_rate_per_day"] * 5.0)

    # 2. Acceleration factor must reflect exponential Arrhenius kinetics
    assert spiked["acceleration_factor"] > 6.0

    # 3. Spoilage risk score must jump significantly
    assert spiked["spoilage_risk_score"] > baseline["spoilage_risk_score"]
    assert spiked["spoilage_risk_score"] >= 70.0  # Reaches critical tier

    # 4. Reroute must be triggered due to accelerated decay
    assert spiked["is_reroute_recommended"] is True

    # 5. Scientific summary and impact comparison must be populated
    assert "faster" in result["impact_comparison"]["decay_rate_multiplier"]
    assert len(result["scientific_summary"]) > 50


def test_chilling_injury_detection():
    """Verify chilling-sensitive crops (like Tomatoes) flag physiological chilling stress below 7°C."""
    req_cold_injury = SpoilageEvaluationRequest(
        crop_type="Tomato",
        remaining_shelf_life_days=10.0,
        initial_shelf_life_days=14.0,
        current_temp_celsius=2.0,  # Below 7°C threshold
        exposure_hours=12.0,
    )
    assessment = calculate_spoilage_risk(req_cold_injury)
    assert assessment.chilling_injury_active is True
    assert "Chilling injury" in assessment.rationale


def test_transit_viability_expiration_detection():
    """Verify that if remaining shelf life drops below remaining transit hours, risk is critical and reroute flagged."""
    req = SpoilageEvaluationRequest(
        crop_type="Mango",
        remaining_shelf_life_days=0.5,  # Only 12 hours left
        initial_shelf_life_days=14.0,
        current_temp_celsius=32.0,
        exposure_hours=2.0,
        transit_hours_remaining=16.0,   # 16 hours needed to destination!
    )
    assessment = calculate_spoilage_risk(req)
    
    assert assessment.transit_viability is not None
    assert assessment.transit_viability["will_survive_transit"] is False
    assert assessment.is_reroute_recommended is True
    assert assessment.risk_level == "CRITICAL"
    assert assessment.spoilage_risk_score >= 88.0
