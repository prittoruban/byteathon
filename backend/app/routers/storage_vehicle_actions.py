from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from backend.app.database import get_supabase_client
from backend.app.store import store

router = APIRouter(prefix="/api", tags=["Storage & Vehicle Partner Actions"])

class DirectActionPayload(BaseModel):
    plan_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    booking_id: Optional[str] = None
    facility_id: Optional[str] = None
    reason: Optional[str] = None
    crop_type: Optional[str] = "Produce"
    quantity_kg: Optional[float] = 1000.0

class BookingActionPayload(BaseModel):
    batch_id: Optional[str] = None
    farmer_name: Optional[str] = "Farmer"
    crop_type: Optional[str] = "Produce"
    quantity_kg: Optional[float] = 1000.0

class TripActionPayload(BaseModel):
    batch_id: Optional[str] = None
    buyer_name: Optional[str] = "Buyer"
    crop_type: Optional[str] = "Produce"
    driver_name: Optional[str] = "Driver"

@router.post("/storage/confirm")
async def direct_storage_confirm(payload: DirectActionPayload):
    facility_id = payload.facility_id or payload.booking_id or "fac-default"
    return await confirm_storage_booking(facility_id, BookingActionPayload(crop_type=payload.crop_type, quantity_kg=payload.quantity_kg))

@router.post("/storage/decline")
async def direct_storage_decline(payload: DirectActionPayload):
    facility_id = payload.facility_id or payload.booking_id or "fac-default"
    return await decline_storage_booking(facility_id, BookingActionPayload(crop_type=payload.crop_type, quantity_kg=payload.quantity_kg))

@router.post("/vehicle/accept")
async def direct_vehicle_accept(payload: DirectActionPayload):
    veh_id = payload.vehicle_id or "veh-01"
    plan_id = payload.plan_id
    if plan_id and plan_id in store.dispatch_plans:
        plan = store.dispatch_plans[plan_id]
        # Verify buyer approval gating
        if not plan.get("buyer_approved") and plan.get("status") not in ["buyer_approved", "in_transit"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Commercial buyer must approve purchase order before transportation can accept transit.",
            )
        store.dispatch_plans[plan_id]["status"] = "in_transit"
        batch_id = store.dispatch_plans[plan_id].get("batch_id")
        if batch_id:
            store.update_produce_batch(batch_id, {"status": "in_transit"})

        # Notify buyer that reefer truck has started transit
        buyer_user = next((p for p in store.profiles.values() if p["role"] == "buyer"), None)
        if buyer_user:
            store.add_notification({
                "recipient_id": buyer_user["id"],
                "type": "transit_started",
                "title": f"Reefer Truck En Route: {plan.get('crop_type')}",
                "body": f"Vehicle {plan.get('vehicle_number', 'MH-15-AG-4021')} departed {plan.get('origin_location')}. Temp setpoint locked at +4.0°C.",
                "payload": {"plan_id": plan_id, "batch_id": batch_id},
            })
    return await accept_vehicle_trip(veh_id, TripActionPayload(crop_type=payload.crop_type))

@router.post("/vehicle/decline")
async def direct_vehicle_decline(payload: DirectActionPayload):
    return {"status": "declined", "message": "Trip marked unavailable for this driver"}

@router.post("/vehicle/deliver")
async def direct_vehicle_deliver(payload: DirectActionPayload):
    veh_id = payload.vehicle_id or "veh-01"
    plan_id = payload.plan_id
    if plan_id and plan_id in store.dispatch_plans:
        plan = store.dispatch_plans[plan_id]
        store.dispatch_plans[plan_id]["status"] = "delivered"
        batch_id = store.dispatch_plans[plan_id].get("batch_id")
        if batch_id:
            store.update_produce_batch(batch_id, {"status": "delivered"})

        # Notify buyer
        buyer_user = next((p for p in store.profiles.values() if p["role"] == "buyer"), None)
        if buyer_user:
            store.add_notification({
                "recipient_id": buyer_user["id"],
                "type": "delivery_complete",
                "title": f"Shipment Delivered: {plan.get('crop_type')}",
                "body": f"Reefer truck {plan.get('vehicle_number')} arrived and unloaded at your facility.",
                "payload": {"plan_id": plan_id},
            })

        # Notify farmer
        farmer_user = next((p for p in store.profiles.values() if p["role"] == "farmer"), None)
        if farmer_user:
            store.add_notification({
                "recipient_id": farmer_user["id"],
                "type": "delivery_complete",
                "title": f"Delivered to {plan.get('buyer_name')}",
                "body": f"Your {plan.get('crop_type')} lot was safely delivered to commercial buyer.",
                "payload": {"plan_id": plan_id},
            })
    return await mark_vehicle_delivered(veh_id, TripActionPayload(crop_type=payload.crop_type))

@router.post("/storage/{facility_id}/confirm-booking")
async def confirm_storage_booking(facility_id: str, payload: BookingActionPayload):
    """
    Cold storage operator confirms slot booking. Updates storage utilization and notifies farmer.
    """
    client = get_supabase_client()
    try:
        # Increase utilization in Supabase if facility exists
        res = client.table("storage_facilities").select("current_utilization_kg, total_capacity_kg").eq("id", facility_id).execute()
        if res.data and len(res.data) > 0:
            current_util = res.data[0].get("current_utilization_kg", 0.0)
            new_util = current_util + (payload.quantity_kg or 1000.0)
            client.table("storage_facilities").update({"current_utilization_kg": new_util}).eq("id", facility_id).execute()
    except Exception as e:
        print(f"[Warning] Failed to update storage utilization in Supabase: {e}")

    # Notify farmer
    farmer_user = next((p for p in store.profiles.values() if p["role"] == "farmer"), None)
    if farmer_user:
        store.add_notification({
            "recipient_id": farmer_user["id"],
            "type": "booking_confirmed",
            "title": "Cold Storage Space Confirmed",
            "body": f"Facility operator confirmed {payload.quantity_kg}kg {payload.crop_type} cold storage slot.",
            "payload": {"facility_id": facility_id},
        })

    return {
        "status": "confirmed",
        "facility_id": facility_id,
        "message": "Storage booking confirmed. Capacity updated and farmer notified.",
    }

@router.post("/storage/{facility_id}/decline-booking")
async def decline_storage_booking(facility_id: str, payload: BookingActionPayload):
    """
    Cold storage operator declines slot booking (e.g. at full capacity). Notifies FPO coordinator.
    """
    fpo_user = next((p for p in store.profiles.values() if p["role"] == "fpo_coordinator"), None)
    if fpo_user:
        store.add_notification({
            "recipient_id": fpo_user["id"],
            "type": "storage_declined",
            "title": f"Cold Storage Capacity Full at Facility",
            "body": f"Booking of {payload.quantity_kg}kg {payload.crop_type} declined. Please reroute.",
            "payload": {"facility_id": facility_id},
        })

    return {
        "status": "declined",
        "facility_id": facility_id,
        "message": "Storage booking declined. FPO coordinator notified for alternative routing.",
    }

@router.post("/vehicle/{vehicle_id}/accept-trip")
async def accept_vehicle_trip(vehicle_id: str, payload: TripActionPayload):
    """
    Truck driver accepts trip assignment. Sets vehicle status to 'assigned', notifies farmer.
    """
    client = get_supabase_client()
    try:
        client.table("transport_vehicles").update({"status": "assigned"}).eq("id", vehicle_id).execute()
    except Exception as e:
        print(f"[Warning] Transport vehicle status update fallback: {e}")

    farmer_user = next((p for p in store.profiles.values() if p["role"] == "farmer"), None)
    if farmer_user:
        store.add_notification({
            "recipient_id": farmer_user["id"],
            "type": "trip_accepted",
            "title": "Truck Driver En Route to Farm",
            "body": f"Driver {payload.driver_name} confirmed pickup of your {payload.crop_type} lot.",
            "payload": {"vehicle_id": vehicle_id},
        })

    return {
        "status": "accepted",
        "vehicle_id": vehicle_id,
        "message": "Trip accepted by driver. Farmer notified of vehicle dispatch.",
    }

@router.post("/vehicle/{vehicle_id}/mark-delivered")
async def mark_vehicle_delivered(vehicle_id: str, payload: TripActionPayload):
    """
    Driver marks trip delivered. Sets shipment status = 'delivered', notifies farmer & buyer.
    """
    client = get_supabase_client()
    try:
        client.table("transport_vehicles").update({"status": "available"}).eq("id", vehicle_id).execute()
        if payload.batch_id:
            client.table("shipments").update({"status": "delivered"}).eq("batch_id", payload.batch_id).execute()
            client.table("produce_batches").update({"status": "delivered"}).eq("id", payload.batch_id).execute()
    except Exception as e:
        print(f"[Warning] Delivery status update fallback: {e}")

    # Notify Farmer
    farmer_user = next((p for p in store.profiles.values() if p["role"] == "farmer"), None)
    if farmer_user:
        store.add_notification({
            "recipient_id": farmer_user["id"],
            "type": "lot_delivered",
            "title": f"Harvest Delivered: {payload.crop_type}",
            "body": f"Your produce was delivered successfully to {payload.buyer_name}. Payment processing initiated.",
            "payload": {"vehicle_id": vehicle_id},
        })

    # Notify Buyer
    buyer_user = next((p for p in store.profiles.values() if p["role"] == "buyer"), None)
    if buyer_user:
        store.add_notification({
            "recipient_id": buyer_user["id"],
            "type": "delivery_arrived",
            "title": f"Produce Arrived: {payload.crop_type}",
            "body": f"Vehicle has completed delivery at your receiving dock.",
            "payload": {"vehicle_id": vehicle_id},
        })

    return {
        "status": "delivered",
        "vehicle_id": vehicle_id,
        "message": "Delivery logged successfully. Both farmer and buyer notified.",
    }
