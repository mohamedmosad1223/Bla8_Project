"""
Preachers Router — Routes delegate to PreachersController.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import PreacherType, PreacherStatus, GenderType, ApprovalStatus, UserRole
from app.schemas import PreacherUpdate, PreacherRegister
from app.controllers.preachers_controller import PreachersController
from app.auth import check_role, get_optional_current_user, get_current_user
from app.models.user import User
from app.models.preacher import Preacher

router = APIRouter(
    prefix="/api/preachers",
    tags=["Preachers"]
)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_preacher(payload: PreacherRegister, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_optional_current_user)):
    """تسجيل داعية — لو رسمي الجمعية بتضيفه، لو متطوع بيسجل نفسه"""
    return PreachersController.register(db, payload, current_user)


@router.get("/", dependencies=[Depends(check_role([UserRole.admin, UserRole.organization]))])
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


@router.patch("/{preacher_id}", dependencies=[Depends(check_role([UserRole.admin, UserRole.organization, UserRole.preacher]))])
def update_preacher(preacher_id: int, payload: PreacherUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تحديث بيانات الداعية"""
    # التحقق من الصلاحيات
    # لو أدمن: تمام
    # لو جمعية: لازم الداعية يكون تبعها
    # لو داعية: لازم يكون هو نفسه
    
    preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
    if not preacher:
        raise HTTPException(status_code=404, detail="الداعية غير موجود")

    if current_user.role == UserRole.admin:
        pass
    elif current_user.role == UserRole.organization:
        if preacher.org_id != current_user.organization.org_id:
            raise HTTPException(status_code=403, detail="لا يمكنك تعديل داعية لا ينتمي لجمعيتك")
    elif current_user.role == UserRole.preacher:
        if preacher.preacher_id != current_user.preacher.preacher_id:
            raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات داعية آخر")
            
    return PreachersController.update_preacher(db, preacher_id, payload)


@router.delete("/{preacher_id}", dependencies=[Depends(check_role([UserRole.admin, UserRole.organization]))])
def delete_preacher(preacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """حذف داعية — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
    if not preacher:
         raise HTTPException(status_code=404, detail="الداعية غير موجود")

    if current_user.role == UserRole.organization:
        if preacher.org_id != current_user.organization.org_id:
            raise HTTPException(status_code=403, detail="لا يمكنك حذف داعية لا ينتمي لجمعيتك")

    return PreachersController.delete_preacher(db, preacher_id)
