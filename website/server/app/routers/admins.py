"""
Admins Router — Routes delegate to AdminsController.
"""

from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import EmailStr

from app.database import get_db
from app.schemas import (
    AdminUpdate, AdminRegister, AdminProfileRead, AdminProfileUpdate, 
    AdminUpdateStatusRequest, AdminOrganizationListRead, AdminOrganizationDetailRead,
    AdminPreacherListRead, AdminPreacherDetailRead, OrganizationRegister,
    ChangePasswordRequest, AdminLanguageUpdate, AdminDeleteAccountRequest
)
from app.controllers.admins_controller import AdminsController
from app.controllers.admin_management_controller import AdminManagementController
from app.controllers.profiles_controller import ProfilesController
from app.auth import check_role, get_current_user
from app.models.enums import UserRole, ApprovalStatus, PreacherType, PreacherStatus
from app.models.user import User

router = APIRouter(
    prefix="/api/admins",
    tags=["Admins"],
    dependencies=[Depends(check_role([UserRole.admin]))]
)


@router.get("/me", response_model=AdminProfileRead)
def get_current_admin_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب بيانات الملف الشخصي للأدمن الحالي"""
    # Allowed for both admin and super_admin
    return AdminsController.get_admin_profile(db, current_user.user_id)

@router.patch("/me")
def update_current_admin_profile(
    full_name: Optional[str] = Form(None),
    email: Optional[EmailStr] = Form(None),
    phone: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """تحديث بيانات الملف الشخصي للأدمن الحالي"""
    payload = AdminProfileUpdate(
        full_name=full_name,
        email=email,
        phone=phone
    )
    return AdminsController.update_admin_profile(db, current_user.user_id, payload, profile_picture)

@router.post("/me/change-password")
def change_self_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تغيير كلمة المرور (يدعم الباسورد القديم أو الـ OTP)"""
    return AdminsController.change_self_password(db, current_user, payload)

@router.patch("/me/languages")
def update_self_languages(payload: AdminLanguageUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تحديث لغات الأدمن"""
    return AdminsController.sync_admin_languages(db, current_user.user_id, payload)

@router.post("/me/delete-account")
def delete_self_account(payload: AdminDeleteAccountRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """حذف الحساب (تعطيل نهائي) بعد التأكد من الباسورد"""
    return AdminsController.delete_self_account(db, current_user, payload)

@router.post("/logout")
def logout_admin(response: Response):
    """تسجيل خروج الأدمن ومسح كوكيز الجلسة"""
    response.delete_cookie("access_token")
    return ProfilesController.logout()

@router.post("/register", status_code=status.HTTP_201_CREATED, dependencies=[Depends(check_role([UserRole.admin]))])
def register_admin(payload: AdminRegister, db: Session = Depends(get_db)):
    """تسجيل أدمن جديد — ينشئ User + Admin في عملية واحدة"""
    return AdminsController.register(db, payload)


@router.get("/", dependencies=[Depends(check_role([UserRole.admin]))])
def list_admins(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """قائمة كل الأدمنز"""
    return AdminsController.list_admins(db, skip, limit)


@router.get("/{admin_id}")
def get_admin(admin_id: int, db: Session = Depends(get_db)):
    """جلب أدمن بالـ ID"""
    return AdminsController.get_admin(db, admin_id)


@router.patch("/{admin_id}")
def update_admin(admin_id: int, payload: AdminUpdate, db: Session = Depends(get_db)):
    """تحديث بيانات الأدمن"""
    return AdminsController.update_admin(db, admin_id, payload)


@router.delete("/{admin_id}")
def delete_admin(admin_id: int, db: Session = Depends(get_db)):
    """حذف أدمن — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    return AdminsController.delete_admin(db, admin_id)


# ─── Management (Organizations & Preachers) ──────────────────────────────

@router.get("/management/organizations", response_model=List[AdminOrganizationListRead])
def list_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="اسم الجمعية أو الرقم التعريفى"),
    approval_status: Optional[ApprovalStatus] = Query(None),
    created_after: Optional[datetime] = Query(None),
    created_before: Optional[datetime] = Query(None),
    order_by: str = Query("latest", regex="^(latest|oldest)$"),
    db: Session = Depends(get_db)
):
    """قائمة الجمعيات مع إحصائيات (للأدمن)"""
    return AdminManagementController.list_organizations(
        db, skip, limit, search, 
        approval_status, created_after, 
        created_before, order_by
    )

@router.get("/management/organizations/{org_id}", response_model=AdminOrganizationDetailRead)
def get_organization_details(org_id: int, db: Session = Depends(get_db)):
    """تفاصيل الجمعية مع الرسوم البيانية (للأدمن)"""
    return AdminManagementController.get_organization_details(db, org_id)

@router.post("/management/organizations", status_code=status.HTTP_201_CREATED)
def admin_register_organization(payload: OrganizationRegister, db: Session = Depends(get_db)):
    """إضافة جمعية مباشرة من قبل الأدمن (تكون مفعلة فوراً)"""
    return AdminManagementController.admin_register_organization(db, payload)

@router.patch("/management/organizations/{org_id}/status")
def toggle_org_status(org_id: int, payload: AdminUpdateStatusRequest, db: Session = Depends(get_db)):
    """تفعيل/تعطيل حساب الجمعية"""
    return AdminManagementController.toggle_org_status(db, org_id, payload.status)

@router.get("/management/preachers", response_model=List[AdminPreacherListRead])
def list_preachers(
    org_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="اسم الداعية أو الرقم التعريفى"),
    type: Optional[PreacherType] = Query(None),
    status: Optional[PreacherStatus] = Query(None),
    languages: List[int] = Query([], description="قائمة معرفات اللغات (فلترة متعددة)"),
    joined_after: Optional[datetime] = Query(None),
    joined_before: Optional[datetime] = Query(None),
    order_by: str = Query("latest", regex="^(latest|oldest)$"),
    db: Session = Depends(get_db)
):
    """قائمة كل الدعاة (أو تابعين لجمعية) مع إحصائيات"""
    return AdminManagementController.list_preachers(
        db=db, org_id=org_id, skip=skip, limit=limit, 
        search=search, type=type, status=status,
        languages=languages, joined_after=joined_after,
        joined_before=joined_before, order_by=order_by
    )

@router.get("/management/preachers/{preacher_id}", response_model=AdminPreacherDetailRead)
def get_preacher_details(preacher_id: int, db: Session = Depends(get_db)):
    """تفاصيل الداعية مع الرسوم البيانية (للأدمن)"""
    return AdminManagementController.get_preacher_details(db, preacher_id)

@router.patch("/management/preachers/{preacher_id}/status")
def toggle_preacher_status(preacher_id: int, payload: AdminUpdateStatusRequest, db: Session = Depends(get_db)):
    """تفعيل/تعطيل حساب الداعية"""
    return AdminManagementController.toggle_preacher_status(db, preacher_id, payload.status)
