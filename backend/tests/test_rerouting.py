"""
Unit tests for Step 6: Dynamic Rerouting Engine
"""

import pytest
from backend.app.rerouting_engine import (
    evaluate_dynamic_reroute,
    SimulatedRerouteRequest,
)


@pytest.fixture
def sample_shipment():
    return {
        "id": "42119c80-f97f-473a-914e-dc37ee0ccf45",
        "batch_id": "0607a56d-19a0-4e50-b1d5-57ddce7d5e59",
        "vehicle_id": "b291200c-bd8b-4bd1-93f9-bff80d3cf0f0",
        "allocated_quantity_kg": 4000.0,
        "produce_batches": {
            "id": "0607a56d-19a0-4e50-b1d5-57ddce7d5e59",
            "crop_type": "Tomato",
            "initial_shelf_life_days": 14.0,
            "remaining_shelf_life_days": 2.5,  # 60 hours remaining
        },
        "transport_vehicles": {
            "id": "b291200c-bd8b-4bd1-93f9-bff80d3cf0f0",
            "vehicle_number": "MH-15-TC-1088",
            "current_latitude": 19.98,
            "current_longitude": 73.79,
            "current_temp_celsius": 8.0,
            "current_humidity_pct": 85.0,
            "cost_per_km": 15.0,
        },
        "destination_buyer": {
            "id": "48ee5000-503e-4b8d-a7bc-272532eaf258",
            "name": "FreshMart Hypermarket (Prime Retail)",
            "type": "primary_retail",
            "location": "Mumbai Central Hub",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "offered_price_per_kg": 42.0,
        },
    }


@pytest.fixture
def sample_buyers():
    return [
        {
            "id": "48ee5000-503e-4b8d-a7bc-272532eaf258",
            "name": "FreshMart Hypermarket (Prime Retail)",
            "type": "primary_retail",
            "demand_crop": "Tomato",
            "demand_kg": 4000.0,
            "offered_price_per_kg": 42.0,
            "location": "Mumbai Central Hub",
            "latitude": 19.0760,
            "longitude": 72.8777,
        },
        {
            "id": "d46dcda9-7559-45d5-b859-505cb8704dcc",
            "name": "Apex Agro Puree & Sauce Corp",
            "type": "secondary_processor",
            "demand_crop": "Tomato",
            "demand_kg": 8000.0,
            "offered_price_per_kg": 26.5,
            "location": "Thane Industrial Zone",
            "latitude": 19.2183,
            "longitude": 72.9781,
        },
        {
            "id": "fe4ef355-a442-4423-8548-2cbb523da143",
            "name": "NaturePure Juices & Pulp Ltd",
            "type": "secondary_processor",
            "demand_crop": "Mango",  # Mismatch
            "demand_kg": 6000.0,
            "offered_price_per_kg": 35.0,
            "location": "Kalyan Food Park",
            "latitude": 19.2403,
            "longitude": 73.1305,
        },
    ]


def test_normal_temperature_maintains_original_route(sample_shipment, sample_buyers):
    """
    Verify that under normal cold chain conditions, the system recommends
    maintaining the higher-margin primary retail destination.
    """
    recommendation = evaluate_dynamic_reroute(
        shipment=sample_shipment,
        candidate_buyers=sample_buyers,
        telemetry_override={"current_temp_celsius": 8.0, "current_humidity_pct": 85.0},
    )

    assert recommendation.action_recommended == "MAINTAIN_ORIGINAL_ROUTE"
    assert recommendation.original_destination.is_sustainable is True
    assert recommendation.original_destination.will_spoil_in_transit is False
    assert "MAINTAIN ORIGINAL ROUTE" in recommendation.explainable_rationale


def test_temperature_spike_triggers_dynamic_reroute(sample_shipment, sample_buyers):
    """
    Mandatory Step 6 Verification:
    Simulate a temperature spike and demonstrate an explainable rerouting decision.
    """
    # Simulate AC failure: vehicle temperature surges to 36.5°C
    telemetry_override = {
        "current_temp_celsius": 36.5,
        "current_humidity_pct": 65.0,
        "trigger_reason": "Severe AC failure: Cabin sensor reported 36.5°C in Mumbai corridor traffic",
    }

    recommendation = evaluate_dynamic_reroute(
        shipment=sample_shipment,
        candidate_buyers=sample_buyers,
        telemetry_override=telemetry_override,
    )

    # 1. Decision must be to execute dynamic reroute
    assert recommendation.action_recommended == "EXECUTE_DYNAMIC_REROUTE"

    # 2. Original destination must be marked unsustainable
    assert recommendation.original_destination.is_sustainable is False

    # 3. Recommended alternative destination must be the closer processor
    assert recommendation.recommended_destination is not None
    assert recommendation.recommended_destination.buyer_name == "Apex Agro Puree & Sauce Corp"
    assert recommendation.recommended_destination.buyer_type == "secondary_processor"

    # 4. Proximity & time comparison must show saved distance/time
    assert recommendation.comparison_summary["distance_saved_km"] > 0
    assert recommendation.comparison_summary["transit_hours_saved"] > 0
    assert recommendation.comparison_summary["salvaged_net_margin"] > 50000.0

    # 5. Crop mismatch candidate (Mango) must be marked non-viable
    mango_buyer = next(
        c for c in recommendation.candidate_evaluations if "Mango" in c.viability_reason
    )
    assert mango_buyer.is_viable is False

    # 6. Explainable rationale must clearly detail the decision
    assert "EXECUTE DYNAMIC REROUTE" in recommendation.explainable_rationale
    assert "Apex Agro Puree & Sauce Corp" in recommendation.explainable_rationale
    assert "36.5°C" in recommendation.explainable_rationale
