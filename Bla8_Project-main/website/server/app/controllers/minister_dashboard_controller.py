from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from app.models.user import User
from app.models.preacher import Preacher, PreacherLanguage
from app.models.organization import Organization
from app.models.dawah_request import DawahRequest
from app.models.message import Message
from app.models.interested_person import InterestedPerson
from app.models.reference import Country, Language
from app.models.enums import RequestStatus, PreacherStatus, RequestType, AccountStatus
from typing import List, Optional

class MinisterDashboardController:
    """
    Controller for the Minister Dashboard.
    Provides high-level statistics and summaries for the Minister of Endowments.
    """

    @staticmethod
    def get_dashboard_stats(db: Session):
        # 1. Total Organizations (الجمعيات)
        total_organizations = db.query(Organization).count()

        # 2. Total Organization Requests
        # Assuming this refers to total dawah requests handled by organizations
        total_org_requests = db.query(DawahRequest).count()

        # 3. Total Conversations (Messages)
        total_conversations = db.query(Message).count()

        # 4. Referred for Education and Follow-up (Placeholder logic based on a specific status if exists)
        # For now, let's use a count of requests that are 'in_progress' or similar
        referred_count = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.in_progress).count()

        # 5. Converted (أسلم)
        total_converted = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.converted).count()

        # 6. Rejected (رفض)
        total_rejected = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.rejected).count()

        # 6.5 Under Persuasion (قيد الإقناع)
        total_under_persuasion = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.under_persuasion).count()

        # 7. Total Cases (إجمالي الحالات المسجلة)
        total_cases = db.query(DawahRequest).count()

        # 8. Total Individuals (Interested Persons + Invited Dawah Requests)
        total_interested = db.query(InterestedPerson).count()
        total_invited_requests = db.query(DawahRequest).filter(DawahRequest.request_type == RequestType.invited).count()
        total_individuals = total_interested + total_invited_requests

        # 9. Governorate Distribution
        # Note: Depending on where governorate is stored (e.g., in Preacher or Organization or DawahRequest)
        # Let's assume we want to see dawah requests by governorate (invited_city or similar)
        # If governorate_id is available, we use it.
        governorate_stats = db.query(
            DawahRequest.governorate, # Placeholder for governorate/city
            func.count(DawahRequest.request_id).label("count")
        ).group_by(DawahRequest.governorate).order_by(desc("count")).limit(10).all()

        governorates = [
            {"name": g.governorate or "غير محدد", "value": g.count} for g in governorate_stats
        ]

        # 10. Request Distribution (Filtered to 3 statuses)
        dist_data = db.query(
            DawahRequest.status, func.count(DawahRequest.request_id)
        ).filter(DawahRequest.status.in_([RequestStatus.converted, RequestStatus.rejected, RequestStatus.under_persuasion])).group_by(DawahRequest.status).all()
        requests_distribution = [{"label": s.value, "value": count} for s, count in dist_data]
        
        # If no data for specific statuses, ensure they are at least represented if expected by frontend
        # (Though frontend mapping should handle it)

        # 11. Conversion Trends
        trend_data = db.query(
            func.date_trunc('month', DawahRequest.updated_at).label('month'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label('rejects')
        ).group_by('month').order_by('month').all()

        conversion_trends = []
        for t in trend_data:
            if t.month:
                month_label = t.month.strftime("%b %Y")
                conversion_trends.append({"label": f"{month_label} - Converts", "value": t.converts})
                conversion_trends.append({"label": f"{month_label} - Rejects", "value": t.rejects})

        return {
            "top_cards": [
                {"title": "إجمالي عدد الجمعيات", "value": total_organizations, "icon": "organizations"},
                {"title": "إجمالي عدد طلبات الجمعية", "value": total_org_requests, "icon": "requests"},
                {"title": "إجمالي عدد المحادثات", "value": total_conversations, "icon": "messages"},
                {"title": "المحالون للتعليم والمتابعة", "value": referred_count, "icon": "referrals"},
                {"title": "أسلم", "value": total_converted, "icon": "converted"},
                {"title": "رفض", "value": total_rejected, "icon": "rejected"},
                {"title": "إجمالي الحالات المسجلة", "value": total_cases, "icon": "cases"},
                {"title": "إجمالي الأفراد المسجلين", "value": total_individuals, "icon": "individuals"},
            ],
            "governorates": governorates,
            "requests_summary": {
                "total": total_org_requests,
                "converted": total_converted,
                "under_persuasion": total_under_persuasion,
                "rejected": total_rejected
            },
            "requests_distribution": requests_distribution,
            "conversion_trends": conversion_trends
        }

    @staticmethod
    def get_organization_details(db: Session, org_id: int):
        """
        جلب تفاصيل شاملة لجمعية معينة (بيانات الجمعية + إحصائيات الأداء).
        """
        is_volunteers_view = org_id == 0
        org = None if is_volunteers_view else db.query(Organization).filter(Organization.org_id == org_id).first()
        if not is_volunteers_view and not org:
            return None

        org_filter = Preacher.org_id.is_(None) if is_volunteers_view else (Preacher.org_id == org_id)

        # 1. Base query for requests belonging to this org
        org_requests_query = db.query(DawahRequest).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(org_filter)

        # 2. Performance Stats (Cards)
        total_preachers = db.query(Preacher).filter(org_filter).count()
        total_org_requests = org_requests_query.count()
        total_converts = org_requests_query.filter(DawahRequest.status == RequestStatus.converted).count()
        total_rejections = org_requests_query.filter(DawahRequest.status == RequestStatus.rejected).count()
        total_persuasion = org_requests_query.filter(DawahRequest.status == RequestStatus.under_persuasion).count()
        
        # 3. Request Distribution (Donut Chart) - Filtered
        dist_data = db.query(
            DawahRequest.status, func.count(DawahRequest.request_id)
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(
            DawahRequest.status.in_([RequestStatus.converted, RequestStatus.rejected, RequestStatus.under_persuasion]),
            org_filter
        ).group_by(DawahRequest.status).all()
        requests_distribution = [{"label": s.value, "value": count} for s, count in dist_data]

        # 4. Conversion Trends (Monthly Bar Chart)
        trend_data = db.query(
            func.date_trunc('month', DawahRequest.updated_at).label('month'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label('rejects')
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(org_filter).group_by('month').order_by('month').all()

        conversion_trends = []
        for t in trend_data:
            month_label = t.month.strftime("%b %Y")
            conversion_trends.append({"month": month_label, "converts": t.converts, "rejects": t.rejects})

        # 5. Nationalities (Global distribution for this org - Map/Bar Chart)
        nationality_data = db.query(
            Country.country_name, func.count(DawahRequest.request_id)
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).join(
            Country, DawahRequest.invited_nationality_id == Country.country_id
        ).filter(org_filter).group_by(Country.country_name).order_by(func.count(DawahRequest.request_id).desc()).limit(7).all()

        nationalities = [{"label": c, "value": count} for c, count in nationality_data]

        # 6. Detailed Status Summary
        total_in_progress = org_requests_query.filter(DawahRequest.status == RequestStatus.in_progress).count()

        return {
            "organization_info": {
                "name": "الدعاة المتطوعين" if is_volunteers_view else org.organization_name,
                "license_number": "-" if is_volunteers_view else org.license_number,
                "email": "-" if is_volunteers_view else org.email,
                "phone": "-" if is_volunteers_view else org.phone,
                "governorate": "عام" if is_volunteers_view else org.governorate,
                "manager_name": "غير متوفر" if is_volunteers_view else org.manager_name,
                "status": "مفعل" # Fixed status for now based on image
            },
            "performance_stats": [
                {"title": "إجمالي عدد الدعاة", "value": total_preachers, "icon": "preachers"},
                {"title": "إجمالي عدد طلبات الجمعية", "value": total_org_requests, "icon": "requests"},
                {"title": "أسلم", "value": total_converts, "icon": "converted"},
                {"title": "رفض", "value": total_rejections, "icon": "rejected"},
            ],
            "charts": {
                "requests_distribution": requests_distribution,
                "conversion_trends": conversion_trends,
                "nationalities": nationalities
            },
            "requests_summary": {
                "total": total_org_requests,
                "converted": total_converts,
                "under_persuasion": total_persuasion,
                "rejected": total_rejections
            }
        }

    @staticmethod
    def get_organization_preachers(
        db: Session, 
        org_id: int, 
        search: Optional[str] = None,
        nationality_id: Optional[int] = None,
        language_id: Optional[int] = None,
        status: Optional[str] = None,
        joining_date: Optional[str] = None
    ):
        """
        جلب قائمة الدعاة لجمعية معينة مع فلاتر (البحث، الجنسية، اللغة، الحالة، تاريخ الانضمام).
        """
        org_filter = Preacher.org_id.is_(None) if org_id == 0 else (Preacher.org_id == org_id)
        query = db.query(Preacher).join(User, Preacher.user_id == User.user_id).filter(org_filter)

        if search:
            query = query.filter(Preacher.full_name.ilike(f"%{search}%"))
        
        if nationality_id:
            query = query.filter(Preacher.nationality_country_id == nationality_id)
        
        if language_id:
            query = query.filter(Preacher.languages.any(PreacherLanguage.language_id == language_id))
        
        if status:
            query = query.filter(User.status == status)
        
        if joining_date:
            # Simple date comparison (assuming ISO format YYYY-MM-DD or similar)
            query = query.filter(func.date(Preacher.created_at) == joining_date)

        preachers = query.all()
        results = []

        for p in preachers:
            results.append({
                "preacher_id": p.preacher_id,
                "full_name": p.full_name,
                "nationality": db.query(Country).filter(Country.country_id == p.nationality_country_id).first().country_name if p.nationality_country_id else "غير محدد",
                "languages": [db.query(Language).filter(Language.language_id == l.language_id).first().language_name for l in p.languages],
                "joining_date": p.created_at.strftime("%d/%m/%Y %I:%M %p"),
                "status": p.user.status.value,
                "phone": p.phone
            })
        
        return results

    # Removed toggle_preacher_status to enforce read-only role for the minister

    @staticmethod
    def get_preacher_details(db: Session, preacher_id: int, trend_granularity: str = "monthly"):
        """
        جلب تفاصيل شاملة لداعية معين (بيانات الملف الشخصي + إحصائيات الأداء).
        """
        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not preacher:
            return None

        # 1. Performance Stats
        stats = preacher.statistics
        total_requests = (stats.total_accepted + stats.no_response_count) if stats else db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == preacher_id).count()
        
        # If stats doesn't exist, calculate manually
        if not stats:
            converted = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == preacher_id, DawahRequest.status == RequestStatus.converted).count()
            in_progress = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == preacher_id, DawahRequest.status == RequestStatus.in_progress).count()
            rejected = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == preacher_id, DawahRequest.status == RequestStatus.rejected).count()
        else:
            converted = stats.converted_count
            in_progress = stats.in_progress_count # This might be in_progress or under_persuasion depending on app logic
            rejected = stats.rejected_count
            # For consistency, we calculate under_persuasion if stats is manual or rename it
            under_persuasion = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == preacher_id, DawahRequest.status == RequestStatus.under_persuasion).count()

        # 2. Nationalities distribution (Mocking or calculating based on requests)
        nationality_data = db.query(
            Country.country_name, func.count(DawahRequest.request_id)
        ).join(
            Country, DawahRequest.invited_nationality_id == Country.country_id
        ).filter(DawahRequest.assigned_preacher_id == preacher_id).group_by(Country.country_name).order_by(func.count(DawahRequest.request_id).desc()).limit(5).all()
        
        nationalities = [{"label": c, "value": count} for c, count in nationality_data]

        # 3. Response Time Trend (Average first response speed by day/month)
        # Computed as minutes between request submission and acceptance time.
        normalized_granularity = (trend_granularity or "monthly").lower()
        granularity = "day" if normalized_granularity in ["daily", "day"] else "month"

        response_data = db.query(
            func.date_trunc(granularity, DawahRequest.accepted_at).label('bucket'),
            func.avg(
                func.extract('epoch', DawahRequest.accepted_at - DawahRequest.submission_date) / 60
            ).label('avg_speed_minutes')
        ).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.accepted_at.isnot(None)
        ).group_by('bucket').order_by('bucket').all()

        response_time_trend = []
        for item in response_data:
            if item.bucket:
                response_time_trend.append({
                    "month": item.bucket.strftime("%d %b %Y") if granularity == "day" else item.bucket.strftime("%b %Y"),
                    "value": round(item.avg_speed_minutes or 0, 1)
                })

        return {
            "preacher_info": {
                "preacher_id": preacher.preacher_id,
                "full_name": preacher.full_name,
                "email": preacher.email,
                "phone": preacher.phone,
                "languages": [db.query(Language).filter(Language.language_id == l.language_id).first().language_name for l in preacher.languages],
                "religion": "مسلم", # Default for preachers
                "organization_name": preacher.organization.organization_name if preacher.organization else "داعية متطوع",
                "status": preacher.user.status.value,
                "joining_date": preacher.created_at.strftime("%d/%m/%Y"),
            },
            "performance_stats": [
                {"title": "إجمالي عدد الطلبات", "value": total_requests, "icon": "requests", "change": "+10.5%"},
                {"title": "أسلم", "value": converted, "icon": "converted", "change": "-10.5%"},
                {"title": "قيد الإقناع", "value": under_persuasion, "icon": "in_progress", "change": "+10.5%"},
                {"title": "رفض", "value": rejected, "icon": "rejected", "change": "+10.5%"},
            ],
            "charts": {
                "nationalities": nationalities,
                "response_time_trend": response_time_trend
            }
        }

    @staticmethod
    def get_global_preachers(
        db: Session, 
        search: Optional[str] = None,
        nationality_id: Optional[int] = None,
        language_id: Optional[int] = None,
        status: Optional[str] = None
    ):
        """
        جلب قائمة جميع الدعاة لوزير الأوقاف ببحث عام (مع فلاتر).
        لا تقم بجلب الإدارة أو غيرهم، فقط الدعاة.
        """
        query = db.query(Preacher).join(User, Preacher.user_id == User.user_id)

        if search:
            query = query.filter(Preacher.full_name.ilike(f"%{search}%"))
        
        if nationality_id:
            query = query.filter(Preacher.nationality_country_id == nationality_id)
        
        if language_id:
            query = query.filter(Preacher.languages.any(PreacherLanguage.language_id == language_id))
        
        if status:
            query = query.filter(User.status == status)
        
        preachers = query.all()
        results = []

        for p in preachers:
            results.append({
                "preacher_id": p.preacher_id,
                "full_name": p.full_name,
                "organization_name": p.organization.organization_name if p.organization else "متطوع",
                "nationality": db.query(Country).filter(Country.country_id == p.nationality_country_id).first().country_name if p.nationality_country_id else "غير محدد",
                "languages": [db.query(Language).filter(Language.language_id == l.language_id).first().language_name for l in p.languages],
                "joining_date": p.created_at.strftime("%d/%m/%Y %I:%M %p"),
                "status": p.user.status.value,
                "phone": p.phone
            })
        
        return results

    @staticmethod
    def get_global_dashboard_stats(db: Session, org_id: Optional[int] = None, period: Optional[str] = "all_time", trend_granularity: Optional[str] = "month"):
        """
        جلب إحصائيات الداشبورد العالمي للوزير مع فلاتر (الجمعية، الفترة الزمنية، دقة الرسم البياني).
        """
        from datetime import datetime, timedelta
        from sqlalchemy import and_

        # 1. Base query filters
        preacher_filter = []
        request_filter = []
        
        if org_id is not None and org_id != 0:
            preacher_filter.append(Preacher.org_id == org_id)
            request_filter.append(Preacher.org_id == org_id)
        elif org_id == 0: # Volunteers only
            preacher_filter.append(Preacher.org_id == None)
            request_filter.append(Preacher.org_id == None)

        now = datetime.now()
        if period == "this_month":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            request_filter.append(DawahRequest.created_at >= start_date)
        elif period == "last_month":
            last_month = now.replace(day=1) - timedelta(days=1)
            start_date = last_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = last_month.replace(hour=23, minute=59, second=59)
            request_filter.append(and_(DawahRequest.created_at >= start_date, DawahRequest.created_at <= end_date))

        # 2. Top Cards Data
        total_preachers = db.query(Preacher).filter(*preacher_filter).count()
        
        # Activities = Total requests assigned to preachers
        total_activities = db.query(DawahRequest).join(Preacher).filter(
            DawahRequest.assigned_preacher_id != None,
            *request_filter
        ).count()
        
        # New Interested = New/Pending requests
        new_interested = db.query(DawahRequest).join(Preacher).filter(
            DawahRequest.status == RequestStatus.pending,
            *request_filter
        ).count()
        
        # Converted for overall performance calc
        total_converts = db.query(DawahRequest).join(Preacher).filter(
            DawahRequest.status == RequestStatus.converted,
            *request_filter
        ).count()
        
        overall_performance_pct = round((total_converts / total_activities * 100), 1) if total_activities > 0 else 0

        # 3. Request Status Distribution (Donut Chart) - Filtered to 3 statuses
        status_data = db.query(
            DawahRequest.status, func.count(DawahRequest.request_id)
        ).join(Preacher).filter(
            DawahRequest.status.in_([RequestStatus.converted, RequestStatus.rejected, RequestStatus.under_persuasion]),
            *request_filter
        ).group_by(DawahRequest.status).all()

        # 4. Acceptance Rate (Daily/Monthly Area Chart)
        # Ensure trend_granularity is safe
        valid_granularity = trend_granularity if trend_granularity in ["day", "month"] else "month"
        
        trend_data = db.query(
            func.date_trunc(valid_granularity, DawahRequest.created_at).label('period'),
            func.count(DawahRequest.request_id).label('total'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('accepted')
        ).join(Preacher).filter(*request_filter).group_by('period').order_by('period').all()
        
        acceptance_rate_trend = []
        date_format = "%d %b" if valid_granularity == "day" else "%b %Y"
        for d in trend_data:
            rate = (d.accepted / d.total * 100) if d.total > 0 else 0
            acceptance_rate_trend.append({
                "period": d.period.strftime(date_format), 
                "rate": round(rate, 1)
            })

        # 5. Preacher Performance Comparison (Bar Chart)
        preacher_performance = db.query(
            Preacher.full_name,
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts')
        ).join(DawahRequest, Preacher.preacher_id == DawahRequest.assigned_preacher_id).filter(
            *request_filter
        ).group_by(Preacher.full_name).order_by(desc('converts')).limit(5).all()
        
        preacher_comparison = [{"name": p.full_name, "value": p.converts} for p in preacher_performance]

        # 6. Top 6 Preachers Table Logic
        top_preachers_query = db.query(
            Preacher,
            func.count(DawahRequest.request_id).label('activities'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts')
        ).join(DawahRequest, Preacher.preacher_id == DawahRequest.assigned_preacher_id).group_by(Preacher.preacher_id).filter(
            *request_filter
        ).order_by(desc('converts'), desc('activities')).limit(6).all()

        top_preachers_table = []
        for idx, (p, activities, converts) in enumerate(top_preachers_query, 1):
            perf_val = (converts / activities * 100) if activities > 0 else 0
            status_label = "نشط" if perf_val > 85 else "متوسط" if perf_val > 70 else "غير نشط"
            top_preachers_table.append({
                "rank": idx, "name": p.full_name, "organization": p.organization.organization_name if p.organization else "متطوع",
                "activities_count": activities, "converts_count": converts, "performance_pct": f"{round(perf_val, 1)}%",
                "status_label": status_label, "account_status": p.user.status.value
            })

        return {
            "top_cards": [
                {"title": "عدد الدعاة", "value": total_preachers, "icon": "preachers"},
                {"title": "عدد الأنشطة المنفذة", "value": total_activities, "icon": "activities"},
                {"title": "عدد المهتدين الجدد", "value": new_interested, "icon": "converts"},
                {"title": "نسبة الأداء العام", "value": f"{overall_performance_pct}%", "icon": "performance"},
            ],
            "charts": {
                "status_distribution": [{"label": s.value, "value": count} for s, count in status_data],
                "acceptance_rate_trend": acceptance_rate_trend,
                "preacher_comparison": preacher_comparison
            },
            "top_preachers": top_preachers_table
        }

    @staticmethod
    def get_reports_analytics(db: Session, org_id: Optional[int] = None, period: Optional[str] = "all_time", trend_granularity: Optional[str] = "month"):
        """جلب بيانات التقارير والتحليلات المتقدمة للوزير (مع دقة الرسم البياني)."""
        from datetime import datetime, timedelta
        from sqlalchemy import and_

        # 1. Base query filters
        request_filter = []
        if org_id is not None and org_id != 0:
            request_filter.append(Preacher.org_id == org_id)
        elif org_id == 0: # Volunteers
            request_filter.append(Preacher.org_id == None)

        # Apply Period Filter
        now = datetime.now()
        if period == "this_month":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            request_filter.append(DawahRequest.created_at >= start_date)
        elif period == "last_month":
            last_month = now.replace(day=1) - timedelta(days=1)
            start_date = last_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = last_month.replace(hour=23, minute=59, second=59)
            request_filter.append(and_(DawahRequest.created_at >= start_date, DawahRequest.created_at <= end_date))

        # 2. Top Cards Data (Reflecting Period)
        total_requests = db.query(DawahRequest).join(Preacher).filter(*request_filter).count()
        total_converted = db.query(DawahRequest).join(Preacher).filter(DawahRequest.status == RequestStatus.converted, *request_filter).count()
        total_rejected = db.query(DawahRequest).join(Preacher).filter(DawahRequest.status == RequestStatus.rejected, *request_filter).count()
        total_under_persuasion = db.query(DawahRequest).join(Preacher).filter(DawahRequest.status == RequestStatus.under_persuasion, *request_filter).count()
        
        active_preachers = db.query(Preacher).join(User).filter(User.status == AccountStatus.active, (Preacher.org_id == org_id) if org_id and org_id != 0 else True).count()
        acceptance_rate = round((total_converted / total_requests * 100), 1) if total_requests > 0 else 0

        # 3. Trend Configuration
        valid_granularity = trend_granularity if trend_granularity in ["day", "month"] else "month"
        date_format = "%d %b" if valid_granularity == "day" else "%b %Y"

        # 4. Generate Date Range for Trends (Padding)
        trend_dates = []
        if valid_granularity == 'day':
            # If period is month-based, show the whole month. Otherwise last 14 days.
            if period in ["this_month", "last_month"]:
                start_range = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_range = end_date.replace(hour=23, minute=59, second=59) if period == "last_month" else now
            else:
                start_range = (now - timedelta(days=13)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_range = now
                
            curr = start_range
            while curr <= end_range:
                trend_dates.append(curr)
                curr += timedelta(days=1)
        else:
            # Last 6 months
            curr = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            for _ in range(6):
                trend_dates.insert(0, curr)
                if curr.month == 1: curr = curr.replace(year=curr.year-1, month=12)
                else: curr = curr.replace(month=curr.month-1)

        # 4. Converted vs Rejected Trend (Bar Chart)
        trend_query = db.query(
            func.date_trunc(valid_granularity, DawahRequest.created_at).label('period'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label('rejects')
        ).join(Preacher).filter(*request_filter).group_by('period').order_by('period')
        
        trend_results = {r.period.replace(tzinfo=None): r for r in trend_query.all()}
        
        converted_rejected_trend = []
        for dt in trend_dates:
            key = dt.replace(tzinfo=None)
            res = trend_results.get(key)
            converted_rejected_trend.append({
                "period": dt.strftime(date_format),
                "converts": res.converts if res else 0,
                "rejects": res.rejects if res else 0
            })

        # 5. Acceptance Rate Trend (Line/Area Chart)
        rate_query = db.query(
            func.date_trunc(valid_granularity, DawahRequest.created_at).label('period'),
            func.count(DawahRequest.request_id).label('total'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('accepted')
        ).join(Preacher).filter(*request_filter).group_by('period').order_by('period')
        
        rate_results = {r.period.replace(tzinfo=None): r for r in rate_query.all()}
        
        acceptance_trend = []
        for dt in trend_dates:
            key = dt.replace(tzinfo=None)
            res = rate_results.get(key)
            rate = (res.accepted / res.total * 100) if res and res.total > 0 else 0
            acceptance_trend.append({
                "period": dt.strftime(date_format),
                "rate": round(rate, 1)
            })

        # 5. Geographic Distribution (Organizations - Robust Bilingual Kuwait Standard)
        official_govs = ["العاصمة", "حولي", "الأحمدي", "الفروانية", "الجهراء", "مبارك الكبير"]
        
        # English to Arabic mapping (Case-insensitive)
        en_to_ar = {
            "capital": "العاصمة", "al asimah": "العاصمة", "alasimah": "العاصمة", "kuwait city": "العاصمة", "kuwait": "العاصمة",
            "hawalli": "حولي", "hawali": "حولي",
            "ahmadi": "الأحمدي", "al ahmadi": "الأحمدي", "alahmadi": "الأحمدي", "al-ahmadi": "الأحمدي",
            "farwaniyah": "الفروانية", "al farwaniyah": "الفروانية", "alfarwaniyah": "الفروانية", "farwaniya": "الفروانية", "al farwaniya": "الفروانية", "al-farwaniyah": "الفروانية",
            "jahra": "الجهراء", "al jahra": "الجهراء", "aljahra": "الجهراء", "al-jahra": "الجهراء",
            "mubarak al-kabeer": "مبارك الكبير", "mubarak alkabeer": "مبارك الكبير", "mubarak": "مبارك الكبير", "mubarak al-kabir": "مبارك الكبير", "mubarak al kabeer": "مبارك الكبير"
        }
        
        def normalize_ar(text: str | None) -> str:
            if not text: return ""
            # Handle English
            if any(c.isalpha() for c in text): # If contains Latin characters
                t_en = text.lower().strip()
                return en_to_ar.get(t_en, t_en) # Return mapped Arabic or original English if not found
                
            # Standardize Arabic characters (Remove Hamzas, unify Taa/Haa, etc.)
            res = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
            res = res.replace("ة", "ه").replace("ى", "ي")
            # Remove common prefixes
            res = res.replace("محافظة", "").replace("المحافظة", "").replace("المحافظه", "")
            return res.strip()
            
        # Map normalized canonical names to their official Arabic names
        norm_to_official = {normalize_ar(g): g for g in official_govs}
        
        total_organizations = db.query(Organization).count()
        all_gov_rows = db.query(Organization.governorate).all()
        
        gov_counts = {gov: 0 for gov in official_govs}
        gov_counts["غير ذلك"] = 0
        
        for (raw_name,) in all_gov_rows:
            norm_val = normalize_ar(raw_name)
            if norm_val in norm_to_official:
                official_name = norm_to_official[norm_val]
                gov_counts[official_name] += 1
            elif norm_val in official_govs:
                # Ensure norm_val is treated as a valid key for gov_counts
                gov_counts[str(norm_val)] += 1
            else:
                gov_counts["غير ذلك"] += 1
        
        geographic_distribution = []
        # Ensure all 6 appear
        for g_name in official_govs:
            cnt = gov_counts[g_name]
            pct = round((cnt / total_organizations * 100), 1) if total_organizations > 0 else 0
            geographic_distribution.append({
                "name": g_name, 
                "count": cnt, 
                "percentage": f"{pct}%"
            })
        
        # Add 'Other' if it has entries
        if gov_counts["غير ذلك"] > 0:
            cnt = gov_counts["غير ذلك"]
            pct = round((cnt / total_organizations * 100), 1) if total_organizations > 0 else 0
            geographic_distribution.append({
                "name": "غير ذلك", 
                "count": cnt, 
                "percentage": f"{pct}%"
            })

        # 6. Organizations Performance (Mullti-entity comparison - ALWAYS)
        # We always want a comparison view for the "Top 5" chart, even if a filter is active
        # BUT we respect the PERIOD filter (this month / last month)
        comparison_filter = []
        if period == "this_month":
            comparison_filter.append(DawahRequest.created_at >= start_date)
        elif period == "last_month":
            comparison_filter.append(and_(DawahRequest.created_at >= start_date, DawahRequest.created_at <= end_date))

        # 6a. Get performance from regular organizations
        # We join with DawahRequest and apply the status/period filter directly in the join condition 
        # to ensure we don't accidentally filter out organizations with 0 converts.
        perf_query = db.query(
            Organization.organization_name.label('label'),
            func.count(DawahRequest.request_id).label('value')
        ).select_from(Organization)\
         .outerjoin(Preacher, Organization.org_id == Preacher.org_id)\
         .outerjoin(DawahRequest, and_(
             Preacher.preacher_id == DawahRequest.assigned_preacher_id,
             DawahRequest.status == RequestStatus.converted,
             *comparison_filter
         ))\
         .group_by(Organization.organization_name)\
         .order_by(desc('value'))\
         .limit(10) # Get top 10 to pick top 5 after merging with freelancers
        
        perf_by_org = perf_query.all()
         
        # 6b. Get performance from freelance preachers (Volunteers)
        freelance_converted = db.query(
            func.count(DawahRequest.request_id).label('value')
        ).select_from(DawahRequest)\
         .join(Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id)\
         .filter(and_(
             Preacher.org_id == None,
             DawahRequest.status == RequestStatus.converted,
             *comparison_filter
         )).first()
        
        # Combine and sort for the Top 5
        all_entities = []
        for o in perf_by_org:
            all_entities.append({"label": str(o.label), "value": int(o.value)})
            
        if freelance_converted and freelance_converted.value:
            all_entities.append({"label": "الدعاة المتعاونين", "value": int(freelance_converted.value)})
            
        # Perform final sort and slice
        sorted_entities = sorted(all_entities, key=lambda x: x['value'], reverse=True)
        org_performance_donut = sorted_entities[:5]

        # Add a special 'Status Breakdown' only if a specific org is filtered (for separate UI use or tooltips)
        # For now, the Minister wants the Top 5 chart to stay a Top 5 chart.

        def get_time_ago_ar(dt: datetime) -> str:
            if not dt: return "غير محدد"
            # Standardize timezone-aware comparison
            now = datetime.now(dt.tzinfo)
            diff = now - dt
            
            if diff.days > 365:
                return "منذ سنة أو أكثر"
            if diff.days > 30:
                months = diff.days // 30
                return f"منذ {months} شهر" if months > 1 else "منذ شهر"
            if diff.days > 0:
                if diff.days == 1: return "منذ يوم"
                if diff.days == 2: return "منذ يومين"
                return f"منذ {diff.days} أيام" if diff.days < 11 else f"منذ {diff.days} يوماً"
            
            hours = diff.seconds // 3600
            if hours > 0:
                if hours == 1: return "منذ ساعة"
                if hours == 2: return "منذ ساعتين"
                return f"منذ {hours} ساعات" if hours < 11 else f"منذ {hours} ساعة"
            
            minutes = (diff.seconds % 3600) // 60
            if minutes > 0:
                if minutes == 1: return "منذ دقيقة"
                if minutes == 2: return "منذ دقيقتين"
                return f"منذ {minutes} دقائق" if minutes < 11 else f"منذ {minutes} دقيقة"
            
            return "الآن"

        # 7. Organizations Performance Table
        org_details = []
        orgs_list = db.query(Organization).all() if org_id is None else db.query(Organization).filter(Organization.org_id == org_id).all()
        
        for org in orgs_list:
            o_requests_query = db.query(DawahRequest).join(Preacher).filter(Preacher.org_id == org.org_id)
            # Apply time filter to individual org stats too if period is set
            if period == "this_month": o_requests_query = o_requests_query.filter(DawahRequest.created_at >= start_date)
            elif period == "last_month": o_requests_query = o_requests_query.filter(and_(DawahRequest.created_at >= start_date, DawahRequest.created_at <= end_date))
            
            o_requests = o_requests_query.count()
            o_converts = o_requests_query.filter(DawahRequest.status == RequestStatus.converted).count()
            o_preachers = db.query(Preacher).filter(Preacher.org_id == org.org_id).count()
            o_rate = (o_converts / o_requests * 100) if o_requests > 0 else 0
            level = "ممتاز" if o_rate > 80 else "جيد" if o_rate > 50 else "يحتاج تحسين"
            
            # Real Last Update logic (Hybrid: Latest Request activity OR Last Seen OR Profile Update)
            latest_req = db.query(DawahRequest).join(Preacher).filter(Preacher.org_id == org.org_id).order_by(desc(DawahRequest.updated_at)).first()
            req_activity = latest_req.updated_at if latest_req else None
            
            # Combine multiple activity indicators
            activity_dates = [org.updated_at]
            if req_activity: activity_dates.append(req_activity)
            if org.user and org.user.last_seen: activity_dates.append(org.user.last_seen)
            if org.user and org.user.last_login: activity_dates.append(org.user.last_login)
            
            last_activity = max(activity_dates)
            
            org_details.append({
                "org_name": org.organization_name,
                "requests_count": o_requests,
                "converts_count": o_converts,
                "preachers_count": o_preachers,
                "acceptance_level": level,
                "last_update": get_time_ago_ar(last_activity)
            })

        return {
            "top_cards": [
                {"title": "إجمالي الطلبات", "value": total_requests, "icon": "requests", "change": "+10.5%"},
                {"title": "إجمالي المسلمين الجدد", "value": total_converted, "icon": "converts", "change": "+10.5%"},
                {"title": "عدد الدعاة النشطين", "value": active_preachers, "icon": "active_preachers", "change": "+10.5%"},
                {"title": "نسبة القبود العامة", "value": f"{acceptance_rate}%", "icon": "acceptance", "change": "+10.5%"},
            ],
            "charts": {
                "converted_rejected_trend": converted_rejected_trend,
                "acceptance_trend": acceptance_trend,
                "org_performance_donut": org_performance_donut,
                "total_islam_converts": total_converted,
                "total_rejected": total_rejected
            },
            "geographic_distribution": geographic_distribution,
            "organization_performance_table": org_details
        }

    @staticmethod
    def get_global_preachers(
        db: Session, 
        search: Optional[str] = None,
        nationality_id: Optional[int] = None,
        language_id: Optional[int] = None,
        status: Optional[str] = None
    ):
        """
        جلب قائمة جميع الدعاة لوزير الأوقاف ببحث عام (مع فلاتر).
        لا تقم بجلب الإدارة أو غيرهم، فقط الدعاة.
        """
        query = db.query(Preacher).join(User, Preacher.user_id == User.user_id)

        if search:
            query = query.filter(Preacher.full_name.ilike(f"%{search}%"))
        
        if nationality_id:
            query = query.filter(Preacher.nationality_country_id == nationality_id)
        
        if language_id:
            query = query.filter(Preacher.languages.any(PreacherLanguage.language_id == language_id))
        
        if status:
            query = query.filter(User.status == status)
        
        preachers = query.all()
        results = []

        for p in preachers:
            results.append({
                "preacher_id": p.preacher_id,
                "full_name": p.full_name,
                "organization_name": p.organization.organization_name if p.organization else "متطوع",
                "nationality": db.query(Country).filter(Country.country_id == p.nationality_country_id).first().country_name if p.nationality_country_id else "غير محدد",
                "languages": [db.query(Language).filter(Language.language_id == l.language_id).first().language_name for l in p.languages],
                "joining_date": p.created_at.strftime("%d/%m/%Y %I:%M %p"),
                "status": p.user.status.value,
                "phone": p.phone
            })
        
        return results

    @staticmethod
    def get_organizations_overview(db: Session, search: Optional[str] = None):
        """
        جلب قائمة بكل الجمعيات مع إحصائيات الأداء لكل منها (مع إمكانية البحث).
        """
        query = db.query(Organization)
        if search:
            query = query.filter(Organization.organization_name.ilike(f"%{search}%"))
            
        orgs = query.all()
        results = []

        for org in orgs:
            # 1. Preachers count for this org
            preachers_count = db.query(Preacher).filter(Preacher.org_id == org.org_id).count()

            # 2. Total converted (New Muslims) for this org
            new_muslims = db.query(DawahRequest).join(Preacher).filter(
                Preacher.org_id == org.org_id,
                DawahRequest.status == RequestStatus.converted
            ).count()

            # 3. Total interested (Total requests handled by this org)
            total_requests = db.query(DawahRequest).join(Preacher).filter(
                Preacher.org_id == org.org_id
            ).count()

            # 4. Conversion rate
            conversion_rate = (new_muslims / total_requests * 100) if total_requests > 0 else 0

            results.append({
                "org_id": org.org_id,
                "organization_name": org.organization_name,
                "governorate": org.governorate,
                "phone": org.phone,
                "stats": {
                    "new_muslims": new_muslims,
                    "interested_count": total_requests,
                    "preachers_count": preachers_count,
                    "conversion_rate": round(conversion_rate, 1)
                }
            })

        # Separate entry for Volunteer Preachers (those without an organization)
        volunteers_preachers_count = db.query(Preacher).filter(Preacher.org_id == None).count()
        if volunteers_preachers_count > 0 and (not search or "متطوع" in search):
            v_new_muslims = db.query(DawahRequest).join(Preacher).filter(
                Preacher.org_id == None,
                DawahRequest.status == RequestStatus.converted
            ).count()

            v_total_requests = db.query(DawahRequest).join(Preacher).filter(
                Preacher.org_id == None
            ).count()

            v_conversion_rate = (v_new_muslims / v_total_requests * 100) if v_total_requests > 0 else 0

            results.append({
                "org_id": 0,
                "organization_name": "الدعاة المتطوعين",
                "governorate": "عام",
                "phone": "N/A",
                "stats": {
                    "new_muslims": v_new_muslims,
                    "interested_count": v_total_requests,
                    "preachers_count": volunteers_preachers_count,
                    "conversion_rate": round(v_conversion_rate, 1)
                }
            })

        return results
