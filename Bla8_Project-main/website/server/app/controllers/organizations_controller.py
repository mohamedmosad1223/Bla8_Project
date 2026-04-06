"""
Organizations Controller — Business logic for Organization CRUD operations.
"""

from typing import Optional, List, Any
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
    def register(db: Session, payload: OrganizationRegister, license_file: any, admin_user: User | None = None):
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        # حفظ الملف المرفوع
        file_path = save_upload_file(license_file, "organizations/licenses")

        # Determine initial status (Active if created by Admin, Pending otherwise)
        is_admin = admin_user and admin_user.role == UserRole.admin
        
        user = User(
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            role=UserRole.organization,
            status=AccountStatus.active if is_admin else AccountStatus.pending,
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
            approval_status=ApprovalStatus.approved if is_admin else ApprovalStatus.pending,
            approved_by=admin_user.admin.admin_id if is_admin and admin_user.admin else None,
            approved_at=datetime.now(timezone.utc) if is_admin else None
        )
        db.add(org)
        db.flush()

        # إرسال إشعار ترحيبي
        NotificationsController.create_notification(
            db, user.user_id, NotificationType.status_changed,
            "أهلاً بك في منصة بلاغ", "تم استلام طلب الانضمام الخاص بجمعيتكم، وهو حالياً قيد المراجعة من قبل الإدارة."
        )

        db.commit()
        db.refresh(org)
        return {"message": OrganizationMessages.REGISTERED, "data": org}

    @staticmethod
    def list_organizations(
        db: Session, skip: int, limit: int, 
        approval: str | None = None,
        search: Optional[str] = None,
        country_id: Optional[int] = None,
        governorate: Optional[str] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        order_by: str = "latest"
    ):
        from sqlalchemy import func, or_
        from app.models.preacher import Preacher
        from app.models.dawah_request import DawahRequest
        from app.models.enums import RequestStatus

        # Subquery for preachers count per org
        preachers_sub = db.query(
            Preacher.org_id,
            func.count(Preacher.preacher_id).label("preachers_count")
        ).group_by(Preacher.org_id).subquery()

        # Subquery for dawah request stats per org
        stats_sub = db.query(
            Preacher.org_id,
            func.count(DawahRequest.request_id).label("cases_count"),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label("converted_count"),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.in_progress).label("pending_count"),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label("rejected_count")
        ).join(DawahRequest, Preacher.preacher_id == DawahRequest.assigned_preacher_id) \
         .group_by(Preacher.org_id).subquery()

        q = db.query(
            Organization,
            func.coalesce(preachers_sub.c.preachers_count, 0).label("preachers_count"),
            func.coalesce(stats_sub.c.cases_count, 0).label("cases_count"),
            func.coalesce(stats_sub.c.converted_count, 0).label("converted_count"),
            func.coalesce(stats_sub.c.pending_count, 0).label("pending_count"),
            func.coalesce(stats_sub.c.rejected_count, 0).label("rejected_count")
        ).outerjoin(preachers_sub, Organization.org_id == preachers_sub.c.org_id) \
         .outerjoin(stats_sub, Organization.org_id == stats_sub.c.org_id)
        
        # 1. Search (Name/ID/Manager)
        if search:
            if search.isdigit():
                 q = q.filter(or_(
                     Organization.org_id == int(search),
                     Organization.organization_name.ilike(f"%{search}%"),
                     Organization.manager_name.ilike(f"%{search}%")
                 ))
            else:
                q = q.filter(or_(
                    Organization.organization_name.ilike(f"%{search}%"),
                    Organization.manager_name.ilike(f"%{search}%")
                ))

        # 2. Approval Filter
        if approval:
            q = q.filter(Organization.approval_status == approval)

        # 3. Country/Governorate
        if country_id:
            q = q.filter(Organization.country_id == country_id)
        if governorate:
            q = q.filter(Organization.governorate == governorate)
        
        # 3. Date Range
        if created_after:
            q = q.filter(Organization.created_at >= created_after)
        if created_before:
            q = q.filter(Organization.created_at <= created_before)

        # 4. Sorting
        if order_by == "oldest":
            q = q.order_by(Organization.created_at.asc())
        else:
            q = q.order_by(Organization.created_at.desc())

        results = q.offset(skip).limit(limit).all()
        
        data = []
        for row in results:
            org, p_count, c_count, con_count, pen_count, rej_count = row
            # Convert model to dict and add extra fields
            org_dict = {column.name: getattr(org, column.name) for column in org.__table__.columns}
            org_dict["user_id"] = org.user_id
            org_dict["account_status"] = org.user.status.value if org.user else AccountStatus.pending.value
            org_dict["preachers_count"] = p_count
            org_dict["cases_count"] = c_count
            org_dict["converted_count"] = con_count
            org_dict["pending_count"] = pen_count
            org_dict["rejected_count"] = rej_count
            data.append(org_dict)

        return {"message": OrganizationMessages.LISTED, "data": data}

    @staticmethod
    def get_organization(db: Session, org_id: int, trend_granularity: str = "month"):
        from app.models.reference import Country
        from app.controllers.organization_dashboard_controller import OrganizationDashboardController

        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail=OrganizationMessages.NOT_FOUND)
        
        # Get basic stats and trends from dashboard controller
        stats_data = OrganizationDashboardController.get_dashboard_stats(db, org_id, trend_granularity)
        
        # Get country name
        country = db.query(Country).filter(Country.country_id == org.country_id).first()
        
        org_dict = {column.name: getattr(org, column.name) for column in org.__table__.columns}
        org_dict["account_status"] = org.user.status.value if org.user else AccountStatus.pending.value
        org_dict["country_name"] = country.country_name if country else "—"
        
        # Merge stats
        org_dict["preachers_count"] = stats_data["total_preachers"]["value"]
        org_dict["cases_count"] = stats_data["total_beneficiaries"]["value"]
        org_dict["converted_count"] = stats_data["total_converts"]["value"]
        org_dict["pending_count"] = stats_data["active_conversations"]["value"]
        org_dict["rejected_count"] = stats_data["total_rejections"]["value"]
        
        # charts
        org_dict["requests_distribution"] = stats_data["requests_distribution"]
        org_dict["conversion_trends"] = stats_data["conversion_trends"]
        org_dict["governorates_distribution"] = stats_data["top_nationalities"]

        return {"message": OrganizationMessages.FETCHED, "data": org_dict}

    @staticmethod
    def update_organization(db: Session, org_id: int, payload: OrganizationUpdate, admin_user: User | None = None):
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail=OrganizationMessages.NOT_FOUND)

        from app.auth import get_password_hash
        
        for field, value in payload.model_dump(exclude_unset=True).items():
            if field == "is_active":
                if org.user:
                    org.user.status = AccountStatus.active if value else AccountStatus.suspended
                continue
            if field == "password":
                if org.user:
                    org.user.password_hash = get_password_hash(value)
                continue
            if field == "password_confirm":
                continue # Handled by frontend/schema validation
            
            setattr(org, field, value)

        from app.controllers.notifications_controller import NotificationsController
        from app.models.enums import NotificationType

        # مزامنة حالة الحساب وإرسال إشعارات
        if payload.approval_status == ApprovalStatus.approved:
            if org.user:
                org.user.status = AccountStatus.active
            
            # تسجيل بيانات الموافقة
            if admin_user and admin_user.role == UserRole.admin and admin_user.admin:
                org.approved_by = admin_user.admin.admin_id
                org.approved_at = datetime.now(timezone.utc)
            else:
                org.approved_at = datetime.now(timezone.utc)

            NotificationsController.create_notification(
                db, org.user_id, NotificationType.account_approved,
                "تمت الموافقة على حسابك", "مرحباً بك في منصة بلاغ، تم تفعيل حساب الجمعية الخاص بك بنجاح."
            )
        elif payload.approval_status == ApprovalStatus.rejected:
            if org.user:
                org.user.status = AccountStatus.suspended
            
            NotificationsController.create_notification(
                db, org.user_id, NotificationType.account_rejected,
                "تم رفض طلب الانضمام", 
                f"نأسف لإبلاغك بأنه تم رفض طلب الجمعية. السبب: {org.rejection_reason or 'غير محدد'}"
            )

        db.commit()
        db.refresh(org)
        return {"message": OrganizationMessages.UPDATED, "data": org}

    @staticmethod
    def delete_organization(db: Session, org_id: int):
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail=OrganizationMessages.NOT_FOUND)

        # Soft delete organization's user
        user = db.query(User).filter(User.user_id == org.user_id).first()
        if user:
            user.deleted_at = datetime.now(timezone.utc)
            user.status = AccountStatus.suspended

        # Handle related Preachers (soft delete user, physical delete preacher)
        from app.models.preacher import Preacher
        from app.models.dawah_request import DawahRequest
        from app.models.enums import RequestStatus
        preachers = db.query(Preacher).filter(Preacher.org_id == org_id).all()
        for p in preachers:
            if p.user_id:
                p_user = db.query(User).filter(User.user_id == p.user_id).first()
                if p_user:
                    p_user.deleted_at = datetime.now(timezone.utc)
                    p_user.status = AccountStatus.suspended
            
            # Unassign requests
            db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == p.preacher_id).update({
                "assigned_preacher_id": None,
                "status": RequestStatus.pending
            }, synchronize_session=False)

            db.delete(p)

        # Handle AuditLog and ReportMetric nullification
        from app.models.audit_log import AuditLog
        db.query(AuditLog).filter(AuditLog.org_id == org_id).update({"org_id": None}, synchronize_session=False)

        from app.models.report_metric import ReportMetric
        db.query(ReportMetric).filter(ReportMetric.org_id == org_id).update({"org_id": None}, synchronize_session=False)

        db.delete(org)
        db.commit()
        return {"message": OrganizationMessages.DELETED}
