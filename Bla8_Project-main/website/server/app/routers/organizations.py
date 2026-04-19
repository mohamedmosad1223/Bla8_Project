from fastapi import APIRouter, Depends, Query, status, HTTPException, File, UploadFile, Form, Response, Request
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import date
from pydantic import EmailStr, ValidationError
from datetime import datetime

from app.database import get_db
from app.schemas import OrganizationUpdate, OrganizationRegister
from app.controllers.organizations_controller import OrganizationsController
from app.controllers.profiles_controller import ProfilesController
from app.auth import get_current_user, check_role, get_optional_current_user
from app.models.user import User
from app.models.organization import Organization
from app.models.enums import UserRole, ApprovalStatus, AccountStatus

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
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
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
    return OrganizationsController.register(db, payload, license_file, admin_user=current_user)

@router.get("/", dependencies=[Depends(check_role([UserRole.admin]))])
def list_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    approval: Optional[ApprovalStatus] = Query(None, description="Filter by approval_status"),
    search: Optional[str] = Query(None, description="اسم الجمعية أو الرقم التعريفى"),
    country_id: Optional[int] = Query(None),
    governorate: Optional[str] = Query(None),
    created_after: Optional[datetime] = Query(None),
    created_before: Optional[datetime] = Query(None),
    status: Optional[AccountStatus] = Query(None),
    order_by: str = Query("latest", pattern="^(latest|oldest)$"),
    db: Session = Depends(get_db),
):
    """قائمة كل الجمعيات"""
    return OrganizationsController.list_organizations(
        db=db, skip=skip, limit=limit, 
        approval=approval, search=search,
        country_id=country_id, governorate=governorate,
        created_after=created_after, created_before=created_before,
        status=status,
        order_by=order_by
    )

@router.get("/{org_id}")
def get_organization(
    org_id: int, 
    trend_granularity: str = "month",
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """جلب جمعية بالـ ID"""
    if current_user.role != UserRole.admin:
         if not current_user.organization or current_user.organization.org_id != org_id:
             raise HTTPException(status_code=403, detail="لا يمكنك الوصول لبيانات جمعية أخرى")
    return OrganizationsController.get_organization(db, org_id, trend_granularity)

@router.patch("/{org_id}")
@router.post("/{org_id}")
async def update_organization(
    org_id: int, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    organization_name: Optional[str] = Form(None),
    license_number: Optional[str] = Form(None),
    manager_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[EmailStr] = Form(None),
    approval_status: Optional[ApprovalStatus] = Form(None),
    rejection_reason: Optional[str] = Form(None),
    license_file: Optional[UploadFile] = File(None)
):
    """تحديث بيانات الجمعية (يدعم JSON و Form)"""
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        try:
            payload_data = await request.json()
            payload = OrganizationUpdate(**payload_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {str(e)}")
            
        if current_user.role != UserRole.admin:
             if not current_user.organization or current_user.organization.org_id != org_id:
                 raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات جمعية أخرى")
             if payload.approval_status is not None or payload.rejection_reason is not None:
                 raise HTTPException(status_code=403, detail="لا تملك صلاحية تعديل حالة الموافقة")
                 
        return OrganizationsController.update_organization(db, org_id, payload, admin_user=current_user)

    # Handle Form Data
    org = db.query(Organization).filter(Organization.org_id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="الجمعية غير موجودة")

    if current_user.role != UserRole.admin:
         if not current_user.organization or current_user.organization.org_id != org_id:
             raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات جمعية أخرى")
         if approval_status is not None or rejection_reason is not None:
             raise HTTPException(status_code=403, detail="لا تملك صلاحية تعديل حالة الموافقة")

    update_dict = {}
    if organization_name: update_dict["organization_name"] = organization_name
    if license_number: update_dict["license_number"] = license_number
    if manager_name: update_dict["manager_name"] = manager_name
    if phone: update_dict["phone"] = phone
    if email: update_dict["email"] = email
    if approval_status: update_dict["approval_status"] = approval_status
    if rejection_reason: update_dict["rejection_reason"] = rejection_reason

    if license_file:
        from app.utils.file_handler import save_upload_file
        file_path = save_upload_file(license_file, "organizations/licenses")
        org.license_file = file_path

    try:
        payload = OrganizationUpdate(**update_dict)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if not update_dict and not license_file:
         raise HTTPException(status_code=400, detail="لم يتم إرسال بيانات لتحديثها")

    return OrganizationsController.update_organization(db, org_id, payload, admin_user=current_user)


@router.delete("/{org_id}", dependencies=[Depends(check_role([UserRole.admin]))])
def delete_organization(org_id: int, db: Session = Depends(get_db)):
    """حذف جمعية — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    return OrganizationsController.delete_organization(db, org_id)

@router.post("/logout")
def logout_organization(response: Response):
    """تسجيل خروج الجمعية ومسح كوكيز الجلسة"""
    response.delete_cookie("access_token")
    return ProfilesController.logout()
