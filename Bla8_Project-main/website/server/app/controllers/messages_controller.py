"""
Messages Controller — Logic for Chat and Messaging
"""

from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
import sqlalchemy as sa

from app.models.message import Message
from app.models.dawah_request import DawahRequest
from app.models.enums import RequestStatus, NotificationType, UserRole
from app.models.user import User
from app.models.preacher import Preacher
from app.models.muslim_caller import MuslimCaller
from app.models.interested_person import InterestedPerson
from app.controllers.notifications_controller import NotificationsController
from app.controllers.dawah_reports_controller import DawahReportsController
from app.schemas.schemas import MessageCreate

class MessagesController:

    @staticmethod
    def send_message(db: Session, sender: User, payload: MessageCreate):
        # 1. Determine Context (Request or DM)
        request = None
        receiver_id = payload.receiver_id
        
        if payload.request_id:
            request = db.query(DawahRequest).filter(DawahRequest.request_id == payload.request_id).first()
            if not request:
                raise HTTPException(status_code=404, detail="الطلب غير موجود")
            
            if request.status not in [RequestStatus.in_progress, RequestStatus.under_persuasion]:
                raise HTTPException(status_code=400, detail="المحادثة متاحة فقط للطلبات النشطة")

            # v4: Enforce mandatory daily report for preachers in request-based chats
            if sender.role == UserRole.preacher:
                 if DawahReportsController.check_report_due(db, payload.request_id):
                     raise HTTPException(
                         status_code=400, 
                         detail="نعتذر، يجب إكمال التقرير اليومي لهذه الحالة أولاً قبل متابعة المراسلة"
                     )

            # Determine Receiver and validate participation for request context
            preacher = db.query(Preacher).filter(Preacher.preacher_id == request.assigned_preacher_id).first()
            preacher_user_id = preacher.user_id if preacher else None

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
        else:
            # Direct Message Context
            if not receiver_id:
                raise HTTPException(status_code=400, detail="يجب تحديد المستلم للمراسلة المباشرة")
            
            # Validation: Organizations can only message their own preachers
            if sender.role == UserRole.organization:
                preacher = db.query(Preacher).filter(Preacher.user_id == receiver_id).first()
                if not preacher or preacher.org_id != sender.organization.org_id:
                    raise HTTPException(status_code=403, detail="لا يمكنك مراسلة داعية لا ينتمي لجمعيتك")
            elif sender.role == UserRole.preacher:
                receiver_user = db.query(User).filter(User.user_id == receiver_id).first()
                if receiver_user and receiver_user.role == UserRole.organization:
                    if sender.preacher.org_id != receiver_user.organization.org_id:
                        raise HTTPException(status_code=403, detail="لا يمكنك مراسلة جمعية أخرى غير التي تنتمي إليها")
                else:
                    # For now, only Org-Preacher DM is supported as requested
                    raise HTTPException(status_code=403, detail="المراسلة المباشرة متاحة حالياً بين الداعية وجمعيته فقط")
            else:
                raise HTTPException(status_code=403, detail="نوع حسابك لا يدعم المراسلة المباشرة")

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
        sender_name = "مستخدم"
        if sender.role == UserRole.admin and sender.admin:
            sender_name = sender.admin.full_name
        elif sender.role == UserRole.organization and sender.organization:
            sender_name = sender.organization.organization_name
        elif sender.role == UserRole.preacher and sender.preacher:
            sender_name = sender.preacher.full_name
        elif sender.role == UserRole.muslim_caller and sender.muslim_caller:
            sender_name = sender.muslim_caller.full_name
        elif sender.role == UserRole.interested and sender.interested_person:
            sender_name = f"{sender.interested_person.first_name} {sender.interested_person.last_name}"

        brief_msg = payload.message_text[:40] + ("..." if len(payload.message_text) > 40 else "")
        notification_title = f"رسالة جديدة من {sender_name}"
        notification_body = brief_msg

        if request:
            notification_related_id = request.request_id
        else:
            notification_related_id = sender.user_id # For DMs, link to sender

        NotificationsController.create_notification(
            db, receiver_id, NotificationType.new_message,
            notification_title, notification_body,
            related_id=notification_related_id
        )

        return {"message": "تم إرسال الرسالة بنجاح", "data": new_msg}

    @staticmethod
    def get_chat_history(db: Session, user_id: int, request_id: int = None, other_user_id: int = None):
        """جلب تاريخ المحادثة سواء كانت لطلب معين أو مباشرة بين مستخدمين"""
        if request_id:
            request = db.query(DawahRequest).filter(DawahRequest.request_id == request_id).first()
            if not request:
                raise HTTPException(status_code=404, detail="الطلب غير موجود")

            preacher = db.query(Preacher).filter(Preacher.preacher_id == request.assigned_preacher_id).first()
            preacher_user_id = preacher.user_id if preacher else None

            submitter_user_id = None
            if request.submitted_by_caller_id:
                caller = db.query(MuslimCaller).filter(MuslimCaller.caller_id == request.submitted_by_caller_id).first()
                if caller: submitter_user_id = caller.user_id
            elif request.submitted_by_person_id:
                person = db.query(InterestedPerson).filter(InterestedPerson.person_id == request.submitted_by_person_id).first()
                if person: submitter_user_id = person.user_id

            if user_id not in [preacher_user_id, submitter_user_id]:
                raise HTTPException(status_code=403, detail="ليس لديك صلاحية لعرض هذه المحادثة")

            messages = db.query(Message).filter(Message.request_id == request_id).order_by(Message.created_at.asc()).all()

        elif other_user_id:
            messages = db.query(Message).filter(
                Message.request_id.is_(None),
                or_(
                    (Message.sender_id == user_id) & (Message.receiver_id == other_user_id),
                    (Message.sender_id == other_user_id) & (Message.receiver_id == user_id)
                )
            ).order_by(Message.created_at.asc()).all()
        else:
            raise HTTPException(status_code=400, detail="يجب تحديد طلب أو مستخدم لجلب المحادثة")

        unread_msgs = [m for m in messages if m.receiver_id == user_id and not m.is_read]
        for m in unread_msgs:
            m.is_read = True
        if unread_msgs:
            db.commit()

        from app.schemas.schemas import MessageRead
        serialized = []
        for m in messages:
            d = MessageRead.model_validate(m).model_dump()
            d['is_mine'] = (m.sender_id == user_id)
            serialized.append(d)

        return {"message": "تم جلب تاريخ المحادثة", "data": serialized}

    @staticmethod
    def get_my_chats_preview(db: Session, user_id: int, role: UserRole):
        """صندوق الوارد الموحد: يعرض محادثات الطلبات والمحادثات المباشرة"""
        
        previews = []
        
        # 1. جلب محادثات الطلبات النشطة
        if role in [UserRole.preacher, UserRole.muslim_caller, UserRole.interested]:
            query = db.query(DawahRequest)
            if role == UserRole.preacher:
                preacher = db.query(Preacher).filter(Preacher.user_id == user_id).first()
                if preacher: query = query.filter(DawahRequest.assigned_preacher_id == preacher.preacher_id)
            elif role == UserRole.muslim_caller:
                caller = db.query(MuslimCaller).filter(MuslimCaller.user_id == user_id).first()
                if caller: query = query.filter(DawahRequest.submitted_by_caller_id == caller.caller_id)
            elif role == UserRole.interested:
                person = db.query(InterestedPerson).filter(InterestedPerson.user_id == user_id).first()
                if person: query = query.filter(DawahRequest.submitted_by_person_id == person.person_id)

            active_requests = query.filter(DawahRequest.status.in_([RequestStatus.in_progress, RequestStatus.under_persuasion])).all()
            
            for r in active_requests:
                last_msg = db.query(Message).filter(Message.request_id == r.request_id).order_by(Message.created_at.desc()).first()
                unread_count = db.query(Message).filter(Message.request_id == r.request_id, Message.receiver_id == user_id, Message.is_read == False).count()
                
                other_name = "مجهول"
                if role == UserRole.preacher:
                    # Show the invited person's name (the one who wants to learn about Islam)
                    parts = [r.invited_first_name, r.invited_last_name]
                    invited = " ".join(p for p in parts if p)
                    other_name = invited if invited else f"شخص #{r.request_id}"
                else:
                    pre = db.query(Preacher).filter(Preacher.preacher_id == r.assigned_preacher_id).first()
                    if pre: other_name = pre.full_name

                previews.append({
                    "request_id": r.request_id,
                    "other_user_id": None, # Related to request
                    "other_party_name": other_name,
                    "last_message": last_msg.message_text if last_msg else "لا توجد رسائل بعد",
                    "last_message_at": last_msg.created_at if last_msg else r.accepted_at,
                    "unread_count": unread_count,
                    "is_direct": False
                })

        # 2. جلب المحادثات المباشرة (DMs)
        # نحدد جميع المستخدمين الذين تواصل معهم المستخدم الحالي بعيداً عن الطلبات
        dm_partners = db.query(
            func.distinct(
                sa.case(
                    (Message.sender_id == user_id, Message.receiver_id),
                    else_=Message.sender_id
                )
            )
        ).filter(
            Message.request_id == None,
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        ).all()

        for (partner_id,) in dm_partners:
            # Last message in this DM
            last_msg = db.query(Message).filter(
                Message.request_id == None,
                or_(
                    (Message.sender_id == user_id) & (Message.receiver_id == partner_id),
                    (Message.sender_id == partner_id) & (Message.receiver_id == user_id)
                )
            ).order_by(Message.created_at.desc()).first()
            
            unread_count = db.query(Message).filter(
                Message.request_id == None,
                Message.sender_id == partner_id,
                Message.receiver_id == user_id,
                Message.is_read == False
            ).count()

            # Partner Name
            partner_user = db.query(User).filter(User.user_id == partner_id).first()
            partner_name = "مستخدم"
            if partner_user.role == UserRole.organization:
                partner_name = f"مشرف جمعية {partner_user.organization.organization_name}"
            elif partner_user.role == UserRole.preacher:
                partner_name = partner_user.preacher.full_name

            previews.append({
                "request_id": None,
                "other_user_id": partner_id,
                "other_party_name": partner_name,
                "last_message": last_msg.message_text if last_msg else "",
                "last_message_at": last_msg.created_at if last_msg else None,
                "unread_count": unread_count,
                "is_direct": True
            })

        # Final Sort
        previews.sort(key=lambda x: x["last_message_at"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

        return {"message": "تم جلب قائمة المحادثات بنجاح", "data": previews}
