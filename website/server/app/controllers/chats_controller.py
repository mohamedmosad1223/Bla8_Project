from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.user import User
from app.models.ai_chat import AIChatMessage
from app.models.enums import UserRole
from app.controllers.messages_controller import MessagesController
from app.schemas.schemas import AIChatMessageCreate, AIChatMessageRead, GuestAIChatCreate
from app.utils.llm_service import LLMService

class ChatsController:

    WELCOME_MESSAGE = "مرحباً بك! أنا مساعد ذكي هنا للإجابة على استفساراتك حول الإسلام والتعريف به. كيف يمكنني مساعدتك اليوم؟"

    @staticmethod
    def get_ai_chat_history(db: Session, user: User):
        """جلب تاريخ المحادثة مع الذكاء الاصطناعي"""
        # السماح لجميع المسجلين (دعاة، مهتمين، إلخ) برؤية تاريخهم
        
        history = db.query(AIChatMessage).filter(AIChatMessage.user_id == user.user_id).order_by(AIChatMessage.created_at.asc()).all()
        
        return {
            "welcome_message": ChatsController.WELCOME_MESSAGE,
            "history": history
        }

    @staticmethod
    def send_ai_message(db: Session, user: User, payload: AIChatMessageCreate):
        """إرسال رسالة للذكاء الاصطناعي واستلام رد (تجريبي حالياً)"""
        # السماح لجميع المسجلين باستخدام الشات وحفظ رسائلهم


        # 1. Save User Message
        user_msg = AIChatMessage(
            user_id=user.user_id,
            role="user",
            content=payload.content
        )
        db.add(user_msg)
        db.commit() # Commit to get it in history, and also safely
        
        # 2. Fetch recent chat history to provide context to LLM (e.g. last 10 messages)
        recent_history = db.query(AIChatMessage).filter(AIChatMessage.user_id == user.user_id).order_by(AIChatMessage.created_at.desc()).limit(10).all()
        recent_history.reverse() # chronological order
        
        messages = []
        for msg in recent_history:
            # We map 'ai' to 'assistant' for OpenAI compatibility
            mapped_role = "assistant" if msg.role == "ai" else "user"
            messages.append({"role": mapped_role, "content": msg.content})
        
        # 3. Generate AI Response via LLM — pass user role for role-based prompt selection
        user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        ai_response_text = LLMService.generate_chat_response(messages, role=user_role)
        
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
    def send_guest_ai_message(db: Session, payload: GuestAIChatCreate):
        """إرسال رسالة للذكاء الاصطناعي كزائر وحفظها باستخدام session_id"""
        
        # 1. حفظ رسالة الزائر في الداتا بيز
        user_msg = AIChatMessage(
            session_id=payload.session_id,
            role="user",
            content=payload.message
        )
        db.add(user_msg)
        db.commit()
        
        # 2. جلب المحادثات السابقة باستخدام session_id
        recent_history = db.query(AIChatMessage).filter(AIChatMessage.session_id == payload.session_id).order_by(AIChatMessage.created_at.desc()).limit(10).all()
        recent_history.reverse()
        
        messages = []
        for msg in recent_history:
            mapped_role = "assistant" if msg.role == "ai" else "user"
            messages.append({"role": mapped_role, "content": msg.content})
            
        # 3. إرسال الرسائل للذكاء الاصطناعي (الزوار دائماً يأخذون برومبت الغير مسلم)
        ai_response_text = LLMService.generate_chat_response(messages, role="guest")
        
        # 4. حفظ رد الذكاء الاصطناعي
        ai_msg = AIChatMessage(
            session_id=payload.session_id,
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
    def cleanup_guest_chats(db: Session, user=None, days: int = 30, system_run: bool = False):
        """حذف رسائل الزوار (بدون حساب) الأقدم من 30 يوم"""
        if not system_run:
            if user is None or user.role != UserRole.admin:
                raise HTTPException(status_code=403, detail="هذا الجزء مخصص للمديرين فقط")
            
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        deleted_count = db.query(AIChatMessage).filter(
            AIChatMessage.user_id.is_(None),
            AIChatMessage.created_at < cutoff
        ).delete(synchronize_session=False)
        db.commit()
        
        return {"message": f"تم حذف {deleted_count} رسالة من الزوار أقدم من {days} يوم(أيام)"}

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
