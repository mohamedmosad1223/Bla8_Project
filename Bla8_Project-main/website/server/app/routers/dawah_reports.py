from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.schemas import DawahReportCreate, DawahReportRead
from app.controllers.dawah_reports_controller import DawahReportsController

router = APIRouter(prefix="/api/dawah-reports", tags=["Dawah Reports"])

@router.post("/", response_model=None, status_code=status.HTTP_201_CREATED)
def create_daily_report(
    payload: DawahReportCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """تسجيل تقرير يومي عن طلب (متاح للدعاة فقط)"""
    if current_user.role != UserRole.preacher:
        raise HTTPException(status_code=403, detail="هذا الإجراء متاح للدعاة فقط")
    
    preacher_id = current_user.preacher.preacher_id
    return DawahReportsController.create_report(db, preacher_id, payload)

@router.get("/{request_id}", response_model=None)
def get_reports(
    request_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """جلب قائمة التقارير لطلب معين (مُأمن بصلاحيات)"""
    # التفويض (Authorization)
    # المسموح لهم: الأدمن، الجمعية، والداعية صاحب الطلب
    return DawahReportsController.list_reports(db, request_id, current_user)
