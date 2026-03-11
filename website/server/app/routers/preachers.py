"""
Preachers Router — Routes delegate to PreachersController.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import PreacherType, PreacherStatus, GenderType, ApprovalStatus
from app.schemas import PreacherUpdate, PreacherRegister
from app.controllers.preachers_controller import PreachersController

router = APIRouter(prefix="/api/preachers", tags=["Preachers"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_preacher(payload: PreacherRegister, db: Session = Depends(get_db)):
    """تسجيل داعية جديد — ينشئ User + Preacher في عملية واحدة"""
    return PreachersController.register(db, payload)


@router.get("/")
def list_preachers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    full_name: Optional[str] = Query(None, description="بحث بالاسم"),
    type: Optional[PreacherType] = Query(None),
    preacher_status: Optional[PreacherStatus] = Query(None, alias="status"),
    gender: Optional[GenderType] = Query(None),
    approval_status: Optional[ApprovalStatus] = Query(None),
    nationality_country_id: Optional[int] = Query(None),
    org_id: Optional[int] = Query(None, description="Filter by organization"),
    db: Session = Depends(get_db),
):
    """قائمة الدعاة — مع فلترة متقدمة"""
    return PreachersController.list_preachers(
        db, skip, limit, full_name, type,
        preacher_status, gender, approval_status,
        nationality_country_id, org_id,
    )


@router.get("/{preacher_id}")
def get_preacher(preacher_id: int, db: Session = Depends(get_db)):
    """جلب داعية بالـ ID"""
    return PreachersController.get_preacher(db, preacher_id)


@router.patch("/{preacher_id}")
def update_preacher(preacher_id: int, payload: PreacherUpdate, db: Session = Depends(get_db)):
    """تحديث بيانات الداعية"""
    return PreachersController.update_preacher(db, preacher_id, payload)


@router.delete("/{preacher_id}")
def delete_preacher(preacher_id: int, db: Session = Depends(get_db)):
    """حذف داعية — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    return PreachersController.delete_preacher(db, preacher_id)
