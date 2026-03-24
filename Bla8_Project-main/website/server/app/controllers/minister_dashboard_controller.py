from sqlalchemy.orm import Session
from sqlalchemy import func, desc
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
        # 1. Total Preachers
        total_preachers = db.query(Preacher).count()

        # 2. Total Organization Requests
        # Assuming this refers to total dawah requests handled by organizations
        total_org_requests = db.query(DawahRequest).count()

        # 3. Total Conversations (Messages)
        total_conversations = db.query(Message).count()

        # 4. Referred for Education and Follow-up (Placeholder logic based on a specific status if exists)
        # For now, let's use a count of requests that are 'in_progress' or similar
        referred_count = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.in_progress).count()

        # 5. Converted (من أسلموا)
        total_converted = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.converted).count()

        # 6. Rejected (من رفضوا)
        total_rejected = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.rejected).count()

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
            DawahRequest.invited_city, # Placeholder for governorate/city
            func.count(DawahRequest.request_id).label("count")
        ).group_by(DawahRequest.invited_city).order_by(desc("count")).limit(10).all()

        governorates = [
            {"name": g.invited_city or "غير محدد", "value": g.count} for g in governorate_stats
        ]

        # 8. Monthly Stats for Chart (Converted vs Rejected)
        # Mocking or calculating for the last 6 months
        # (Implementation details would depend on created_at or updated_at)

        return {
            "top_cards": [
                {"title": "إجمالي عدد الدعاة", "value": total_preachers, "icon": "preachers"},
                {"title": "إجمالي عدد طلبات الجمعية", "value": total_org_requests, "icon": "requests"},
                {"title": "إجمالي عدد المحادثات", "value": total_conversations, "icon": "messages"},
                {"title": "المحالون للتعليم والمتابعة", "value": referred_count, "icon": "referrals"},
                {"title": "من أسلموا", "value": total_converted, "icon": "converted"},
                {"title": "من رفضوا", "value": total_rejected, "icon": "rejected"},
                {"title": "إجمالي الحالات المسجلة", "value": total_cases, "icon": "cases"},
                {"title": "إجمالي الأفراد المسجلين", "value": total_individuals, "icon": "individuals"},
            ],
            "governorates": governorates,
            "requests_summary": {
                "total": total_org_requests,
                "converted": total_converted,
                "in_progress": referred_count,
                "rejected": total_rejected
            }
        }

    @staticmethod
    def get_organization_details(db: Session, org_id: int):
        """
        جلب تفاصيل شاملة لجمعية معينة (بيانات الجمعية + إحصائيات الأداء).
        """
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            return None

        # 1. Base query for requests belonging to this org
        org_requests_query = db.query(DawahRequest).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id)

        # 2. Performance Stats (Cards)
        total_preachers = db.query(Preacher).filter(Preacher.org_id == org_id).count()
        total_org_requests = org_requests_query.count()
        total_converts = org_requests_query.filter(DawahRequest.status == RequestStatus.converted).count()
        total_rejections = org_requests_query.filter(DawahRequest.status == RequestStatus.rejected).count()
        
        # 3. Request Distribution (Donut Chart)
        dist_data = db.query(
            DawahRequest.status, func.count(DawahRequest.request_id)
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id).group_by(DawahRequest.status).all()
        requests_distribution = [{"label": s.value, "value": count} for s, count in dist_data]

        # 4. Conversion Trends (Monthly Bar Chart)
        trend_data = db.query(
            func.date_trunc('month', DawahRequest.updated_at).label('month'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label('rejects')
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(Preacher.org_id == org_id).group_by('month').order_by('month').all()

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
        ).filter(Preacher.org_id == org_id).group_by(Country.country_name).order_by(func.count(DawahRequest.request_id).desc()).limit(7).all()

        nationalities = [{"label": c, "value": count} for c, count in nationality_data]

        # 6. Detailed Status Summary
        total_in_progress = org_requests_query.filter(DawahRequest.status == RequestStatus.in_progress).count()

        return {
            "organization_info": {
                "name": org.organization_name,
                "license_number": org.license_number,
                "email": org.email,
                "phone": org.phone,
                "governorate": org.governorate,
                "manager_name": org.manager_name,
                "status": "مفعل" # Fixed status for now based on image
            },
            "performance_stats": [
                {"title": "إجمالي عدد الدعاة", "value": total_preachers, "icon": "preachers"},
                {"title": "إجمالي عدد طلبات الجمعية", "value": total_org_requests, "icon": "requests"},
                {"title": "من أسلموا", "value": total_converts, "icon": "converted"},
                {"title": "من رفضوا", "value": total_rejections, "icon": "rejected"},
            ],
            "charts": {
                "requests_distribution": requests_distribution,
                "conversion_trends": conversion_trends,
                "nationalities": nationalities
            },
            "requests_summary": {
                "total": total_org_requests,
                "converted": total_converts,
                "in_progress": total_in_progress,
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
        query = db.query(Preacher).join(User, Preacher.user_id == User.user_id).filter(Preacher.org_id == org_id)

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
    def get_preacher_details(db: Session, preacher_id: int):
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
            in_progress = stats.in_progress_count
            rejected = stats.rejected_count

        # 2. Nationalities distribution (Mocking or calculating based on requests)
        nationality_data = db.query(
            Country.country_name, func.count(DawahRequest.request_id)
        ).join(
            Country, DawahRequest.invited_nationality_id == Country.country_id
        ).filter(DawahRequest.assigned_preacher_id == preacher_id).group_by(Country.country_name).order_by(func.count(DawahRequest.request_id).desc()).limit(5).all()
        
        nationalities = [{"label": c, "value": count} for c, count in nationality_data]

        # 3. Response Time Trend (Placeholder)
        # In a real app, this would be calculated from a history table or DawahRequest events
        response_time_trend = [
            {"month": "يناير", "value": 10},
            {"month": "فبراير", "value": 12},
            {"month": "مارس", "value": 8},
            {"month": "ابريل", "value": 15},
            {"month": "مايو", "value": 5}
        ]

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
                {"title": "عدد من أسلموا", "value": converted, "icon": "converted", "change": "-10.5%"},
                {"title": "إجمالي قيد الإقناع", "value": in_progress, "icon": "in_progress", "change": "+10.5%"},
                {"title": "عدد من رفضوا", "value": rejected, "icon": "rejected", "change": "+10.5%"},
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
    def get_global_dashboard_stats(db: Session, org_id: Optional[int] = None, period: Optional[str] = "all_time"):
        """
        جلب إحصائيات الداشبورد العالمي للوزير مع فلاتر (الجمعية، الفترة الزمنية).
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

        # 3. Request Status Distribution (Donut Chart)
        status_data = db.query(
            DawahRequest.status, func.count(DawahRequest.request_id)
        ).join(Preacher).filter(*request_filter).group_by(DawahRequest.status).all()

        # 4. Monthly Acceptance Rate (Monthly Line Chart)
        monthly_data = db.query(
            func.date_trunc('month', DawahRequest.created_at).label('month'),
            func.count(DawahRequest.request_id).label('total'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status != RequestStatus.pending).label('accepted')
        ).join(Preacher).filter(*request_filter).group_by('month').order_by('month').all()
        
        acceptance_rate_trend = []
        for d in monthly_data:
            rate = (d.accepted / d.total * 100) if d.total > 0 else 0
            acceptance_rate_trend.append({"month": d.month.strftime("%b %Y"), "rate": round(rate, 1)})

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
    def get_reports_analytics(db: Session, org_id: Optional[int] = None, period: Optional[str] = "all_time"):
        """جلب بيانات التقارير والتحليلات المتقدمة للوزير."""
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
        active_preachers = db.query(Preacher).join(User).filter(User.status == AccountStatus.active, (Preacher.org_id == org_id) if org_id and org_id != 0 else True).count()
        acceptance_rate = round((total_converted / total_requests * 100), 1) if total_requests > 0 else 0

        # 3. Monthly Converted vs Rejected (Bar Chart)
        monthly_comp = db.query(
            func.date_trunc('month', DawahRequest.created_at).label('month'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label('rejects')
        ).join(Preacher).filter(*request_filter).group_by('month').order_by('month').limit(6).all()
        
        converted_rejected_trend = [{"month": d.month.strftime("%b %Y"), "converts": d.converts, "rejects": d.rejects} for d in monthly_comp]

        # 4. Monthly Acceptance Rate (Line Chart - Platform Wide or Org Specific)
        monthly_rate_data = db.query(
            func.date_trunc('month', DawahRequest.created_at).label('month'),
            func.count(DawahRequest.request_id).label('total'),
            func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('accepted')
        ).join(Preacher).filter(*request_filter).group_by('month').order_by('month').all()
        
        acceptance_trend = []
        for d in monthly_rate_data:
            rate = (d.accepted / d.total * 100) if d.total > 0 else 0
            acceptance_trend.append({"month": d.month.strftime("%b %Y"), "rate": round(rate, 1)})

        # 5. Geographic Distribution (Based on DawahRequest.governorate)
        geo_data = db.query(
            DawahRequest.governorate, 
            func.count(DawahRequest.request_id).label('count')
        ).join(Preacher).filter(*request_filter).group_by(DawahRequest.governorate).order_by(desc('count')).limit(5).all()
        
        geographic_distribution = []
        for gov, count in geo_data:
            pct = round((count / total_requests * 100), 1) if total_requests > 0 else 0
            geographic_distribution.append({"name": gov or "غير محدد", "count": count, "percentage": f"{pct}%"})

        # 6. Organizations Performance (Donut Chart & Table)
        # Note: Even if org_id is filtered, we might still show the selected org's share? 
        # Usually for donut charts of performance, we show multiple if org_id is None.
        org_performance_donut = []
        if org_id is None:
            perf_by_org = db.query(
                Organization.organization_name,
                func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts')
            ).join(Preacher, Organization.org_id == Preacher.org_id).join(DawahRequest).group_by(Organization.organization_name).all()
            org_performance_donut = [{"label": o.organization_name, "value": o.converts} for o in perf_by_org]
        else:
            # If specific org, show its conversion vs rejection distribution for the donut
            org_performance_donut = [
                {"label": "أسلموا", "value": total_converted},
                {"label": "رفضوا", "value": total_rejected},
                {"label": "قيد المتابعة", "value": total_requests - total_converted - total_rejected}
            ]

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
            org_details.append({
                "org_name": org.organization_name,
                "requests_count": o_requests,
                "converts_count": o_converts,
                "preachers_count": o_preachers,
                "acceptance_level": level,
                "last_update": "قبل يومين" # Placeholder for now
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
