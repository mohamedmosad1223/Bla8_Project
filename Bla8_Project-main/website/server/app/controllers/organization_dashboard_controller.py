from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List

from app.models.dawah_request import DawahRequest
from app.models.preacher import Preacher
from app.models.organization import Organization
from app.models.message import Message
from app.models.enums import RequestStatus, UserRole
from app.models.user import User
from app.models.reference import Country  # kept for future use

class OrganizationDashboardController:

    @staticmethod
    def get_dashboard_stats(db: Session, org_id: int, trend_granularity: str = "monthly"):
        # Base query for requests belonging to this org
        org_requests_query = db.query(DawahRequest).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id)

        # 1. Top Stats (8 Cards)
        # Show total preachers count belonging to this org
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

        # 2. Invited people distribution by nationality (world map source)
        nationality_data = db.query(
            Country.country_name, func.count(DawahRequest.request_id)
        ).join(
            DawahRequest, Country.country_id == DawahRequest.invited_nationality_id
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(
            Preacher.org_id == org_id
        ).group_by(Country.country_name).order_by(
            func.count(DawahRequest.request_id).desc()
        ).all()

        top_nationalities = [{"label": n, "value": count} for n, count in nationality_data]

        # 3. Requests Distribution (Donut Chart)
        dist_data = db.query(
            DawahRequest.status, func.count(DawahRequest.request_id)
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id).group_by(DawahRequest.status).all()
        
        requests_distribution = [{"label": s.value, "value": count} for s, count in dist_data]

        # 4. Conversion Trends (Bar Chart)
        now = datetime.now()
        normalized_granularity = (trend_granularity or "monthly").lower()
        granularity = "day" if normalized_granularity in ["daily", "day"] else "month"
        date_format = "%d %b %Y" if granularity == "day" else "%b %Y"

        trend_dates = []
        if granularity == 'day':
            start_range = (now - timedelta(days=13)).replace(hour=0, minute=0, second=0, microsecond=0)
            curr = start_range
            while curr <= now:
                trend_dates.append(curr)
                curr += timedelta(days=1)
        else:
            curr = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            for _ in range(6):
                trend_dates.insert(0, curr)
                if curr.month == 1: curr = curr.replace(year=curr.year-1, month=12)
                else: curr = curr.replace(month=curr.month-1)

        trend_data = db.query(
            func.date_trunc(granularity, DawahRequest.updated_at).label('bucket'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label('rejects')
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id).group_by('bucket').order_by('bucket').all()

        trend_results = {r.bucket.replace(tzinfo=None) if r.bucket else None: r for r in trend_data}

        conversion_trends = []
        for dt in trend_dates:
            key = dt.replace(tzinfo=None)
            res = trend_results.get(key)
            formatted_date = dt.strftime(date_format)
            conversion_trends.append({"label": f"{formatted_date} - Converts", "value": res.converts if res else 0})
            conversion_trends.append({"label": f"{formatted_date} - Rejects", "value": res.rejects if res else 0})

        return {
            "total_preachers": {"title": "إجمالي عدد الدعاة", "value": total_preachers, "change_percentage": 0.0, "is_positive": True},
            "new_requests_today": {"title": "عدد المحادثات الجديدة", "value": new_requests_today, "change_percentage": 0.0, "is_positive": True},
            "active_conversations": {"title": "عدد المحادثات المفتوحة", "value": active_conversations, "change_percentage": 0.0, "is_positive": True},
            "total_beneficiaries": {"title": "عدد المستفيدين", "value": total_beneficiaries, "change_percentage": 0.0, "is_positive": True},
            "needs_followup_count": {"title": "المحالون للتعليم والمتابعة", "value": needs_followup_count, "change_percentage": 0.0, "is_positive": False},
            "total_messages": {"title": "إجمالي عدد المحادثات", "value": total_messages, "change_percentage": 0.0, "is_positive": True},
            "total_converts": {"title": "من أسلموا", "value": total_converts, "change_percentage": 0.0, "is_positive": True},
            "total_rejections": {"title": "من رفضوا", "value": total_rejections, "change_percentage": 0.0, "is_positive": False},
            "top_nationalities": top_nationalities,
            "requests_distribution": requests_distribution,
            "conversion_trends": conversion_trends
        }
