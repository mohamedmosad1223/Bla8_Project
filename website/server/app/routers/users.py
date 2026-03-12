from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import UserUpdate
from app.controllers.users_controller import UsersController
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", dependencies=[Depends(check_role([UserRole.admin]))])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: str | None = Query(None, description="Filter by role"),
    status: str | None = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
):
    """قائمة كل المستخدمين — مع فلترة حسب الدور والحالة"""
    return UsersController.list_users(db, skip, limit, role, status)


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب مستخدم واحد بالـ ID"""
    if current_user.role != UserRole.admin and current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="لا يمكنك الوصول لبيانات مستخدم آخر")
    return UsersController.get_user(db, user_id)


@router.patch("/{user_id}")
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تحديث بيانات المستخدم الأساسية (email / status)"""
    if current_user.role != UserRole.admin and current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات مستخدم آخر")
    return UsersController.update_user(db, user_id, payload)


@router.delete("/{user_id}", dependencies=[Depends(check_role([UserRole.admin]))])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """حذف مستخدم (soft delete — يضع deleted_at)"""
    return UsersController.delete_user(db, user_id)
