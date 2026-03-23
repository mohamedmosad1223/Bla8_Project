from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas.schemas import (
    AIChatMessageCreate, AIChatHistoryResponse, GuestAIChatCreate,
    AIChatConversationCreate, AIChatConversationRead, AIChatConversationListResponse
)
from app.controllers.chats_controller import ChatsController

router = APIRouter(prefix="/api/chat", tags=["Chats & AI"])

@router.get("/ai/history", response_model=AIChatHistoryResponse)
def get_ai_chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب تاريخ المحادثة مع المساعد الذكي (خاص بغير المسلمين)"""
    return ChatsController.get_ai_chat_history(db, current_user)

@router.post("/ai/send")
def send_ai_message(payload: AIChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """إرسال رسالة للمساعد الذكي واستلام رد آلي (للمسجلين)"""
    return ChatsController.send_ai_message(db, current_user, payload)

@router.post("/ai/guest/send")
def send_guest_ai_message(payload: GuestAIChatCreate, db: Session = Depends(get_db)):
    """إرسال رسالة للمساعد الذكي للزوار (بدون تسجيل)"""
    return ChatsController.send_guest_ai_message(db, payload)

@router.delete("/ai/guest/cleanup")
def cleanup_guest_chats(days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """حذف رسائل الزوار الأقدم من 30 يوم (للمدراء)"""
    return ChatsController.cleanup_guest_chats(db, current_user, days)

@router.post("/analytics/send")
def send_analytics_ai_message(payload: AIChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """شات تحليل الأداء الخاص بوزير الأوقاف ومشرفي الجمعيات — Read-Only آمن"""
    return ChatsController.send_analytics_ai_message(db, current_user, payload)

@router.get("/preachers")
def get_preacher_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب قائمة المحادثات مع الدعاة فقط"""
    return ChatsController.get_preacher_chats(db, current_user)

@router.delete("/ai/history/clear")
def clear_ai_chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """مسح تاريخ المحادثة بالكامل لبدء شات جديد"""
    return ChatsController.clear_my_ai_chat_history(db, current_user)

# ─── New Multi-Session Conversations ───────────────────────────────────────

@router.get("/conversations", response_model=AIChatConversationListResponse)
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب قائمة جلسات المحادثة للمستخدم"""
    return ChatsController.list_conversations(db, current_user)

@router.post("/conversations", response_model=AIChatConversationRead)
def create_conversation(payload: AIChatConversationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """إنشاء جلسة محادثة جديدة"""
    return ChatsController.create_conversation(db, current_user, payload)

@router.get("/conversations/{conversation_id}/messages", response_model=AIChatHistoryResponse)
def get_conversation_messages(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب سجل الرسائل لجلسة محادثة معينة"""
    return ChatsController.get_conversation_messages(db, current_user, conversation_id)

@router.post("/conversations/{conversation_id}/messages")
def send_message_to_conversation(conversation_id: int, payload: AIChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """إرسال رسالة داخل جلسة محادثة معينة (تكملة الكلام)"""
    payload.conversation_id = conversation_id
    return ChatsController.send_ai_message(db, current_user, payload)
