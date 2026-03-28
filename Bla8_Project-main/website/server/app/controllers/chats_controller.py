from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.user import User
from app.models.ai_chat import AIChatMessage, AIChatConversation
from app.models.enums import UserRole
from app.controllers.messages_controller import MessagesController
from app.schemas.schemas import (
    AIChatMessageCreate, AIChatMessageRead, GuestAIChatCreate,
    AIChatConversationCreate, AIChatConversationRead, AIChatConversationListResponse
)
from app.utils.llm_service import LLMService
from app.utils.analytics_service import AnalyticsAIOrchestrator

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
        """إرسال رسالة للذكاء الاصطناعي واستلام رد (يدعم الجلسات المتعددة)"""
        # 1. إعداد الجلسة (Conversation)
        conversation_id = payload.conversation_id
        if not conversation_id:
            title_text = payload.content[:30] + ("..." if len(payload.content) > 30 else "")
            new_conv = AIChatConversation(user_id=user.user_id, title=title_text)
            db.add(new_conv)
            db.commit()
            db.refresh(new_conv)
            conversation_id = new_conv.id

        # 2. حفظ رسالة المستخدم
        user_msg = AIChatMessage(
            user_id=user.user_id,
            conversation_id=conversation_id,
            role="user",
            content=payload.content
        )
        db.add(user_msg)
        db.commit()
        
        # 3. جلب تاريخ المحادثة في هذه الجلسة تحديداً
        recent_history = (
            db.query(AIChatMessage)
            .filter(AIChatMessage.conversation_id == conversation_id)
            .order_by(AIChatMessage.created_at.desc())
            .limit(10)
            .all()
        )
        recent_history.reverse()
        
        messages = []
        for msg in recent_history:
            mapped_role = "assistant" if msg.role == "ai" else "user"
            messages.append({"role": mapped_role, "content": msg.content})
        
        # 4. استدعاء الـ LLM واصطناع رد
        user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        ai_response_text = LLMService.generate_chat_response(messages, role=user_role)
        
        # 5. حفظ رد الذكاء الاصطناعي في نفس الجلسة
        ai_msg = AIChatMessage(
            user_id=user.user_id,
            conversation_id=conversation_id,
            role="ai",
            content=ai_response_text
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)

        return {
            "user_message": user_msg,
            "ai_response": ai_msg,
            "conversation_id": conversation_id
        }
        
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
    def send_ai_message_stream(db: Session, user: User, payload: AIChatMessageCreate):
        """إرسال رسالة للذكاء الاصطناعي مع دعم الـ Streaming للمسجلين"""
        # 1. إعداد الجلسة
        conversation_id = payload.conversation_id
        if not conversation_id:
            title_text = payload.content[:30] + ("..." if len(payload.content) > 30 else "")
            new_conv = AIChatConversation(user_id=user.user_id, title=title_text)
            db.add(new_conv)
            db.commit()
            db.refresh(new_conv)
            conversation_id = new_conv.id

        # 2. حفظ رسالة المستخدم
        user_msg = AIChatMessage(
            user_id=user.user_id,
            conversation_id=conversation_id,
            role="user",
            content=payload.content
        )
        db.add(user_msg)
        db.commit()

        # 3. جلب التاريخ
        recent_history = db.query(AIChatMessage).filter(AIChatMessage.conversation_id == conversation_id).order_by(AIChatMessage.created_at.desc()).limit(11).all()
        recent_history.reverse()
        
        messages = []
        for msg in recent_history:
            mapped_role = "assistant" if msg.role == "ai" else "user"
            messages.append({"role": mapped_role, "content": msg.content})

        # 4. الـ Generator اللي هيعمل الـ Stream ويسيف في الآخر
        def stream_generator():
            full_response = ""
            user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
            
            for chunk in LLMService.generate_chat_response_stream(messages, role=user_role):
                full_response += chunk
                # استخدام صيغة SSE (Server-Sent Events) لتجنب الـ Buffering
                yield f"data: {chunk}\n\n"
            
            # 5. حفظ الرد الكامل بعد انتهاء الستريم
            if full_response:
                ai_msg = AIChatMessage(
                    user_id=user.user_id,
                    conversation_id=conversation_id,
                    role="ai",
                    content=full_response
                )
                db.add(ai_msg)
                db.commit()

        return stream_generator()

    @staticmethod
    def send_guest_ai_message_stream(db: Session, payload: GuestAIChatCreate):
        """إرسال رسالة للذكاء الاصطناعي مع دعم الـ Streaming للزوار"""
        # 1. حفظ رسالة الزائر
        user_msg = AIChatMessage(
            session_id=payload.session_id,
            role="user",
            content=payload.message
        )
        db.add(user_msg)
        db.commit()

        # 2. جلب التاريخ
        recent_history = db.query(AIChatMessage).filter(AIChatMessage.session_id == payload.session_id).order_by(AIChatMessage.created_at.desc()).limit(11).all()
        recent_history.reverse()
        
        messages = []
        for msg in recent_history:
            mapped_role = "assistant" if msg.role == "ai" else "user"
            messages.append({"role": mapped_role, "content": msg.content})

        def stream_generator():
            full_response = ""
            for chunk in LLMService.generate_chat_response_stream(messages, role="guest"):
                full_response += chunk
                yield f"data: {chunk}\n\n"
            
            if full_response:
                ai_msg = AIChatMessage(
                    session_id=payload.session_id,
                    role="ai",
                    content=full_response
                )
                db.add(ai_msg)
                db.commit()

        return stream_generator()
        
    @staticmethod
    def get_guest_ai_chat_history(db: Session, session_id: str):
        """جلب تاريخ المحادثة للزائر باستخدام session_id"""
        history = db.query(AIChatMessage).filter(AIChatMessage.session_id == session_id).order_by(AIChatMessage.created_at.asc()).all()
        
        # إذا كان التاريخ فارغ، أضف رسالة ترحيبية
        if not history:
            welcome_msg = AIChatMessage(
                session_id=session_id,
                role="ai",
                content="أهلاً 👋 أنا مساعدك. كيف يمكنني مساعدتك اليوم؟"
            )
            db.add(welcome_msg)
            db.commit()
            db.refresh(welcome_msg)
            history = [welcome_msg]
        
        return {"history": history}

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
    def create_conversation(db: Session, user: User, payload: AIChatConversationCreate):
        """إنشاء جلسة محادثة جديدة"""
        conversation = AIChatConversation(
            user_id=user.user_id,
            title=payload.title or "محادثة جديدة"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation

    @staticmethod
    def list_conversations(db: Session, user: User):
        """جلب قائمة جلسات المحادثة للمستخدم"""
        conversations = db.query(AIChatConversation).filter(
            AIChatConversation.user_id == user.user_id
        ).order_by(AIChatConversation.created_at.desc()).all()
        return {"conversations": conversations}

    @staticmethod
    def get_conversation_messages(db: Session, user: User, conversation_id: int):
        """جلب الرسائل داخل جلسة محادثة معينة"""
        conv = db.query(AIChatConversation).filter(
            AIChatConversation.id == conversation_id,
            AIChatConversation.user_id == user.user_id
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="الجلسة غير موجودة")
        
        messages = db.query(AIChatMessage).filter(
            AIChatMessage.conversation_id == conversation_id
        ).order_by(AIChatMessage.created_at.asc()).all()
        
        return {"history": messages, "welcome_message": f"مرحباً بك في جلسة: {conv.title}"}

    @staticmethod
    def send_analytics_ai_message(db: Session, user: User, payload: AIChatMessageCreate):
        """شات تحليلي خاص بوزير الأوقاف ومشرف الجمعية — Read-Only آمن 100%"""
        user_role_val = user.role.value if hasattr(user.role, 'value') else str(user.role)

        # تأكد من الصلاحية
        if user_role_val not in ("minister", "organization"):
            raise HTTPException(status_code=403, detail="هذا الشات مخصص لوزير الأوقاف ومشرفي الجمعيات فقط.")

        # لو كان مشرف جمعية → جيب org_id تلقائياً
        org_id: Optional[int] = None
        if user_role_val == "organization":
            from app.models.organization import Organization
            org = db.query(Organization).filter(Organization.user_id == user.user_id).first()
            if org:
                org_id = org.org_id

        # 1. إعداد الجلسة (Conversation)
        conversation_id = payload.conversation_id
        if not conversation_id:
            # لو لم يتم إرسال id جلسة، انشئ واحدة جديدة بعنوان مقتبس من الرسالة
            title_text = payload.content[:30] + ("..." if len(payload.content) > 30 else "")
            new_conv = AIChatConversation(user_id=user.user_id, title=title_text)
            db.add(new_conv)
            db.commit()
            db.refresh(new_conv)
            conversation_id = new_conv.id

        # 1. حفظ رسالة المستخدم
        user_msg = AIChatMessage(
            user_id=user.user_id,
            conversation_id=conversation_id,
            role="user",
            content=payload.content
        )
        db.add(user_msg)
        db.commit()

        # 2. جلب تاريخ المحادثة (آخر 10 رسائل في هذه الجلسة تحديداً)
        recent_history = (
            db.query(AIChatMessage)
            .filter(AIChatMessage.conversation_id == conversation_id)
            .order_by(AIChatMessage.created_at.desc())
            .limit(10)
            .all()
        )
        recent_history.reverse()

        messages = []
        for msg in recent_history:
            mapped_role = "assistant" if msg.role == "ai" else "user"
            messages.append({"role": mapped_role, "content": msg.content})

        # 3. أرسل للذكاء الاصطناعي واجلب البيانات بأمان
        ai_response_text = AnalyticsAIOrchestrator.chat(
            messages=messages,
            role=user_role_val,
            db=db,
            org_id=org_id
        )

        # 4. حفظ رد الذكاء الاصطناعي
        ai_msg = AIChatMessage(
            user_id=user.user_id,
            conversation_id=conversation_id,
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
    def clear_my_ai_chat_history(db: Session, user: User):
        """حذف تاريخ المحادثة بالكامل للمستخدم الحالي لبدء شات جديد"""
        deleted_count = db.query(AIChatMessage).filter(AIChatMessage.user_id == user.user_id).delete(synchronize_session=False)
        db.commit()
        return {"message": f"تم مسح تاريخ المحادثة بنجاح. تم حذف {deleted_count} رسالة."}

    @staticmethod
    def get_preacher_chats(db: Session, user: User):
        """جلب محادثات المستخدم مع الدعاة فقط"""
        # We reuse the existing preview logic
        all_chats_response = MessagesController.get_my_chats_preview(db, user.user_id, user.role)
        all_chatsData = all_chats_response.get("data", [])
        
        # Filter for chats involving preachers
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
