"""
Organizations Controller — Business logic for Organization CRUD operations.
"""

import hashlib
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.organization import Organization
from app.models.responses import OrganizationMessages, UserMessages
from app.controllers.notifications_controller import NotificationsController
from app.models.enums import UserRole, AccountStatus, ApprovalStatus, NotificationType
from app.auth import get_password_hash
from app.schemas import OrganizationRegister, OrganizationUpdate
from app.utils.file_handler import save_upload_file

class OrganizationsController:

    @staticmethod
    def register(db: Session, payload: OrganizationRegister, license_file: any):
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        # حفظ الملف المرفوع
        file_path = save_upload_file(license_file, "organizations/licenses")

        user = User(
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            role=UserRole.organization,
            status=AccountStatus.pending,
        )
        db.add(user)
        db.flush()

        org = Organization(
            user_id=user.user_id,
            organization_name=payload.organization_name,
            license_number=payload.license_number,
            license_file=file_path,
            establishment_date=payload.establishment_date,
            country_id=payload.country_id,
            governorate=payload.governorate,
            manager_name=payload.manager_name,
            phone=payload.phone,
            email=payload.org_email,
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        return {"message": OrganizationMessages.REGISTERED, "data": org}

    @staticmethod
    def list_organizations(db: Session, skip: int, limit: int, approval: str | None):
        q = db.query(Organization)
        if approval:
            q = q.filter(Organization.approval_status == approval)
        orgs = q.order_by(Organization.created_at.desc()).offset(skip).limit(limit).all()
        return {"message": OrganizationMessages.LISTED, "data": orgs}

    @staticmethod
    def get_organization(db: Session, org_id: int):
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail=OrganizationMessages.NOT_FOUND)
        return {"message": OrganizationMessages.FETCHED, "data": org}

    @staticmethod
    def update_organization(db: Session, org_id: int, payload: OrganizationUpdate):
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail=OrganizationMessages.NOT_FOUND)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(org, field, value)

        # مزامنة حالة الحساب وإرسال إشعارات
        if payload.approval_status == ApprovalStatus.approved:
            if org.user:
                org.user.status = AccountStatus.active
            NotificationsController.create_notification(
                db, org.user_id, NotificationType.account_approved,
                "تمت الموافقة على حسابك", "مرحباً بك في منصة بلاغ، تم تفعيل حساب الجمعية الخاص بك بنجاح."
            )
        elif payload.approval_status == ApprovalStatus.rejected:
            if org.user:
                org.user.status = AccountStatus.suspended
            NotificationsController.create_notification(
                db, org.user_id, NotificationType.account_rejected,
                "تم رفض طلب الانضمام", f"نأسف لإبلاغك بأنه تم رفض طلبك. السبب: {org.rejection_reason or 'غير محدد'}"
            )

        db.commit()
        db.refresh(org)
        return {"message": OrganizationMessages.UPDATED, "data": org}

    @staticmethod
    def delete_organization(db: Session, org_id: int):
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail=OrganizationMessages.NOT_FOUND)

        user = db.query(User).filter(User.user_id == org.user_id).first()
        if user:
            user.deleted_at = datetime.now(timezone.utc)
            user.status = AccountStatus.suspended

        db.delete(org)
        db.commit()
        return {"message": OrganizationMessages.DELETED}
