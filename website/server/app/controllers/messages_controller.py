"""
Messages Controller — Logic for Chat and Messaging
"""

from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from app.models.message import Message
from app.models.dawah_request import DawahRequest
from app.models.enums import RequestStatus, NotificationType, UserRole
from app.models.user import User
from app.models.preacher import Preacher
from app.models.muslim_caller import MuslimCaller
from app.models.interested_person import InterestedPerson
from app.controllers.notifications_controller import NotificationsController
from app.schemas.schemas import MessageCreate

class MessagesController:

    @staticmethod
    def send_message(db: Session, sender: User, payload: MessageCreate):
        # 1. Fetch Request
        request = db.query(DawahRequest).filter(DawahRequest.request_id == payload.request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
        
        if request.status != RequestStatus.in_progress:
            raise HTTPException(status_code=400, detail="المحادثة متاحة فقط للطلبات 'قيد التنفيذ'")

        # 2. Determine Receiver and validate participation
        receiver_id = None
        
        # Get preacher user_id
        preacher = db.query(Preacher).filter(Preacher.preacher_id == request.assigned_preacher_id).first()
        preacher_user_id = preacher.user_id if preacher else None

        # Get submitter user_id
        submitter_user_id = None
        if request.submitted_by_caller_id:
            caller = db.query(MuslimCaller).filter(MuslimCaller.caller_id == request.submitted_by_caller_id).first()
            if caller: submitter_user_id = caller.user_id
        elif request.submitted_by_person_id:
            person = db.query(InterestedPerson).filter(InterestedPerson.person_id == request.submitted_by_person_id).first()
            if person: submitter_user_id = person.user_id

        if sender.user_id == preacher_user_id:
            receiver_id = submitter_user_id
        elif sender.user_id == submitter_user_id:
            receiver_id = preacher_user_id
        else:
            raise HTTPException(status_code=403, detail="ليس لديك صلاحية لإرسال رسائل في هذا الطلب")

        if not receiver_id:
            raise HTTPException(status_code=400, detail="لا يوجد مستلم لهذه الرسالة")

        # 3. Create Message
        new_msg = Message(
            request_id=payload.request_id,
            sender_id=sender.user_id,
            receiver_id=receiver_id,
            message_text=payload.message_text,
            message_type=payload.message_type,
            file_path=payload.file_path
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)

        # 4. Notify Receiver
        NotificationsController.create_notification(
            db, receiver_id, NotificationType.new_message,
            "رسالة جديدة", f"لديك رسالة جديدة بخصوص الطلب #{request.request_id}",
            related_id=request.request_id
        )

        return {"message": "تم إرسال الرسالة بنجاح", "data": new_msg}

    @staticmethod
    def get_chat_history(db: Session, user_id: int, request_id: int):
        # Verify participation
        request = db.query(DawahRequest).filter(DawahRequest.request_id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")

        # Get preacher user_id
        preacher = db.query(Preacher).filter(Preacher.preacher_id == request.assigned_preacher_id).first()
        preacher_user_id = preacher.user_id if preacher else None

        # Get submitter user_id
        submitter_user_id = None
        if request.submitted_by_caller_id:
            caller = db.query(MuslimCaller).filter(MuslimCaller.caller_id == request.submitted_by_caller_id).first()
            if caller: submitter_user_id = caller.user_id
        elif request.submitted_by_person_id:
            person = db.query(InterestedPerson).filter(InterestedPerson.person_id == request.submitted_by_person_id).first()
            if person: submitter_user_id = person.user_id

        if user_id not in [preacher_user_id, submitter_user_id]:
             raise HTTPException(status_code=403, detail="ليس لديك صلاحية لعرض هذه المحادثة")

        # Fetch messages
        messages = db.query(Message).filter(Message.request_id == request_id).order_by(Message.created_at.asc()).all()

        # Mark as read
        unread_msgs = [m for m in messages if m.receiver_id == user_id and not m.is_read]
        for m in unread_msgs:
            m.is_read = True
        
        if unread_msgs:
            db.commit()

        return {"message": "تم جلب تاريخ المحادثة", "data": messages}

    @staticmethod
    def get_my_chats_preview(db: Session, user_id: int, role: UserRole):
        """Get summary of all active chats for the current user"""
        
        # 1. Base query for requests
        query = db.query(DawahRequest)
        
        if role == UserRole.preacher:
            preacher = db.query(Preacher).filter(Preacher.user_id == user_id).first()
            if not preacher: return {"data": []}
            query = query.filter(DawahRequest.assigned_preacher_id == preacher.preacher_id)
        elif role in [UserRole.muslim_caller, UserRole.interested]:
            caller = db.query(MuslimCaller).filter(MuslimCaller.user_id == user_id).first()
            person = db.query(InterestedPerson).filter(InterestedPerson.user_id == user_id).first()
            
            if caller:
                query = query.filter(DawahRequest.submitted_by_caller_id == caller.caller_id)
            elif person:
                query = query.filter(DawahRequest.submitted_by_person_id == person.person_id)
            else:
                return {"data": []}
        else:
            raise HTTPException(status_code=403, detail="هذه الخاصية غير متاحة لنوع حسابك")

        requests = query.filter(DawahRequest.status == RequestStatus.in_progress).all()
        
        previews = []
        for r in requests:
            # Last message
            last_msg = db.query(Message).filter(Message.request_id == r.request_id).order_by(Message.created_at.desc()).first()
            
            # Unread count
            unread_count = db.query(Message).filter(
                Message.request_id == r.request_id,
                Message.receiver_id == user_id,
                Message.is_read == False
            ).count()

            # Determine "Other Party" name
            other_name = "مجهول"
            if role == UserRole.preacher:
                # Other party is the submitter
                if r.submitted_by_caller_id:
                    c = db.query(MuslimCaller).filter(MuslimCaller.caller_id == r.submitted_by_caller_id).first()
                    if c: other_name = c.full_name
                elif r.submitted_by_person_id:
                    p = db.query(InterestedPerson).filter(InterestedPerson.person_id == r.submitted_by_person_id).first()
                    if p: other_name = f"{p.first_name} {p.last_name}"
            else:
                # Other party is the preacher
                pre = db.query(Preacher).filter(Preacher.preacher_id == r.assigned_preacher_id).first()
                if pre: other_name = pre.full_name

            previews.append({
                "request_id": r.request_id,
                "other_party_name": other_name,
                "last_message": last_msg.message_text if last_msg else "لا توجد رسائل بعد",
                "last_message_at": last_msg.created_at if last_msg else r.accepted_at,
                "unread_count": unread_count,
                "status": r.status
            })

        # Sort by last message date
        previews.sort(key=lambda x: x["last_message_at"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

        return {"message": "تم جلب قائمة المحادثات بنجاح", "data": previews}
