import pytest
from backend.app.distribution_engine import (
    optimize_distribution_plan,
    calculate_haversine_distance,
    estimate_transit_hours,
)


def test_haversine_distance_calculation():
    # Distance between Pune (18.5204, 73.8567) and Mumbai (19.0760, 72.8777)
    dist = calculate_haversine_distance(18.5204, 73.8567, 19.0760, 72.8777)
    assert 130.0 <= dist <= 170.0
    # Transit hours at 45 km/h
    hours = estimate_transit_hours(dist, avg_speed_kmh=45.0)
    assert hours > 0.5


def test_distribution_small_scenario_constraints():
    """
    Verifies that all constraints (demand, vehicle payload, shelf life)
    are strictly respected in a small scenario.
    """
    # 2 Batches: One high-risk ambient heap tomato (urgent), one cold storage potato (stable)
    batches = [
        {
            "id": "batch-tomato-urgent",
            "crop_type": "Tomato",
            "quantity_kg": 4000.0,
            "remaining_shelf_life_days": 2.0,  # 48 hours remaining
            "storage_condition": "ambient_heap",
            "basal_degradation_score": 25.0,  # high decay risk -> FEFO priority
            "farmers": {
                "name": "Patel Farm",
                "location": "Nashik",
                "latitude": 19.9975,
                "longitude": 73.7898,
            },
        },
        {
            "id": "batch-potato-stable",
            "crop_type": "Potato",
            "quantity_kg": 8000.0,
            "remaining_shelf_life_days": 40.0,
            "storage_condition": "cold_storage",
            "basal_degradation_score": 1.5,
            "farmers": {
                "name": "Reddy Farm",
                "location": "Pune",
                "latitude": 18.5204,
                "longitude": 73.8567,
            },
        },
    ]

    # Buyers: One with 3000kg tomato demand, one with 2000kg potato demand
    buyers = [
        {
            "id": "buyer-mumbai-retail",
            "name": "Mumbai Fresh Retail",
            "type": "primary_retail",
            "demand_crop": "Tomato",
            "demand_kg": 3000.0,  # Demand is LESS than batch quantity (4000kg)
            "offered_price_per_kg": 40.0,
            "quality_threshold_min_shelf_life_hours": 24.0,
            "latitude": 19.0760,
            "longitude": 72.8777,
            "location": "Mumbai",
        },
        {
            "id": "buyer-pune-chips",
            "name": "Pune Snack Foods",
            "type": "secondary_processor",
            "demand_crop": "Potato",
            "demand_kg": 2000.0,
            "offered_price_per_kg": 22.0,
            "quality_threshold_min_shelf_life_hours": 12.0,
            "latitude": 18.5300,
            "longitude": 73.8600,
            "location": "Pune",
        },
    ]

    # Vehicles: One small truck (max 2500kg), one medium truck (max 5000kg)
    vehicles = [
        {
            "id": "veh-small",
            "vehicle_number": "TRK-SMALL",
            "max_payload_kg": 2500.0,  # Limits maximum single allocation
            "is_refrigerated": False,
            "cost_per_km": 12.0,
        },
        {
            "id": "veh-medium",
            "vehicle_number": "TRK-MEDIUM",
            "max_payload_kg": 5000.0,
            "is_refrigerated": True,
            "cost_per_km": 20.0,
        },
    ]

    plan = optimize_distribution_plan(
        batches=batches, buyers=buyers, vehicles=vehicles
    )

    # 1. Check constraints audit
    assert plan.constraints_audit.demand_limits_respected is True
    assert plan.constraints_audit.vehicle_capacities_respected is True
    assert plan.constraints_audit.shelf_life_limits_respected is True
    assert plan.constraints_audit.all_allocations_feasible is True

    # 2. Check recommendations
    assert len(plan.recommendations) > 0
    for rec in plan.recommendations:
        # Quantity allocated cannot exceed the vehicle payload
        matched_veh = next(v for v in vehicles if v["id"] == rec.vehicle_id)
        assert rec.allocated_quantity_kg <= matched_veh["max_payload_kg"]

        # Quantity allocated cannot exceed the buyer demand
        matched_buyer = next(b for b in buyers if b["id"] == rec.buyer_id)
        assert rec.allocated_quantity_kg <= matched_buyer["demand_kg"]

        # Distance and cost calculations
        assert rec.distance_km > 0
        assert rec.transport_cost > 0
        assert rec.expected_revenue > 0
        assert rec.net_margin == round(
            rec.expected_revenue - rec.transport_cost, 2
        )
        assert len(rec.explanation) > 10

    # 3. Check unallocated reporting
    assert plan.total_unallocated_kg > 0
    assert len(plan.unallocated_batches) > 0
    # Tomato batch had 4000kg, buyer only wanted 3000kg, vehicle limited to 2500kg
    # So unallocated must be reported
    assert any(
        ub.crop_type == "Tomato" and ub.unallocated_quantity_kg > 0
        for ub in plan.unallocated_batches
    )


def test_shelf_life_insufficient_rejection():
    """
    Verifies that when remaining shelf life is shorter than transit time + quality threshold,
    the allocation is safely rejected to prevent food waste.
    """
    batches = [
        {
            "id": "batch-spoiling",
            "crop_type": "Tomato",
            "quantity_kg": 2000.0,
            "remaining_shelf_life_days": 0.2,  # Only 4.8 hours remaining!
            "storage_condition": "ambient_heap",
            "basal_degradation_score": 30.0,
            "farmers": {
                "name": "Far Farm",
                "location": "Remote Area",
                "latitude": 21.0,
                "longitude": 79.0,
            },
        }
    ]

    # Buyer 800km away requiring 24h quality threshold
    buyers = [
        {
            "id": "buyer-remote",
            "name": "Distant Mart",
            "type": "primary_retail",
            "demand_crop": "Tomato",
            "demand_kg": 5000.0,
            "offered_price_per_kg": 40.0,
            "quality_threshold_min_shelf_life_hours": 24.0,  # 24h needed, but only 4.8h left!
            "latitude": 19.0,
            "longitude": 72.8,
            "location": "Mumbai",
        }
    ]

    vehicles = [
        {
            "id": "veh-1",
            "vehicle_number": "TRK-01",
            "max_payload_kg": 5000.0,
            "is_refrigerated": True,
            "cost_per_km": 15.0,
        }
    ]

    plan = optimize_distribution_plan(
        batches=batches, buyers=buyers, vehicles=vehicles
    )

    # Must NOT allocate because shelf life is expired/insufficient
    assert len(plan.recommendations) == 0
    assert plan.total_allocated_kg == 0.0
    assert plan.total_unallocated_kg == 2000.0
    assert len(plan.unallocated_batches) == 1
    assert "Remaining shelf life insufficient" in plan.unallocated_batches[0].reason
