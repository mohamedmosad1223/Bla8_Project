"""
Admins Controller — Business logic for Admin CRUD operations.
"""

import hashlib
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.admin import Admin
from app.models.enums import UserRole, AccountStatus
from app.models.responses import AdminMessages, UserMessages
from app.schemas import AdminUpdate, AdminRegister


from app.auth import get_password_hash

def _hash_password(password: str) -> str:
    return get_password_hash(password)


class AdminsController:

    @staticmethod
    def register(db: Session, payload: AdminRegister):
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        user = User(
            email=payload.email,
            password_hash=_hash_password(payload.password),
            role=UserRole.admin,
            status=AccountStatus.active,
        )
        db.add(user)
        db.flush()

        admin = Admin(
            user_id=user.user_id,
            full_name=payload.full_name,
            phone=payload.phone,
            level=payload.level,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return {"message": AdminMessages.REGISTERED, "data": admin}

    @staticmethod
    def list_admins(db: Session, skip: int, limit: int):
        admins = db.query(Admin).order_by(Admin.created_at.desc()).offset(skip).limit(limit).all()
        return {"message": AdminMessages.LISTED, "data": admins}

    @staticmethod
    def get_admin(db: Session, admin_id: int):
        admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail=AdminMessages.NOT_FOUND)
        return {"message": AdminMessages.FETCHED, "data": admin}

    @staticmethod
    def update_admin(db: Session, admin_id: int, payload: AdminUpdate):
        admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail=AdminMessages.NOT_FOUND)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(admin, field, value)

        db.commit()
        db.refresh(admin)
        return {"message": AdminMessages.UPDATED, "data": admin}

    @staticmethod
    def delete_admin(db: Session, admin_id: int):
        admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail=AdminMessages.NOT_FOUND)

        user = db.query(User).filter(User.user_id == admin.user_id).first()
        if user:
            user.deleted_at = datetime.now(timezone.utc)
            user.status = AccountStatus.suspended

        db.delete(admin)
        db.commit()
        return {"message": AdminMessages.DELETED}
