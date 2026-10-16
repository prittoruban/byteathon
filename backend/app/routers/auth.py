from typing import Optional, Literal
from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel
from backend.app.store import store, DEMO_PROFILES

router = APIRouter(prefix="/api/auth", tags=["Multi-Role Authentication"])

RoleType = Literal["farmer", "fpo_coordinator", "cold_storage_owner", "truck_driver", "buyer"]

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: RoleType
    display_name: str
    phone: Optional[str] = None
    linked_entity_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

@router.get("/me")
async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
):
    """
    Returns current authenticated user details: { user_id, role, display_name, linked_entity_id }.
    Supports user ID or Role headers for flexible demo switching.
    """
    profile = None
    if x_user_id:
        profile = store.get_profile_by_id(x_user_id)
    elif x_user_role:
        for p in store.profiles.values():
            if p.get("role") == x_user_role:
                profile = p
                break

    if not profile:
        # Default to first demo farmer
        profile = DEMO_PROFILES[0]

    return {
        "user_id": profile["id"],
        "email": profile.get("email"),
        "role": profile["role"],
        "display_name": profile.get("display_name"),
        "phone": profile.get("phone"),
        "linked_entity_id": profile.get("linked_entity_id"),
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(payload: RegisterRequest):
    """
    Creates new user profile row and persists to store.
    """
    existing = store.get_profile_by_email(payload.email)
    if existing:
        return {
            "message": "User already registered, returning existing profile.",
            "user_id": existing["id"],
            "role": existing["role"],
            "display_name": existing.get("display_name"),
            "linked_entity_id": existing.get("linked_entity_id"),
        }

    new_profile = store.create_profile(payload.model_dump())
    return {
        "message": "Registration successful.",
        "user_id": new_profile["id"],
        "role": new_profile["role"],
        "display_name": new_profile.get("display_name"),
        "linked_entity_id": new_profile.get("linked_entity_id"),
    }

@router.post("/login")
async def login_user(payload: LoginRequest):
    """
    Authenticates user against demo credentials or registered profiles.
    """
    profile = store.get_profile_by_email(payload.email)
    if not profile:
        # Fallback to role matching if username like 'farmer', 'fpo', etc.
        for p in store.profiles.values():
            if payload.email.lower() in p["email"].lower() or payload.email.lower() == p["role"]:
                profile = p
                break

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please use demo credentials (e.g. farmer@demo.com / demo1234).",
        )

    return {
        "access_token": f"token-{profile['id']}",
        "token_type": "bearer",
        "user": {
            "user_id": profile["id"],
            "email": profile["email"],
            "role": profile["role"],
            "display_name": profile["display_name"],
            "phone": profile.get("phone"),
            "linked_entity_id": profile.get("linked_entity_id"),
        },
    }
