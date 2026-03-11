"""
Organizations Router — Routes delegate to OrganizationsController.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import OrganizationUpdate, OrganizationRegister
from app.controllers.organizations_controller import OrganizationsController
from app.auth import check_role
from app.models.enums import UserRole

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_organization(payload: OrganizationRegister, db: Session = Depends(get_db)):
    """تسجيل جمعية جديدة — ينشئ User + Organization في عملية واحدة"""
    return OrganizationsController.register(db, payload)


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
def get_organization(org_id: int, db: Session = Depends(get_db)):
    """جلب جمعية بالـ ID"""
    return OrganizationsController.get_organization(db, org_id)


@router.patch("/{org_id}")
def update_organization(org_id: int, payload: OrganizationUpdate, db: Session = Depends(get_db)):
    """تحديث بيانات الجمعية"""
    return OrganizationsController.update_organization(db, org_id, payload)


@router.delete("/{org_id}", dependencies=[Depends(check_role([UserRole.admin]))])
def delete_organization(org_id: int, db: Session = Depends(get_db)):
    """حذف جمعية — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    return OrganizationsController.delete_organization(db, org_id)
