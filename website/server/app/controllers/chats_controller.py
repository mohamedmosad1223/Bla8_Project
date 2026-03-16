from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.user import User
from app.models.ai_chat import AIChatMessage
from app.models.enums import UserRole
from app.controllers.messages_controller import MessagesController
from app.schemas.schemas import AIChatMessageCreate, AIChatMessageRead

class ChatsController:

    WELCOME_MESSAGE = "مرحباً بك! أنا مساعد ذكي هنا للإجابة على استفساراتك حول الإسلام والتعريف به. كيف يمكنني مساعدتك اليوم؟"

    @staticmethod
    def get_ai_chat_history(db: Session, user: User):
        """جلب تاريخ المحادثة مع الذكاء الاصطناعي"""
        if user.role != UserRole.interested:
            raise HTTPException(status_code=403, detail="هذا الجزء مخصص للأشخاص المهتمين فقط")
        
        history = db.query(AIChatMessage).filter(AIChatMessage.user_id == user.user_id).order_by(AIChatMessage.created_at.asc()).all()
        
        return {
            "welcome_message": ChatsController.WELCOME_MESSAGE,
            "history": history
        }

    @staticmethod
    def send_ai_message(db: Session, user: User, payload: AIChatMessageCreate):
        """إرسال رسالة للذكاء الاصطناعي واستلام رد (تجريبي حالياً)"""
        if user.role != UserRole.interested:
            raise HTTPException(status_code=403, detail="هذا الجزء مخصص للأشخاص المهتمين فقط")

        # 1. Save User Message
        user_msg = AIChatMessage(
            user_id=user.user_id,
            role="user",
            content=payload.content
        )
        db.add(user_msg)
        
        # 2. Mock AI Response (Placeholder as requested: "عايزينه حاليا فاضي")
        ai_response_text = "شكراً لرسالتك. أنا في طور التطور حالياً وسأكون قادراً على الإجابة على استفساراتك العميقة قريباً جداً. هل لديك أي سؤال آخر؟"
        
        ai_msg = AIChatMessage(
            user_id=user.user_id,
            role="ai",
            content=ai_response_text
        )
        db.add(ai_msg)
        
        db.commit()
        db.refresh(ai_msg)
        
        return {
            "user_message": user_msg,
            "ai_response": ai_msg
        }

    @staticmethod
    def get_preacher_chats(db: Session, user: User):
        """جلب محادثات المستخدم مع الدعاة فقط"""
        # We reuse the existing preview logic
        all_chats_response = MessagesController.get_my_chats_preview(db, user.user_id, user.role)
        all_chatsData = all_chats_response.get("data", [])
        
        # Filter for chats involving preachers
        # Since get_my_chats_preview labels them in other_party_name or we can deduce from role
        # However, a cleaner way might be to filter by the role of the other user in DMs
        # For request-based chats, the other party IS usually a preacher for interested persons.
        
        preacher_chats = []
        for chat in all_chatsData:
            # If it's a request, it's already between Submitter and Preacher
            if not chat["is_direct"]:
                preacher_chats.append(chat)
            else:
                # For DMs, check if partner is a preacher
                partner_user = db.query(User).filter(User.user_id == chat["other_user_id"]).first()
                if partner_user and partner_user.role == UserRole.preacher:
                    preacher_chats.append(chat)
                    
        return {
            "message": "تم جلب المحادثات مع الدعاة بنجاح",
            "data": preacher_chats
        }
