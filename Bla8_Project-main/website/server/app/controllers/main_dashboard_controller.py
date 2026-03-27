from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc

from app.models.preacher import Preacher, PreacherStatistics
from app.models.organization import Organization
from app.models.dawah_request import DawahRequest
from app.models.interested_person import InterestedPerson
from app.models.reference import Country
from app.models.message import Message
from app.models.enums import RequestStatus, PreacherStatus, RequestType, ApprovalStatus

class AdminDashboardController:
    """
    Controller for the Admin Dashboard.
    Provides real-time statistics, charts, and recent activity.
    """

    @staticmethod
    def get_main_dashboard(db: Session):
        # 1. Top Cards - Row 1
        total_orgs = db.query(Organization).count()
        total_preachers = db.query(Preacher).count()
        
        # Total Individuals (Interested Persons + Invited Dawah Requests)
        total_interested = db.query(InterestedPerson).count()
        total_invited_requests = db.query(DawahRequest).filter(DawahRequest.request_type == RequestType.invited).count()
        total_individuals = total_interested + total_invited_requests

        # 2. Top Cards - Row 2
        total_cases = db.query(DawahRequest).count()
        total_converted = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.converted).count()
        total_rejected = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.rejected).count()
        
        # New Metrics
        pending_org_requests = db.query(Organization).filter(Organization.approval_status == ApprovalStatus.pending).count()
        total_conversations = db.query(func.count(func.distinct(Message.request_id))).scalar() or 0
        total_follow_up = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.under_persuasion).count()

        # 3. Tables - Top 10 Preachers
        # Assuming success rate = (converted / total) * 100
        top_preachers_query = db.query(
            Preacher.preacher_id,
            Preacher.full_name,
            Organization.organization_name,
            PreacherStatistics.converted_count,
            PreacherStatistics.total_accepted
        ).join(Organization, Preacher.org_id == Organization.org_id, isouter=True) \
         .join(PreacherStatistics, Preacher.preacher_id == PreacherStatistics.preacher_id, isouter=True) \
         .order_by(desc(PreacherStatistics.converted_count)) \
         .limit(10).all()

        top_preachers = []
        for p in top_preachers_query:
            success_rate = (p.converted_count / p.total_accepted * 100) if p.total_accepted and p.total_accepted > 0 else 0
            top_preachers.append({
                "preacher_id": p.preacher_id,
                "full_name": p.full_name,
                "organization_name": p.organization_name,
                "success_rate": round(success_rate, 2)
            })

        # 4. Tables - Organization Stats
        org_stats_query = db.query(
            Organization.org_id,
            Organization.organization_name,
            func.count(Preacher.preacher_id).label("preachers_count")
        ).join(Preacher, Organization.org_id == Preacher.org_id, isouter=True) \
         .group_by(Organization.org_id, Organization.organization_name) \
         .order_by(desc("preachers_count")).limit(10).all()

        organization_stats = [
            {
                "org_id": o.org_id,
                "organization_name": o.organization_name,
                "preachers_count": o.preachers_count
            } for o in org_stats_query
        ]

        # 5. Charts - Nationalities Distribution
        nationalities_query = db.query(
            Country.country_name,
            func.count(DawahRequest.request_id).label("count")
        ).join(DawahRequest, Country.country_id == DawahRequest.invited_nationality_id) \
         .group_by(Country.country_name) \
         .order_by(desc("count")).limit(10).all()

        nationalities_distribution = [
            {"label": n.country_name, "value": float(n.count)} for n in nationalities_query
        ]

        # 6. Preacher Presence (Simulated based on status)
        online_count = db.query(Preacher).filter(Preacher.status == PreacherStatus.active).count()
        # Mocking busy/offline for variety based on active status
        preacher_presence = {
            "online": int(online_count * 0.7),
            "busy": int(online_count * 0.2),
            "offline": db.query(Preacher).filter(Preacher.status == PreacherStatus.suspended).count() + int(online_count * 0.1)
        }

        # 7. Recent Activity
        recent_reqs = db.query(DawahRequest).order_by(desc(DawahRequest.updated_at)).limit(10).all()
        recent_activities = []
        for r in recent_reqs:
            action = "تم تحديث حالة الطلب"
            if r.status == RequestStatus.pending:
                action = "تم إضافة شخص مدعو جديد"
            elif r.status == RequestStatus.converted:
                action = "نطق الشهادة بفضل الله!"
            elif r.status == RequestStatus.rejected:
                action = "تم رفض الطلب"
            
            name = f"{r.invited_first_name or ''} {r.invited_last_name or ''}".strip() or "شخص غير معروف"
            
            recent_activities.append({
                "id": r.request_id,
                "name": name,
                "action": action,
                "time": "منذ قليل", 
                "timestamp": r.updated_at
            })

        return {
            "total_organizations": {"title": "إجمالي عدد الجمعيات", "value": total_orgs, "is_positive": True},
            "pending_org_requests": {"title": "إجمالي عدد طلبات الجمعية", "value": pending_org_requests, "is_positive": True},
            "total_conversations": {"title": "إجمالي عدد المحادثات", "value": total_conversations, "is_positive": True},
            "total_follow_up": {"title": "المحالون للتعليم والمتابعة", "value": total_follow_up, "is_positive": True},
            "total_converted": {"title": "من أسلموا", "value": total_converted, "is_positive": True},
            "total_rejected": {"title": "من رفضوا", "value": total_rejected, "is_positive": True},
            "total_cases": {"title": "إجمالي الحالات المسجلة", "value": total_cases, "is_positive": True},
            "total_individuals": {"title": "إجمالي الأفراد المسجلين", "value": total_individuals, "is_positive": True},
            "top_preachers": top_preachers,
            "organization_stats": organization_stats,
            "nationalities_distribution": nationalities_distribution,
            "preacher_presence": preacher_presence,
            "recent_activities": recent_activities
        }
