"""
Unit tests for Step 8: Dashboard Integration & End-to-End Workflow
Verifies the complete workflow:
Temperature event -> Arrhenius risk evaluation -> Dynamic rerouting decision ->
Secondary market arbitrage -> Supabase inventory & shipment status update.
"""

import pytest
from backend.app.database import get_supabase_client
from backend.app.rerouting_engine import evaluate_dynamic_reroute, persist_reroute_to_supabase
from backend.app.secondary_recovery import evaluate_secondary_market_arbitrage
from backend.app.spoilage_engine import calculate_spoilage_risk, SpoilageEvaluationRequest


def test_end_to_end_temperature_spike_resolution_workflow():
    """
    Mandatory Step 8 Verification:
    Verify that the complete workflow works from simulated temperature spike
    through risk recalculation, rerouting decision, secondary arbitrage, and persistence.
    """
    client = get_supabase_client()

    # 1. Fetch active shipments from Supabase
    shipments_res = (
        client.table("shipments")
        .select(
            "*, produce_batches(id, crop_type, quantity_kg, initial_shelf_life_days, remaining_shelf_life_days), "
            "transport_vehicles(id, vehicle_number, is_refrigerated, current_temp_celsius, current_humidity_pct, current_latitude, current_longitude, cost_per_km), "
            "destination_buyer:buyers!shipments_destination_buyer_id_fkey(id, name, type, location, latitude, longitude, offered_price_per_kg, demand_crop, demand_kg)"
        )
        .in_("status", ["in_transit", "rerouted"])
        .limit(1)
        .execute()
    )

    if not shipments_res.data:
        # Reset sample shipment so the live workflow test can execute deterministically
        client.table("shipments").update({"status": "in_transit"}).eq("id", "42119c80-f97f-473a-914e-dc37ee0ccf45").execute()
        shipments_res = (
            client.table("shipments")
            .select(
                "*, produce_batches(id, crop_type, quantity_kg, initial_shelf_life_days, remaining_shelf_life_days), "
                "transport_vehicles(id, vehicle_number, is_refrigerated, current_temp_celsius, current_humidity_pct, current_latitude, current_longitude, cost_per_km), "
                "destination_buyer:buyers!shipments_destination_buyer_id_fkey(id, name, type, location, latitude, longitude, offered_price_per_kg, demand_crop, demand_kg)"
            )
            .in_("status", ["in_transit", "rerouted"])
            .limit(1)
            .execute()
        )

    assert len(shipments_res.data) > 0, "At least one active in-transit shipment required in database"
    shipment = shipments_res.data[0]

    # 2. Simulate temperature spike event (e.g. 36.5°C)
    spiked_temp = 36.5
    spoilage_req = SpoilageEvaluationRequest(
        crop_type=shipment["produce_batches"]["crop_type"],
        remaining_shelf_life_days=float(shipment["produce_batches"]["remaining_shelf_life_days"]),
        initial_shelf_life_days=float(shipment["produce_batches"]["initial_shelf_life_days"]),
        current_temp_celsius=spiked_temp,
        current_humidity_pct=70.0,
        exposure_hours=4.0,
        transit_hours_remaining=float(shipment.get("estimated_transit_hours", 4.0)),
    )
    spoilage_assessment = calculate_spoilage_risk(spoilage_req)

    # Spoilage risk must surge under thermal stress
    assert spoilage_assessment.acceleration_factor > 5.0
    assert spoilage_assessment.spoilage_risk_score >= 70.0 or spoilage_assessment.risk_level in ["WARNING", "CRITICAL"]

    # 3. Fetch candidate buyers for dynamic rerouting
    buyers_res = client.table("buyers").select("*").execute()
    candidate_buyers = buyers_res.data or []

    # 4. Execute dynamic rerouting solver
    telemetry_override = {
        "current_temp_celsius": spiked_temp,
        "current_humidity_pct": 70.0,
        "trigger_reason": "End-to-End Test: Cooling system compressor failure simulation",
    }
    reroute_rec = evaluate_dynamic_reroute(
        shipment=shipment,
        candidate_buyers=candidate_buyers,
        telemetry_override=telemetry_override,
    )

    # Decision must be formed and explainable
    assert reroute_rec.action_recommended in ["EXECUTE_DYNAMIC_REROUTE", "MAINTAIN_ORIGINAL_ROUTE"]
    assert len(reroute_rec.explainable_rationale) > 40
    assert reroute_rec.comparison_summary is not None

    # 5. Execute secondary market arbitrage comparison
    if reroute_rec.recommended_destination:
        prim_buyer = shipment["destination_buyer"]
        sec_buyer = next(
            (b for b in candidate_buyers if b["id"] == reroute_rec.recommended_destination.buyer_id),
            candidate_buyers[1],
        )
        arbitrage_res = evaluate_secondary_market_arbitrage(
            crop_type=shipment["produce_batches"]["crop_type"],
            quantity_kg=float(shipment["allocated_quantity_kg"]),
            initial_shelf_life_days=float(shipment["produce_batches"]["initial_shelf_life_days"]),
            remaining_shelf_life_days=float(shipment["produce_batches"]["remaining_shelf_life_days"]),
            current_temp_celsius=spiked_temp,
            current_humidity_pct=70.0,
            vehicle_lat=shipment["transport_vehicles"]["current_latitude"] or 19.98,
            vehicle_lon=shipment["transport_vehicles"]["current_longitude"] or 73.79,
            primary_buyer=prim_buyer,
            secondary_buyer=sec_buyer,
        )
        assert arbitrage_res.food_safety is not None
        assert arbitrage_res.primary_retail_option is not None
        assert arbitrage_res.secondary_processor_option is not None

    # 6. Verify database round-trip persistence
    if reroute_rec.recommended_destination:
        updated = persist_reroute_to_supabase(client, shipment["id"], reroute_rec)
        assert updated["status"] == "rerouted"
        assert updated["destination_buyer_id"] == reroute_rec.recommended_destination.buyer_id
        assert updated["reroute_reason"] is not None

        # Re-fetch from Supabase to verify true database persistence
        verified = client.table("shipments").select("*").eq("id", shipment["id"]).execute().data[0]
        assert verified["status"] == "rerouted"
        assert verified["destination_buyer_id"] == reroute_rec.recommended_destination.buyer_id
