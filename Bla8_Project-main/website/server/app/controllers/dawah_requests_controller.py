import sqlalchemy as sa
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.dawah_request import DawahRequest, RequestStatusHistory, ContactAttempt
from app.models.enums import RequestStatus, RequestType, UserRole, CommunicationChannel
from app.schemas import DawahRequestCreate, StatusUpdateRequest
from app.models.user import User
from app.models.preacher import Preacher
from app.controllers.notifications_controller import NotificationsController
from app.controllers.dawah_reports_controller import DawahReportsController
from app.models.enums import NotificationType
from app.models.reference import Country, Language
from app.models.muslim_caller import MuslimCaller
from app.models.interested_person import InterestedPerson
from app.models.religion import Religion

class DawahRequestsController:

    @staticmethod
    def create_request(db: Session, payload: DawahRequestCreate, current_user: User):
        # Create the request
        request_data = payload.model_dump()
        
        # Override submitter IDs with the current user's actual profile IDs to prevent spoofing
        request_data["submitted_by_caller_id"] = None
        request_data["submitted_by_person_id"] = None
        
        if current_user.role == UserRole.muslim_caller:
            if not current_user.muslim_caller:
                raise HTTPException(status_code=400, detail="بروفايل المسلم الداعي غير مكتمل")
            request_data["submitted_by_caller_id"] = current_user.muslim_caller.caller_id
            request_data["request_type"] = RequestType.invited
        elif current_user.role == UserRole.interested:
            if not current_user.interested_person:
                raise HTTPException(status_code=400, detail="بروفايل الشخص المهتم غير مكتمل")
            request_data["submitted_by_person_id"] = current_user.interested_person.person_id
            request_data["request_type"] = RequestType.self_interested
        
        request = DawahRequest(**request_data)
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
        """قائمة الطلبات المتاحة (pending) لجميع الدعاة — مع أسماء الدولة واللغة"""
        from app.models.reference import Country, Language
        from app.models.muslim_caller import MuslimCaller
        from app.models.interested_person import InterestedPerson

        results = (
            db.query(
                DawahRequest,
                Country.country_name.label("invited_country_name"),
                Language.language_name.label("invited_language_name"),
                Religion.religion_name.label("invited_religion_display"),
                sa.case(
                    (DawahRequest.request_type == RequestType.self_interested, "لا يوجد"),
                    (MuslimCaller.full_name.is_not(None), MuslimCaller.full_name),
                    else_="لا يوجد"
                ).label("submitted_by_name")
            )
            .outerjoin(Country, DawahRequest.invited_nationality_id == Country.country_id)
            .outerjoin(Language, DawahRequest.invited_language_id == Language.language_id)
            .outerjoin(Religion, DawahRequest.invited_religion_id == Religion.religion_id)
            .outerjoin(MuslimCaller, DawahRequest.submitted_by_caller_id == MuslimCaller.caller_id)
            .outerjoin(InterestedPerson, DawahRequest.submitted_by_person_id == InterestedPerson.person_id)
            .filter(DawahRequest.status == RequestStatus.pending)
            .order_by(DawahRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        data = []
        for req, country_name, language_name, religion_name_res, submitted_by_name in results:
            # دمج الاسم الأول والأخير للمدعو
            invited_name = f"{req.invited_first_name or ''} {req.invited_last_name or ''}".strip() or "غير محدد"
            
            # تحديد الديانة للعرض
            religion_display = religion_name_res
            if not religion_display and req.invited_religion:
                religion_display = req.invited_religion
            if not religion_display:
                religion_display = "غير محدد"

            item = {
                "request_id":            req.request_id,
                "request_type":          req.request_type.value if req.request_type else None,
                "status":                req.status.value,
                "communication_channel": req.communication_channel.value if req.communication_channel else None,
                "deep_link":             req.deep_link,
                "notes":                 req.notes if req.notes else "لا يوجد",
                "submission_date":       req.submission_date,
                "accepted_at":           req.accepted_at,
                "updated_at":            req.updated_at,
                "invited_first_name":    req.invited_first_name,
                "invited_last_name":     req.invited_last_name,
                "invited_name":          invited_name,
                "invited_gender":        req.invited_gender.value if req.invited_gender else None,
                "invited_nationality_id":req.invited_nationality_id,
                "invited_country_name":  country_name if country_name else "—",
                "invited_language_id":   req.invited_language_id,
                "invited_language_name": language_name if language_name else "—",
                "invited_religion_id":   req.invited_religion_id,
                "invited_religion":      religion_display,
                "invited_phone":         req.invited_phone,
                "invited_email":         req.invited_email,
                "submitted_by_caller_id":req.submitted_by_caller_id,
                "submitted_by_person_id":req.submitted_by_person_id,
                "submitted_by_name":      submitted_by_name if submitted_by_name else "طلب ذاتي",
            }
            data.append(item)

        return {"message": "تم جلب قائمة الطلبات المتاحة", "data": data}


    @staticmethod
    def accept_request(db: Session, request_id: int, preacher_id: int):
        """قبول طلب من قبل داعية معين"""
        request = db.query(DawahRequest).filter(DawahRequest.request_id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
        
        if request.status != RequestStatus.pending:
            raise HTTPException(status_code=400, detail="هذا الطلب تم قبوله بالفعل أو لم يعد متاحاً")
            
        # v4: Check if preacher is blocked due to missing daily reports (24h rule)
        if DawahReportsController.is_preacher_blocked(db, preacher_id):
            raise HTTPException(
                status_code=403,
                detail="تم إيقاف صلاحية سحب طلبات جديدة مؤقتاً. الرجاء تقديم التقارير اليومية المطلوبة لطلباتك الحالية أولاً."
            )
        
        # v4: Check workload limit (Max 2 active requests)
        active_count = db.query(DawahRequest).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.status.in_([RequestStatus.in_progress, RequestStatus.under_persuasion])
        ).count()
        
        if active_count >= 2:
            raise HTTPException(
                status_code=400, 
                detail="يجب إنهاء أو كتابة تقرير عن الطلبات الحالية أولاً (الحد الأقصى هو طلبين نشطين)"
            )
        
        request.assigned_preacher_id = preacher_id
        request.status = RequestStatus.in_progress
        request.accepted_at = datetime.now(timezone.utc)
        
        # New: Set alert/reclaim timers
        request.alert_42h_sent_at = None
        request.auto_reclaim_at   = request.accepted_at + timedelta(hours=72)
        
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
        """الطلبات الخاصة بالداعية الحالي — مع بيانات كاملة"""
        from app.models.reference import Country, Language
        from app.models.religion import Religion
        
        results = db.query(
            DawahRequest, Country, Language, Religion
        ).outerjoin(
            Country, DawahRequest.invited_nationality_id == Country.country_id
        ).outerjoin(
            Language, DawahRequest.invited_language_id == Language.language_id
        ).outerjoin(
            Religion, DawahRequest.invited_religion_id == Religion.religion_id
        ).filter(
            DawahRequest.assigned_preacher_id == preacher_id
        ).order_by(DawahRequest.updated_at.desc()).offset(skip).limit(limit).all()
        
        out = []
        for req, c, l, r in results:
            invited_name = f"{req.invited_first_name or ''} {req.invited_last_name or ''}".strip() or "غير محدد"
            
            # Combine religion ID display and manual text
            rel_display = r.religion_name if r else None
            if not rel_display and req.invited_religion: rel_display = req.invited_religion
            if not rel_display: rel_display = "—"

            rd = {
                "request_id":            req.request_id,
                "status":                req.status.value,
                "request_type":          req.request_type.value if req.request_type else None,
                "invited_name":          invited_name,
                "invited_first_name":    req.invited_first_name,
                "invited_last_name":     req.invited_last_name,
                "invited_gender":        req.invited_gender.value if req.invited_gender else None,
                "invited_country_name":  c.country_name if c else "—",
                "invited_language_name": l.language_name if l else "—",
                "invited_religion":      rel_display,
                "invited_phone":         req.invited_phone,
                "invited_email":         req.invited_email,
                "communication_channel": req.communication_channel.value if req.communication_channel else None,
                "deep_link":             req.deep_link,
                "submission_date":       req.submission_date,
                "accepted_at":           req.accepted_at,
                "updated_at":            req.updated_at,
                "notes":                 req.notes or "لا يوجد",
                "submitted_by_caller_id":req.submitted_by_caller_id,
                "submitted_by_person_id":req.submitted_by_person_id,
            }
            
            # Submitter info
            submitted_by_name = "طلب ذاتي"
            if req.submitted_by_caller_id:
                from app.models.muslim_caller import MuslimCaller
                mc = db.query(MuslimCaller).filter(MuslimCaller.caller_id == req.submitted_by_caller_id).first()
                if mc: submitted_by_name = mc.full_name
            elif req.submitted_by_person_id:
                from app.models.interested_person import InterestedPerson
                ip = db.query(InterestedPerson).filter(InterestedPerson.person_id == req.submitted_by_person_id).first()
                if ip: submitted_by_name = f"{ip.first_name} {ip.last_name}"
            
            rd['submitted_by_name'] = submitted_by_name
            
            # v4: Determine if this request needs a report
            needs_report = False
            from app.controllers.dawah_reports_controller import DawahReportsController
            
            if req.status in [RequestStatus.in_progress, RequestStatus.under_persuasion]:
                needs_report = DawahReportsController.check_report_due(db, req.request_id)
            elif req.status in [RequestStatus.converted, RequestStatus.rejected]:
                from app.models.dawah_request import DawahReport
                last_report = db.query(DawahReport).filter(DawahReport.request_id == req.request_id).order_by(DawahReport.created_at.desc()).first()
                if not last_report or (last_report.created_at < req.updated_at - timedelta(minutes=5)):
                    needs_report = True

            rd['needs_report'] = needs_report
            out.append(rd)

        return {"message": "تم جلب طلباتك الحالية", "data": out}

    @staticmethod
    def update_status(db: Session, request_id: int, preacher_id: int, payload: StatusUpdateRequest):
        """تحديث حالة الطلب (converted, rejected, etc.)"""
        request = db.query(DawahRequest).filter(
            DawahRequest.request_id == request_id,
            DawahRequest.assigned_preacher_id == preacher_id
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود أو غير مسند إليك")
        
        # v4: Enforce mandatory daily report for non-terminal updates too
        # If it's a terminal status, the feedback check below handles it.
        # If it's just a note or status change to/from in_progress/under_persuasion, check 24h report.
        terminal_statuses = [RequestStatus.converted, RequestStatus.rejected, RequestStatus.no_response]
        if payload.new_status not in terminal_statuses:
            if DawahReportsController.check_report_due(db, request_id):
                raise HTTPException(
                    status_code=400, 
                    detail="نعتذر، يجب إكمال التقرير اليومي لهذه الحالة أولاً قبل إجراء أي تحديث"
                )

        old_status = request.status
        if payload.new_status:
            request.status = payload.new_status
            
        if payload.conversion_date:
            request.conversion_date = payload.conversion_date
        if payload.preacher_feedback:
            # Append feedback if already exists or just set it
            if request.preacher_feedback:
                request.preacher_feedback += f"\n- {payload.preacher_feedback}"
            else:
                request.preacher_feedback = payload.preacher_feedback
                
        if payload.note:
            request.notes = payload.note
            
        if request.status == RequestStatus.converted and old_status != RequestStatus.converted:
            # 1. Notify the Submitter (Muslim Caller) - Celebratory message
            if request.submitted_by_caller_id:
                from app.models.muslim_caller import MuslimCaller
                caller = db.query(MuslimCaller).filter(MuslimCaller.caller_id == request.submitted_by_caller_id).first()
                if caller:
                    invited_name = f"{request.invited_first_name or ''} {request.invited_last_name or ''}".strip()
                    name_display = f"المدعو '{invited_name}'" if invited_name else "الحالة"
                    body = (f"بشائر الخير! {name_display} نطق الشهادة بفضل الله ثم بجهدك.\n"
                            f"نسأل الله أن يجعله في ميزان حسناتك، استمر في طريق الدعوة المبارك! 🌟🕌")
                    
                    NotificationsController.create_notification(
                        db, caller.user_id, NotificationType.status_changed,
                        "الحمد لله على نعمة الإسلام! 🕋✨", 
                        body
                    )
            
            # 2. Notify the Interested Person (The New Muslim) - Welcoming message
            if request.submitted_by_person_id:
                from app.models.interested_person import InterestedPerson
                person = db.query(InterestedPerson).filter(InterestedPerson.person_id == request.submitted_by_person_id).first()
                if person:
                    welcome_body = ("مرحباً بك في رحاب الإسلام! 🕋✨\n"
                                   "نسأل الله أن يثبتك على الحق ويوفقك لكل خير. نحن سعداء جداً بانضمامك إلينا ونسأل الله لك حياة مليئة بالإيمان والسكينة.")
                    
                    NotificationsController.create_notification(
                        db, person.user_id, NotificationType.status_changed,
                        "مرحباً بك في الإسلام! ✨🌙", 
                        welcome_body
                    )
            
        # v4: Enforce report/feedback when closing a request
        terminal_statuses = [RequestStatus.converted, RequestStatus.rejected, RequestStatus.no_response]
        if request.status in terminal_statuses:
            if not request.preacher_feedback and not payload.preacher_feedback:
                raise HTTPException(status_code=400, detail="يجب كتابة التقرير النهائي في خانة الملاحظات قبل إغلاق الطلب")

        # إضافة سجل للتاريخ حتى لو لم تتغير الحالة ولكن تمت إضافة ملاحظة
        history = RequestStatusHistory(
            request_id=request.request_id,
            old_status=old_status,
            new_status=request.status,
            note=payload.note or payload.preacher_feedback or "تحديث بيانات الطلب"
        )
        db.add(history)
        db.commit()
        db.refresh(request)
        return {"message": "تم تحديث حالة الطلب بنجاح", "data": request}

    @staticmethod
    def list_org_requests(db: Session, org_id: int, skip: int, limit: int):
        """عرض طلبات كل الدعاة التابعين لجمعية معينة — بيانات كاملة"""
        from app.models.reference import Country, Language
        from app.models.religion import Religion

        query = db.query(
            DawahRequest, Preacher, Country, Language, Religion
        ).join(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).outerjoin(
            Country, DawahRequest.invited_nationality_id == Country.country_id
        ).outerjoin(
            Language, DawahRequest.invited_language_id == Language.language_id
        ).outerjoin(
            Religion, DawahRequest.invited_religion_id == Religion.religion_id
        ).filter(
            Preacher.org_id == org_id
        ).order_by(DawahRequest.updated_at.desc())

        results = query.offset(skip).limit(limit).all()
        
        rich_data = []
        for r, p, c, l, rel in results:
            invited_name = f"{r.invited_first_name or ''} {r.invited_last_name or ''}".strip() or "غير محدد"
            
            rel_display = rel.religion_name if rel else None
            if not rel_display and r.invited_religion: rel_display = r.invited_religion
            if not rel_display: rel_display = "—"

            item = {
                "request_id":            r.request_id,
                "status":                r.status.value,
                "request_type":          r.request_type.value if r.request_type else None,
                "invited_name":          invited_name,
                "invited_first_name":    r.invited_first_name,
                "invited_last_name":     r.invited_last_name,
                "invited_gender":        r.invited_gender.value if r.invited_gender else None,
                "invited_country_name":  c.country_name if c else "—",
                "invited_language_name": l.language_name if l else "—",
                "invited_religion":      rel_display,
                "invited_phone":         r.invited_phone,
                "invited_email":         r.invited_email,
                "communication_channel": r.communication_channel.value if r.communication_channel else None,
                "deep_link":             r.deep_link,
                "preacher_id":           r.assigned_preacher_id,
                "preacher_name":         p.full_name if p else "غير محدد",
                "submission_date":       r.submission_date,
                "accepted_at":           r.accepted_at,
                "created_at":            r.created_at,
                "updated_at":            r.updated_at,
                "notes":                 r.notes or "لا يوجد",
                "submitted_by_caller_id":r.submitted_by_caller_id,
                "submitted_by_person_id":r.submitted_by_person_id,
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
        elif role == UserRole.interested:
            from app.models.interested_person import InterestedPerson
            person = db.query(InterestedPerson).filter(InterestedPerson.user_id == user_id).first()
            if not person: return {"message": "لم يتم العثور على بروفايل مهتم", "data": []}
            q = q.filter(DawahRequest.submitted_by_person_id == person.person_id)
        else:
            return {"message": "غير مسموح لهذا الرول برؤية الطلبات المرفوعة", "data": []}
            
        # استخدام selectinload لضمان جلب البيانات حتى لو كان الاستعلام معقداً
        requests = q.options(selectinload(DawahRequest.preacher)).order_by(DawahRequest.created_at.desc()).offset(skip).limit(limit).all()
        
        # تحويل البيانات لشكل غني (Rich Data) للمرسل لتتوافق مع شاشة الطلبات
        rich_data = []
        for r in requests:
            first_name = r.invited_first_name or ""
            last_name = r.invited_last_name or ""
            full_name = f"{first_name} {last_name}".strip()
            
            item = {
                "request_id": r.request_id,
                "status": r.status,
                "request_type": r.request_type,
                "invited_name": full_name or "غير محدد",
                "preacher_name": r.preacher.full_name if (hasattr(r, 'preacher') and r.preacher) else "قيد الانتظار",
                "submission_date": r.submission_date,
                "updated_at": r.updated_at,
                "accepted_at": r.accepted_at,
                "submitter_feedback": r.submitter_feedback 
            }
            rich_data.append(item)
            
        return {"message": "تم جلب طلباتك التي سجلتها", "data": rich_data}

    @staticmethod
    def get_request(db: Session, request_id: int):
        from app.models.reference import Country, Language
        from app.models.religion import Religion
        
        result = db.query(
            DawahRequest, Preacher, Country, Language, Religion
        ).outerjoin(
            Preacher, DawahRequest.assigned_preacher_id == Preacher.preacher_id
        ).outerjoin(
            Country, DawahRequest.invited_nationality_id == Country.country_id
        ).outerjoin(
            Language, DawahRequest.invited_language_id == Language.language_id
        ).outerjoin(
            Religion, DawahRequest.invited_religion_id == Religion.religion_id
        ).filter(
            DawahRequest.request_id == request_id
        ).first()

        if not result:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
        
        req, p, c, l, rel = result
        
        invited_name = f"{req.invited_first_name or ''} {req.invited_last_name or ''}".strip() or "غير محدد"
        
        rel_display = rel.religion_name if rel else None
        if not rel_display and req.invited_religion: rel_display = req.invited_religion
        if not rel_display: rel_display = "—"

        data = {
            "request_id":            req.request_id,
            "status":                req.status.value,
            "request_type":          req.request_type.value if req.request_type else None,
            "invited_name":          invited_name,
            "invited_first_name":    req.invited_first_name,
            "invited_last_name":     req.invited_last_name,
            "invited_gender":        req.invited_gender.value if req.invited_gender else None,
            "invited_country_name":  c.country_name if c else "—",
            "invited_language_name": l.language_name if l else "—",
            "invited_religion":      rel_display,
            "invited_phone":         req.invited_phone,
            "invited_email":         req.invited_email,
            "communication_channel": req.communication_channel.value if req.communication_channel else None,
            "deep_link":             req.deep_link,
            "preacher_id":           req.assigned_preacher_id,
            "preacher_name":         p.full_name if p else "غير محدد",
            "submission_date":       req.submission_date,
            "accepted_at":           req.accepted_at,
            "created_at":            req.created_at,
            "updated_at":            req.updated_at,
            "notes":                 req.notes or "لا يوجد",
            "preacher_feedback":     req.preacher_feedback,
            "submitted_by_caller_id":req.submitted_by_caller_id,
            "submitted_by_person_id":req.submitted_by_person_id,
        }
        
        # Submitter info
        submitted_by_name = "طلب ذاتي"
        if req.submitted_by_caller_id:
            from app.models.muslim_caller import MuslimCaller
            mc = db.query(MuslimCaller).filter(MuslimCaller.caller_id == req.submitted_by_caller_id).first()
            if mc: submitted_by_name = mc.full_name
        elif req.submitted_by_person_id:
            from app.models.interested_person import InterestedPerson
            ip = db.query(InterestedPerson).filter(InterestedPerson.person_id == req.submitted_by_person_id).first()
            if ip: submitted_by_name = f"{ip.first_name} {ip.last_name}"
        
        data["submitted_by_name"] = submitted_by_name

        return {"message": "تم جلب بيانات الطلب", "data": data}

    @staticmethod
    def track_link_click(db: Session, request_id: int, preacher_id: int, channel: CommunicationChannel = None):
        """تسجيل نقرة التواصل وتحويل الحالة لـ 'under_persuasion'. لو الـ channel غير معطى، نستخدم المخزن في الطلب."""
        request = db.query(DawahRequest).filter(
            DawahRequest.request_id == request_id,
            DawahRequest.assigned_preacher_id == preacher_id
        ).first()

        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود أو غير مسند إليك")

        if channel is None:
            channel = request.communication_channel
            
        if channel is None:
             raise HTTPException(status_code=400, detail="لم يتم تحديد وسيلة التواصل لهذا الطلب")

        # Log attempt
        attempt = ContactAttempt(
            request_id=request_id,
            preacher_id=preacher_id,
            channel=channel
        )
        db.add(attempt)

        # Transition status if not already terminal
        # "تحويل حالة الطلب لقيد الإقناع مثلا"
        if request.status == RequestStatus.in_progress:
            old_status = request.status
            request.status = RequestStatus.under_persuasion
            
            history = RequestStatusHistory(
                request_id=request_id,
                old_status=old_status,
                new_status=RequestStatus.under_persuasion,
                note=f"بدأ التواصل عبر {channel.value} - تحويل لقيد الإقناع"
            )
            db.add(history)

        db.commit()
        db.refresh(request)
        return {"message": "تم تسجيل محاولة الاتصال", "data": request}
