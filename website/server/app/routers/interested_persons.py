"""
Interested Persons Router — Routes delegate to InterestedPersonsController.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import InterestedPersonUpdate, InterestedPersonRegister
from app.controllers.interested_persons_controller import InterestedPersonsController

router = APIRouter(prefix="/api/interested-persons", tags=["Interested Persons"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_interested_person(payload: InterestedPersonRegister, db: Session = Depends(get_db)):
    """تسجيل شخص مهتم جديد — ينشئ User + InterestedPerson في عملية واحدة"""
    return InterestedPersonsController.register(db, payload)


@router.get("/")
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
def get_interested_person(person_id: int, db: Session = Depends(get_db)):
    """جلب شخص مهتم بالـ ID"""
    return InterestedPersonsController.get_person(db, person_id)


@router.patch("/{person_id}")
def update_interested_person(person_id: int, payload: InterestedPersonUpdate, db: Session = Depends(get_db)):
    """تحديث بيانات الشخص المهتم"""
    return InterestedPersonsController.update_person(db, person_id, payload)


@router.delete("/{person_id}")
def delete_interested_person(person_id: int, db: Session = Depends(get_db)):
    """حذف شخص مهتم — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    return InterestedPersonsController.delete_person(db, person_id)
