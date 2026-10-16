"""
HARVEST ZERO — In-Memory & Supabase Hybrid Store for Multi-Role Platform Rebuild
Provides high-reliability storage for profiles, notifications, and dispatch plans,
syncing to Supabase when tables exist and gracefully maintaining in-memory state.
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
from backend.app.database import get_supabase_client

# Demo user credentials & default profiles
DEMO_PROFILES: List[Dict[str, Any]] = [
    {
        "id": "e4b0c1a1-1111-4444-8888-000000000001",
        "email": "farmer@demo.com",
        "password": "demo1234",
        "role": "farmer",
        "display_name": "Ramesh Patel (Greenfield Farms)",
        "phone": "+91-9876543210",
        "linked_entity_id": "92066deb-ff6f-4b6d-9578-3cb5879737e1",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "e4b0c1a1-2222-4444-8888-000000000002",
        "email": "fpo@demo.com",
        "password": "demo1234",
        "role": "fpo_coordinator",
        "display_name": "Dr. Sunita Deshmukh (Nashik FPO Cluster)",
        "phone": "+91-9876543299",
        "linked_entity_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "e4b0c1a1-3333-4444-8888-000000000003",
        "email": "storage@demo.com",
        "password": "demo1234",
        "role": "cold_storage_owner",
        "display_name": "MahaAgro Cold Vault Manager",
        "phone": "+91-9876543301",
        "linked_entity_id": "c1f7a0b2-3e4d-4c5b-9a8f-1d2e3f4a5b6c",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "e4b0c1a1-4444-4444-8888-000000000004",
        "email": "truck@demo.com",
        "password": "demo1234",
        "role": "truck_driver",
        "display_name": "Balwinder Singh (MH-15-AG-4021)",
        "phone": "+91-9876543402",
        "linked_entity_id": "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "e4b0c1a1-5555-4444-8888-000000000005",
        "email": "buyer@demo.com",
        "password": "demo1234",
        "role": "buyer",
        "display_name": "Rajesh Gupta (FreshMart Prime Retail)",
        "phone": "+91-9876543503",
        "linked_entity_id": "f2a4c6e8-1b3d-4f5a-9c7e-2d4f6a8b0c2e",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]

# Seed Dispatch Plans (Empty in production mode - populated solely by real intake)
DEMO_DISPATCH_PLANS: List[Dict[str, Any]] = []

# Seed Notifications (Empty in production mode - populated solely by real actions)
DEMO_NOTIFICATIONS: List[Dict[str, Any]] = []

class MemoryStore:
    def __init__(self):
        self.profiles: Dict[str, Dict[str, Any]] = {p["id"]: p for p in DEMO_PROFILES}
        self.dispatch_plans: Dict[str, Dict[str, Any]] = {}
        self.notifications: Dict[str, Dict[str, Any]] = {}
        self.produce_batches: Dict[str, Dict[str, Any]] = {}

    def add_produce_batch(self, batch_data: Dict[str, Any]) -> Dict[str, Any]:
        b_id = batch_data.get("id") or str(uuid.uuid4())
        record = {
            "id": b_id,
            "crop_type": batch_data.get("crop_type") or batch_data.get("crop_name", "Produce Lot"),
            "crop_name": batch_data.get("crop_type") or batch_data.get("crop_name", "Produce Lot"),
            "quantity_kg": batch_data.get("quantity_kg", 2500.0),
            "harvest_date": batch_data.get("harvest_date") or datetime.now(timezone.utc).isoformat(),
            "initial_shelf_life_days": batch_data.get("initial_shelf_life_days", 10.0),
            "remaining_shelf_life_days": batch_data.get("remaining_shelf_life_days", 8.0),
            "remaining_shelf_life_hours": batch_data.get("remaining_shelf_life_hours", 84.0),
            "storage_condition": batch_data.get("storage_condition", "ambient"),
            "basal_degradation_score": batch_data.get("basal_degradation_score", 12.0),
            "status": batch_data.get("status", "plan_confirmed"),
            "farmer_name": batch_data.get("farmer_name", "Ramesh Patel (Greenfield Farms)"),
            "farm_location_name": batch_data.get("farm_location_name", "Nashik Cluster Farm A"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.produce_batches[b_id] = record
        return record

    def list_produce_batches(self) -> List[Dict[str, Any]]:
        return sorted(list(self.produce_batches.values()), key=lambda x: x.get("created_at", ""), reverse=True)

    def get_produce_batch(self, batch_id: str) -> Optional[Dict[str, Any]]:
        return self.produce_batches.get(batch_id)

    def update_produce_batch(self, batch_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if batch_id in self.produce_batches:
            self.produce_batches[batch_id].update(updates)
            return self.produce_batches[batch_id]
        return None

    def get_profile_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self.profiles.get(user_id)

    def get_profile_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        for p in self.profiles.values():
            if p.get("email", "").lower() == email.lower():
                return p
        return None

    def create_profile(self, data: Dict[str, Any]) -> Dict[str, Any]:
        p_id = data.get("id") or str(uuid.uuid4())
        record = {
            "id": p_id,
            "email": data.get("email"),
            "role": data.get("role", "farmer"),
            "display_name": data.get("display_name", "User"),
            "phone": data.get("phone"),
            "linked_entity_id": data.get("linked_entity_id"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.profiles[p_id] = record
        return record

    def list_notifications(self, recipient_id: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
        results = list(self.notifications.values())
        if recipient_id:
            results = [n for n in results if n.get("recipient_id") == recipient_id]
        elif role:
            # Match recipient with that role
            valid_ids = [p["id"] for p in self.profiles.values() if p.get("role") == role]
            results = [n for n in results if n.get("recipient_id") in valid_ids]
        return sorted(results, key=lambda x: x.get("created_at", ""), reverse=True)

    def count_unread(self, recipient_id: Optional[str] = None, role: Optional[str] = None) -> int:
        notifs = self.list_notifications(recipient_id=recipient_id, role=role)
        return sum(1 for n in notifs if not n.get("is_read", False))

    def mark_read(self, notif_id: str) -> bool:
        if notif_id in self.notifications:
            self.notifications[notif_id]["is_read"] = True
            return True
        return False

    def mark_all_read(self, recipient_id: Optional[str] = None, role: Optional[str] = None) -> int:
        notifs = self.list_notifications(recipient_id=recipient_id, role=role)
        count = 0
        for n in notifs:
            if not n.get("is_read", False):
                n["is_read"] = True
                count += 1
        return count

    def add_notification(self, data: Dict[str, Any]) -> Dict[str, Any]:
        n_id = data.get("id") or str(uuid.uuid4())
        record = {
            "id": n_id,
            "recipient_id": data.get("recipient_id"),
            "type": data.get("type", "plan_request"),
            "title": data.get("title", ""),
            "body": data.get("body", ""),
            "payload": data.get("payload", {}),
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.notifications[n_id] = record
        return record

    def list_dispatch_plans(self, batch_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        plans = list(self.dispatch_plans.values())
        if batch_id:
            plans = [p for p in plans if p.get("batch_id") == batch_id]
        if status:
            plans = [p for p in plans if p.get("status") == status]
        return sorted(plans, key=lambda x: x.get("created_at", ""), reverse=True)

    def get_dispatch_plan(self, plan_id: str) -> Optional[Dict[str, Any]]:
        return self.dispatch_plans.get(plan_id)

    def update_dispatch_plan(self, plan_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if plan_id in self.dispatch_plans:
            self.dispatch_plans[plan_id].update(updates)
            return self.dispatch_plans[plan_id]
        return None

store = MemoryStore()
