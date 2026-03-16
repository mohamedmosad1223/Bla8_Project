from fastapi import APIRouter, Depends, Query, status, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import MuslimCallerUpdate, MuslimCallerRegister
from app.controllers.muslim_callers_controller import MuslimCallersController
from app.controllers.profiles_controller import ProfilesController
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter(prefix="/api/muslim-callers", tags=["Muslim Callers"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_muslim_caller(payload: MuslimCallerRegister, db: Session = Depends(get_db)):
    """تسجيل مسلم داعي جديد — ينشئ User + MuslimCaller في عملية واحدة"""
    return MuslimCallersController.register(db, payload)


@router.get("/", dependencies=[Depends(check_role([UserRole.admin]))])
def list_muslim_callers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    full_name: str | None = Query(None, description="بحث بالاسم"),
    db: Session = Depends(get_db),
):
    """قائمة كل المسلمين الدعاة"""
    return MuslimCallersController.list_callers(db, skip, limit, full_name)


@router.get("/{caller_id}")
def get_muslim_caller(caller_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب مسلم داعي بالـ ID"""
    if current_user.role != UserRole.admin:
        if not current_user.muslim_caller or current_user.muslim_caller.caller_id != caller_id:
            raise HTTPException(status_code=403, detail="لا يمكنك الوصول لبيانات داعي آخر")
    return MuslimCallersController.get_caller(db, caller_id)


@router.patch("/{caller_id}")
def update_muslim_caller(caller_id: int, payload: MuslimCallerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تحديث بيانات المسلم الداعي"""
    if current_user.role != UserRole.admin:
        if not current_user.muslim_caller or current_user.muslim_caller.caller_id != caller_id:
            raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات داعي آخر")
    return MuslimCallersController.update_caller(db, caller_id, payload)


@router.delete("/{caller_id}", dependencies=[Depends(check_role([UserRole.admin]))])
def delete_muslim_caller(caller_id: int, db: Session = Depends(get_db)):
    """حذف مسلم داعي — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    return MuslimCallersController.delete_caller(db, caller_id)

@router.post("/logout")
def logout_caller(response: Response):
    """تسجيل خروج المسلم الداعي ومسح كوكيز الجلسة"""
    response.delete_cookie("access_token")
    return ProfilesController.logout()
