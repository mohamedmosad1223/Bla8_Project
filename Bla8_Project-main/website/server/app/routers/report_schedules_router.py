from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth import check_role
from app.models.user import User
from app.models.enums import UserRole
from app.controllers.report_schedules_controller import ReportSchedulesController
from app.schemas.schemas import ReportScheduleRead, ReportScheduleCreate

router = APIRouter(prefix="/api/report-schedules", tags=["Report Schedules"])


@router.post("/", response_model=ReportScheduleRead, status_code=status.HTTP_201_CREATED)
def create_schedule(
    data: ReportScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.admin]))
):
    """
    إنشاء جدول تقرير جديد (للأدمن فقط).
    """
    return ReportSchedulesController.create_schedule(db, current_user, data)


@router.get("/", response_model=List[ReportScheduleRead])
def list_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.admin]))
):
    """
    عرض جداول التقارير الخاصة بالمستخدم الحالي.
    """
    return ReportSchedulesController.list_schedules(db, current_user)


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.admin]))
):
    """
    حذف جدول تقرير.
    """
    return ReportSchedulesController.delete_schedule(db, current_user, schedule_id)
