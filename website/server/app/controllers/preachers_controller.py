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
    RequestStatus, NotificationType
)
from app.controllers.notifications_controller import NotificationsController
from app.models.responses import PreacherMessages, UserMessages
from app.schemas import PreacherUpdate, PreacherRegister
from app.models.dawah_request import DawahRequest


from app.auth import get_password_hash, get_current_user
from app.auth import check_role

def _hash_password(password: str) -> str:
    return get_password_hash(password)


class PreachersController:

    @staticmethod
    def register(db: Session, payload: PreacherRegister, current_user: Optional[User] = None):
        # التحقق من وجود الإيميل مسبقاً
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        # تحديد نوع التسجيل والحالة
        # الحالة 1: جمعية بتضيف داعية (رسمي أوتوماتيك)
        if current_user and current_user.role == UserRole.organization:
            if not current_user.organization:
                raise HTTPException(status_code=400, detail="حساب الجمعية غير مكتمل")
            payload.org_id = current_user.organization.org_id
            payload.type = PreacherType.official
            account_status = AccountStatus.active
            approval_status = ApprovalStatus.approved
            is_official = True

        # الحالة 2: أدمن بيضيف داعية
        elif current_user and current_user.role == UserRole.admin:
            is_official = payload.org_id is not None
            if is_official:
                account_status = AccountStatus.active
                approval_status = ApprovalStatus.approved
            else:
                account_status = AccountStatus.pending
                approval_status = ApprovalStatus.pending

        # الحالة 3: تسجيل ذاتي (منفرد) من بره
        else:
            if payload.org_id is not None:
                raise HTTPException(status_code=403, detail="لا يمكنك تحديد جمعية عند التسجل ذاتياً")
            payload.type = PreacherType.volunteer
            is_official = False
            account_status = AccountStatus.pending
            approval_status = ApprovalStatus.pending

        user = User(
            email=payload.email,
            password_hash=_hash_password(payload.password),
            role=UserRole.preacher,
            status=account_status,
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
            approval_status=approval_status,
            status=PreacherStatus.active if account_status == AccountStatus.active else PreacherStatus.suspended
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

        # منطق استرداد الطلبات في حالة الإيقاف
        if payload.status == PreacherStatus.suspended:
            # إعادة كل الطلبات الحالية (in_progress) لتصبح (pending)
            db.query(DawahRequest).filter(
                DawahRequest.assigned_preacher_id == preacher_id,
                DawahRequest.status == RequestStatus.in_progress
            ).update({
                DawahRequest.status: RequestStatus.pending,
                DawahRequest.assigned_preacher_id: None
            })
            
            # تحديث حالة حساب المستخدم المرتبط للإيقاف أيضاً
            if preacher.user:
                preacher.user.status = AccountStatus.suspended

        # في حالة التفعيل مرة أخرى والموافقة
        if (payload.status == PreacherStatus.active or payload.approval_status == ApprovalStatus.approved) and preacher.approval_status == ApprovalStatus.approved:
             if preacher.user:
                preacher.user.status = AccountStatus.active
             NotificationsController.create_notification(
                 db, preacher.user_id, NotificationType.account_approved,
                 "تمت الموافقة على حسابك", "تم تفعيل حسابك كداعية بنجاح، يمكنك الآن البدء في استقبال طلبات الدعوة."
             )
        
        # في حالة الرفض
        elif payload.approval_status == ApprovalStatus.rejected:
            if preacher.user:
                preacher.user.status = AccountStatus.suspended
            NotificationsController.create_notification(
                db, preacher.user_id, NotificationType.account_rejected,
                "تم رفض طلب الانضمام", f"نأسف لإبلاغك بأنه تم رفض طلبك. السبب: {preacher.rejection_reason or 'غير محدد'}"
            )

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
