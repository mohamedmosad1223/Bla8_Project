"""
Notifications Router — Routes for listing and managing user notifications.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.controllers.notifications_controller import NotificationsController

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)

@router.get("/")
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """جلب قائمة إشعاراتك — مرتبة من الأحدث للأقدم"""
    notifications = NotificationsController.list_notifications(db, current_user.user_id, skip, limit)
    return {"message": "تم جلب الإشعارات بنجاح", "data": notifications}

@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """تحديد إشعار كـ "مقروء" """
    notification = NotificationsController.mark_as_read(db, notification_id, current_user.user_id)
    return {"message": "تم تحديد الإشعار كمقروء", "data": notification}
