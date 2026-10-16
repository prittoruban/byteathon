from typing import Optional, List
from fastapi import APIRouter, Query, Header, HTTPException, status
from backend.app.store import store

router = APIRouter(prefix="/api/notifications", tags=["In-App Notifications"])

@router.get("")
async def list_notifications(
    recipient_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    x_user_id: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    """
    Returns notifications for the authenticated user / role.
    """
    target_id = recipient_id or x_user_id
    target_role = role or x_user_role
    items = store.list_notifications(recipient_id=target_id, role=target_role)
    return items

@router.get("/unread-count")
async def get_unread_count(
    recipient_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    x_user_id: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    """
    Returns count of unread notifications for badge indicator.
    """
    target_id = recipient_id or x_user_id
    target_role = role or x_user_role
    count = store.count_unread(recipient_id=target_id, role=target_role)
    return {"count": count}

@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """
    Marks a single notification as read.
    """
    success = store.mark_read(notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification '{notification_id}' not found.",
        )
    return {"status": "success", "id": notification_id, "is_read": True}

@router.patch("/read-all")
async def mark_all_notifications_read(
    recipient_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    x_user_id: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    """
    Marks all notifications for the active recipient / role as read.
    """
    target_id = recipient_id or x_user_id
    target_role = role or x_user_role
    marked = store.mark_all_read(recipient_id=target_id, role=target_role)
    return {"status": "success", "marked_read_count": marked}
