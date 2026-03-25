from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List

from app.models.dawah_request import DawahRequest
from app.models.preacher import Preacher
from app.models.message import Message
from app.models.enums import RequestStatus, UserRole
from app.models.user import User
from app.models.reference import Country  # kept for future use

class OrganizationDashboardController:

    @staticmethod
    def get_dashboard_stats(db: Session, org_id: int):
        # Base query for requests belonging to this org
        org_requests_query = db.query(DawahRequest).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id)

        # 1. Top Stats (8 Cards)
        total_preachers = db.query(Preacher).filter(Preacher.org_id == org_id).count()
        
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        new_requests_today = org_requests_query.filter(DawahRequest.created_at >= today_start).count()
        
        active_conversations = org_requests_query.filter(DawahRequest.status == RequestStatus.in_progress).count()
        
        total_beneficiaries = org_requests_query.count()
        
        total_messages = db.query(Message).join(
            DawahRequest, Message.request_id == DawahRequest.request_id
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id).count()
        
        total_converts = org_requests_query.filter(DawahRequest.status == RequestStatus.converted).count()
        
        total_rejections = org_requests_query.filter(DawahRequest.status == RequestStatus.rejected).count()
        
        # Needs Followup (Dummy logic: Preachers who haven't accepted a request in 7 days or have pending alerts)
        needs_followup_count = org_requests_query.filter(
            DawahRequest.status == RequestStatus.in_progress,
            DawahRequest.alert_42h_sent_at.isnot(None)
        ).count()

        # 2. Kuwait Governorates Distribution (always return all 6, 0 if no data)
        KUWAIT_GOVERNORATES = [
            'محافظة العاصمة',
            'محافظة الأحمدي',
            'محافظة الفروانية',
            'محافظة حولي',
            'محافظة الجهراء',
            'محافظة مبارك الكبير',
        ]

        # جيب عدد الطلبات لكل محافظة موجودة في الـ DB
        gov_data = db.query(
            DawahRequest.governorate, func.count(DawahRequest.request_id)
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(
            Preacher.org_id == org_id,
            DawahRequest.governorate.in_(KUWAIT_GOVERNORATES)
        ).group_by(DawahRequest.governorate).all()

        gov_map = {gov: count for gov, count in gov_data}

        # دايماً ارجع الست محافظات حتى لو قيمتهم صفر
        top_nationalities = [
            {"label": gov, "value": gov_map.get(gov, 0)}
            for gov in KUWAIT_GOVERNORATES
        ]

        # 3. Requests Distribution (Donut Chart)
        dist_data = db.query(
            DawahRequest.status, func.count(DawahRequest.request_id)
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id).group_by(DawahRequest.status).all()
        
        requests_distribution = [{"label": s.value, "value": count} for s, count in dist_data]

        # 4. Conversion Trends (Bar Chart by month)
        trend_data = db.query(
            func.date_trunc('month', DawahRequest.updated_at).label('month'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label('rejects')
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id).group_by('month').order_by('month').all()

        # Formatting for frontend (simplified)
        conversion_trends = []
        for t in trend_data:
            month_label = t.month.strftime("%b %Y")
            conversion_trends.append({"label": f"{month_label} - Converts", "value": t.converts})
            conversion_trends.append({"label": f"{month_label} - Rejects", "value": t.rejects})

        return {
            "total_preachers": {"title": "إجمالي عدد الدعاة", "value": total_preachers, "change_percentage": 0.0, "is_positive": True},
            "new_requests_today": {"title": "عدد المحادثات الجديدة", "value": new_requests_today, "change_percentage": 0.0, "is_positive": True},
            "active_conversations": {"title": "عدد المحادثات المفتوحة", "value": active_conversations, "change_percentage": 0.0, "is_positive": True},
            "total_beneficiaries": {"title": "عدد المستفيدين", "value": total_beneficiaries, "change_percentage": 0.0, "is_positive": True},
            "needs_followup_count": {"title": "المحتاجون للمتابعة", "value": needs_followup_count, "change_percentage": 0.0, "is_positive": False},
            "total_messages": {"title": "إجمالي عدد المحادثات", "value": total_messages, "change_percentage": 0.0, "is_positive": True},
            "total_converts": {"title": "من أسلموا", "value": total_converts, "change_percentage": 0.0, "is_positive": True},
            "total_rejections": {"title": "من رفضوا", "value": total_rejections, "change_percentage": 0.0, "is_positive": False},
            "top_nationalities": top_nationalities,
            "requests_distribution": requests_distribution,
            "conversion_trends": conversion_trends
        }
