from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas.schemas import AIChatMessageCreate, AIChatHistoryResponse
from app.controllers.chats_controller import ChatsController

router = APIRouter(prefix="/api/chat", tags=["Chats & AI"])

@router.get("/ai/history", response_model=AIChatHistoryResponse)
def get_ai_chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب تاريخ المحادثة مع المساعد الذكي (خاص بغير المسلمين)"""
    return ChatsController.get_ai_chat_history(db, current_user)

@router.post("/ai/send")
def send_ai_message(payload: AIChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """إرسال رسالة للمساعد الذكي واستلام رد آلي"""
    return ChatsController.send_ai_message(db, current_user, payload)

@router.get("/preachers")
def get_preacher_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب قائمة المحادثات مع الدعاة فقط"""
    return ChatsController.get_preacher_chats(db, current_user)
