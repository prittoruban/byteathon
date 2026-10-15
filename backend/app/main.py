from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import get_supabase_client
from backend.app.models import (
    FarmerCreate,
    ProduceBatchCreate,
    ProduceBatchUpdate,
    BuyerCreate,
    StorageFacilityCreate,
    TransportVehicleCreate,
    ShipmentCreate,
)
from backend.app.distribution_engine import (
    optimize_distribution_plan,
    DistributionPlan,
)
from backend.app.spoilage_engine import (
    CROP_KINETIC_DATABASE,
    DEFAULT_KINETIC_PROFILE,
    SpoilageEvaluationRequest,
    SpoilageRiskAssessment,
    TemperatureSpikeSimulationRequest,
    calculate_spoilage_risk,
    simulate_temperature_spike,
    get_crop_kinetics,
)
from backend.app.rerouting_engine import (
    evaluate_dynamic_reroute,
    persist_reroute_to_supabase,
    RerouteRecommendation,
    SimulatedRerouteRequest,
)
from backend.app.secondary_recovery import (
    evaluate_secondary_market_arbitrage,
    determine_quality_grade,
    evaluate_food_safety_compliance,
    SecondaryArbitrageResult,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Post-Harvest Loss Prevention and Distribution Optimization API",
)

# Configure CORS so the Next.js frontend can communicate smoothly
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
async def root():
    return {
        "message": "Welcome to HARVEST ZERO API",
        "description": "Intelligent Post-Harvest Loss Prevention and Distribution Optimization",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/health",
        "verify_db_url": "/api/db-verify",
    }


@app.get("/health", tags=["Monitoring"])
async def health_check():
    return {
        "status": "healthy",
        "service": "harvest-zero-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database_configured": bool(
            settings.SUPABASE_URL
            and "your-project-id" not in settings.SUPABASE_URL
            and (settings.public_key or settings.secret_key)
        ),
        "supabase_url": (
            settings.SUPABASE_URL
            if "your-project-id" not in settings.SUPABASE_URL
            else None
        ),
    }


# ====================================================================
# DATABASE VERIFICATION ENDPOINT (STEP 2 VERIFICATION)
# ====================================================================
@app.get("/api/db-verify", tags=["Database"])
async def verify_database():
    """
    Verifies that the Supabase database is connected, all 6 tables exist,
    and performs a full round-trip read and write verification.
    """
    try:
        client = get_supabase_client()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database client initialization error: {str(e)}",
        )

    tables = [
        "farmers",
        "produce_batches",
        "buyers",
        "storage_facilities",
        "transport_vehicles",
        "shipments",
    ]
    counts: Dict[str, int] = {}
    errors: Dict[str, str] = {}

    # 1. Read check across all 6 tables
    for table in tables:
        try:
            res = client.table(table).select("id", count="exact").limit(1).execute()
            counts[table] = res.count if res.count is not None else len(res.data)
        except Exception as e:
            errors[table] = str(e)

    if errors:
        return {
            "status": "tables_missing_or_error",
            "message": "One or more tables could not be read. Please run 'supabase_schema.sql' in the Supabase SQL Editor.",
            "counts": counts,
            "errors": errors,
            "read_verified": False,
            "write_verified": False,
        }

    # 2. Write check: Insert a transient test farmer, read it back, and remove it
    write_verified = False
    test_id = None
    try:
        insert_res = (
            client.table("farmers")
            .insert(
                {
                    "name": "__TEST_VERIFICATION_FARMER__",
                    "location": "Verification Test LatLon",
                    "storage_type": "cold_storage",
                }
            )
            .execute()
        )
        if insert_res.data and len(insert_res.data) > 0:
            test_id = insert_res.data[0]["id"]
            # Clean up the test record
            client.table("farmers").delete().eq("id", test_id).execute()
            write_verified = True
    except Exception as e:
        errors["write_test"] = str(e)

    return {
        "status": "verified" if write_verified else "partial",
        "message": (
            "Supabase database successfully connected with read and write operations verified!"
            if write_verified
            else "Read succeeded, but write test failed."
        ),
        "read_verified": True,
        "write_verified": write_verified,
        "table_counts": counts,
        "errors": errors or None,
    }


# ====================================================================
# 1. FARMERS API
# ====================================================================
@app.get("/api/farmers", tags=["Farmers"])
async def get_farmers(limit: int = 50):
    client = get_supabase_client()
    res = client.table("farmers").select("*").limit(limit).execute()
    return res.data


@app.post("/api/farmers", tags=["Farmers"], status_code=status.HTTP_201_CREATED)
async def create_farmer(payload: FarmerCreate):
    client = get_supabase_client()
    data = payload.model_dump(exclude_none=True)
    res = client.table("farmers").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create farmer record")
    return res.data[0]


# ====================================================================
# 2. PRODUCE BATCHES API
# ====================================================================
@app.get("/api/produce-batches", tags=["Produce Batches"])
async def get_produce_batches(limit: int = 50):
    client = get_supabase_client()
    res = client.table("produce_batches").select("*, farmers(name, location)").limit(limit).execute()
    return res.data


@app.post(
    "/api/produce-batches",
    tags=["Produce Batches"],
    status_code=status.HTTP_201_CREATED,
)
async def create_produce_batch(payload: ProduceBatchCreate):
    client = get_supabase_client()
    data = payload.model_dump(exclude_none=True)
    if "harvest_date" in data and data["harvest_date"]:
        data["harvest_date"] = str(data["harvest_date"])
    res = client.table("produce_batches").insert(data).execute()
    if not res.data:
        raise HTTPException(
            status_code=400, detail="Failed to create produce batch record"
        )
    return res.data[0]


@app.patch("/api/produce-batches/{batch_id}", tags=["Produce Batches"])
async def update_produce_batch(batch_id: str, payload: ProduceBatchUpdate):
    client = get_supabase_client()
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided to update")
    res = client.table("produce_batches").update(data).eq("id", batch_id).execute()
    if not res.data:
        raise HTTPException(
            status_code=404, detail="Produce batch not found or update failed"
        )
    return res.data[0]


@app.delete("/api/produce-batches/{batch_id}", tags=["Produce Batches"])
async def delete_produce_batch(batch_id: str):
    client = get_supabase_client()
    res = client.table("produce_batches").delete().eq("id", batch_id).execute()
    return {"message": "Produce batch deleted successfully", "id": batch_id}


# ====================================================================
# INVENTORY AGGREGATION & CAPACITY SUMMARY API (STEP 3)
# ====================================================================
@app.get("/api/inventory/summary", tags=["Inventory"])
async def get_inventory_summary():
    """
    Returns aggregate inventory metrics: active batch tonnage, shelf-life stats,
    unfulfilled buyer demand, storage utilization, and vehicle capacity.
    """
    client = get_supabase_client()
    batches = client.table("produce_batches").select("*").execute().data or []
    buyers = client.table("buyers").select("*").execute().data or []
    storages = client.table("storage_facilities").select("*").execute().data or []
    vehicles = client.table("transport_vehicles").select("*").execute().data or []

    active_batches = [
        b for b in batches if b.get("status") in ["harvested", "in_storage", "in_transit"]
    ]
    total_produce_kg = sum(float(b.get("quantity_kg", 0)) for b in active_batches)

    avg_shelf_life = (
        sum(float(b.get("remaining_shelf_life_days", 0)) for b in batches) / len(batches)
        if batches
        else 0.0
    )
    critical_batches = sum(
        1
        for b in batches
        if float(b.get("remaining_shelf_life_days", 0)) <= 3.0
        and b.get("status") not in ["delivered", "spoiled"]
    )

    total_buyer_demand_kg = sum(float(b.get("demand_kg", 0)) for b in buyers)
    primary_demand_kg = sum(
        float(b.get("demand_kg", 0)) for b in buyers if b.get("type") == "primary_retail"
    )
    secondary_demand_kg = sum(
        float(b.get("demand_kg", 0)) for b in buyers if b.get("type") == "secondary_processor"
    )

    total_storage_capacity = sum(float(s.get("total_capacity_kg", 0)) for s in storages)
    total_storage_util = sum(float(s.get("current_utilization_kg", 0)) for s in storages)

    total_vehicle_payload = sum(float(v.get("max_payload_kg", 0)) for v in vehicles)
    refrigerated_vehicles = sum(1 for v in vehicles if v.get("is_refrigerated"))

    return {
        "total_produce_kg": round(total_produce_kg, 2),
        "total_batches_count": len(batches),
        "active_batches_count": len(active_batches),
        "avg_remaining_shelf_life_days": round(avg_shelf_life, 1),
        "critical_batches_count": critical_batches,
        "buyer_demand": {
            "total_demand_kg": round(total_buyer_demand_kg, 2),
            "primary_demand_kg": round(primary_demand_kg, 2),
            "secondary_demand_kg": round(secondary_demand_kg, 2),
            "total_buyers": len(buyers),
        },
        "storage": {
            "total_capacity_kg": round(total_storage_capacity, 2),
            "utilization_kg": round(total_storage_util, 2),
            "available_capacity_kg": round(max(0.0, total_storage_capacity - total_storage_util), 2),
            "utilization_pct": (
                round((total_storage_util / total_storage_capacity * 100), 1)
                if total_storage_capacity > 0
                else 0.0
            ),
            "facilities_count": len(storages),
        },
        "vehicles": {
            "total_payload_kg": round(total_vehicle_payload, 2),
            "total_vehicles": len(vehicles),
            "refrigerated_count": refrigerated_vehicles,
            "ambient_count": len(vehicles) - refrigerated_vehicles,
        },
    }


# ====================================================================
# 3. BUYERS API
# ====================================================================
@app.get("/api/buyers", tags=["Buyers"])
async def get_buyers(limit: int = 50):
    client = get_supabase_client()
    res = client.table("buyers").select("*").limit(limit).execute()
    return res.data


@app.post("/api/buyers", tags=["Buyers"], status_code=status.HTTP_201_CREATED)
async def create_buyer(payload: BuyerCreate):
    client = get_supabase_client()
    data = payload.model_dump(exclude_none=True)
    res = client.table("buyers").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create buyer record")
    return res.data[0]


# ====================================================================
# 4. STORAGE FACILITIES API
# ====================================================================
@app.get("/api/storage-facilities", tags=["Storage Facilities"])
async def get_storage_facilities(limit: int = 50):
    client = get_supabase_client()
    res = client.table("storage_facilities").select("*").limit(limit).execute()
    return res.data


@app.post(
    "/api/storage-facilities",
    tags=["Storage Facilities"],
    status_code=status.HTTP_201_CREATED,
)
async def create_storage_facility(payload: StorageFacilityCreate):
    client = get_supabase_client()
    data = payload.model_dump(exclude_none=True)
    res = client.table("storage_facilities").insert(data).execute()
    if not res.data:
        raise HTTPException(
            status_code=400, detail="Failed to create storage facility record"
        )
    return res.data[0]


# ====================================================================
# 5. TRANSPORT VEHICLES API
# ====================================================================
@app.get("/api/transport-vehicles", tags=["Transport Vehicles"])
async def get_transport_vehicles(limit: int = 50):
    client = get_supabase_client()
    res = client.table("transport_vehicles").select("*").limit(limit).execute()
    return res.data


@app.post(
    "/api/transport-vehicles",
    tags=["Transport Vehicles"],
    status_code=status.HTTP_201_CREATED,
)
async def create_transport_vehicle(payload: TransportVehicleCreate):
    client = get_supabase_client()
    data = payload.model_dump(exclude_none=True)
    res = client.table("transport_vehicles").insert(data).execute()
    if not res.data:
        raise HTTPException(
            status_code=400, detail="Failed to create transport vehicle record"
        )
    return res.data[0]


# ====================================================================
# 6. SHIPMENTS API
# ====================================================================
@app.get("/api/shipments", tags=["Shipments"])
async def get_shipments(limit: int = 50):
    client = get_supabase_client()
    res = (
        client.table("shipments")
        .select(
            "*, produce_batches(crop_type, quantity_kg), transport_vehicles(vehicle_number, is_refrigerated), destination_buyer:buyers!shipments_destination_buyer_id_fkey(name, type)"
        )
        .limit(limit)
        .execute()
    )
    return res.data


@app.post(
    "/api/shipments",
    tags=["Shipments"],
    status_code=status.HTTP_201_CREATED,
)
async def create_shipment(payload: ShipmentCreate):
    client = get_supabase_client()
    data = payload.model_dump(exclude_none=True)
    res = client.table("shipments").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create shipment record")
    return res.data[0]


# ====================================================================
# DISTRIBUTION ENGINE RECOMMENDATION API (STEP 4)
# ====================================================================
@app.get(
    "/api/distribution/recommend",
    tags=["Distribution Engine"],
    response_model=DistributionPlan,
)
async def get_distribution_recommendation():
    """
    Evaluates active produce batches, buyer demands, vehicle capacities,
    and storage constraints to generate an optimal, explainable distribution plan.
    """
    client = get_supabase_client()
    batches = (
        client.table("produce_batches")
        .select("*, farmers(name, location, latitude, longitude)")
        .execute()
        .data
        or []
    )
    buyers = client.table("buyers").select("*").execute().data or []
    vehicles = client.table("transport_vehicles").select("*").execute().data or []
    storages = client.table("storage_facilities").select("*").execute().data or []

    # Filter to active batches ready for dispatch or in buffer storage
    active_batches = [
        b for b in batches if b.get("status") in ["harvested", "in_storage"]
    ]

    plan = optimize_distribution_plan(
        batches=active_batches,
        buyers=buyers,
        vehicles=vehicles,
        storage_facilities=storages,
    )
    return plan


@app.post(
    "/api/distribution/simulate",
    tags=["Distribution Engine"],
    response_model=DistributionPlan,
)
async def simulate_distribution_scenario(payload: Dict[str, Any]):
    """
    Runs the distribution optimization engine on an explicit scenario payload.
    Used for automated scenario testing and hackathon judging verification.
    """
    batches = payload.get("batches", [])
    buyers = payload.get("buyers", [])
    vehicles = payload.get("vehicles", [])
    storages = payload.get("storage_facilities", [])

    plan = optimize_distribution_plan(
        batches=batches,
        buyers=buyers,
        vehicles=vehicles,
        storage_facilities=storages,
    )
    return plan


# ====================================================================
# SPOILAGE-RISK ENGINE (STEP 5)
# ====================================================================
@app.get(
    "/api/spoilage/crops",
    tags=["Spoilage Engine"],
    response_model=List[Dict[str, Any]],
)
async def get_supported_crop_kinetics():
    """
    Returns calibrated Arrhenius degradation kinetic parameters, optimal temperatures,
    and literature citations for supported agricultural commodities.
    """
    results = []
    for crop_key, params in CROP_KINETIC_DATABASE.items():
        results.append({
            "key": crop_key,
            "crop_name": params.crop_name,
            "optimal_temp_celsius": params.optimal_temp_celsius,
            "reference_temp_celsius": params.reference_temp_celsius,
            "activation_energy_j_mol": params.activation_energy_j_mol,
            "activation_energy_kj_mol": round(params.activation_energy_j_mol / 1000.0, 1),
            "base_decay_rate_per_day": params.base_decay_rate_per_day,
            "optimal_humidity_min": params.optimal_humidity_min,
            "optimal_humidity_max": params.optimal_humidity_max,
            "chilling_injury_threshold_celsius": params.chilling_injury_threshold_celsius,
            "typical_shelf_life_days": params.typical_shelf_life_days,
            "literature_source": params.literature_source,
        })
    return results


@app.post(
    "/api/spoilage/evaluate",
    tags=["Spoilage Engine"],
    response_model=SpoilageRiskAssessment,
)
async def evaluate_spoilage_risk(payload: SpoilageEvaluationRequest):
    """
    Evaluates real-time biological deterioration and Arrhenius degradation rate
    for a produce consignment under specified environmental telemetry.
    """
    return calculate_spoilage_risk(payload)


@app.post(
    "/api/spoilage/simulate-temperature-spike",
    tags=["Spoilage Engine"],
    response_model=Dict[str, Any],
)
async def simulate_spoilage_temperature_spike(payload: TemperatureSpikeSimulationRequest):
    """
    Simulates refrigeration failure (thermal spike), demonstrating non-linear
    Arrhenius acceleration compared against baseline cold-chain logistics.
    """
    return simulate_temperature_spike(payload)


@app.get(
    "/api/spoilage/live-assessments",
    tags=["Spoilage Engine"],
    response_model=List[Dict[str, Any]],
)
async def get_live_inventory_spoilage_assessments():
    """
    Evaluates real-time Arrhenius deterioration across all active batches in Supabase,
    applying ambient vs storage facility micro-climates.
    """
    client = get_supabase_client()
    batches = (
        client.table("produce_batches")
        .select("*, farmers(name, location, storage_type)")
        .execute()
        .data
        or []
    )

    assessments = []
    for b in batches:
        crop = b.get("crop_type", "Generic")
        remaining_sl = float(b.get("remaining_shelf_life_days", 5.0))
        initial_sl = float(b.get("initial_shelf_life_days", 14.0))
        cond = b.get("storage_condition", "ambient_heap")

        # Map micro-climate environmental conditions
        if cond == "cold_storage":
            temp = 4.0
            humidity = 90.0
        elif cond == "ventilated_shed":
            temp = 22.0
            humidity = 70.0
        else:  # ambient heap
            temp = 32.0
            humidity = 60.0

        req = SpoilageEvaluationRequest(
            crop_type=crop,
            remaining_shelf_life_days=remaining_sl,
            initial_shelf_life_days=initial_sl,
            current_temp_celsius=temp,
            current_humidity_pct=humidity,
            exposure_hours=6.0,
        )
        assessment = calculate_spoilage_risk(req)
        assessments.append({
            "batch_id": b.get("id"),
            "crop_type": crop,
            "quantity_kg": b.get("quantity_kg"),
            "storage_condition": cond,
            "farmer_name": b.get("farmers", {}).get("name", "Unknown"),
            "assessment": assessment.model_dump(),
        })

    return assessments


# ====================================================================
# DYNAMIC REROUTING ENGINE (STEP 6)
# ====================================================================
@app.get(
    "/api/shipments/active",
    tags=["Dynamic Rerouting"],
    response_model=List[Dict[str, Any]],
)
async def get_active_shipments():
    """
    Retrieves all active consignments (in_transit, scheduled, or rerouted)
    with joined batch, vehicle, and buyer details.
    """
    client = get_supabase_client()
    res = (
        client.table("shipments")
        .select(
            "*, produce_batches(id, crop_type, quantity_kg, initial_shelf_life_days, remaining_shelf_life_days), "
            "transport_vehicles(id, vehicle_number, is_refrigerated, current_temp_celsius, current_humidity_pct, current_latitude, current_longitude, cost_per_km), "
            "destination_buyer:buyers!shipments_destination_buyer_id_fkey(id, name, type, location, latitude, longitude, offered_price_per_kg, demand_crop, demand_kg), "
            "original_buyer:buyers!shipments_original_buyer_id_fkey(id, name, type, location)"
        )
        .in_("status", ["in_transit", "scheduled", "rerouted"])
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@app.post(
    "/api/rerouting/evaluate/{shipment_id}",
    tags=["Dynamic Rerouting"],
    response_model=RerouteRecommendation,
)
async def evaluate_shipment_reroute(
    shipment_id: str,
    payload: Optional[Dict[str, Any]] = None,
):
    """
    Evaluates whether a specific active shipment requires dynamic rerouting
    under its current or simulated thermal stress.
    """
    client = get_supabase_client()
    
    # 1. Fetch shipment with full relational context
    shipment_res = (
        client.table("shipments")
        .select(
            "*, produce_batches(id, crop_type, quantity_kg, initial_shelf_life_days, remaining_shelf_life_days), "
            "transport_vehicles(id, vehicle_number, is_refrigerated, current_temp_celsius, current_humidity_pct, current_latitude, current_longitude, cost_per_km), "
            "destination_buyer:buyers!shipments_destination_buyer_id_fkey(id, name, type, location, latitude, longitude, offered_price_per_kg, demand_crop, demand_kg)"
        )
        .eq("id", shipment_id)
        .execute()
    )

    if not shipment_res.data:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    shipment = shipment_res.data[0]

    # 2. Fetch all registered candidate buyers
    buyers_res = client.table("buyers").select("*").execute()
    candidate_buyers = buyers_res.data or []

    # 3. Telemetry override if provided in request body
    telemetry_override = None
    if payload and "current_temp_celsius" in payload:
        telemetry_override = {
            "current_temp_celsius": float(payload["current_temp_celsius"]),
            "current_humidity_pct": float(payload.get("current_humidity_pct", 70.0)),
            "trigger_reason": payload.get("trigger_reason", "Simulated thermal anomaly"),
        }

    recommendation = evaluate_dynamic_reroute(
        shipment=shipment,
        candidate_buyers=candidate_buyers,
        telemetry_override=telemetry_override,
    )
    return recommendation


@app.post(
    "/api/rerouting/simulate-spike-and-reroute",
    tags=["Dynamic Rerouting"],
    response_model=RerouteRecommendation,
)
async def simulate_spike_and_reroute(req: SimulatedRerouteRequest):
    """
    Simulates a high-temperature breakdown on an active shipment or simulated consignment,
    demonstrating the complete dynamic rerouting evaluation and alternative comparison.
    """
    client = get_supabase_client()
    buyers_res = client.table("buyers").select("*").execute()
    candidate_buyers = buyers_res.data or []

    # Build simulated or retrieved shipment
    if req.shipment_id:
        shipment_res = (
            client.table("shipments")
            .select(
                "*, produce_batches(id, crop_type, quantity_kg, initial_shelf_life_days, remaining_shelf_life_days), "
                "transport_vehicles(id, vehicle_number, is_refrigerated, current_temp_celsius, current_humidity_pct, current_latitude, current_longitude, cost_per_km), "
                "destination_buyer:buyers!shipments_destination_buyer_id_fkey(id, name, type, location, latitude, longitude, offered_price_per_kg, demand_crop, demand_kg)"
            )
            .eq("id", req.shipment_id)
            .execute()
        )
        if shipment_res.data:
            shipment = shipment_res.data[0]
        else:
            raise HTTPException(status_code=404, detail=f"Shipment {req.shipment_id} not found")
    else:
        # Default scenario: Tomato consignment in Nashik-Mumbai corridor
        shipment = {
            "id": "simulated-shipment-001",
            "allocated_quantity_kg": req.quantity_kg,
            "produce_batches": {
                "id": "batch-sim-001",
                "crop_type": req.crop_type,
                "initial_shelf_life_days": req.initial_shelf_life_days,
                "remaining_shelf_life_days": req.remaining_shelf_life_days,
            },
            "transport_vehicles": {
                "id": "veh-sim-001",
                "vehicle_number": "MH-15-TC-1088",
                "current_latitude": req.vehicle_lat,
                "current_longitude": req.vehicle_lon,
                "cost_per_km": req.cost_per_km,
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

    telemetry_override = {
        "current_temp_celsius": req.spiked_temp_celsius,
        "current_humidity_pct": req.current_humidity_pct,
        "trigger_reason": f"Refrigeration compressor breakdown: temperature spiked to {req.spiked_temp_celsius}°C",
    }

    return evaluate_dynamic_reroute(
        shipment=shipment,
        candidate_buyers=candidate_buyers,
        telemetry_override=telemetry_override,
    )


@app.post(
    "/api/rerouting/confirm/{shipment_id}",
    tags=["Dynamic Rerouting"],
    response_model=Dict[str, Any],
)
async def confirm_shipment_reroute(
    shipment_id: str,
    recommendation: RerouteRecommendation,
):
    """
    Executes and persists the dynamic rerouting decision to Supabase PostgreSQL,
    updating the shipment status, new destination buyer, and transparent audit reason.
    """
    client = get_supabase_client()
    try:
        updated_shipment = persist_reroute_to_supabase(
            client=client,
            shipment_id=shipment_id,
            recommendation=recommendation,
        )
        return {
            "status": "success",
            "message": f"Shipment {shipment_id} successfully rerouted to {recommendation.recommended_destination.buyer_name}",
            "updated_shipment": updated_shipment,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ====================================================================
# SECONDARY-MARKET RECOVERY & ARBITRAGE (STEP 7)
# ====================================================================
@app.get(
    "/api/secondary/buyers",
    tags=["Secondary Market Recovery"],
    response_model=List[Dict[str, Any]],
)
async def get_secondary_processing_buyers():
    """
    Returns all registered industrial secondary processors (puree, paste,
    juice, starch, dehydration) capable of absorbing sub-prime produce.
    """
    client = get_supabase_client()
    res = (
        client.table("buyers")
        .select("*")
        .eq("type", "secondary_processor")
        .execute()
    )
    return res.data or []


@app.post(
    "/api/secondary/arbitrage-evaluate",
    tags=["Secondary Market Recovery"],
    response_model=SecondaryArbitrageResult,
)
async def evaluate_secondary_arbitrage(payload: Dict[str, Any]):
    """
    Evaluates financial and biological arbitrage between a primary supermarket contract
    and a secondary processing alternative under specific temperature conditions.
    """
    client = get_supabase_client()
    crop_type = payload.get("crop_type", "Tomato")
    quantity_kg = float(payload.get("quantity_kg", 4000.0))
    initial_sl_days = float(payload.get("initial_shelf_life_days", 14.0))
    remaining_sl_days = float(payload.get("remaining_shelf_life_days", 3.0))
    current_temp = float(payload.get("current_temp_celsius", 35.0))
    current_humidity = float(payload.get("current_humidity_pct", 70.0))
    v_lat = float(payload.get("vehicle_lat", 19.98))
    v_lon = float(payload.get("vehicle_lon", 73.79))
    cost_per_km = float(payload.get("cost_per_km", 15.0))

    # Retrieve or use specified buyers
    prim_buyer_id = payload.get("primary_buyer_id")
    sec_buyer_id = payload.get("secondary_buyer_id")

    buyers_res = client.table("buyers").select("*").execute().data or []

    primary_buyer = None
    secondary_buyer = None

    if prim_buyer_id:
        primary_buyer = next((b for b in buyers_res if str(b["id"]) == str(prim_buyer_id)), None)
    if sec_buyer_id:
        secondary_buyer = next((b for b in buyers_res if str(b["id"]) == str(sec_buyer_id)), None)

    # Defaults matching crop if not specified
    if not primary_buyer:
        primary_buyer = next(
            (b for b in buyers_res if b["type"] == "primary_retail" and crop_type.lower() in b["demand_crop"].lower()),
            buyers_res[0] if buyers_res else {},
        )
    if not secondary_buyer:
        secondary_buyer = next(
            (b for b in buyers_res if b["type"] == "secondary_processor" and crop_type.lower() in b["demand_crop"].lower()),
            buyers_res[1] if len(buyers_res) > 1 else {},
        )

    return evaluate_secondary_market_arbitrage(
        crop_type=crop_type,
        quantity_kg=quantity_kg,
        initial_shelf_life_days=initial_sl_days,
        remaining_shelf_life_days=remaining_sl_days,
        current_temp_celsius=current_temp,
        current_humidity_pct=current_humidity,
        vehicle_lat=v_lat,
        vehicle_lon=v_lon,
        primary_buyer=primary_buyer,
        secondary_buyer=secondary_buyer,
        cost_per_km=cost_per_km,
    )


@app.get(
    "/api/secondary/benchmark-scenarios",
    tags=["Secondary Market Recovery"],
)
async def get_arbitrage_benchmark_scenarios():
    """
    Returns comparative benchmark scenarios (Scenario A: Diversion Beneficial vs Scenario B: Diversion Not Beneficial)
    for hackathon demonstration and verification.
    """
    client = get_supabase_client()
    buyers_res = client.table("buyers").select("*").execute().data or []

    prim_tomato = next((b for b in buyers_res if b["name"] == "FreshMart Hypermarket (Prime Retail)"), None) or {
        "id": "prim-tom",
        "name": "FreshMart Hypermarket (Prime Retail)",
        "type": "primary_retail",
        "location": "Mumbai Central Hub",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "offered_price_per_kg": 42.0,
    }

    sec_tomato = next((b for b in buyers_res if b["name"] == "Apex Agro Puree & Sauce Corp"), None) or {
        "id": "sec-tom",
        "name": "Apex Agro Puree & Sauce Corp",
        "type": "secondary_processor",
        "location": "Thane Industrial Zone",
        "latitude": 19.2183,
        "longitude": 72.9781,
        "offered_price_per_kg": 26.5,
    }

    # Scenario A: Heatwave Breakdown (Diversion is Beneficial)
    beneficial_scenario = evaluate_secondary_market_arbitrage(
        crop_type="Tomato",
        quantity_kg=4000.0,
        initial_shelf_life_days=14.0,
        remaining_shelf_life_days=2.0,
        current_temp_celsius=36.0,
        current_humidity_pct=70.0,
        vehicle_lat=19.98,
        vehicle_lon=73.79,
        primary_buyer=prim_tomato,
        secondary_buyer=sec_tomato,
    )

    # Scenario B: Cold Chain Intact (Diversion is NOT Beneficial)
    not_beneficial_scenario = evaluate_secondary_market_arbitrage(
        crop_type="Tomato",
        quantity_kg=4000.0,
        initial_shelf_life_days=14.0,
        remaining_shelf_life_days=9.0,
        current_temp_celsius=8.0,
        current_humidity_pct=85.0,
        vehicle_lat=19.98,
        vehicle_lon=73.79,
        primary_buyer=prim_tomato,
        secondary_buyer=sec_tomato,
    )

    return {
        "scenario_a_diversion_beneficial": beneficial_scenario.model_dump(),
        "scenario_b_diversion_not_beneficial": not_beneficial_scenario.model_dump(),
    }

