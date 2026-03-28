from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case

from app.models.user import User
from app.models.organization import Organization
from app.models.preacher import Preacher, PreacherLanguage
from app.models.dawah_request import DawahRequest
from app.models.reference import Country, Language
from app.models.enums import (
    UserRole, AccountStatus, ApprovalStatus, 
    PreacherStatus, RequestStatus, PreacherType
)
from app.schemas.schemas import (
    AdminOrganizationListRead, AdminOrganizationDetailRead,
    AdminPreacherListRead, AdminPreacherDetailRead,
    StatCard, ChartDataPoint, OrganizationRegister
)
from app.auth import get_password_hash

class AdminManagementController:
    
    # ─── Organizations ────────────────────────────────────────────────────────

    @staticmethod
    def list_organizations(
        db: Session, skip: int = 0, limit: int = 50, 
        search: Optional[str] = None,
        approval_status: Optional[ApprovalStatus] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        order_by: str = "latest"
    ):
        query = db.query(Organization).options(joinedload(Organization.user))
        
        # 1. Search (Name/ID)
        if search:
            if search.isdigit():
                 query = query.filter(sa.or_(
                     Organization.org_id == int(search),
                     Organization.organization_name.ilike(f"%{search}%")
                 ))
            else:
                query = query.filter(Organization.organization_name.ilike(f"%{search}%"))

        # 2. Filters
        if approval_status:
            query = query.filter(Organization.approval_status == approval_status)
        if created_after:
            query = query.filter(Organization.created_at >= created_after)
        if created_before:
            query = query.filter(Organization.created_at <= created_before)

        # 3. Sorting
        if order_by == "oldest":
            query = query.order_by(Organization.created_at.asc())
        else:
            query = query.order_by(Organization.created_at.desc())
        
        orgs = query.offset(skip).limit(limit).all()
        
        result = []
        for org in orgs:
            stats = db.query(
                func.count(DawahRequest.request_id).label("total"),
                func.count(case((DawahRequest.status == RequestStatus.converted, 1))).label("converted"),
                func.count(case((DawahRequest.status == RequestStatus.under_persuasion, 1))).label("persuasion"),
                func.count(case((DawahRequest.status == RequestStatus.rejected, 1))).label("rejected")
            ).join(Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id)\
             .filter(Preacher.org_id == org.org_id).first()
            
            preacher_count = db.query(Preacher).filter(Preacher.org_id == org.org_id).count()
            
            result.append(AdminOrganizationListRead(
                org_id=org.org_id,
                organization_name=org.organization_name,
                manager_name=org.manager_name,
                preachers_count=preacher_count,
                total_requests=stats.total or 0,
                converted_count=stats.converted or 0,
                under_persuasion_count=stats.persuasion or 0,
                rejected_count=stats.rejected or 0,
                created_at=org.created_at,
                status=org.user.status if org.user else AccountStatus.active
            ))
        return result

    @staticmethod
    def get_organization_details(db: Session, org_id: int):
        org = db.query(Organization).options(
            joinedload(Organization.user),
            joinedload(Organization.user).joinedload(User.preacher) # for manager info if applicable
        ).filter(Organization.org_id == org_id).first()
        
        if not org:
            raise HTTPException(status_code=404, detail="الجمعية غير موجودة")
        
        country = db.query(Country).filter(Country.country_id == org.country_id).first()
        
        # Stats
        total_preachers = db.query(Preacher).filter(Preacher.org_id == org_id).count()
        
        req_stats = db.query(
            func.count(DawahRequest.request_id).label("total"),
            func.count(case((DawahRequest.status == RequestStatus.converted, 1))).label("converted"),
            func.count(case((DawahRequest.status == RequestStatus.rejected, 1))).label("rejected")
        ).join(Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id)\
         .filter(Preacher.org_id == org_id).first()

        stats_cards = [
            StatCard(title="إجمالي عدد الدعاة", value=total_preachers),
            StatCard(title="إجمالي عدد طلبات الجمعية", value=req_stats.total or 0),
            StatCard(title="من أسلموا", value=req_stats.converted or 0),
            StatCard(title="من رفضوا", value=req_stats.rejected or 0),
        ]

        # Charts
        dist_data = db.query(DawahRequest.status, func.count(DawahRequest.request_id))\
            .join(Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id)\
            .filter(Preacher.org_id == org_id).group_by(DawahRequest.status).all()
        requests_distribution = [ChartDataPoint(label=s.value, value=float(c)) for s, c in dist_data]

        nat_data = db.query(Country.country_name, func.count(DawahRequest.request_id))\
            .join(DawahRequest, Country.country_id == DawahRequest.invited_nationality_id)\
            .join(Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id)\
            .filter(Preacher.org_id == org_id)\
            .group_by(Country.country_name).order_by(func.count(DawahRequest.request_id).desc()).limit(5).all()
        nationalities_distribution = [ChartDataPoint(label=n, value=float(c)) for n, c in nat_data]

        return AdminOrganizationDetailRead(
            org_id=org.org_id,
            organization_name=org.organization_name,
            license_number=org.license_number,
            phone=org.phone,
            email=org.email,
            country=country.country_name if country else "N/A",
            governorate=org.governorate,
            created_at=org.created_at,
            status=org.user.status if org.user else AccountStatus.active,
            manager_name=org.manager_name,
            stats=stats_cards,
            conversion_trends=[], # Placeholder for now
            requests_distribution=requests_distribution,
            nationalities_distribution=nationalities_distribution
        )

    @staticmethod
    def admin_register_organization(db: Session, payload: OrganizationRegister):
        # Direct registration by admin (automatic active/approved)
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail="البريد الإلكتروني مسجل مسبقاً")

        user = User(
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            role=UserRole.organization,
            status=AccountStatus.active,
        )
        db.add(user)
        db.flush()

        org = Organization(
            user_id=user.user_id,
            organization_name=payload.organization_name,
            license_number=payload.license_number,
            license_file=payload.license_file,
            establishment_date=payload.establishment_date,
            country_id=payload.country_id,
            governorate=payload.governorate,
            manager_name=payload.manager_name,
            phone=payload.phone,
            email=payload.org_email,
            approval_status=ApprovalStatus.approved,
            approved_at=datetime.now(timezone.utc)
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        return org

    # ─── Preachers ────────────────────────────────────────────────────────────

    @staticmethod
    def list_preachers(
        db: Session, 
        org_id: Optional[int] = None, 
        skip: int = 0, 
        limit: int = 50, 
        search: Optional[str] = None,
        type: Optional[PreacherType] = None,
        status: Optional[PreacherStatus] = None,
        languages: list[int] = [],
        joined_after: Optional[datetime] = None,
        joined_before: Optional[datetime] = None,
        order_by: str = "latest"
    ):
        query = db.query(Preacher).options(
            joinedload(Preacher.user), 
            joinedload(Preacher.organization),
            joinedload(Preacher.languages).joinedload(PreacherLanguage.preacher)
        )
        
        # 1. Search (Name/ID)
        if search:
            if search.isdigit():
                 query = query.filter(sa.or_(
                     Preacher.preacher_id == int(search),
                     Preacher.full_name.ilike(f"%{search}%")
                 ))
            else:
                query = query.filter(Preacher.full_name.ilike(f"%{search}%"))

        # 2. Filters
        if org_id:
            query = query.filter(Preacher.org_id == org_id)
        if type:
            query = query.filter(Preacher.type == type)
        if status:
            query = query.filter(Preacher.status == status)
        
        # 3. Languages
        if languages:
            query = query.join(PreacherLanguage).filter(PreacherLanguage.language_id.in_(languages))

        # 4. Date Range
        if joined_after:
            query = query.filter(Preacher.created_at >= joined_after)
        if joined_before:
            query = query.filter(Preacher.created_at <= joined_before)

        # 5. Sorting
        if order_by == "oldest":
            query = query.order_by(Preacher.created_at.asc())
        else:
            query = query.order_by(Preacher.created_at.desc())
        
        preachers = query.offset(skip).limit(limit).all()
        
        result = []
        for p in preachers:
            country = db.query(Country).filter(Country.country_id == p.nationality_country_id).first()
            langs = db.query(Language.language_name).join(PreacherLanguage).filter(PreacherLanguage.preacher_id == p.preacher_id).all()
            
            # Decide organization name
            if p.type == PreacherType.volunteer:
                org_display_name = "داعية متعاون"
            else:
                org_display_name = p.organization.organization_name if p.organization else "N/A"
            
            # Total requests count (cases)
            total_cases = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == p.preacher_id).count()
            
            result.append(AdminPreacherListRead(
                preacher_id=p.preacher_id,
                full_name=p.full_name,
                nationality=country.country_name if country else "N/A",
                organization_name=org_display_name,
                total_requests=total_cases,
                created_at=p.created_at,
                languages=[l[0] for l in langs],
                status=p.status
            ))
        return result

    @staticmethod
    def get_preacher_details(db: Session, preacher_id: int):
        p = db.query(Preacher).options(joinedload(Preacher.user), joinedload(Preacher.organization)).filter(Preacher.preacher_id == preacher_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="الداعية غير موجود")
        
        country = db.query(Country).filter(Country.country_id == p.nationality_country_id).first()
        langs = db.query(Language.language_name).join(PreacherLanguage).filter(PreacherLanguage.preacher_id == p.preacher_id).all()
        
        # Stats
        from app.models.preacher import PreacherStatistics
        stats_db = db.query(PreacherStatistics).filter(PreacherStatistics.preacher_id == preacher_id).first()
        
        stats_cards = [
            StatCard(title="إجمالي عدد الطلبات", value=stats_db.total_accepted if stats_db else 0),
            StatCard(title="إجمالي قيد الاقناع", value=stats_db.in_progress_count if stats_db else 0),
            StatCard(title="عدد من أسلموا", value=stats_db.converted_count if stats_db else 0),
            StatCard(title="عدد من رفضوا", value=stats_db.rejected_count if stats_db else 0),
        ]

        # Charts
        country_data = db.query(Country.country_name, func.count(DawahRequest.request_id))\
            .join(DawahRequest, Country.country_id == DawahRequest.invited_nationality_id)\
            .filter(DawahRequest.assigned_preacher_id == preacher_id)\
            .group_by(Country.country_name).all()
        countries_distribution = [ChartDataPoint(label=n, value=float(c)) for n, c in country_data]

        return AdminPreacherDetailRead(
            preacher_id=p.preacher_id,
            full_name=p.full_name,
            email=p.email,
            phone=p.phone,
            languages=[l[0] for l in langs],
            nationality=country.country_name if country else "N/A",
            organization_name=p.organization.organization_name if p.organization else None,
            status=p.status,
            scientific_qualification=p.scientific_qualification,
            gender=p.gender,
            stats=stats_cards,
            countries_distribution=countries_distribution,
            response_speed_chart=[] # Placeholder
        )

    @staticmethod
    def toggle_org_status(db: Session, org_id: int, status: AccountStatus):
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="الجمعية غير موجودة")
        
        if org.user:
            org.user.status = status
            
        # Cascade suspension to all preachers of this organization
        if status == AccountStatus.suspended:
            preachers = db.query(Preacher).filter(Preacher.org_id == org_id).all()
            for p in preachers:
                p.status = PreacherStatus.suspended
                if p.user:
                    p.user.status = AccountStatus.suspended
                    
        db.commit()
        
        msg = "تم تحديث حالة الجمعية بنجاح"
        if status == AccountStatus.suspended:
            msg = "تم توقيف الجمعية وكافة الدعاة التابعين لها بنجاح"
            
        return {"message": msg}

    @staticmethod
    def toggle_preacher_status(db: Session, preacher_id: int, status: PreacherStatus):
        p = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="الداعية غير موجود")
        
        p.status = status
        if p.user:
            p.user.status = AccountStatus.active if status == PreacherStatus.active else AccountStatus.suspended
        db.commit()
        return {"message": "تم تحديث حالة الداعية بنجاح"}
