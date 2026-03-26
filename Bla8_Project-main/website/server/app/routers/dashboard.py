from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.preacher import Preacher
from app.models.enums import UserRole
from app.controllers.preacher_dashboard_controller import PreacherDashboardController
from app.controllers.organization_dashboard_controller import OrganizationDashboardController
from app.controllers.main_dashboard_controller import AdminDashboardController
from app.schemas.schemas import PreacherDashboardRead, OrganizationDashboardRead, MainDashboardRead

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/admin", response_model=MainDashboardRead)
def get_admin_dashboard(db: Session = Depends(get_db)):
    """جلب بيانات الداشبورد الرئيسية للمنصة (إحصائيات عامة، رسوم بيانية، ونشاط حديث)"""
    return AdminDashboardController.get_main_dashboard(db)

@router.get("/preacher", response_model=PreacherDashboardRead)
def get_preacher_dashboard_self(
    interval: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.preacher]))
):
    """جلب إحصائيات لوحة التحكم والرسوم البيانية للداعية (لنفسه)"""
    return PreacherDashboardController.get_dashboard_stats(db, current_user.preacher.preacher_id, current_user.user_id, interval)

@router.get("/preacher/{preacher_id}", response_model=PreacherDashboardRead)
def get_preacher_dashboard_for_org(
    preacher_id: int,
    interval: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.admin, UserRole.organization]))
):
    """جلب إحصائيات لوحة التحكم لداعية معين (خاص بالأدمن والجمعية التابع لها)"""
    preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
    if not preacher:
        raise HTTPException(status_code=404, detail="الداعية غير موجود")
    
    # التحقق من الصلاحية: لو جمعية لازم الداعية يكون تبعها
    if current_user.role == UserRole.organization:
        if preacher.org_id != current_user.organization.org_id:
            raise HTTPException(status_code=403, detail="لا يمكنك عرض إحصائيات داعية لا ينتمي لجمعيتك")
            
    return PreacherDashboardController.get_dashboard_stats(db, preacher.preacher_id, preacher.user_id, interval)

@router.get("/organization", response_model=OrganizationDashboardRead)
def get_organization_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.organization]))
):
    """جلب إحصائيات لوحة التحكم والرسوم البيانية للجمعية"""
    if not current_user.organization:
        raise HTTPException(status_code=400, detail="حساب الجمعية غير مكتمل")
    return OrganizationDashboardController.get_dashboard_stats(db, current_user.organization.org_id)
