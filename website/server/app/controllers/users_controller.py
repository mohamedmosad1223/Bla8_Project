"""
Users Controller — Business logic for User CRUD operations.
"""

from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.enums import AccountStatus
from app.models.responses import UserMessages
from app.schemas import UserUpdate
from app.auth import get_password_hash


def _hash_password(password: str) -> str:
    return get_password_hash(password)


class UsersController:

    @staticmethod
    def list_users(db: Session, skip: int, limit: int, role: str | None, status_filter: str | None):
        q = db.query(User).filter(User.deleted_at.is_(None))
        if role:
            q = q.filter(User.role == role)
        if status_filter:
            q = q.filter(User.status == status_filter)
        users = q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return {"message": UserMessages.LISTED, "data": users}

    @staticmethod
    def get_user(db: Session, user_id: int):
        user = db.query(User).filter(User.user_id == user_id, User.deleted_at.is_(None)).first()
        if not user:
            raise HTTPException(status_code=404, detail=UserMessages.NOT_FOUND)
        return {"message": UserMessages.FETCHED, "data": user}

    @staticmethod
    def update_user(db: Session, user_id: int, payload: UserUpdate):
        user = db.query(User).filter(User.user_id == user_id, User.deleted_at.is_(None)).first()
        if not user:
            raise HTTPException(status_code=404, detail=UserMessages.NOT_FOUND)

        update_data = payload.model_dump(exclude_unset=True)

        if "email" in update_data:
            exists = db.query(User).filter(
                User.email == update_data["email"],
                User.user_id != user_id
            ).first()
            if exists:
                raise HTTPException(status_code=409, detail=UserMessages.EMAIL_EXISTS)

        for field, value in update_data.items():
            setattr(user, field, value)

        db.commit()
        db.refresh(user)
        return {"message": UserMessages.UPDATED, "data": user}

    @staticmethod
    def delete_user(db: Session, user_id: int):
        user = db.query(User).filter(User.user_id == user_id, User.deleted_at.is_(None)).first()
        if not user:
            raise HTTPException(status_code=404, detail=UserMessages.NOT_FOUND)

        user.deleted_at = datetime.now(timezone.utc)
        user.status = AccountStatus.suspended
        db.commit()
        return {"message": UserMessages.DELETED}
