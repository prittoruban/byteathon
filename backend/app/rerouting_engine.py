"""
HARVEST ZERO — Dynamic Rerouting Engine (Step 6)
Module: backend/app/rerouting_engine.py

Autonomously re-evaluates active consignments experiencing in-transit thermal stress
or logistics delays. Recalculates remaining biological shelf life using the Arrhenius
engine, evaluates alternative buyer destinations (both primary retail and secondary processors),
compares delivery times, freight costs, and net economic salvage margins, and generates
transparent, explainable rerouting decisions.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from backend.app.distribution_engine import calculate_haversine_distance
from backend.app.spoilage_engine import (
    calculate_spoilage_risk,
    SpoilageEvaluationRequest,
    get_crop_kinetics,
)


class CandidateBuyerEvaluation(BaseModel):
    buyer_id: str
    buyer_name: str
    buyer_type: str  # primary_retail or secondary_processor
    location: str
    offered_price_per_kg: float
    demand_kg: float
    distance_km: float
    estimated_transit_hours: float
    transport_cost: float
    expected_gross_revenue: float
    net_margin: float
    remaining_shelf_life_hours_at_arrival: float
    safety_margin_hours: float
    is_viable: bool
    viability_reason: str


class OriginalDestinationEvaluation(BaseModel):
    buyer_id: str
    buyer_name: str
    buyer_type: str
    location: str
    distance_km: float
    estimated_transit_hours: float
    current_spoilage_risk_score: float
    risk_level: str  # SAFE, WARNING, CRITICAL
    remaining_shelf_life_hours_at_arrival: float
    safety_margin_hours: float
    will_spoil_in_transit: bool
    is_sustainable: bool
    transport_cost: float
    expected_gross_revenue: float
    net_margin: float
    status_explanation: str


class RerouteRecommendation(BaseModel):
    recommendation_id: str
    shipment_id: str
    batch_id: str
    crop_type: str
    quantity_kg: float
    vehicle_id: str
    vehicle_number: str
    current_temp_celsius: float
    current_humidity_pct: float
    trigger_event: str
    action_recommended: str  # "EXECUTE_DYNAMIC_REROUTE" or "MAINTAIN_ORIGINAL_ROUTE"
    original_destination: OriginalDestinationEvaluation
    recommended_destination: Optional[CandidateBuyerEvaluation]
    candidate_evaluations: List[CandidateBuyerEvaluation]
    comparison_summary: Dict[str, Any]
    explainable_rationale: str
    created_at: str


class SimulatedRerouteRequest(BaseModel):
    shipment_id: Optional[str] = None
    crop_type: str = "Tomato"
    quantity_kg: float = 4000.0
    remaining_shelf_life_days: float = 3.0
    initial_shelf_life_days: float = 14.0
    vehicle_lat: float = 19.98
    vehicle_lon: float = 73.79
    spiked_temp_celsius: float = 36.0
    current_humidity_pct: float = 75.0
    cost_per_km: float = 15.0


def evaluate_dynamic_reroute(
    shipment: Dict[str, Any],
    candidate_buyers: List[Dict[str, Any]],
    telemetry_override: Optional[Dict[str, Any]] = None,
) -> RerouteRecommendation:
    """
    Evaluates whether an active shipment should be rerouted based on real-time Arrhenius kinetics,
    comparing the original buyer with alternative regional buyers.
    """
    rec_id = f"REROUTE-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()

    # 1. Extract shipment attributes
    shipment_id = str(shipment.get("id", "simulated-shipment"))
    batch = shipment.get("produce_batches") or {}
    vehicle = shipment.get("transport_vehicles") or {}
    dest_buyer = shipment.get("destination_buyer") or {}

    crop_type = batch.get("crop_type") or shipment.get("crop_type", "Tomato")
    quantity_kg = float(shipment.get("allocated_quantity_kg", 4000.0))
    initial_sl_days = float(batch.get("initial_shelf_life_days", 14.0))
    remaining_sl_days = float(batch.get("remaining_shelf_life_days", 4.0))

    vehicle_id = str(shipment.get("vehicle_id", vehicle.get("id", "veh-001")))
    vehicle_number = vehicle.get("vehicle_number", "MH-15-TC-1088")
    v_lat = vehicle.get("current_latitude", 19.98)
    v_lon = vehicle.get("current_longitude", 73.79)
    cost_per_km = float(vehicle.get("cost_per_km", 15.0))

    # Current telemetry (with optional simulated override)
    if telemetry_override:
        curr_temp = float(telemetry_override.get("current_temp_celsius", 35.0))
        curr_humidity = float(telemetry_override.get("current_humidity_pct", 75.0))
        trigger_reason = telemetry_override.get(
            "trigger_reason",
            f"Simulated cooling failure: temperature spiked to {curr_temp:.1f}°C",
        )
    else:
        curr_temp = float(vehicle.get("current_temp_celsius", 24.0))
        curr_humidity = float(vehicle.get("current_humidity_pct", 65.0))
        trigger_reason = f"Live telemetry check: {curr_temp:.1f}°C ambient"

    # 2. Evaluate Arrhenius decay at current temperature
    kinetics_req = SpoilageEvaluationRequest(
        crop_type=crop_type,
        remaining_shelf_life_days=remaining_sl_days,
        initial_shelf_life_days=initial_sl_days,
        current_temp_celsius=curr_temp,
        current_humidity_pct=curr_humidity,
        exposure_hours=2.0,
    )
    current_assessment = calculate_spoilage_risk(kinetics_req)

    # 3. Evaluate Original Destination
    orig_buyer_id = str(shipment.get("destination_buyer_id", dest_buyer.get("id", "")))
    orig_buyer_name = dest_buyer.get("name", "Original Buyer")
    orig_buyer_type = dest_buyer.get("type", "primary_retail")
    orig_buyer_loc = dest_buyer.get("location", "Mumbai Central Hub")
    orig_lat = dest_buyer.get("latitude", 19.0760)
    orig_lon = dest_buyer.get("longitude", 72.8777)
    orig_price = float(dest_buyer.get("offered_price_per_kg", 42.0))

    orig_distance = calculate_haversine_distance(v_lat, v_lon, orig_lat, orig_lon, 140.0)
    avg_speed_kmh = 42.0  # Real-world Indian highway & city transit average
    orig_transit_hours = round(max(0.8, orig_distance / avg_speed_kmh), 1)
    orig_freight_cost = round(500.0 + (cost_per_km * orig_distance), 2)
    orig_gross_revenue = round(quantity_kg * orig_price, 2)
    orig_net_margin = round(orig_gross_revenue - orig_freight_cost, 2)

    # Calculate biological shelf life consumed during transit to original buyer
    transit_decay_consumed_days = (orig_transit_hours / 24.0) * current_assessment.acceleration_factor
    orig_arrival_sl_days = max(0.0, remaining_sl_days - transit_decay_consumed_days)
    orig_arrival_sl_hours = round(orig_arrival_sl_days * 24.0, 1)

    # Quality threshold required by buyer type
    # Primary retail requires >= 24h of display shelf life; secondary processors accept >= 4h
    buyer_quality_threshold_hours = 24.0 if orig_buyer_type == "primary_retail" else 4.0
    orig_safety_margin_hours = round(orig_arrival_sl_hours - buyer_quality_threshold_hours, 1)
    orig_will_spoil = orig_arrival_sl_hours <= 0.0 or orig_safety_margin_hours < 0

    orig_sustainable = (
        not orig_will_spoil
        and current_assessment.spoilage_risk_score < 70.0
    )

    if orig_sustainable:
        orig_explanation = (
            f"Consignment reaches {orig_buyer_name} in {orig_transit_hours}h with {orig_safety_margin_hours}h "
            f"safety buffer above retail quality threshold."
        )
    else:
        orig_explanation = (
            f"CRITICAL: At {curr_temp:.1f}°C, decay rate is {current_assessment.acceleration_factor:.1f}x normal. "
            f"Produce reaches {orig_buyer_name} with only {orig_arrival_sl_hours}h life remaining "
            f"({abs(orig_safety_margin_hours)}h below the {buyer_quality_threshold_hours}h {orig_buyer_type} standard). "
            f"Risk of complete cargo write-off."
        )

    orig_eval = OriginalDestinationEvaluation(
        buyer_id=orig_buyer_id,
        buyer_name=orig_buyer_name,
        buyer_type=orig_buyer_type,
        location=orig_buyer_loc,
        distance_km=orig_distance,
        estimated_transit_hours=orig_transit_hours,
        current_spoilage_risk_score=current_assessment.spoilage_risk_score,
        risk_level=current_assessment.risk_level,
        remaining_shelf_life_hours_at_arrival=orig_arrival_sl_hours,
        safety_margin_hours=orig_safety_margin_hours,
        will_spoil_in_transit=orig_will_spoil,
        is_sustainable=orig_sustainable,
        transport_cost=orig_freight_cost,
        expected_gross_revenue=orig_gross_revenue,
        net_margin=orig_net_margin,
        status_explanation=orig_explanation,
    )

    # 4. Evaluate Alternative Candidate Buyers
    candidate_evaluations: List[CandidateBuyerEvaluation] = []

    for buyer in candidate_buyers:
        b_id = str(buyer.get("id"))
        if b_id == orig_buyer_id:
            continue  # Skip original buyer

        b_name = buyer.get("name", "Unknown Buyer")
        b_type = buyer.get("type", "secondary_processor")
        b_crop = buyer.get("demand_crop", "")
        b_demand = float(buyer.get("demand_kg", 0.0))
        b_price = float(buyer.get("offered_price_per_kg", 25.0))
        b_loc = buyer.get("location", "Regional APMC")
        b_lat = buyer.get("latitude")
        b_lon = buyer.get("longitude")

        # Crop matching check
        clean_crop = crop_type.strip().lower()
        clean_demand_crop = b_crop.strip().lower()
        if clean_crop not in clean_demand_crop and clean_demand_crop not in clean_crop:
            candidate_evaluations.append(
                CandidateBuyerEvaluation(
                    buyer_id=b_id,
                    buyer_name=b_name,
                    buyer_type=b_type,
                    location=b_loc,
                    offered_price_per_kg=b_price,
                    demand_kg=b_demand,
                    distance_km=0.0,
                    estimated_transit_hours=0.0,
                    transport_cost=0.0,
                    expected_gross_revenue=0.0,
                    net_margin=0.0,
                    remaining_shelf_life_hours_at_arrival=0.0,
                    safety_margin_hours=0.0,
                    is_viable=False,
                    viability_reason=f"Crop mismatch: requires {b_crop}, shipment carries {crop_type}.",
                )
            )
            continue

        # Geospatial & transit evaluation
        b_dist = calculate_haversine_distance(v_lat, v_lon, b_lat, b_lon, 90.0)
        b_transit_hours = round(max(0.5, b_dist / avg_speed_kmh), 1)
        b_freight = round(500.0 + (cost_per_km * b_dist), 2)

        # Usable quantity (capped by buyer's demand capacity)
        salvaged_kg = min(quantity_kg, b_demand) if b_demand > 0 else quantity_kg
        b_gross = round(salvaged_kg * b_price, 2)
        b_net = round(b_gross - b_freight, 2)

        # Shelf life at arrival at alternative buyer
        b_transit_decay_days = (b_transit_hours / 24.0) * current_assessment.acceleration_factor
        b_arrival_sl_days = max(0.0, remaining_sl_days - b_transit_decay_days)
        b_arrival_sl_hours = round(b_arrival_sl_days * 24.0, 1)

        # Secondary processors only need >= 4 hours (immediate processing into puree/juice)
        b_req_buffer = 4.0 if b_type == "secondary_processor" else 20.0
        b_safety_margin = round(b_arrival_sl_hours - b_req_buffer, 1)
        b_viable = (b_arrival_sl_hours > b_req_buffer) and (b_net > 0)

        if b_viable:
            v_reason = (
                f"Viable destination: {b_dist:.1f} km ({b_transit_hours}h transit). "
                f"Arrives with {b_arrival_sl_hours}h shelf life ({b_safety_margin}h safety margin for {b_type}). "
                f"Net yield: ₹{b_net:,.2f}."
            )
        else:
            if b_arrival_sl_hours <= b_req_buffer:
                v_reason = f"Non-viable: Produce would arrive with insufficient buffer ({b_arrival_sl_hours}h <= {b_req_buffer}h required)."
            else:
                v_reason = f"Non-viable: Freight cost (₹{b_freight}) exceeds revenue (₹{b_gross})."

        candidate_evaluations.append(
            CandidateBuyerEvaluation(
                buyer_id=b_id,
                buyer_name=b_name,
                buyer_type=b_type,
                location=b_loc,
                offered_price_per_kg=b_price,
                demand_kg=b_demand,
                distance_km=b_dist,
                estimated_transit_hours=b_transit_hours,
                transport_cost=b_freight,
                expected_gross_revenue=b_gross,
                net_margin=b_net,
                remaining_shelf_life_hours_at_arrival=b_arrival_sl_hours,
                safety_margin_hours=b_safety_margin,
                is_viable=b_viable,
                viability_reason=v_reason,
            )
        )

    # 5. Determine Optimal Rerouting Recommendation
    viable_candidates = [c for c in candidate_evaluations if c.is_viable]

    # Rank viable candidates:
    # Under critical risk, prioritize safety margin and proximity, then net margin
    if current_assessment.risk_level == "CRITICAL":
        viable_candidates.sort(key=lambda c: (-c.safety_margin_hours, -c.net_margin))
    else:
        viable_candidates.sort(key=lambda c: -c.net_margin)

    best_alternative = viable_candidates[0] if viable_candidates else None

    # Decision Logic:
    # Reroute if original destination is unsustainable OR has critical spoilage risk
    if not orig_sustainable and best_alternative:
        action = "EXECUTE_DYNAMIC_REROUTE"
        distance_saved = round(orig_distance - best_alternative.distance_km, 1)
        hours_saved = round(orig_transit_hours - best_alternative.estimated_transit_hours, 1)
        economic_salvaged = best_alternative.net_margin

        rationale = (
            f"EXECUTE DYNAMIC REROUTE: Vehicle {vehicle_number} detected {curr_temp:.1f}°C ({trigger_reason}), "
            f"accelerating {crop_type} decay by {current_assessment.acceleration_factor:.1f}x. "
            f"Continuing to {orig_buyer_name} leads to cargo spoilage ({orig_arrival_sl_hours}h life remaining). "
            f"Rerouting to {best_alternative.buyer_name} ({best_alternative.buyer_type}) in {best_alternative.location} "
            f"reduces transit by {distance_saved} km ({hours_saved}h saved), ensures {best_alternative.remaining_shelf_life_hours_at_arrival}h "
            f"quality buffer, and salvages ₹{economic_salvaged:,.2f} in net economic value."
        )
    elif not orig_sustainable and not best_alternative:
        action = "CRITICAL_HAZARD_NO_VIABLE_BUYER"
        distance_saved = 0.0
        hours_saved = 0.0
        economic_salvaged = 0.0
        rationale = (
            f"CRITICAL HAZARD: Thermal stress ({curr_temp:.1f}°C) renders {orig_buyer_name} unsustainable, "
            f"but no viable regional buyer with matching crop demand was found within safe transit range. "
            f"Emergency cold storage holding facility dispatch recommended."
        )
    else:
        action = "MAINTAIN_ORIGINAL_ROUTE"
        distance_saved = 0.0
        hours_saved = 0.0
        economic_salvaged = orig_net_margin
        rationale = (
            f"MAINTAIN ORIGINAL ROUTE: Consignment remains biologically viable at {curr_temp:.1f}°C. "
            f"Estimated arrival at {orig_buyer_name} in {orig_transit_hours}h retains {orig_arrival_sl_hours}h "
            f"shelf life ({orig_safety_margin_hours}h safety buffer). "
            f"Net yield of ₹{orig_net_margin:,.2f} is preserved."
        )

    comparison_summary = {
        "original_distance_km": orig_distance,
        "recommended_distance_km": best_alternative.distance_km if best_alternative else orig_distance,
        "distance_saved_km": distance_saved,
        "transit_hours_saved": hours_saved,
        "original_net_margin": orig_net_margin if orig_sustainable else 0.0,
        "salvaged_net_margin": economic_salvaged,
        "economic_value_preserved": economic_salvaged if not orig_sustainable else orig_net_margin,
        "risk_level_at_decision": current_assessment.risk_level,
    }

    return RerouteRecommendation(
        recommendation_id=rec_id,
        shipment_id=shipment_id,
        batch_id=str(batch.get("id", "batch-001")),
        crop_type=crop_type,
        quantity_kg=quantity_kg,
        vehicle_id=vehicle_id,
        vehicle_number=vehicle_number,
        current_temp_celsius=curr_temp,
        current_humidity_pct=curr_humidity,
        trigger_event=trigger_reason,
        action_recommended=action,
        original_destination=orig_eval,
        recommended_destination=best_alternative,
        candidate_evaluations=candidate_evaluations,
        comparison_summary=comparison_summary,
        explainable_rationale=rationale,
        created_at=timestamp,
    )


def persist_reroute_to_supabase(
    client: Any,
    shipment_id: str,
    recommendation: RerouteRecommendation,
) -> Dict[str, Any]:
    """
    Persists the executed reroute decision to the Supabase PostgreSQL database.
    Updates destination buyer, original buyer, transit metrics, status, and reroute reason.
    """
    if not recommendation.recommended_destination:
        raise ValueError("Cannot persist reroute without a valid recommended destination")

    new_buyer = recommendation.recommended_destination
    update_payload = {
        "destination_buyer_id": new_buyer.buyer_id,
        "original_buyer_id": recommendation.original_destination.buyer_id,
        "transit_distance_km": new_buyer.distance_km,
        "estimated_transit_hours": new_buyer.estimated_transit_hours,
        "current_spoilage_risk_score": 35.0,  # Stabilized risk score upon diversion to closer processor
        "status": "rerouted",
        "reroute_reason": recommendation.explainable_rationale,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    res = (
        client.table("shipments")
        .update(update_payload)
        .eq("id", shipment_id)
        .execute()
    )

    if not res.data:
        raise RuntimeError(f"Failed to update shipment {shipment_id} in Supabase")

    return res.data[0]
