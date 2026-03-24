"""
WebSocket Chat Router
يوفر اتصال WebSocket لإرسال واستقبال الرسائل الفورية، حالة الكتابة، وتأكيد القراءة.
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from sqlalchemy import or_

from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.models.message import Message
from app.models.enums import UserRole, RequestStatus, NotificationType, MessageType
from app.models.dawah_request import DawahRequest
from app.models.preacher import Preacher
from app.models.muslim_caller import MuslimCaller
from app.models.interested_person import InterestedPerson
from app.controllers.notifications_controller import NotificationsController
from app.controllers.dawah_reports_controller import DawahReportsController
from app.ws_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket Chat"])


# ── Auth helper ──────────────────────────────────────────────────────────

def _authenticate_ws_token(token: str) -> str | None:
    """Decode JWT and return the email (sub claim), or None if invalid."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ── Permission helpers (same logic as messages_controller) ───────────────

def _validate_request_chat(db, sender: User, request_id: int, receiver_id_override: int | None):
    """Validate that sender can chat in a dawah-request context. Returns receiver_id."""
    request = db.query(DawahRequest).filter(DawahRequest.request_id == request_id).first()
    if not request:
        return None, "الطلب غير موجود"

    if request.status not in [RequestStatus.in_progress, RequestStatus.under_persuasion]:
        return None, "المحادثة متاحة فقط للطلبات النشطة"

    # Enforce daily report for preachers
    if sender.role == UserRole.preacher:
        if DawahReportsController.check_report_due(db, request_id):
            return None, "يجب إكمال التقرير اليومي لهذه الحالة أولاً"

    preacher = db.query(Preacher).filter(Preacher.preacher_id == request.assigned_preacher_id).first()
    preacher_user_id = preacher.user_id if preacher else None

    submitter_user_id = None
    if request.submitted_by_caller_id:
        caller = db.query(MuslimCaller).filter(MuslimCaller.caller_id == request.submitted_by_caller_id).first()
        if caller:
            submitter_user_id = caller.user_id
    elif request.submitted_by_person_id:
        person = db.query(InterestedPerson).filter(InterestedPerson.person_id == request.submitted_by_person_id).first()
        if person:
            submitter_user_id = person.user_id

    if sender.user_id == preacher_user_id:
        return submitter_user_id, None
    elif sender.user_id == submitter_user_id:
        return preacher_user_id, None
    else:
        return None, "ليس لديك صلاحية لإرسال رسائل في هذا الطلب"


def _validate_dm(db, sender: User, receiver_id: int):
    """Validate direct-message permission. Returns error string or None."""
    if sender.role == UserRole.organization:
        preacher = db.query(Preacher).filter(Preacher.user_id == receiver_id).first()
        if not preacher or preacher.org_id != sender.organization.org_id:
            return "لا يمكنك مراسلة داعية لا ينتمي لجمعيتك"
    elif sender.role == UserRole.preacher:
        receiver_user = db.query(User).filter(User.user_id == receiver_id).first()
        if receiver_user and receiver_user.role == UserRole.organization:
            if sender.preacher.org_id != receiver_user.organization.org_id:
                return "لا يمكنك مراسلة جمعية أخرى غير التي تنتمي إليها"
        elif receiver_user and receiver_user.role == UserRole.admin:
            pass # Preacher can message admin
        else:
            return "المراسلة المباشرة متاحة حالياً بين الداعية وجمعيته أو الإدارة فقط"
    elif sender.role == UserRole.admin:
        # Admin can DM organizations and preachers
        receiver_user = db.query(User).filter(User.user_id == receiver_id).first()
        if not receiver_user or receiver_user.role not in [UserRole.organization, UserRole.preacher]:
            return "الأدمن يمكنه المراسلة المباشرة مع الجمعيات والدعاة فقط"
    else:
        return "نوع حسابك لا يدعم المراسلة المباشرة"
    return None


def _get_sender_name(sender: User) -> str:
    """Get display name for a user (for notifications)."""
    if sender.role == UserRole.admin and sender.admin:
        return sender.admin.full_name
    elif sender.role == UserRole.organization and sender.organization:
        return sender.organization.organization_name
    elif sender.role == UserRole.preacher and sender.preacher:
        return sender.preacher.full_name
    elif sender.role == UserRole.muslim_caller and sender.muslim_caller:
        return sender.muslim_caller.full_name
    elif sender.role == UserRole.interested and sender.interested_person:
        return f"{sender.interested_person.first_name} {sender.interested_person.last_name}"
    return "مستخدم"


# ── WebSocket Endpoint ───────────────────────────────────────────────────

@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket, token: str = Query(None)):
    """
    WebSocket Real-Time Chat
    ─────────────────────────
    Connect:  ws://host/ws/chat?token=<JWT>

    Client sends JSON actions:
    ─────────────────────────
    1. Send Message:
       {"action": "send_message", "request_id": null, "receiver_id": 5,
        "message_text": "مرحبا", "message_type": "text", "file_path": null}

    2. Typing Indicator:
       {"action": "typing", "receiver_id": 5, "request_id": null}

    3. Stop Typing:
       {"action": "stop_typing", "receiver_id": 5, "request_id": null}

    4. Mark Messages as Read:
       {"action": "read", "message_ids": [10, 11, 12]}

    5. Check Online Status:
       {"action": "check_online", "user_ids": [5, 8, 12]}

    Server pushes JSON events:
    ─────────────────────────
    - {"event": "new_message", "data": {message object}}
    - {"event": "message_sent", "data": {message object}}
    - {"event": "typing", "sender_id": 3, "request_id": null}
    - {"event": "stop_typing", "sender_id": 3, "request_id": null}
    - {"event": "read_receipt", "message_ids": [10,11,12], "reader_id": 5}
    - {"event": "online_status", "statuses": {5: true, 8: false}}
    - {"event": "user_online", "user_id": 3}
    - {"event": "user_offline", "user_id": 3}
    - {"event": "error", "detail": "..."}
    """

    # 1. Authenticate
    if not token:
        token = websocket.cookies.get("access_token")
    
    if not token:
        await websocket.close(code=4001, reason="توكن غير صالح")
        return
        
    email = _authenticate_ws_token(token)
    if not email:
        await websocket.close(code=4001, reason="توكن غير صالح")
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            await websocket.close(code=4001, reason="مستخدم غير موجود")
            return

        user_id = user.user_id
        await manager.connect(user_id, websocket)

        # Notify contacts that this user is online
        contact_ids = _get_contact_ids(db, user)
        await manager.broadcast_to_users(
            contact_ids,
            {"event": "user_online", "user_id": user_id}
        )

        # 2. Message loop
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "send_message":
                await _handle_send_message(db, user, data, websocket)

            elif action == "typing":
                receiver_id = data.get("receiver_id")
                if receiver_id:
                    await manager.send_to_user(receiver_id, {
                        "event": "typing",
                        "sender_id": user_id,
                        "request_id": data.get("request_id"),
                    })

            elif action == "stop_typing":
                receiver_id = data.get("receiver_id")
                if receiver_id:
                    await manager.send_to_user(receiver_id, {
                        "event": "stop_typing",
                        "sender_id": user_id,
                        "request_id": data.get("request_id"),
                    })

            elif action == "read":
                await _handle_read_receipt(db, user_id, data)

            elif action == "check_online":
                user_ids = data.get("user_ids", [])
                statuses = {uid: manager.is_online(uid) for uid in user_ids}
                await websocket.send_json({"event": "online_status", "statuses": statuses})

            else:
                await websocket.send_json({"event": "error", "detail": f"action غير معروف: {action}"})

    except WebSocketDisconnect:
        logger.info(f"WS disconnected: user {user.user_id}")
    except Exception as e:
        logger.exception(f"WS error for user {user.user_id}: {e}")
    finally:
        manager.disconnect(user.user_id, websocket)
        # Notify contacts that this user went offline
        try:
            contact_ids = _get_contact_ids(db, user)
            await manager.broadcast_to_users(
                contact_ids,
                {"event": "user_offline", "user_id": user.user_id}
            )
        except Exception:
            pass
        db.close()


# ── Action Handlers ──────────────────────────────────────────────────────

async def _handle_send_message(db, sender: User, data: dict, websocket: WebSocket):
    """Process a send_message action."""
    request_id = data.get("request_id")
    receiver_id = data.get("receiver_id")
    message_text = data.get("message_text", "")
    message_type_str = data.get("message_type", "text")
    file_path = data.get("file_path")

    # Parse message_type
    try:
        msg_type = MessageType(message_type_str)
    except ValueError:
        msg_type = MessageType.text

    # Validate
    if request_id:
        receiver_id, error = _validate_request_chat(db, sender, request_id, receiver_id)
        if error:
            await websocket.send_json({"event": "error", "detail": error})
            return
    else:
        if not receiver_id:
            await websocket.send_json({"event": "error", "detail": "يجب تحديد المستلم"})
            return
        error = _validate_dm(db, sender, receiver_id)
        if error:
            await websocket.send_json({"event": "error", "detail": error})
            return

    if not receiver_id:
        await websocket.send_json({"event": "error", "detail": "لا يوجد مستلم"})
        return

    # Save to DB
    new_msg = Message(
        request_id=request_id,
        sender_id=sender.user_id,
        receiver_id=receiver_id,
        message_text=message_text,
        message_type=msg_type,
        file_path=file_path,
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # Build response payload
    msg_payload = {
        "message_id": new_msg.message_id,
        "request_id": new_msg.request_id,
        "sender_id": new_msg.sender_id,
        "receiver_id": new_msg.receiver_id,
        "message_text": new_msg.message_text,
        "message_type": new_msg.message_type.value,
        "file_path": new_msg.file_path,
        "is_read": new_msg.is_read,
        "created_at": new_msg.created_at.isoformat(),
    }

    # Send to receiver in real-time
    await manager.send_to_user(receiver_id, {"event": "new_message", "data": msg_payload})

    # Confirm to sender
    await websocket.send_json({"event": "message_sent", "data": msg_payload})

    # Create DB notification (for when receiver is offline / push notifications)
    try:
        sender_name = _get_sender_name(sender)
        if request_id:
            notif_body = f"لديك رسالة جديدة بخصوص الطلب #{request_id}"
            notif_related = request_id
        else:
            notif_body = f"لديك رسالة مباشرة جديدة من {sender_name}"
            notif_related = sender.user_id

        NotificationsController.create_notification(
            db, receiver_id, NotificationType.new_message,
            "رسالة جديدة", notif_body,
            related_id=notif_related,
        )
    except Exception as e:
        logger.warning(f"Failed to create notification: {e}")


async def _handle_read_receipt(db, reader_id: int, data: dict):
    """Mark messages as read and notify the sender."""
    message_ids = data.get("message_ids", [])
    if not message_ids:
        return

    messages = db.query(Message).filter(
        Message.message_id.in_(message_ids),
        Message.receiver_id == reader_id,
        Message.is_read == False,
    ).all()

    sender_ids = set()
    updated_ids = []
    for msg in messages:
        msg.is_read = True
        sender_ids.add(msg.sender_id)
        updated_ids.append(msg.message_id)

    if updated_ids:
        db.commit()

    # Notify each sender about read receipts
    for sid in sender_ids:
        relevant = [m_id for m_id, msg in zip(updated_ids, messages) if msg.sender_id == sid]
        await manager.send_to_user(sid, {
            "event": "read_receipt",
            "message_ids": relevant,
            "reader_id": reader_id,
        })


# ── Utility ──────────────────────────────────────────────────────────────

def _get_contact_ids(db, user: User) -> list[int]:
    """Get user IDs that have exchanged messages with this user (for online/offline broadcast)."""
    rows = db.query(Message.sender_id, Message.receiver_id).filter(
        or_(Message.sender_id == user.user_id, Message.receiver_id == user.user_id)
    ).distinct().all()

    contacts = set()
    for sender_id, receiver_id in rows:
        if sender_id != user.user_id:
            contacts.add(sender_id)
        if receiver_id != user.user_id:
            contacts.add(receiver_id)
    return list(contacts)
