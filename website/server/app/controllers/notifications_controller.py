"""
Notifications Controller — logic for creating and retrieving notifications.
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.enums import NotificationType

class NotificationsController:

    @staticmethod
    def create_notification(
        db: Session, 
        user_id: int, 
        ntype: NotificationType, 
        title: str, 
        body: Optional[str] = None, 
        related_id: Optional[int] = None
    ):
        """Creates a new notification for a specific user."""
        notification = Notification(
            user_id=user_id,
            type=ntype,
            title=title,
            body=body,
            related_id=related_id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def list_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 50):
        """Lists notifications for a specific user, sorted by most recent."""
        return db.query(Notification)\
            .filter(Notification.user_id == user_id)\
            .order_by(Notification.created_at.desc())\
            .offset(skip).limit(limit).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int):
        """Marks a notification as read."""
        notification = db.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.user_id == user_id
        ).first()
        if notification:
            notification.is_read = True
            db.commit()
            db.refresh(notification)
        return notification
