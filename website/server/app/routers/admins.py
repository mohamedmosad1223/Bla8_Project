"""
Admins Router — Routes delegate to AdminsController.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AdminUpdate, AdminRegister
from app.controllers.admins_controller import AdminsController

router = APIRouter(prefix="/api/admins", tags=["Admins"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_admin(payload: AdminRegister, db: Session = Depends(get_db)):
    """تسجيل أدمن جديد — ينشئ User + Admin في عملية واحدة"""
    return AdminsController.register(db, payload)


@router.get("/")
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
