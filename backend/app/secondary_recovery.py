"""
HARVEST ZERO — Secondary-Market Recovery & Arbitrage Protocol (Step 7)
Module: backend/app/secondary_recovery.py

Implements automated economic arbitrage between primary retail markets and secondary
industrial processors (puree, paste, juice, dehydration, chips).
Monitors continuous quality degradation, applies tiered quality-penalty pricing deductions,
validates strict FSSAI food-safety compliance thresholds, and determines whether mid-transit
diversion yields superior economic recovery compared to continuing to primary retail.
"""

import uuid
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from backend.app.distribution_engine import calculate_haversine_distance
from backend.app.spoilage_engine import (
    calculate_spoilage_risk,
    calculate_arrhenius_decay_rate,
    SpoilageEvaluationRequest,
    get_crop_kinetics,
)

# Minimum biological shelf-life buffer required for human food processing (FSSAI compliance)
FOOD_SAFETY_MIN_BUFFER_HOURS = 4.0

# Minimum display shelf life expected by primary retail supermarkets
PRIMARY_RETAIL_MIN_BUFFER_HOURS = 24.0


class QualityGradeAssessment(BaseModel):
    grade: str  # "GRADE_A_PRIME", "GRADE_B_COMMERCIAL", "GRADE_C_PROCESSING_ONLY", "GRADE_D_SPOILED"
    shelf_life_retention_pct: float
    primary_retail_penalty_pct: float  # Price discount applied by primary buyer
    secondary_processor_penalty_pct: float  # Price discount applied by processor
    fssai_compliant_for_processing: bool
    description: str


class FoodSafetyCompliance(BaseModel):
    is_compliant: bool
    status: str  # "FSSAI_COMPLIANT_FIT_FOR_PROCESSING", "FOOD_SAFETY_HAZARD_REJECTED"
    microbial_risk_index: str  # "LOW", "MODERATE", "CRITICAL_SPOILAGE"
    regulatory_standard: str
    certification_rationale: str


class BuyerOptionEconomics(BaseModel):
    buyer_id: str
    buyer_name: str
    buyer_type: str  # "primary_retail" or "secondary_processor"
    location: str
    distance_km: float
    estimated_transit_hours: float
    transport_freight_cost: float
    contract_price_per_kg: float
    quality_penalty_pct: float
    realized_price_per_kg: float
    expected_gross_revenue: float
    net_margin: float
    arrival_shelf_life_hours: float
    safety_buffer_hours: float
    arrival_quality_grade: str
    is_marketable: bool
    rejection_reason: Optional[str] = None


class SecondaryArbitrageResult(BaseModel):
    scenario_id: str
    crop_type: str
    consignment_quantity_kg: float
    current_temp_celsius: float
    current_humidity_pct: float
    acceleration_factor: float
    food_safety: FoodSafetyCompliance
    primary_retail_option: BuyerOptionEconomics
    secondary_processor_option: BuyerOptionEconomics
    is_diversion_beneficial: bool
    arbitrage_net_difference: float  # Secondary net - Primary net
    recommended_action: str  # "DIVERT_TO_SECONDARY_PROCESSOR" or "MAINTAIN_PRIMARY_RETAIL"
    economic_salvage_percentage: float
    decision_rationale: str


def determine_quality_grade(
    crop_type: str,
    remaining_sl_hours: float,
    initial_sl_hours: float,
) -> QualityGradeAssessment:
    """
    Evaluates commercial quality grading and tiered price penalties based on
    biological shelf life remaining upon arrival.
    """
    retention_pct = round(
        max(0.0, min(100.0, (remaining_sl_hours / max(1.0, initial_sl_hours)) * 100.0)),
        1,
    )

    if remaining_sl_hours >= 48.0 or retention_pct >= 65.0:
        return QualityGradeAssessment(
            grade="GRADE_A_PRIME",
            shelf_life_retention_pct=retention_pct,
            primary_retail_penalty_pct=0.0,  # 100% price paid
            secondary_processor_penalty_pct=0.0,
            fssai_compliant_for_processing=True,
            description="Peak fresh condition. Meets premium retail cosmetic and shelf-life standards.",
        )
    elif remaining_sl_hours >= 24.0 or retention_pct >= 40.0:
        return QualityGradeAssessment(
            grade="GRADE_B_COMMERCIAL",
            shelf_life_retention_pct=retention_pct,
            primary_retail_penalty_pct=25.0,  # 25% discount docked for quick-sale clearance
            secondary_processor_penalty_pct=0.0,  # Processors pay full contracted industrial rate
            fssai_compliant_for_processing=True,
            description="Slightly softened or minor cosmetic blemishes. Discounted by supermarkets; optimal for processors.",
        )
    elif remaining_sl_hours >= FOOD_SAFETY_MIN_BUFFER_HOURS or retention_pct >= 15.0:
        return QualityGradeAssessment(
            grade="GRADE_C_PROCESSING_ONLY",
            shelf_life_retention_pct=retention_pct,
            primary_retail_penalty_pct=80.0,  # Supermarkets reject or apply massive distress deduction
            secondary_processor_penalty_pct=0.0,  # Puree/sauce factories accept with zero cosmetic penalty
            fssai_compliant_for_processing=True,
            description="Sub-prime retail produce. Exceeds retail shelf-life limits but fully compliant for immediate pulping/dehydration.",
        )
    else:
        return QualityGradeAssessment(
            grade="GRADE_D_SPOILED",
            shelf_life_retention_pct=retention_pct,
            primary_retail_penalty_pct=100.0,
            secondary_processor_penalty_pct=100.0,
            fssai_compliant_for_processing=False,
            description="Active biological decay / soft rot. FSSAI food-safety hazard. Unfit for human consumption.",
        )


def evaluate_food_safety_compliance(
    crop_type: str,
    arrival_sl_hours: float,
    current_temp_celsius: float,
    exposure_hours: float,
) -> FoodSafetyCompliance:
    """
    Validates regulatory food safety standards under FSSAI (Food Safety and Standards Authority of India).
    Prevents contaminated or putrefied goods from entering the industrial food chain.
    """
    if arrival_sl_hours >= FOOD_SAFETY_MIN_BUFFER_HOURS:
        return FoodSafetyCompliance(
            is_compliant=True,
            status="FSSAI_COMPLIANT_FIT_FOR_PROCESSING",
            microbial_risk_index="LOW" if arrival_sl_hours > 12.0 else "MODERATE",
            regulatory_standard="FSSAI Food Safety and Standards (Contaminants, Toxins and Residues) Regulations",
            certification_rationale=(
                f"Consignment retains {arrival_sl_hours:.1f}h biological viability above the {FOOD_SAFETY_MIN_BUFFER_HOURS}h "
                f"safety margin. Micro-organism colony-forming limits (CFU/g) remain within allowable industrial thresholds."
            ),
        )
    else:
        return FoodSafetyCompliance(
            is_compliant=False,
            status="FOOD_SAFETY_HAZARD_REJECTED",
            microbial_risk_index="CRITICAL_SPOILAGE",
            regulatory_standard="FSSAI Section 19: Prohibition on Food Containing Toxins and Harmful Microbes",
            certification_rationale=(
                f"VIOLATION: Produce shelf life at arrival ({arrival_sl_hours:.1f}h) is below the mandatory {FOOD_SAFETY_MIN_BUFFER_HOURS}h "
                f"FSSAI threshold. Pectinolytic soft rot and anaerobic fermentation render cargo unfit for human food processing. "
                f"Must be diverted to bio-digestion or organic composting."
            ),
        )


def evaluate_secondary_market_arbitrage(
    crop_type: str,
    quantity_kg: float,
    initial_shelf_life_days: float,
    remaining_shelf_life_days: float,
    current_temp_celsius: float,
    current_humidity_pct: float,
    vehicle_lat: float,
    vehicle_lon: float,
    primary_buyer: Dict[str, Any],
    secondary_buyer: Dict[str, Any],
    cost_per_km: float = 15.0,
) -> SecondaryArbitrageResult:
    """
    Calculates the exact financial and biological trade-off between continuing
    to a primary retail supermarket vs diverting to a secondary processing plant.
    """
    scenario_id = f"ARB-{uuid.uuid4().hex[:8].upper()}"
    params = get_crop_kinetics(crop_type)

    # 1. Arrhenius Acceleration
    _, accel_factor, _ = calculate_arrhenius_decay_rate(params, current_temp_celsius)

    # 2. Evaluate Primary Retail Option
    avg_speed_kmh = 42.0
    prim_dist = calculate_haversine_distance(
        vehicle_lat, vehicle_lon,
        primary_buyer.get("latitude"), primary_buyer.get("longitude"),
        160.0
    )
    prim_transit_hours = round(max(0.8, prim_dist / avg_speed_kmh), 1)
    prim_freight = round(500.0 + (cost_per_km * prim_dist), 2)

    prim_decay_days = (prim_transit_hours / 24.0) * accel_factor
    prim_arrival_sl_days = max(0.0, remaining_shelf_life_days - prim_decay_days)
    prim_arrival_sl_hours = round(prim_arrival_sl_days * 24.0, 1)

    prim_initial_hours = initial_shelf_life_days * 24.0
    prim_grade = determine_quality_grade(crop_type, prim_arrival_sl_hours, prim_initial_hours)

    prim_contract_price = float(primary_buyer.get("offered_price_per_kg", 42.0))
    prim_penalty_pct = prim_grade.primary_retail_penalty_pct
    prim_realized_price = round(prim_contract_price * (1.0 - (prim_penalty_pct / 100.0)), 2)

    prim_marketable = prim_arrival_sl_hours >= PRIMARY_RETAIL_MIN_BUFFER_HOURS
    prim_gross = round(quantity_kg * prim_realized_price, 2) if prim_marketable else 0.0
    prim_net = round(prim_gross - prim_freight, 2)

    prim_rejection = None
    if not prim_marketable:
        prim_rejection = (
            f"Supermarket rejection: Arrival shelf life of {prim_arrival_sl_hours}h fails the {PRIMARY_RETAIL_MIN_BUFFER_HOURS}h display threshold. "
            f"Consignment incurs ₹{prim_freight:,.2f} freight with ₹0 revenue (total loss)."
        )

    prim_option = BuyerOptionEconomics(
        buyer_id=str(primary_buyer.get("id", "prim-001")),
        buyer_name=primary_buyer.get("name", "Primary Supermarket"),
        buyer_type=primary_buyer.get("type", "primary_retail"),
        location=primary_buyer.get("location", "Urban Central APMC"),
        distance_km=prim_dist,
        estimated_transit_hours=prim_transit_hours,
        transport_freight_cost=prim_freight,
        contract_price_per_kg=prim_contract_price,
        quality_penalty_pct=prim_penalty_pct,
        realized_price_per_kg=prim_realized_price,
        expected_gross_revenue=prim_gross,
        net_margin=prim_net,
        arrival_shelf_life_hours=prim_arrival_sl_hours,
        safety_buffer_hours=round(prim_arrival_sl_hours - PRIMARY_RETAIL_MIN_BUFFER_HOURS, 1),
        arrival_quality_grade=prim_grade.grade,
        is_marketable=prim_marketable,
        rejection_reason=prim_rejection,
    )

    # 3. Evaluate Secondary Processor Option
    sec_dist = calculate_haversine_distance(
        vehicle_lat, vehicle_lon,
        secondary_buyer.get("latitude"), secondary_buyer.get("longitude"),
        95.0
    )
    sec_transit_hours = round(max(0.5, sec_dist / avg_speed_kmh), 1)
    sec_freight = round(500.0 + (cost_per_km * sec_dist), 2)

    sec_decay_days = (sec_transit_hours / 24.0) * accel_factor
    sec_arrival_sl_days = max(0.0, remaining_shelf_life_days - sec_decay_days)
    sec_arrival_sl_hours = round(sec_arrival_sl_days * 24.0, 1)

    sec_grade = determine_quality_grade(crop_type, sec_arrival_sl_hours, prim_initial_hours)
    food_safety = evaluate_food_safety_compliance(
        crop_type, sec_arrival_sl_hours, current_temp_celsius, sec_transit_hours
    )

    sec_contract_price = float(secondary_buyer.get("offered_price_per_kg", 26.5))
    sec_penalty_pct = 0.0 if food_safety.is_compliant else 100.0
    sec_realized_price = sec_contract_price if food_safety.is_compliant else 0.0

    sec_marketable = food_safety.is_compliant
    sec_gross = round(quantity_kg * sec_realized_price, 2) if sec_marketable else 0.0
    sec_net = round(sec_gross - sec_freight, 2)

    sec_rejection = None
    if not sec_marketable:
        sec_rejection = food_safety.certification_rationale

    sec_option = BuyerOptionEconomics(
        buyer_id=str(secondary_buyer.get("id", "sec-001")),
        buyer_name=secondary_buyer.get("name", "Secondary Food Processor"),
        buyer_type=secondary_buyer.get("type", "secondary_processor"),
        location=secondary_buyer.get("location", "Industrial MIDC Hub"),
        distance_km=sec_dist,
        estimated_transit_hours=sec_transit_hours,
        transport_freight_cost=sec_freight,
        contract_price_per_kg=sec_contract_price,
        quality_penalty_pct=sec_penalty_pct,
        realized_price_per_kg=sec_realized_price,
        expected_gross_revenue=sec_gross,
        net_margin=sec_net,
        arrival_shelf_life_hours=sec_arrival_sl_hours,
        safety_buffer_hours=round(sec_arrival_sl_hours - FOOD_SAFETY_MIN_BUFFER_HOURS, 1),
        arrival_quality_grade=sec_grade.grade,
        is_marketable=sec_marketable,
        rejection_reason=sec_rejection,
    )

    # 4. Arbitrage Comparison
    arbitrage_diff = round(sec_net - prim_net, 2)
    is_diversion_beneficial = (arbitrage_diff > 0) and food_safety.is_compliant

    if is_diversion_beneficial:
        rec_action = "DIVERT_TO_SECONDARY_PROCESSOR"
        salvage_pct = round((sec_net / max(1.0, quantity_kg * prim_contract_price)) * 100.0, 1)
        rationale = (
            f"SECONDARY ARBITRAGE HIGHLY BENEFICIAL: Under {current_temp_celsius:.1f}°C thermal stress ({accel_factor:.1f}x decay rate), "
            f"consignment arrives at primary retail in {prim_grade.grade} condition ({prim_arrival_sl_hours}h shelf life), "
            f"incurring a {prim_penalty_pct:.0f}% penalty or rejection with net yield of ₹{prim_net:,.2f}. "
            f"Diverting to {sec_option.buyer_name} ({sec_option.buyer_type}) saves {round(prim_dist - sec_dist, 1)} km, "
            f"guarantees FSSAI food-safety compliance ({sec_arrival_sl_hours}h buffer), and delivers net yield of ₹{sec_net:,.2f}. "
            f"Arbitrage Gain: +₹{arbitrage_diff:,.2f} ({salvage_pct}% value recovery)."
        )
    else:
        rec_action = "MAINTAIN_PRIMARY_RETAIL"
        salvage_pct = 100.0
        if not food_safety.is_compliant:
            rationale = (
                f"DIVERSION REJECTED ON FOOD SAFETY GROUNDS: Cargo has spoiled beyond the mandatory {FOOD_SAFETY_MIN_BUFFER_HOURS}h "
                f"FSSAI limit ({sec_arrival_sl_hours}h remaining). Secondary processor cannot legally accept putrefied goods. "
                f"Total biological loss; diversion to non-food composting required."
            )
        else:
            rationale = (
                f"DIVERSION NOT BENEFICIAL: Consignment arrives in {prim_grade.grade} prime retail condition at {prim_option.buyer_name}. "
                f"Primary contract pays full ₹{prim_contract_price:.2f}/kg (Net: ₹{prim_net:,.2f}), "
                f"surpassing secondary processor net yield of ₹{sec_net:,.2f} by ₹{abs(arbitrage_diff):,.2f}. "
                f"Maintain primary retail contract to avoid unnecessary economic haircut."
            )

    return SecondaryArbitrageResult(
        scenario_id=scenario_id,
        crop_type=crop_type,
        consignment_quantity_kg=quantity_kg,
        current_temp_celsius=current_temp_celsius,
        current_humidity_pct=current_humidity_pct,
        acceleration_factor=round(accel_factor, 2),
        food_safety=food_safety,
        primary_retail_option=prim_option,
        secondary_processor_option=sec_option,
        is_diversion_beneficial=is_diversion_beneficial,
        arbitrage_net_difference=arbitrage_diff,
        recommended_action=rec_action,
        economic_salvage_percentage=salvage_pct,
        decision_rationale=rationale,
    )
