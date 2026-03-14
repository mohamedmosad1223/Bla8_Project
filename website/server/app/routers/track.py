from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.enums import UserRole, CommunicationChannel
from app.controllers.dawah_requests_controller import DawahRequestsController

router = APIRouter(prefix="/api/track", tags=["Lead Tracking"])

@router.get("/{request_id}")
@router.get("/{request_id}/{channel}")
def track_and_redirect(
    request_id: int, 
    channel: CommunicationChannel | None = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """تسجيل نقرة التواصل وتحويل المستخدم للرابط الفعلي"""
    # التفويض: الدعاة فقط هم من يتتبعون روابطهم
    if current_user.role != UserRole.preacher:
        raise HTTPException(status_code=403, detail="هذا الإجراء متاح للدعاة فقط")
    
    preacher_id = current_user.preacher.preacher_id
    
    # تسجيل النقرة في الـ Controller (وتحويل الحالة لـ under_persuasion)
    res = DawahRequestsController.track_link_click(db, request_id, preacher_id, channel)
    request = res["data"]
    
    if not request.deep_link:
        raise HTTPException(status_code=400, detail="لا يوجد رابط تواصل مسجل لهذا الطلب")
        
    # التحويل للرابط الفعلي
    return RedirectResponse(url=request.deep_link)
