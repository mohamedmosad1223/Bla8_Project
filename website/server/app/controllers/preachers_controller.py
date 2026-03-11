"""
Preachers Controller — Business logic for Preacher CRUD operations.
"""

import hashlib
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.preacher import Preacher
from app.models.enums import (
    UserRole, AccountStatus,
    PreacherType, PreacherStatus, GenderType, ApprovalStatus,
)
from app.models.responses import PreacherMessages, UserMessages
from app.schemas import PreacherUpdate, PreacherRegister


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class PreachersController:

    @staticmethod
    def register(db: Session, payload: PreacherRegister):
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        user = User(
            email=payload.email,
            password_hash=_hash_password(payload.password),
            role=UserRole.preacher,
            status=AccountStatus.pending,
        )
        db.add(user)
        db.flush()

        preacher = Preacher(
            user_id=user.user_id,
            type=payload.type,
            full_name=payload.full_name,
            phone=payload.phone,
            email=payload.preacher_email,
            gender=payload.gender,
            nationality_country_id=payload.nationality_country_id,
            org_id=payload.org_id,
            identity_number=payload.identity_number,
            scientific_qualification=payload.scientific_qualification,
        )
        db.add(preacher)
        db.commit()
        db.refresh(preacher)
        return {"message": PreacherMessages.REGISTERED, "data": preacher}

    @staticmethod
    def list_preachers(
        db: Session, skip: int, limit: int,
        full_name: Optional[str],
        type: Optional[PreacherType],
        preacher_status: Optional[PreacherStatus],
        gender: Optional[GenderType],
        approval_status: Optional[ApprovalStatus],
        nationality_country_id: Optional[int],
        org_id: Optional[int],
    ):
        q = db.query(Preacher)
        if full_name:
            q = q.filter(Preacher.full_name.ilike(f"%{full_name}%"))
        if type:
            q = q.filter(Preacher.type == type)
        if preacher_status:
            q = q.filter(Preacher.status == preacher_status)
        if gender:
            q = q.filter(Preacher.gender == gender)
        if approval_status:
            q = q.filter(Preacher.approval_status == approval_status)
        if nationality_country_id:
            q = q.filter(Preacher.nationality_country_id == nationality_country_id)
        if org_id:
            q = q.filter(Preacher.org_id == org_id)

        preachers = q.order_by(Preacher.created_at.desc()).offset(skip).limit(limit).all()
        return {"message": PreacherMessages.LISTED, "data": preachers}

    @staticmethod
    def get_preacher(db: Session, preacher_id: int):
        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not preacher:
            raise HTTPException(status_code=404, detail=PreacherMessages.NOT_FOUND)
        return {"message": PreacherMessages.FETCHED, "data": preacher}

    @staticmethod
    def update_preacher(db: Session, preacher_id: int, payload: PreacherUpdate):
        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not preacher:
            raise HTTPException(status_code=404, detail=PreacherMessages.NOT_FOUND)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(preacher, field, value)

        db.commit()
        db.refresh(preacher)
        return {"message": PreacherMessages.UPDATED, "data": preacher}

    @staticmethod
    def delete_preacher(db: Session, preacher_id: int):
        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not preacher:
            raise HTTPException(status_code=404, detail=PreacherMessages.NOT_FOUND)

        if preacher.user_id:
            user = db.query(User).filter(User.user_id == preacher.user_id).first()
            if user:
                user.deleted_at = datetime.now(timezone.utc)
                user.status = AccountStatus.suspended

        db.delete(preacher)
        db.commit()
        return {"message": PreacherMessages.DELETED}
