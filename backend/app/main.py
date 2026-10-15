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
