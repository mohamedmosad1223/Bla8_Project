from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List

from app.models.dawah_request import DawahRequest
from app.models.message import Message
from app.models.enums import RequestStatus, UserRole
from app.models.user import User

class PreacherDashboardController:

    @staticmethod
    def get_dashboard_stats(db: Session, preacher_id: int, user_id: int):
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

        # 3. Response Speed (Line Chart) - Last 6 months
        # Grouping by month
        response_data = db.query(
            func.date_trunc('month', DawahRequest.accepted_at).label('month'),
            # قسّمنا على 3600 للحصول على الساعات بدلاً من الدقائق
            func.avg(func.extract('epoch', DawahRequest.accepted_at - DawahRequest.submission_date) / 3600).label('avg_speed')
        ).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.accepted_at.isnot(None)
        ).group_by('month').order_by('month').all()

        response_speed_chart = [
            {"label": r.month.strftime("%b %Y") if r.month else "Unknown", "value": round(r.avg_speed, 1)} 
            for r in response_data
        ]

        # 4. Activity Chart (Messages over time)
        activity_data = db.query(
            func.date_trunc('day', Message.created_at).label('day'),
            func.count(Message.message_id).label('count')
        ).filter(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        ).group_by('day').order_by('day').limit(30).all()

        activity_chart = [
            {"label": a.day.strftime("%d %b"), "value": a.count} for a in activity_data
        ]

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
