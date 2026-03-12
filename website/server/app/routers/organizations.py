from fastapi import APIRouter, Depends, Query, status, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from datetime import date
from pydantic import EmailStr

from app.database import get_db
from app.schemas import OrganizationUpdate, OrganizationRegister
from app.controllers.organizations_controller import OrganizationsController
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_organization(
    email: EmailStr = Form(...),
    password: str = Form(...),
    password_confirm: str = Form(...),
    organization_name: str = Form(...),
    license_number: str = Form(...),
    establishment_date: date = Form(...),
    country_id: int = Form(...),
    governorate: str = Form(...),
    manager_name: str = Form(...),
    phone: str = Form(...),
    org_email: EmailStr = Form(...),
    license_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """تسجيل جمعية جديدة مع رفع ملف الترخيص"""
    payload = OrganizationRegister(
        email=email,
        password=password,
        password_confirm=password_confirm,
        organization_name=organization_name,
        license_number=license_number,
        establishment_date=establishment_date,
        country_id=country_id,
        governorate=governorate,
        manager_name=manager_name,
        phone=phone,
        org_email=org_email,
        license_file="placeholder" # سيتم استبداله في الكنترولر
    )
    return OrganizationsController.register(db, payload, license_file)

@router.get("/", dependencies=[Depends(check_role([UserRole.admin]))])
def list_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    approval: str | None = Query(None, description="Filter by approval_status"),
    db: Session = Depends(get_db),
):
    """قائمة كل الجمعيات"""
    return OrganizationsController.list_organizations(db, skip, limit, approval)

@router.get("/{org_id}")
def get_organization(org_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب جمعية بالـ ID"""
    if current_user.role != UserRole.admin:
         if not current_user.organization or current_user.organization.org_id != org_id:
             raise HTTPException(status_code=403, detail="لا يمكنك الوصول لبيانات جمعية أخرى")
    return OrganizationsController.get_organization(db, org_id)

@router.patch("/{org_id}")
def update_organization(org_id: int, payload: OrganizationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تحديث بيانات الجمعية"""
    if current_user.role != UserRole.admin:
         if not current_user.organization or current_user.organization.org_id != org_id:
             raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات جمعية أخرى")
         
         # منع المستخدم العادي من تعديل حالة الموافقة
         if payload.approval_status is not None or payload.rejection_reason is not None:
             raise HTTPException(status_code=403, detail="لا تملك صلاحية تعديل حالة الموافقة")
             
    return OrganizationsController.update_organization(db, org_id, payload)


@router.delete("/{org_id}", dependencies=[Depends(check_role([UserRole.admin]))])
def delete_organization(org_id: int, db: Session = Depends(get_db)):
    """حذف جمعية — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    return OrganizationsController.delete_organization(db, org_id)
