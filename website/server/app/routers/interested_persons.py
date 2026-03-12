from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import InterestedPersonUpdate, InterestedPersonRegister
from app.controllers.interested_persons_controller import InterestedPersonsController
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter(prefix="/api/interested-persons", tags=["Interested Persons"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_interested_person(payload: InterestedPersonRegister, db: Session = Depends(get_db)):
    """تسجيل شخص مهتم جديد — ينشئ User + InterestedPerson في عملية واحدة"""
    return InterestedPersonsController.register(db, payload)


@router.get("/", dependencies=[Depends(check_role([UserRole.admin]))])
def list_interested_persons(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    first_name: str | None = Query(None, description="بحث بالاسم الأول"),
    last_name: str | None = Query(None, description="بحث بالاسم الأخير"),
    db: Session = Depends(get_db),
):
    """قائمة كل المهتمين"""
    return InterestedPersonsController.list_persons(db, skip, limit, first_name, last_name)


@router.get("/{person_id}")
def get_interested_person(person_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب شخص مهتم بالـ ID"""
    if current_user.role != UserRole.admin:
        if not current_user.interested_person or current_user.interested_person.person_id != person_id:
            raise HTTPException(status_code=403, detail="لا يمكنك الوصول لبيانات شخص آخر")
    return InterestedPersonsController.get_person(db, person_id)


@router.patch("/{person_id}")
def update_interested_person(person_id: int, payload: InterestedPersonUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تحديث بيانات الشخص المهتم"""
    if current_user.role != UserRole.admin:
        if not current_user.interested_person or current_user.interested_person.person_id != person_id:
            raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات شخص آخر")
    return InterestedPersonsController.update_person(db, person_id, payload)


@router.delete("/{person_id}", dependencies=[Depends(check_role([UserRole.admin]))])
def delete_interested_person(person_id: int, db: Session = Depends(get_db)):
    """حذف شخص مهتم — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    return InterestedPersonsController.delete_person(db, person_id)
