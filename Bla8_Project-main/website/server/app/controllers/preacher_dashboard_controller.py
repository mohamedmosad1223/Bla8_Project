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
        from app.models.preacher import Preacher, PreacherLanguage
        from app.models.reference import Country, Language
        from app.models.organization import Organization

        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not preacher:
             return None # Should be handled by router

        # 0. Preacher Info
        nationality = db.query(Country).filter(Country.country_id == preacher.nationality_country_id).first()
        lang_names = [l.language_name for l in db.query(Language).join(PreacherLanguage).filter(PreacherLanguage.preacher_id == preacher_id).all()]
        org_name = "منفرد"
        if preacher.org_id:
            org = db.query(Organization).filter(Organization.org_id == preacher.org_id).first()
            if org: org_name = org.organization_name
        
        preacher_info = {
            "full_name": preacher.full_name,
            "email": preacher.user.email if preacher.user else preacher.email,
            "phone": preacher.phone,
            "gender": preacher.gender.value if preacher.gender else None,
            "nationality_name": nationality.country_name if nationality else "—",
            "language_names": lang_names,
            "organization_name": org_name,
            "status": preacher.status.value,
            "religion": "إسلام"
        }

        # 1. Basic Counts
        total_requests = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == preacher_id).count()
        converted_count = db.query(DawahRequest).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.status == RequestStatus.converted
        ).count()
        in_progress_count = db.query(DawahRequest).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.status == RequestStatus.in_progress
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
        trunc_unit = 'month' if interval == 'month' else 'day'
        
        first_msg_sq = db.query(
            Message.request_id,
            func.min(Message.created_at).label('first_msg')
        ).filter(Message.sender_id == user_id).group_by(Message.request_id).subquery()

        first_contact_sq = db.query(
            ContactAttempt.request_id,
            func.min(ContactAttempt.clicked_at).label('first_click')
        ).filter(ContactAttempt.preacher_id == preacher_id).group_by(ContactAttempt.request_id).subquery()

        response_data = db.query(
            func.date_trunc(trunc_unit, DawahRequest.accepted_at).label('period'),
            func.avg(
                func.extract('epoch', 
                    func.least(
                        func.coalesce(first_msg_sq.c.first_msg, sa.literal(datetime(9999, 12, 31, tzinfo=timezone.utc))),
                        func.coalesce(first_contact_sq.c.first_click, sa.literal(datetime(9999, 12, 31, tzinfo=timezone.utc)))
                    ) - DawahRequest.accepted_at
                ) / 60
            ).label('avg_speed')
        ).outerjoin(first_msg_sq, DawahRequest.request_id == first_msg_sq.c.request_id
        ).outerjoin(first_contact_sq, DawahRequest.request_id == first_contact_sq.c.request_id
        ).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.accepted_at.isnot(None),
            or_(first_msg_sq.c.request_id.isnot(None), first_contact_sq.c.request_id.isnot(None))
        ).group_by('period').order_by('period').all()

        raw_map = {r.period.date(): round(r.avg_speed, 1) for r in response_data if r.period}
        
        final_chart = []
        now_dt = datetime.now(timezone.utc)
        if interval == 'day':
            for i in range(6, -1, -1):
                d = (now_dt - timedelta(days=i)).date()
                final_chart.append({"name": d.strftime("%d %b"), "time": raw_map.get(d, 0)})
        else:
            for i in range(5, -1, -1):
                first_of_this_month = now_dt.replace(day=1)
                m_dt = first_of_this_month - timedelta(days=i*30) 
                m_dt = m_dt.replace(day=1)
                d = m_dt.date()
                found_val = 0
                for rd, rv in raw_map.items():
                    if rd.year == d.year and rd.month == d.month:
                        found_val = rv
                        break
                final_chart.append({"name": d.strftime("%b %Y"), "time": found_val})

        response_speed_chart = final_chart

        # 4. Activity Chart
        activity_data = db.query(
            func.date_trunc('day', Message.created_at).label('day'),
            func.count(Message.message_id).label('count')
        ).filter(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        ).group_by('day').order_by('day').limit(30).all()

        activity_raw_map = {a.day.date(): a.count for a in activity_data}
        activity_chart_filled = []
        for i in range(6, -1, -1):
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

        # Determine date ranges for this month vs last month
        now = datetime.now(timezone.utc)
        start_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_last_month = (start_this_month - timedelta(days=1)).replace(day=1)
        end_last_month = start_this_month

        def get_stat_with_trend(base_query, date_field, title):
            # Total count
            total = base_query.count()
            
            # This month vs Last month
            this_month = base_query.filter(date_field >= start_this_month).count()
            last_month = base_query.filter(date_field >= start_last_month, date_field < end_last_month).count()
            
            change = 0.0
            is_positive = True
            if last_month > 0:
                change = round(((this_month - last_month) / last_month) * 100, 1)
                is_positive = change >= 0
            elif this_month > 0:
                change = 100.0
                is_positive = True
                
            return {
                "title": title,
                "value": total,
                "change_percentage": abs(change),
                "is_positive": is_positive
            }

        # Sub-queries for specific statuses
        total_q = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == preacher_id)
        converted_q = total_q.filter(DawahRequest.status == RequestStatus.converted)
        in_progress_q = total_q.filter(DawahRequest.status == RequestStatus.in_progress)
        rejected_q = total_q.filter(DawahRequest.status == RequestStatus.rejected)

        return {
            "preacher_info": preacher_info,
            "total_requests": get_stat_with_trend(total_q, DawahRequest.created_at, "إجمالي الطلبات"),
            "converted_count": get_stat_with_trend(converted_q, DawahRequest.updated_at, "عدد من أسلموا"),
            "in_progress_count": get_stat_with_trend(in_progress_q, DawahRequest.updated_at, "إجمالي قيد الاقتناع"),
            "rejected_count": get_stat_with_trend(rejected_q, DawahRequest.updated_at, "عدد من رفضوا"),
            "response_speed_chart": response_speed_chart,
            "requests_by_status": requests_by_status,
            "follow_up_24h_rate": round(follow_up_24h_rate, 1),
            "ai_suggestions_rate": 0.0,
            "governorates_distribution": governorates_distribution,
            "countries_distribution": countries_distribution,
            "activity_chart": activity_chart
        }
