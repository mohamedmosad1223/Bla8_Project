"""
Muslim Callers Controller — Business logic for MuslimCaller CRUD operations.
"""

import hashlib
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.muslim_caller import MuslimCaller
from app.models.enums import UserRole, AccountStatus
from app.models.responses import MuslimCallerMessages, UserMessages
from app.schemas import MuslimCallerUpdate, MuslimCallerRegister


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class MuslimCallersController:

    @staticmethod
    def register(db: Session, payload: MuslimCallerRegister):
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        user = User(
            email=payload.email,
            password_hash=_hash_password(payload.password),
            role=UserRole.muslim_caller,
            status=AccountStatus.active,
        )
        db.add(user)
        db.flush()

        caller = MuslimCaller(
            user_id=user.user_id,
            full_name=payload.full_name,
            phone=payload.phone,
            nationality_country_id=payload.nationality_country_id,
            gender=payload.gender,
        )
        db.add(caller)
        db.commit()
        db.refresh(caller)
        return {"message": MuslimCallerMessages.REGISTERED, "data": caller}

    @staticmethod
    def list_callers(db: Session, skip: int, limit: int, full_name: str | None):
        q = db.query(MuslimCaller)
        if full_name:
            q = q.filter(MuslimCaller.full_name.ilike(f"%{full_name}%"))
        callers = q.order_by(MuslimCaller.created_at.desc()).offset(skip).limit(limit).all()
        return {"message": MuslimCallerMessages.LISTED, "data": callers}

    @staticmethod
    def get_caller(db: Session, caller_id: int):
        caller = db.query(MuslimCaller).filter(MuslimCaller.caller_id == caller_id).first()
        if not caller:
            raise HTTPException(status_code=404, detail=MuslimCallerMessages.NOT_FOUND)
        return {"message": MuslimCallerMessages.FETCHED, "data": caller}

    @staticmethod
    def update_caller(db: Session, caller_id: int, payload: MuslimCallerUpdate):
        caller = db.query(MuslimCaller).filter(MuslimCaller.caller_id == caller_id).first()
        if not caller:
            raise HTTPException(status_code=404, detail=MuslimCallerMessages.NOT_FOUND)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(caller, field, value)

        db.commit()
        db.refresh(caller)
        return {"message": MuslimCallerMessages.UPDATED, "data": caller}

    @staticmethod
    def delete_caller(db: Session, caller_id: int):
        caller = db.query(MuslimCaller).filter(MuslimCaller.caller_id == caller_id).first()
        if not caller:
            raise HTTPException(status_code=404, detail=MuslimCallerMessages.NOT_FOUND)

        user = db.query(User).filter(User.user_id == caller.user_id).first()
        if user:
            user.deleted_at = datetime.now(timezone.utc)
            user.status = AccountStatus.suspended

        db.delete(caller)
        db.commit()
        return {"message": MuslimCallerMessages.DELETED}
