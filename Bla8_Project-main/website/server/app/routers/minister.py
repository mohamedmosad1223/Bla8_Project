from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Response

from app.database import get_db
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.enums import UserRole
from app.controllers.minister_dashboard_controller import MinisterDashboardController
from app.controllers.profiles_controller import ProfilesController
from app.schemas.schemas import ProfileUpdate, ChangePasswordRequest, AccountDeletionRequest

router = APIRouter(prefix="/api/minister", tags=["Minister"])

@router.get("/dashboard")
def get_minister_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب بيانات الداشبورد الخاصة بوزير الأوقاف"""
    return MinisterDashboardController.get_dashboard_stats(db)

@router.get("/global-dashboard")
def get_minister_global_dashboard(
    org_id: Optional[int] = None,
    period: Optional[str] = "all_time",
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب بيانات الداشبورد العالمي الشامل مع فلاتر (لوزير الأوقاف)"""
    return MinisterDashboardController.get_global_dashboard_stats(db, org_id, period)

@router.get("/reports-analytics")
def get_minister_reports_analytics(
    org_id: Optional[int] = None,
    period: Optional[str] = "all_time",
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب بيانات التقارير والتحليلات المتقدمة (لوزير الأوقاف)"""
    return MinisterDashboardController.get_reports_analytics(db, org_id, period)

@router.get("/organizations")
def get_minister_organizations(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب قائمة بكل الجمعيات مع إحصائيات الأداء (لوزير الأوقاف) وإمكانية البحث"""
    return MinisterDashboardController.get_organizations_overview(db, search=search)

@router.get("/organizations/{org_id}")
def get_minister_organization_details(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب تفاصيل جمعية معينة شاملة البيانات والإحصائيات (لوزير الأوقاف)"""
    details = MinisterDashboardController.get_organization_details(db, org_id)
    if not details:
        raise HTTPException(status_code=404, detail="الجمعية غير موجودة")
    return details

@router.get("/organizations/{org_id}/preachers")
def get_minister_organization_preachers(
    org_id: int,
    search: Optional[str] = None,
    nationality_id: Optional[int] = None,
    language_id: Optional[int] = None,
    status: Optional[str] = None,
    joining_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب قائمة دعاة جمعية معينة مع فلاتر (لوزير الأوقاف)"""
    return MinisterDashboardController.get_organization_preachers(
        db=db, 
        org_id=org_id, 
        search=search, 
        nationality_id=nationality_id, 
        language_id=language_id, 
        status=status,
        joining_date=joining_date
    )

@router.get("/preachers")
def get_minister_all_preachers(
    search: Optional[str] = None,
    nationality_id: Optional[int] = None,
    language_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب قائمة جميع الدعاة على مستوى النظام مع فلاتر وبحث (لوزير الأوقاف)"""
    return MinisterDashboardController.get_global_preachers(
        db=db, 
        search=search, 
        nationality_id=nationality_id, 
        language_id=language_id, 
        status=status
    )

@router.get("/preachers/{preacher_id}")
def get_minister_preacher_details(
    preacher_id: int,
    trend_granularity: Optional[str] = "monthly",
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب تفاصيل داعية معين شاملة البيانات والإحصائيات (لوزير الأوقاف)"""
    details = MinisterDashboardController.get_preacher_details(db, preacher_id, trend_granularity=trend_granularity)
    if not details:
        raise HTTPException(status_code=404, detail="الداعية غير موجود")
    return details

@router.get("/preachers")
def get_minister_all_preachers(
    search: Optional[str] = None,
    nationality_id: Optional[int] = None,
    language_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب قائمة جميع الدعاة على مستوى النظام مع فلاتر وبحث (لوزير الأوقاف)"""
    return MinisterDashboardController.get_global_preachers(
        db=db, 
        search=search, 
        nationality_id=nationality_id, 
        language_id=language_id, 
        status=status
    )

# ─── Minister Profile & Settings ─────────────────────────────────────────────

@router.get("/profile")
def get_minister_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب بيانات الملف الشخصي للوزير"""
    return ProfilesController.get_user_profile(db, current_user)

@router.patch("/profile")
def update_minister_profile(
    full_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    app_language: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """تحديث بيانات الملف الشخصي للوزير (الاسم، البريد، الهاتف، اللغة، الصورة)"""
    payload = ProfileUpdate(
        full_name=full_name,
        email=email,
        phone=phone,
        app_language=app_language
    )
    return ProfilesController.update_profile(db, current_user, payload, profile_picture)

@router.post("/change-password")
def change_minister_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """تغيير كلمة المرور للوزير"""
    return ProfilesController.change_password(db, current_user, payload)

@router.get("/help-center")
def get_minister_help_center(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب بيانات مركز المساعدة للوزير"""
    return ProfilesController.get_contact_info(db)

@router.get("/policies")
def get_minister_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """جلب سياسات الخصوصية وشروط الاستخدام للوزير"""
    return ProfilesController.get_policies(db)

@router.post("/delete-account")
def delete_minister_account(
    payload: AccountDeletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.minister, UserRole.admin]))
):
    """تعطيل حساب الوزير (Soft Delete)"""
    return ProfilesController.delete_account(db, current_user, payload)

@router.post("/logout")
def logout_minister(response: Response):
    """تسجيل خروج الوزير ومسح كوكيز الجلسة"""
    response.delete_cookie("access_token")
    return ProfilesController.logout()
