from typing import Optional, Dict, Any
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, HTTPException

from backend.app.database import get_supabase_client
from backend.app.spoilage_engine import (
    calculate_spoilage_risk,
    SpoilageEvaluationRequest,
    calculate_arrhenius_decay_rate,
    get_crop_kinetics,
)

router = APIRouter(prefix="/api/freshness", tags=["Dynamic Freshness Evaluation"])

# In-memory hour-keyed cache: freshness:{batch_id}:{hour}
_freshness_cache: Dict[str, Dict[str, Any]] = {}

@router.get("/{batch_id}")
async def get_batch_freshness(batch_id: str):
    """
    Computes real-time biological shelf life using the Arrhenius kinetic engine,
    factoring in live regional weather and thermal exposure.
    """
    current_hour_key = f"freshness:{batch_id}:{datetime.now(timezone.utc).strftime('%Y-%m-%d-%H')}"
    if current_hour_key in _freshness_cache:
        return _freshness_cache[current_hour_key]

    client = get_supabase_client()
    crop_type = "Tomato"
    remaining_days = 8.5
    storage_type = "ambient_heap"
    lat, lon = 19.9975, 73.7898 # Nashik default coordinates

    try:
        res = client.table("produce_batches").select("*, farmers(latitude, longitude)").eq("id", batch_id).execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            crop_type = row.get("crop_type", "Tomato")
            remaining_days = float(row.get("remaining_shelf_life_days", 8.5))
            storage_type = row.get("storage_condition", "ambient_heap")
            farmers_info = row.get("farmers")
            if isinstance(farmers_info, dict):
                lat = farmers_info.get("latitude") or lat
                lon = farmers_info.get("longitude") or lon
    except Exception as e:
        print(f"[Warning] Failed to fetch batch {batch_id} for freshness evaluation: {e}")

    # Fetch live weather from Open-Meteo with fallback
    ambient_temp = 31.0
    ambient_humidity = 62.0
    try:
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m"
        async with httpx.AsyncClient(timeout=3.0) as ac:
            w_res = await ac.get(weather_url)
            if w_res.status_code == 200:
                w_data = w_res.json().get("current", {})
                ambient_temp = w_data.get("temperature_2m", ambient_temp)
                ambient_humidity = w_data.get("relative_humidity_2m", ambient_humidity)
    except Exception:
        pass

    # If in cold storage, produce temperature is refrigerated
    effective_temp = 4.0 if storage_type == "cold_storage" else (ambient_temp - 4.0 if storage_type == "ventilated_shed" else ambient_temp)

    # Compute Arrhenius kinetic alpha
    kinetics = get_crop_kinetics(crop_type)
    _, acceleration_factor, _ = calculate_arrhenius_decay_rate(kinetics, effective_temp)
    alpha = round(acceleration_factor, 2)

    # Evaluate biological shelf life
    spoilage_req = SpoilageEvaluationRequest(
        crop_type=crop_type,
        current_temp_celsius=effective_temp,
        current_humidity_pct=ambient_humidity,
        storage_type=storage_type,
        remaining_shelf_life_days=remaining_days,
        exposure_hours=24.0,
    )
    assessment = calculate_spoilage_risk(spoilage_req)
    hours_remaining = round(max(4.0, assessment.updated_remaining_shelf_life_days * 24.0), 1)

    if hours_remaining <= 24.0:
        urgency = "critical"
    elif hours_remaining <= 48.0:
        urgency = "high"
    elif hours_remaining <= 96.0:
        urgency = "medium"
    else:
        urgency = "low"

    urgency_reason = (
        f"{storage_type.replace('_', ' ').capitalize()} at {effective_temp:.1f}°C accelerates biological decay by {alpha}×."
    )

    result = {
        "batch_id": batch_id,
        "crop_type": crop_type,
        "hours_remaining": hours_remaining,
        "urgency": urgency,
        "arrhenius_alpha": alpha,
        "urgency_reason": urgency_reason,
        "current_temp_celsius": effective_temp,
        "ambient_humidity_pct": ambient_humidity,
    }

    _freshness_cache[current_hour_key] = result
    return result
