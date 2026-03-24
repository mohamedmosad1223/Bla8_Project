import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_

from app.database import SessionLocal
from app.models.dashboard_snapshot import DashboardSnapshot
from app.models.user import User
from app.models.preacher import Preacher, PreacherStatistics
from app.models.organization import Organization
from app.models.dawah_request import DawahRequest
from app.models.interested_person import InterestedPerson
from app.models.message import Message
from app.models.reference import Country
from app.models.enums import RequestStatus, PreacherStatus, RequestType, AccountStatus

logger = logging.getLogger(__name__)

def _save_snapshot(db: Session, entity_type: str, entity_id: int, data: dict):
    snapshot = db.query(DashboardSnapshot).filter(
        DashboardSnapshot.entity_type == entity_type,
        DashboardSnapshot.entity_id == entity_id
    ).first()

    if not snapshot:
        snapshot = DashboardSnapshot(entity_type=entity_type, entity_id=entity_id)
        db.add(snapshot)
    
    snapshot.snapshot_data = data
    snapshot.computed_at = func.now()
    db.commit()


def compute_platform_stats(db: Session):
    """Computes Admin and Minister global dashboards"""
    logger.info("Computing platform global stats...")
    
    # 1. Base counts
    total_preachers = db.query(Preacher).count()
    total_org_requests = db.query(DawahRequest).count() # All requests
    total_conversations = db.query(Message).count()
    referred_count = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.in_progress).count()
    total_converted = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.converted).count()
    total_rejected = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.rejected).count()
    total_individuals = db.query(InterestedPerson).count() + db.query(DawahRequest).filter(DawahRequest.request_type == RequestType.invited).count()
    
    # 2. Governorates
    governorate_stats = db.query(
        DawahRequest.governorate, func.count(DawahRequest.request_id).label("count")
    ).group_by(DawahRequest.governorate).order_by(desc("count")).limit(10).all()
    
    governorates = [{"name": g.governorate or "غير محدد", "value": g.count} for g in governorate_stats]

    # 3. Overall Performance
    total_activities = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id != None).count()
    new_interested = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.pending).count()
    overall_performance_pct = round((total_converted / total_activities * 100), 1) if total_activities > 0 else 0

    # 4. Top Preachers Table (Admin & Minister)
    top_preachers_query = db.query(
        Preacher,
        func.count(DawahRequest.request_id).label('activities'),
        func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts')
    ).join(DawahRequest, Preacher.preacher_id == DawahRequest.assigned_preacher_id, isouter=True).group_by(Preacher.preacher_id)\
     .order_by(desc('converts'), desc('activities')).limit(10).all()

    top_preachers_table = []
    for idx, (p, activities, converts) in enumerate(top_preachers_query, 1):
        perf_val = (converts / activities * 100) if activities > 0 else 0
        status_label = "نشط" if perf_val > 85 else "متوسط" if perf_val > 70 else "غير نشط"
        
        # Include data used by both Admin and Minister views
        top_preachers_table.append({
            "rank": idx,
            "preacher_id": p.preacher_id,
            "full_name": p.full_name,
            "organization_name": p.organization.organization_name if p.organization else "متطوع",
            "activities_count": activities,
            "converts_count": converts,
            "performance_pct": f"{round(perf_val, 1)}%",
            "success_rate": round(perf_val, 2), # For admin 
            "status_label": status_label,
            "account_status": p.user.status.value if p.user else "active"
        })

    # 5. Organizations Stats (Admin & Minister detailed tables)
    org_stats_query = db.query(Organization).all()
    organization_stats = []
    org_details = [] # Minister format
    org_performance_donut = []
    
    for o in org_stats_query:
        o_preachers = db.query(Preacher).filter(Preacher.org_id == o.org_id).count()
        o_requests = db.query(DawahRequest).join(Preacher).filter(Preacher.org_id == o.org_id).count()
        o_converts = db.query(DawahRequest).join(Preacher).filter(
            Preacher.org_id == o.org_id, DawahRequest.status == RequestStatus.converted
        ).count()
        
        o_rate = (o_converts / o_requests * 100) if o_requests > 0 else 0
        level = "ممتاز" if o_rate > 80 else "جيد" if o_rate > 50 else "يحتاج تحسين"
        
        organization_stats.append({
            "org_id": o.org_id,
            "organization_name": o.organization_name,
            "preachers_count": o_preachers
        })
        
        org_details.append({
            "org_name": o.organization_name,
            "requests_count": o_requests,
            "converts_count": o_converts,
            "preachers_count": o_preachers,
            "acceptance_level": level,
            "last_update": "تم التحديث حديثاً"
        })
        
        org_performance_donut.append({"label": o.organization_name, "value": o_converts})

    # Sort organization_stats by preachers_count descending
    organization_stats.sort(key=lambda x: x["preachers_count"], reverse=True)
    organization_stats = organization_stats[:10]

    # 6. Nationalities (Admin)
    nationalities_query = db.query(
        Country.country_name, func.count(DawahRequest.request_id).label("count")
    ).join(DawahRequest, Country.country_id == DawahRequest.invited_nationality_id)\
     .group_by(Country.country_name).order_by(desc("count")).limit(10).all()

    nationalities = [{"label": n.country_name, "value": float(n.count)} for n in nationalities_query]
    geographic_distribution = [{"name": n.country_name, "count": n.count, "percentage": f"{round((n.count/total_org_requests*100), 1) if total_org_requests > 0 else 0}%"} for n in nationalities_query]

    # 7. Recent Activity (Admin)
    recent_reqs = db.query(DawahRequest).order_by(desc(DawahRequest.updated_at)).limit(10).all()
    recent_activities = []
    for r in recent_reqs:
        action = "تم تحديث حالة الطلب"
        if r.status == RequestStatus.pending: action = "تم إضافة شخص مدعو جديد"
        elif r.status == RequestStatus.converted: action = "نطق الشهادة بفضل الله!"
        elif r.status == RequestStatus.rejected: action = "تم رفض الطلب"
        
        name = f"{r.invited_first_name or ''} {r.invited_last_name or ''}".strip() or "شخص غير معروف"
        recent_activities.append({
            "id": r.request_id, "name": name, "action": action, 
            "time": "تم التحديث حديثاً", "timestamp": r.updated_at.isoformat() if r.updated_at else None
        })

    # 8. Charts Data (Minister)
    status_data = db.query(DawahRequest.status, func.count(DawahRequest.request_id)).group_by(DawahRequest.status).all()
    status_distribution = [{"label": s.value, "value": count} for s, count in status_data]

    # Acceptance Trend (Monthly)
    monthly_rate_data = db.query(
        func.date_trunc('month', DawahRequest.created_at).label('month'),
        func.count(DawahRequest.request_id).label('total'),
        func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('accepted')
    ).group_by('month').order_by('month').all()
    
    acceptance_trend = []
    for d in monthly_rate_data:
        if not d.month: continue
        rate = (d.accepted / d.total * 100) if d.total > 0 else 0
        acceptance_trend.append({"month": d.month.strftime("%b %Y"), "rate": round(rate, 1)})

    # Converted vs Rejected Trend
    monthly_comp = db.query(
        func.date_trunc('month', DawahRequest.created_at).label('month'),
        func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts'),
        func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label('rejects')
    ).group_by('month').order_by('month').limit(6).all()
    
    converted_rejected_trend = [{"month": d.month.strftime("%b %Y"), "converts": d.converts, "rejects": d.rejects} for d in monthly_comp if d.month]

    preacher_comparison = [{"name": p["full_name"], "value": p["converts_count"]} for p in top_preachers_table[:5]]

    # Preacher presence mock
    online_count = db.query(Preacher).filter(Preacher.status == PreacherStatus.active).count()
    preacher_presence = {
        "online": int(online_count * 0.7),
        "busy": int(online_count * 0.2),
        "offline": db.query(Preacher).filter(Preacher.status == PreacherStatus.suspended).count() + int(online_count * 0.1)
    }

    # === Compile Data ===
    
    # Data for Admin Dashboard
    admin_data = {
        "total_organizations": {"title": "إجمالي عدد الجمعيات المسجلة", "value": len(org_stats_query), "is_positive": True},
        "total_preachers": {"title": "إجمالي عدد الدعاة", "value": total_preachers, "is_positive": True},
        "total_individuals": {"title": "إجمالي الأفراد المسجلين", "value": total_individuals, "is_positive": True},
        "total_cases": {"title": "إجمالي الحالات المسجلة", "value": total_org_requests, "is_positive": True},
        "total_converted": {"title": "عدد من أسلموا", "value": total_converted, "is_positive": True},
        "total_rejected": {"title": "إجمالي حالات الرفض", "value": total_rejected, "is_positive": True},
        "top_preachers": top_preachers_table,
        "organization_stats": organization_stats,
        "nationalities_distribution": nationalities,
        "preacher_presence": preacher_presence,
        "recent_activities": recent_activities
    }
    
    # Data for Minister Full Output
    minister_data = {
        "top_cards": [
            {"title": "عدد الدعاة", "value": total_preachers, "icon": "preachers"},
            {"title": "عدد الأنشطة المنفذة", "value": total_activities, "icon": "activities"},
            {"title": "عدد المهتدين الجدد", "value": new_interested, "icon": "converts"},
            {"title": "نسبة الأداء العام", "value": f"{overall_performance_pct}%", "icon": "performance"},
            {"title": "إجمالي عدد المحادثات", "value": total_conversations, "icon": "messages"},
            {"title": "المحالون للتعليم والمتابعة", "value": referred_count, "icon": "referrals"},
            {"title": "من أسلموا", "value": total_converted, "icon": "converted"},
            {"title": "من رفضوا", "value": total_rejected, "icon": "rejected"},
            {"title": "إجمالي الحالات المسجلة", "value": total_org_requests, "icon": "cases"},
            {"title": "إجمالي الأفراد المسجلين", "value": total_individuals, "icon": "individuals"},
            {"title": "عدد الدعاة النشطين", "value": online_count, "icon": "active_preachers", "change": "+0.0%"},
            {"title": "نسبة القبود العامة", "value": f"{overall_performance_pct}%", "icon": "acceptance", "change": "+0.0%"},
        ],
        "governorates": governorates,
        "requests_summary": {
            "total": total_org_requests,
            "converted": total_converted,
            "in_progress": referred_count,
            "rejected": total_rejected
        },
        "charts": {
            "status_distribution": status_distribution,
            "acceptance_rate_trend": acceptance_trend,
            "acceptance_trend": acceptance_trend,
            "preacher_comparison": preacher_comparison,
            "converted_rejected_trend": converted_rejected_trend,
            "org_performance_donut": org_performance_donut,
            "total_islam_converts": total_converted,
            "total_rejected": total_rejected
        },
        "top_preachers": top_preachers_table[:6],
        "geographic_distribution": geographic_distribution,
        "organization_performance_table": org_details
    }

    _save_snapshot(db, "platform", 0, {"admin_dashboard": admin_data, "minister_dashboard": minister_data})
    logger.info("Platform stats computed and saved.")


def compute_preacher_stats(db: Session, preacher: Preacher):
    """Computes stats for a single preacher and updates both snapshot and PreacherStatistics"""
    preacher_id = preacher.preacher_id
    user_id = preacher.user_id

    # 1. Basic Counts
    total_requests = db.query(DawahRequest).filter(DawahRequest.assigned_preacher_id == preacher_id).count()
    converted_count = db.query(DawahRequest).filter(
        DawahRequest.assigned_preacher_id == preacher_id,
        DawahRequest.status == RequestStatus.converted
    ).count()
    
    engagement_count = 0
    if user_id:
        engagement_count = db.query(Message).filter(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        ).count()
        
    rejected_count = db.query(DawahRequest).filter(
        DawahRequest.assigned_preacher_id == preacher_id,
        DawahRequest.status == RequestStatus.rejected
    ).count()
    
    in_progress_count = db.query(DawahRequest).filter(
        DawahRequest.assigned_preacher_id == preacher_id,
        DawahRequest.status == RequestStatus.in_progress
    ).count()

    # Update PreacherStatistics model
    stats_record = db.query(PreacherStatistics).filter(PreacherStatistics.preacher_id == preacher_id).first()
    if not stats_record:
        stats_record = PreacherStatistics(preacher_id=preacher_id)
        db.add(stats_record)
        
    stats_record.total_accepted = total_requests
    stats_record.converted_count = converted_count
    stats_record.in_progress_count = in_progress_count
    stats_record.rejected_count = rejected_count
    stats_record.total_messages_sent = engagement_count
    
    # 2. Requests by Status
    status_counts = db.query(
        DawahRequest.status, func.count(DawahRequest.request_id)
    ).filter(DawahRequest.assigned_preacher_id == preacher_id).group_by(DawahRequest.status).all()
    
    requests_by_status = [{"label": s.value, "value": count} for s, count in status_counts]

    # 3. Response Speed (Line Chart)
    response_data = db.query(
        func.date_trunc('month', DawahRequest.accepted_at).label('month'),
        func.avg(func.extract('epoch', DawahRequest.accepted_at - DawahRequest.submission_date) / 60).label('avg_speed')
    ).filter(
        DawahRequest.assigned_preacher_id == preacher_id,
        DawahRequest.accepted_at.isnot(None)
    ).group_by('month').order_by('month').all()

    response_speed_chart = []
    for r in response_data:
        if r.month:
            val = float(r.avg_speed) if r.avg_speed is not None else 0.0
            response_speed_chart.append({"label": r.month.strftime("%b %Y"), "value": round(val, 2)})

    # 4. Activity Chart
    activity_chart = []
    if user_id:
        activity_data = db.query(
            func.date_trunc('day', Message.created_at).label('day'),
            func.count(Message.message_id).label('count')
        ).filter(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        ).group_by('day').order_by('day').limit(30).all()

        activity_chart = [{"label": a.day.strftime("%d %b"), "value": a.count} for a in activity_data if a.day]

    # 5. Distributions
    gov_data = db.query(
        DawahRequest.governorate, func.count(DawahRequest.request_id)
    ).filter(
        DawahRequest.assigned_preacher_id == preacher_id,
        DawahRequest.governorate.isnot(None)
    ).group_by(DawahRequest.governorate).all()

    governorates_distribution = [{"label": g, "value": count} for g, count in gov_data]

    country_data = db.query(
        Country.country_name, func.count(DawahRequest.request_id)
    ).join(
        Country, DawahRequest.invited_nationality_id == Country.country_id
    ).filter(
        DawahRequest.assigned_preacher_id == preacher_id
    ).group_by(Country.country_name).all()

    countries_distribution = [{"label": c, "value": count} for c, count in country_data]

    # 6. Follow-up 24h Rate
    total_assigned = db.query(DawahRequest).filter(
        DawahRequest.assigned_preacher_id == preacher_id, DawahRequest.accepted_at.isnot(None)
    ).count()
    
    within_24h = db.query(DawahRequest).filter(
        DawahRequest.assigned_preacher_id == preacher_id,
        DawahRequest.accepted_at.isnot(None),
        (DawahRequest.accepted_at - DawahRequest.submission_date) <= timedelta(hours=24)
    ).count()
    
    follow_up_24h_rate = (within_24h / total_assigned * 100) if total_assigned > 0 else 0

    data = {
        "total_requests": {"title": "إجمالي الطلبات", "value": total_requests, "change_percentage": 0.0, "is_positive": True},
        "converted_count": {"title": "عدد من أسلموا", "value": converted_count, "change_percentage": 0.0, "is_positive": True},
        "engagement_count": {"title": "إجمالي التفاعل", "value": engagement_count, "change_percentage": 0.0, "is_positive": True},
        "rejected_count": {"title": "عدد من رفضوا", "value": rejected_count, "change_percentage": 0.0, "is_positive": False},
        "response_speed_chart": response_speed_chart,
        "requests_by_status": requests_by_status,
        "follow_up_24h_rate": round(follow_up_24h_rate, 1),
        "ai_suggestions_rate": 50.0,
        "governorates_distribution": governorates_distribution,
        "countries_distribution": countries_distribution,
        "activity_chart": activity_chart
    }

    _save_snapshot(db, "preacher", preacher_id, data)


def compute_organization_stats(db: Session, org_id: int):
    """Computes stats for a single organization"""
    
    # Base query for requests belonging to this org
    org_requests_query = db.query(DawahRequest).join(
        Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
    ).filter(Preacher.org_id == org_id)

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
    
    needs_followup_count = org_requests_query.filter(
        DawahRequest.status == RequestStatus.in_progress,
        DawahRequest.alert_42h_sent_at.isnot(None)
    ).count()

    nationality_data = db.query(
        Country.country_name, func.count(DawahRequest.request_id)
    ).join(
        Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
    ).join(
        Country, DawahRequest.invited_nationality_id == Country.country_id
    ).filter(Preacher.org_id == org_id).group_by(Country.country_name).order_by(func.count(DawahRequest.request_id).desc()).limit(7).all()

    top_nationalities = [{"label": c, "value": count} for c, count in nationality_data]

    dist_data = db.query(
        DawahRequest.status, func.count(DawahRequest.request_id)
    ).join(
        Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
    ).filter(Preacher.org_id == org_id).group_by(DawahRequest.status).all()
    
    requests_distribution = [{"label": s.value, "value": count} for s, count in dist_data]

    trend_data = db.query(
        func.date_trunc('month', DawahRequest.updated_at).label('month'),
        func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.converted).label('converts'),
        func.count(DawahRequest.request_id).filter(DawahRequest.status == RequestStatus.rejected).label('rejects')
    ).join(
        Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
    ).filter(Preacher.org_id == org_id).group_by('month').order_by('month').all()

    conversion_trends = []
    for t in trend_data:
        if t.month:
            month_label = t.month.strftime("%b %Y")
            conversion_trends.append({"label": f"{month_label} - Converts", "value": t.converts})
            conversion_trends.append({"label": f"{month_label} - Rejects", "value": t.rejects})

    data = {
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

    _save_snapshot(db, "organization", org_id, data)


def refresh_all_snapshots():
    """Main entry point to run all dashboard calculations"""
    logger.info("Starting Dashboard Snapshots Refresh...")
    db = SessionLocal()
    try:
        # 1. Platform & Minister Stats
        compute_platform_stats(db)

        # 2. Organization Stats
        orgs = db.query(Organization.org_id).all()
        for (org_id,) in orgs:
            compute_organization_stats(db, org_id)

        # 3. Preacher Stats
        preachers = db.query(Preacher).all()
        for p in preachers:
            compute_preacher_stats(db, p)

        db.commit()
        logger.info("Dashboard Snapshots Refresh Completed Successfully!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error refreshing dashboard snapshots: {e}")
    finally:
        db.close()
