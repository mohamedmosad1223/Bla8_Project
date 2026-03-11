"""
Dawah Requests Controller — Business logic for dawah requests.
"""

from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.dawah_request import DawahRequest, RequestStatusHistory
from app.models.enums import RequestStatus, RequestType, UserRole
from app.schemas import DawahRequestCreate, StatusUpdateRequest
from app.models.user import User
from app.models.preacher import Preacher
from app.controllers.notifications_controller import NotificationsController
from app.models.enums import NotificationType

class DawahRequestsController:

    @staticmethod
    def create_request(db: Session, payload: DawahRequestCreate):
        # Create the request
        request = DawahRequest(**payload.model_dump())
        db.add(request)
        db.flush()
        
        # Add history entry
        history = RequestStatusHistory(
            request_id=request.request_id,
            new_status=RequestStatus.pending,
            note="طلب جديد تم رفعه في النظام"
        )
        db.add(history)
        db.commit()
        db.refresh(request)
        return {"message": "تم تقديم الطلب بنجاح", "data": request}

    @staticmethod
    def list_pool(db: Session, skip: int, limit: int):
        """قائمة الطلبات المتاحة (pending) لجميع الدعاة"""
        requests = db.query(DawahRequest).filter(
            DawahRequest.status == RequestStatus.pending
        ).order_by(DawahRequest.created_at.desc()).offset(skip).limit(limit).all()
        return {"message": "تم جلب قائمة الطلبات المتاحة", "data": requests}

    @staticmethod
    def accept_request(db: Session, request_id: int, preacher_id: int):
        """قبول طلب من قبل داعية معين"""
        request = db.query(DawahRequest).filter(DawahRequest.request_id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
        
        if request.status != RequestStatus.pending:
            raise HTTPException(status_code=400, detail="هذا الطلب تم قبوله بالفعل أو لم يعد متاحاً")
        
        request.assigned_preacher_id = preacher_id
        request.status = RequestStatus.in_progress
        request.accepted_at = datetime.now(timezone.utc)
        
        history = RequestStatusHistory(
            request_id=request.request_id,
            old_status=RequestStatus.pending,
            new_status=RequestStatus.in_progress,
            note=f"تم قبول الطلب من قبل الداعية ID: {preacher_id}"
        )
        db.add(history)
        db.commit()
        db.refresh(request)
        
        # Fetch preacher name for notification
        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        preacher_name = preacher.full_name if preacher else "مجهول"
        
        # Notify the submitter if possible
        submitter_user_id = None
        if request.submitted_by_caller_id:
            from app.models.muslim_caller import MuslimCaller
            caller = db.query(MuslimCaller).filter(MuslimCaller.caller_id == request.submitted_by_caller_id).first()
            if caller: submitter_user_id = caller.user_id
        elif request.submitted_by_person_id:
            from app.models.interested_person import InterestedPerson
            person = db.query(InterestedPerson).filter(InterestedPerson.person_id == request.submitted_by_person_id).first()
            if person: submitter_user_id = person.user_id
            
        if submitter_user_id:
            NotificationsController.create_notification(
                db, submitter_user_id, NotificationType.request_accepted,
                "تم قبول طلبك", f"قام الداعية {preacher_name} بقبول طلبك للتعريف بالإسلام وهو متاح للتواصل الآن."
            )
            
        return {"message": "تم قبول الطلب، يمكنك الآن البدء في التواصل", "data": request}

    @staticmethod
    def list_my_requests(db: Session, preacher_id: int, skip: int, limit: int):
        """الطلبات الخاصة بالداعية الحالي"""
        requests = db.query(DawahRequest).filter(
            DawahRequest.assigned_preacher_id == preacher_id
        ).order_by(DawahRequest.updated_at.desc()).offset(skip).limit(limit).all()
        return {"message": "تم جلب طلباتك الحالية", "data": requests}

    @staticmethod
    def update_status(db: Session, request_id: int, preacher_id: int, payload: StatusUpdateRequest):
        """تحديث حالة الطلب (converted, rejected, etc.)"""
        request = db.query(DawahRequest).filter(
            DawahRequest.request_id == request_id,
            DawahRequest.assigned_preacher_id == preacher_id
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود أو غير مسند إليك")
        
        old_status = request.status
        request.status = payload.new_status
        if payload.conversion_date:
            request.conversion_date = payload.conversion_date
        if payload.preacher_feedback:
            request.preacher_feedback = payload.preacher_feedback
        if payload.note:
            request.notes = payload.note
            
        history = RequestStatusHistory(
            request_id=request.request_id,
            old_status=old_status,
            new_status=payload.new_status,
            note=payload.note
        )
        db.add(history)
        db.commit()
        db.refresh(request)
        return {"message": "تم تحديث حالة الطلب بنجاح", "data": request}

    @staticmethod
    def list_org_requests(db: Session, org_id: int, skip: int, limit: int):
        """عرض طلبات كل الدعاة التابعين لجمعية معينة"""
        requests = db.query(DawahRequest).options(
            joinedload(DawahRequest.preacher)
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).filter(
            Preacher.org_id == org_id
        ).order_by(DawahRequest.updated_at.desc()).offset(skip).limit(limit).all()
        
        # تحويل البيانات لشكل غني بالمعلومات (Rich Data)
        rich_data = []
        for r in requests:
            item = {
                "request_id": r.request_id,
                "status": r.status,
                "request_type": r.request_type,
                "invited_name": f"{r.invited_first_name or ''} {r.invited_last_name or ''}".strip() or "بيانات غير متوفرة",
                "preacher_id": r.assigned_preacher_id,
                "preacher_name": r.preacher.full_name if r.preacher else "غير محدد",
                "accepted_at": r.accepted_at,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
                "preacher_feedback": r.preacher_feedback
            }
            rich_data.append(item)
            
        return {"message": "تم جلب طلبات الجمعية", "data": rich_data}


    @staticmethod
    def submit_submitter_feedback(db: Session, request_id: int, user_id: int, role: str, feedback: str):
        """تسجيل تقييم الشخص المدعو أو المسلم الداعي عن التجربة"""
        request = db.query(DawahRequest).filter(DawahRequest.request_id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
            
        # التحقق من أن المستخدم هو من رفع الطلب فعلاً
        is_owner = False
        if role == UserRole.muslim_caller:
            from app.models.muslim_caller import MuslimCaller
            caller = db.query(MuslimCaller).filter(MuslimCaller.user_id == user_id).first()
            if caller and request.submitted_by_caller_id == caller.caller_id:
                is_owner = True
        elif role == UserRole.interested:
            from app.models.interested_person import InterestedPerson
            person = db.query(InterestedPerson).filter(InterestedPerson.user_id == user_id).first()
            if person and request.submitted_by_person_id == person.person_id:
                is_owner = True
                
        if not is_owner:
            raise HTTPException(status_code=403, detail="لا يمكنك تقييم طلب لم تقم برفعه")
            
        request.submitter_feedback = feedback
        db.commit()
        db.refresh(request)
        return {"message": "شكراً لتقييمك، تم استلام ملاحظاتك بنجاح", "data": request}
    @staticmethod
    def list_my_submissions(db: Session, user_id: int, role: UserRole, skip: int, limit: int):
        """الطلبات التي رفعها المستخدم الحالي (سواء مسلم داعي أو مهتم)"""
        q = db.query(DawahRequest)
        if role == UserRole.muslim_caller:
            from app.models.muslim_caller import MuslimCaller
            caller = db.query(MuslimCaller).filter(MuslimCaller.user_id == user_id).first()
            if not caller: return {"message": "لم يتم العثور على بروفايل داعي", "data": []}
            q = q.filter(DawahRequest.submitted_by_caller_id == caller.caller_id)
            if not person: return {"message": "لم يتم العثور على بروفايل مهتم", "data": []}
            q = q.filter(DawahRequest.submitted_by_person_id == person.person_id)
        else:
            return {"message": "غير مسموح لهذا الرول", "data": []}
            
        # استخدام selectinload لضمان جلب البيانات حتى لو كان الاستعلام معقداً
        requests = q.options(selectinload(DawahRequest.preacher)).order_by(DawahRequest.created_at.desc()).offset(skip).limit(limit).all()
        
        # تحويل البيانات لشكل غني (Rich Data) للمرسل
        rich_data = []
        for r in requests:
            item = {
                "request_id": r.request_id,
                "status": r.status,
                "request_type": r.request_type,
                "preacher_name": r.preacher.full_name if (hasattr(r, 'preacher') and r.preacher) else "قيد الانتظار",
                "accepted_at": r.accepted_at,
                "created_at": r.created_at,
                "submitter_feedback": r.submitter_feedback 
            }
            rich_data.append(item)
            
        return {"message": "تم جلب طلباتك التي سجلتها", "data": rich_data}

    @staticmethod
    def get_request(db: Session, request_id: int):
        request = db.query(DawahRequest).filter(DawahRequest.request_id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
        return {"message": "تم جلب بيانات الطلب", "data": request}
