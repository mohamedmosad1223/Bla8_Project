from datetime import datetime, timedelta, timezone
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List

from app.models.dawah_request import DawahRequest, ContactAttempt
from app.models.message import Message
from app.models.enums import RequestStatus, UserRole
from app.models.user import User

class PreacherDashboardController:

    @staticmethod
    def get_dashboard_stats(db: Session, preacher_id: int, user_id: int, interval: str = "month"):
        # 1. Basic Counts
        total_requests = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == preacher_id).count()
        converted_count = db.query(DawahRequest).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.status == RequestStatus.converted
        ).count()
        engagement_count = db.query(Message).filter(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        ).count()
        rejected_count = db.query(DawahRequest).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.status == RequestStatus.rejected
        ).count()

        # 2. Requests by Status (Donut Chart)
        status_counts = db.query(
            DawahRequest.status, func.count(DawahRequest.request_id)
        ).filter(DawahRequest.assigned_preacher_id == preacher_id).group_by(DawahRequest.status).all()
        
        requests_by_status = [
            {"label": s.value, "value": count} for s, count in status_counts
        ]

        # 3. Response Speed (Line Chart)
        # Grouping by interval (month or day)
        trunc_unit = 'month' if interval == 'month' else 'day'
        label_format = "%b %Y" if interval == 'month' else "%d %b"
        
        # We want to measure the time *after* the preacher accepted the request until their first action.
        # First Action = First Message or First Contact Click.
        
        # Subquery for first message per request by this preacher
        first_msg_sq = db.query(
            Message.request_id,
            func.min(Message.created_at).label('first_msg')
        ).filter(Message.sender_id == user_id).group_by(Message.request_id).subquery()

        # Subquery for first contact click per request by this preacher
        first_contact_sq = db.query(
            ContactAttempt.request_id,
            func.min(ContactAttempt.clicked_at).label('first_click')
        ).filter(ContactAttempt.preacher_id == preacher_id).group_by(ContactAttempt.request_id).subquery()

        # Final query: (Least of first_msg, first_click) - accepted_at
        response_data = db.query(
            func.date_trunc(trunc_unit, DawahRequest.accepted_at).label('period'),
            func.avg(
                func.extract('epoch', 
                    func.least(
                        func.coalesce(first_msg_sq.c.first_msg, sa.literal(datetime(9999, 12, 31, tzinfo=timezone.utc))),
                        func.coalesce(first_contact_sq.c.first_click, sa.literal(datetime(9999, 12, 31, tzinfo=timezone.utc)))
                    ) - DawahRequest.accepted_at
                ) / 3600
            ).label('avg_speed')
        ).outerjoin(first_msg_sq, DawahRequest.request_id == first_msg_sq.c.request_id
        ).outerjoin(first_contact_sq, DawahRequest.request_id == first_contact_sq.c.request_id
        ).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.accepted_at.isnot(None),
            # Only include requests that have actually been responded to
            or_(first_msg_sq.c.request_id.isnot(None), first_contact_sq.c.request_id.isnot(None))
        ).group_by('period').order_by('period').all()

        # Build final chart data with gap filling
        raw_map = {r.period.date(): round(r.avg_speed, 1) for r in response_data if r.period}
        
        final_chart = []
        now_dt = datetime.now(timezone.utc)
        if interval == 'day':
            # Last 7 days
            for i in range(6, -1, -1):
                d = (now_dt - timedelta(days=i)).date()
                final_chart.append({"label": d.strftime("%d %b"), "value": raw_map.get(d, 0)})
        else:
            # Last 6 months
            for i in range(5, -1, -1):
                # Approximation of month start
                first_of_this_month = now_dt.replace(day=1)
                m_dt = first_of_this_month - timedelta(days=i*30) # Rough, but good enough for labels
                m_dt = m_dt.replace(day=1)
                d = m_dt.date()
                # Find matching month in raw_map (by year and month)
                found_val = 0
                for rd, rv in raw_map.items():
                    if rd.year == d.year and rd.month == d.month:
                        found_val = rv
                        break
                final_chart.append({"label": d.strftime("%b %Y"), "value": found_val})

        response_speed_chart = final_chart

        # 4. Activity Chart (Messages over time)
        activity_data = db.query(
            func.date_trunc('day', Message.created_at).label('day'),
            func.count(Message.message_id).label('count')
        ).filter(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        ).group_by('day').order_by('day').limit(30).all()

        # Gap filling for activity chart (last 7 days)
        activity_raw_map = {a.day.date(): a.count for a in activity_data}
        activity_chart_filled = []
        for i in range(6, -1, -1): # Last 7 days
            d = (now_dt - timedelta(days=i)).date()
            activity_chart_filled.append({"label": d.strftime("%d %b"), "value": activity_raw_map.get(d, 0)})
        activity_chart = activity_chart_filled

        # 5. Governorates Distribution
        gov_data = db.query(
            DawahRequest.governorate, func.count(DawahRequest.request_id)
        ).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.governorate.isnot(None)
        ).group_by(DawahRequest.governorate).all()

        governorates_distribution = [
            {"label": g, "value": count} for g, count in gov_data
        ]

        # 6. Countries Distribution
        from app.models.reference import Country
        country_data = db.query(
            Country.country_name, func.count(DawahRequest.request_id)
        ).join(
            Country, DawahRequest.invited_nationality_id == Country.country_id
        ).filter(
            DawahRequest.assigned_preacher_id == preacher_id
        ).group_by(Country.country_name).all()

        countries_distribution = [
            {"label": c, "value": count} for c, count in country_data
        ]

        # 7. Follow-up 24h Rate
        # Percent of requests where accepted_at - submission_date <= 24h
        total_assigned = db.query(DawahRequest).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.accepted_at.isnot(None)
        ).count()
        
        within_24h = db.query(DawahRequest).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.accepted_at.isnot(None),
            (DawahRequest.accepted_at - DawahRequest.submission_date) <= timedelta(hours=24)
        ).count()
        
        follow_up_24h_rate = (within_24h / total_assigned * 100) if total_assigned > 0 else 0

        # AI Suggestions (Dummy for now, as AI logic isn't fully in DB yet)
        ai_suggestions_rate = 50.0 # Standard placeholder

        return {
            "total_requests": {"title": "إجمالي الطلبات", "value": total_requests, "change_percentage": 10.5, "is_positive": True},
            "converted_count": {"title": "عدد من أسلموا", "value": converted_count, "change_percentage": 5.2, "is_positive": True},
            "engagement_count": {"title": "إجمالي الرسائل", "value": engagement_count, "change_percentage": 12.0, "is_positive": True},
            "rejected_count": {"title": "عدد من رفضوا", "value": rejected_count, "change_percentage": -2.1, "is_positive": False},
            "response_speed_chart": response_speed_chart,
            "requests_by_status": requests_by_status,
            "follow_up_24h_rate": round(follow_up_24h_rate, 1),
            "ai_suggestions_rate": 0.0,
            "governorates_distribution": governorates_distribution,
            "countries_distribution": countries_distribution,
            "activity_chart": activity_chart
        }
