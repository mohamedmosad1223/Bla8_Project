from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.schemas import MessageCreate, MessageRead, ChatPreviewRead
from app.controllers.messages_controller import MessagesController
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter(prefix="/api/messages", tags=["Messages & Chat"])

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=None)
def send_message(payload: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """إرسال رسالة جديدة في محادثة طلب قائم"""
    return MessagesController.send_message(db, current_user, payload)

@router.get("/chat-history/{request_id}", response_model=None)
def get_chat_history(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب سجل الرسائل لطلب معين (بين الداعية والمدعو)"""
    return MessagesController.get_chat_history(db, current_user.user_id, request_id=request_id)

@router.get("/dm-history/{other_user_id}", response_model=None)
def get_dm_history(other_user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب سجل الرسائل المباشرة (مثلاً بين الجمعية والداعية)"""
    return MessagesController.get_chat_history(db, current_user.user_id, other_user_id=other_user_id)

@router.get("/my-chats", response_model=None)
def get_my_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب قائمة بكل المحادثات النشطة للمستخدم الحالي (Tab المحادثات)"""
    return MessagesController.get_my_chats_preview(db, current_user.user_id, current_user.role)
