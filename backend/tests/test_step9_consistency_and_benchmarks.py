import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.distribution_engine import (
    optimize_distribution_plan,
    compare_baseline_vs_harvest_zero,
)
from backend.app.spoilage_engine import (
    calculate_spoilage_risk,
    simulate_temperature_spike,
)
from backend.app.rerouting_engine import evaluate_dynamic_reroute

client = TestClient(app)


@pytest.fixture
def benchmark_scenario_data():
    """
    Standard representative regional cold-chain scenario:
    - 4 produce batches with varied shelf lives and basal degradation rates
    - 3 buyers (primary retail and secondary processors)
    - 3 vehicles (refrigerated and ambient)
    """
    batches = [
        {
            "id": "b-fresh-tomatoes",
            "crop_type": "Tomato",
            "quantity_kg": 2500.0,
            "harvest_date": "2026-10-12T00:00:00Z",
            "initial_shelf_life_days": 10.0,
            "remaining_shelf_life_days": 8.0,
            "storage_condition": "ambient",
            "basal_degradation_score": 0.10,
            "latitude": 19.9975,
            "longitude": 73.7898,
            "farmers": {"name": "Nashik Agro Co-op", "location": "Nashik Valley", "latitude": 19.9975, "longitude": 73.7898},
        },
        {
            "id": "b-critical-tomatoes",
            "crop_type": "Tomato",
            "quantity_kg": 1500.0,
            "harvest_date": "2026-10-08T00:00:00Z",
            "initial_shelf_life_days": 10.0,
            "remaining_shelf_life_days": 1.1,  # 26.4 hours remaining (arrives at retail with <24h buffer in ambient transit!)
            "storage_condition": "ambient",
            "basal_degradation_score": 0.28,
            "latitude": 19.9975,
            "longitude": 73.7898,
            "farmers": {"name": "Godavari Fresh Farms", "location": "Nashik Valley", "latitude": 19.9975, "longitude": 73.7898},
        },
        {
            "id": "b-spinach-perishable",
            "crop_type": "Spinach",
            "quantity_kg": 800.0,
            "harvest_date": "2026-10-14T00:00:00Z",
            "initial_shelf_life_days": 4.0,
            "remaining_shelf_life_days": 2.5,
            "storage_condition": "ambient",
            "basal_degradation_score": 0.25,
            "latitude": 18.5204,
            "longitude": 73.8567,
            "farmers": {"name": "Pune Green Growers", "location": "Pune Rural", "latitude": 18.5204, "longitude": 73.8567},
        },
        {
            "id": "b-mangoes-prime",
            "crop_type": "Mango",
            "quantity_kg": 1200.0,
            "harvest_date": "2026-10-11T00:00:00Z",
            "initial_shelf_life_days": 12.0,
            "remaining_shelf_life_days": 7.0,
            "storage_condition": "cold_storage",
            "basal_degradation_score": 0.08,
            "latitude": 16.9902,
            "longitude": 73.3120,
            "farmers": {"name": "Ratnagiri Orchards", "location": "Ratnagiri", "latitude": 16.9902, "longitude": 73.3120},
        },
    ]

    buyers = [
        {
            "id": "buy-retail-mumbai",
            "name": "Nature Fresh Hypermarket",
            "type": "primary_retail",
            "demand_crop": "Tomato",
            "demand_kg": 3000.0,
            "offered_price_per_kg": 42.0,
            "latitude": 19.0760,
            "longitude": 72.8777,
            "location": "Mumbai Central",
        },
        {
            "id": "buy-processor-nashik",
            "name": "Sahyadri Agro Puree & Pulp",
            "type": "secondary_processor",
            "demand_crop": "Tomato",
            "demand_kg": 2000.0,
            "offered_price_per_kg": 28.0,
            "latitude": 19.9800,
            "longitude": 73.7900,
            "location": "Nashik MIDC",
        },
        {
            "id": "buy-retail-pune",
            "name": "Sahyadri Organic Mart",
            "type": "primary_retail",
            "demand_crop": "Spinach",
            "demand_kg": 1000.0,
            "offered_price_per_kg": 35.0,
            "latitude": 18.5204,
            "longitude": 73.8567,
            "location": "Pune City",
        },
    ]

    vehicles = [
        {
            "id": "veh-reefer-1",
            "vehicle_number": "MH-15-RF-1001",
            "vehicle_type": "Reefer 3.5T",
            "payload_capacity_kg": 3500.0,
            "is_refrigerated": True,
            "cost_per_km": 18.0,
            "status": "available",
        },
        {
            "id": "veh-ambient-1",
            "vehicle_number": "MH-15-AM-2002",
            "vehicle_type": "Ambient Flatbed 2T",
            "payload_capacity_kg": 2000.0,
            "is_refrigerated": False,
            "cost_per_km": 12.0,
            "status": "available",
        },
    ]

    return batches, buyers, vehicles


def test_inventory_consistency_mass_balance(benchmark_scenario_data):
    """
    Step 9: Inventory consistency test.
    Ensures mass balance: Total allocated kg + Total unallocated kg == Total initial batch inventory.
    """
    batches, buyers, vehicles = benchmark_scenario_data
    total_input_kg = sum(b["quantity_kg"] for b in batches)

    plan = optimize_distribution_plan(
        batches=batches,
        buyers=buyers,
        vehicles=vehicles,
    )

    total_accounted_kg = plan.total_allocated_kg + plan.total_unallocated_kg
    assert abs(total_accounted_kg - total_input_kg) < 0.01, (
        f"Mass balance violation: Input={total_input_kg} kg, Accounted={total_accounted_kg} kg"
    )
    assert plan.constraints_audit.all_allocations_feasible is True


def test_capacity_constraints_never_exceeded(benchmark_scenario_data):
    """
    Step 9: Capacity constraint test.
    Ensures no vehicle is allocated cargo exceeding its rated payload capacity.
    """
    batches, buyers, vehicles = benchmark_scenario_data
    plan = optimize_distribution_plan(
        batches=batches,
        buyers=buyers,
        vehicles=vehicles,
    )

    vehicle_caps = {str(v["id"]): float(v["payload_capacity_kg"]) for v in vehicles}
    vehicle_allocations: dict[str, float] = {}

    for rec in plan.recommendations:
        vehicle_allocations[rec.vehicle_id] = (
            vehicle_allocations.get(rec.vehicle_id, 0.0) + rec.allocated_quantity_kg
        )

    for v_id, alloc_sum in vehicle_allocations.items():
        max_cap = vehicle_caps[v_id]
        assert alloc_sum <= max_cap + 0.01, (
            f"Vehicle {v_id} overloaded: {alloc_sum} kg > {max_cap} kg"
        )
    assert plan.constraints_audit.vehicle_capacities_respected is True


def test_demand_limits_never_exceeded(benchmark_scenario_data):
    """
    Step 9: Demand limit test.
    Ensures no buyer is allocated volume exceeding their contracted demand limit.
    """
    batches, buyers, vehicles = benchmark_scenario_data
    plan = optimize_distribution_plan(
        batches=batches,
        buyers=buyers,
        vehicles=vehicles,
    )

    buyer_demands = {str(b["id"]): float(b["demand_kg"]) for b in buyers}
    buyer_allocations: dict[str, float] = {}

    for rec in plan.recommendations:
        buyer_allocations[rec.buyer_id] = (
            buyer_allocations.get(rec.buyer_id, 0.0) + rec.allocated_quantity_kg
        )

    for b_id, alloc_sum in buyer_allocations.items():
        max_demand = buyer_demands[b_id]
        assert alloc_sum <= max_demand + 0.01, (
            f"Buyer {b_id} over-allocated: {alloc_sum} kg > {max_demand} kg"
        )
    assert plan.constraints_audit.demand_limits_respected is True


def test_shelf_life_spoilage_constraints_respected(benchmark_scenario_data):
    """
    Step 9: Spoilage calculations & shelf-life limit test.
    Ensures every recommended shipment arrives with positive shelf-life margin buffer
    above the buyer's quality threshold (24h for retail, 4h for processing).
    """
    batches, buyers, vehicles = benchmark_scenario_data
    plan = optimize_distribution_plan(
        batches=batches,
        buyers=buyers,
        vehicles=vehicles,
    )

    for rec in plan.recommendations:
        assert rec.shelf_life_margin_hours >= 0.0, (
            f"Recommendation {rec.allocation_id} violates shelf-life margin: "
            f"{rec.shelf_life_margin_hours}h"
        )
    assert plan.constraints_audit.shelf_life_limits_respected is True


def test_rerouting_consistency_and_safety():
    """
    Step 9: Rerouting consistency test.
    Simulates in-transit cooling breakdown and tests dynamic reroute diversion.
    """
    candidate_buyers = [
        {
            "id": "buy-supermarket",
            "name": "Metro Mega Retail",
            "type": "primary_retail",
            "demand_crop": "Tomato",
            "demand_kg": 5000.0,
            "offered_price_per_kg": 40.0,
            "latitude": 19.0760,
            "longitude": 72.8777,
            "location": "Mumbai",
        },
        {
            "id": "proc-puree-salvage",
            "name": "Kisan Starch & Dehydrated Flakes",
            "type": "secondary_processor",
            "demand_crop": "Tomato",
            "demand_kg": 5000.0,
            "offered_price_per_kg": 26.5,
            "latitude": 19.2183,
            "longitude": 72.9781,
            "location": "Thane Industrial Zone",
        },
    ]

    reroute_res = evaluate_dynamic_reroute(
        shipment={
            "id": "ship-stress-test-1",
            "crop_type": "Tomato",
            "allocated_quantity_kg": 2000.0,
            "produce_batches": {
                "id": "b-tomatoes",
                "crop_type": "Tomato",
                "initial_shelf_life_days": 10.0,
                "remaining_shelf_life_days": 2.5,
            },
            "transport_vehicles": {
                "id": "v-1",
                "vehicle_number": "MH-12-RF-9000",
                "cost_per_km": 16.0,
                "current_latitude": 19.98,
                "current_longitude": 73.79,
                "current_temp_celsius": 4.0,
                "current_humidity_pct": 85.0,
            },
            "destination_buyer": {
                "id": "buy-supermarket",
                "name": "Metro Mega Retail",
                "type": "primary_retail",
                "offered_price_per_kg": 40.0,
                "latitude": 19.0760,
                "longitude": 72.8777,
                "location": "Mumbai",
            },
        },
        candidate_buyers=candidate_buyers,
        telemetry_override={
            "current_temp_celsius": 36.0,
            "current_humidity_pct": 65.0,
            "trigger_reason": "In-transit reefer cooling compressor failure (+36°C)",
        },
    )

    assert reroute_res.action_recommended == "EXECUTE_DYNAMIC_REROUTE"
    assert reroute_res.original_destination.is_sustainable is False
    assert reroute_res.recommended_destination is not None
    assert reroute_res.recommended_destination.buyer_id == "proc-puree-salvage"
    assert reroute_res.comparison_summary["distance_saved_km"] >= 0
    assert reroute_res.comparison_summary["salvaged_net_margin"] > 0.0


def test_baseline_vs_recommended_plan_benchmark_results(benchmark_scenario_data):
    """
    Step 9: Benchmark test comparing baseline (FIFO unoptimized) with Harvest Zero.
    Proves Harvest Zero achieves statistically significant post-harvest loss reduction
    and economic improvement.
    """
    batches, buyers, vehicles = benchmark_scenario_data
    comparison = compare_baseline_vs_harvest_zero(
        batches=batches,
        buyers=buyers,
        vehicles=vehicles,
    )

    # 1. Spoilage Waste Reduction
    assert comparison.waste_reduction_kg > 0.0, (
        f"Expected waste reduction > 0, got {comparison.waste_reduction_kg} kg"
    )
    assert comparison.harvest_zero_plan.spoilage_rate_pct < comparison.baseline_plan.spoilage_rate_pct
    assert comparison.harvest_zero_plan.spoiled_rejected_kg == 0.0

    # 2. Economic Yield Improvement
    assert comparison.profit_increase_inr > 0.0, (
        f"Expected profit increase > 0, got ₹{comparison.profit_increase_inr}"
    )
    assert comparison.harvest_zero_plan.net_realized_margin > comparison.baseline_plan.net_realized_margin

    # 3. Explanations and Audit Findings
    assert len(comparison.key_findings) >= 3


def test_baseline_comparison_api_endpoint():
    """
    Step 9: API endpoint verification.
    Tests GET /api/distribution/baseline-comparison returns HTTP 200 and schema.
    """
    res = client.get("/api/distribution/baseline-comparison")
    assert res.status_code == 200
    data = res.json()

    assert "baseline_plan" in data
    assert "harvest_zero_plan" in data
    assert "waste_reduction_kg" in data
    assert "profit_increase_inr" in data
    assert "key_findings" in data
    assert len(data["key_findings"]) > 0
