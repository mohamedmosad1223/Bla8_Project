"""
Preachers Controller — Business logic for Preacher CRUD operations.
"""

import hashlib
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.preacher import Preacher
from app.models.enums import (
    UserRole, AccountStatus,
    PreacherType, PreacherStatus, GenderType, ApprovalStatus,
    RequestStatus, NotificationType
)
from app.controllers.notifications_controller import NotificationsController
from app.models.responses import PreacherMessages, UserMessages
from app.schemas import PreacherUpdate, PreacherRegister
from app.models.dawah_request import DawahRequest


from app.auth import get_password_hash
from app.utils.file_handler import save_upload_file

def _hash_password(password: str) -> str:
    return get_password_hash(password)


class PreachersController:

    @staticmethod
    def register(db: Session, payload: PreacherRegister, qualification_file: any, current_user: Optional[User] = None):
        # التحقق من وجود الإيميل مسبقاً
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        # حفظ الملف
        file_path = save_upload_file(qualification_file, "preachers/certificates")

        # تحديد نوع التسجيل والحالة
        # الحالة 1: جمعية بتضيف داعية (رسمي أوتوماتيك)
        if current_user and current_user.role == UserRole.organization:
            if not current_user.organization:
                raise HTTPException(status_code=400, detail="حساب الجمعية غير مكتمل")
            payload.org_id = current_user.organization.org_id
            payload.type = PreacherType.official
            account_status = AccountStatus.active
            approval_status = ApprovalStatus.approved
            is_official = True

        # الحالة 2: أدمن بيضيف داعية
        elif current_user and current_user.role == UserRole.admin:
            is_official = payload.org_id is not None
            if is_official:
                account_status = AccountStatus.active
                approval_status = ApprovalStatus.approved
            else:
                account_status = AccountStatus.pending
                approval_status = ApprovalStatus.pending

        # الحالة 3: تسجيل ذاتي (منفرد) من بره
        else:
            if payload.org_id is not None:
                raise HTTPException(status_code=403, detail="لا يمكنك تحديد جمعية عند التسجل ذاتياً")
            payload.type = PreacherType.volunteer
            is_official = False
            account_status = AccountStatus.pending
            approval_status = ApprovalStatus.pending

        user = User(
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            role=UserRole.preacher,
            status=account_status,
        )
        db.add(user)
        db.flush()

        from app.models.preacher import PreacherLanguage
        
        preacher = Preacher(
            user_id=user.user_id,
            type=payload.type,
            full_name=payload.full_name,
            phone=payload.phone,
            email=payload.preacher_email,
            gender=payload.gender,
            nationality_country_id=payload.nationality_country_id,
            org_id=payload.org_id,
            scientific_qualification=payload.scientific_qualification,
            qualification_file=file_path,
            approval_status=approval_status,
            status=PreacherStatus.active if account_status == AccountStatus.active else PreacherStatus.suspended
        )
        db.add(preacher)
        db.flush()

        # إضافة اللغات (بشكل مرن يتجنب تعارض الـ IDs)
        if payload.languages:
            from app.models.reference import Language
            # نجلب فقط اللغات الموجودة فعلاً في السيستم من الـ IDs المبعوتة
            existing_languages = db.query(Language).filter(Language.language_id.in_(payload.languages)).all()
            existing_ids = [l.language_id for l in existing_languages]
            
            for lang_id in existing_ids:
                db.add(PreacherLanguage(preacher_id=preacher.preacher_id, language_id=lang_id))

        db.flush() # flush before notifications
        
        if approval_status == ApprovalStatus.pending:
            NotificationsController.create_notification(
                db, user.user_id, NotificationType.account_approved,
                "مراجعة طلب الانضمام",
                "تم استلام طلب تسجيلك كداعية بنجاح وهو الآن قيد المراجعة. برجاء الانتظار حتى يتم تأكيد طلبك وتفعيل حسابك قريباً."
            )

        db.commit()
        db.refresh(preacher)

        # إرسال إيميل الترحيب ببيانات الحساب
        try:
            from app.utils.email_sender import send_welcome_email
            # نجلب اسم الجمعية إذا وجد
            org_name = "منصة إبلاغ"
            if preacher.org_id:
                from app.models.organization import Organization
                org = db.query(Organization).filter(Organization.org_id == preacher.org_id).first()
                if org:
                    org_name = org.organization_name
            
            send_welcome_email(
                to_email=user.email,
                preacher_name=preacher.full_name,
                org_name=org_name,
                raw_password=payload.password # كلمة المرور الخام المبعوتة في الـ Payload
            )
        except Exception as e:
            print(f"Error sending welcome email: {e}")
            # لا نوقف العملية لو فشل الإيميل، لكن نكتفي بتسجيل الخطأ

        return {"message": PreacherMessages.REGISTERED, "data": preacher}

    @staticmethod
    def list_preachers(
        db: Session, skip: int, limit: int,
        search: Optional[str] = None,
        type: Optional[PreacherType] = None,
        preacher_status: Optional[PreacherStatus] = None,
        gender: Optional[GenderType] = None,
        approval_status: Optional[ApprovalStatus] = None,
        nationality_country_id: Optional[int] = None,
        org_id: Optional[int] = None,
        languages: list[int] = [],
        joined_after: Optional[datetime] = None,
        joined_before: Optional[datetime] = None,
        order_by: str = "latest"
    ):
        from app.models.preacher import PreacherLanguage
        q = db.query(Preacher)
        
        # 1. Search (Name or ID)
        if search:
            if search.isdigit():
                q = q.filter(sa.or_(
                    Preacher.preacher_id == int(search),
                    Preacher.full_name.ilike(f"%{search}%")
                ))
            else:
                q = q.filter(Preacher.full_name.ilike(f"%{search}%"))
        
        # 2. Filters
        if type:
            q = q.filter(Preacher.type == type)
        if preacher_status:
            q = q.filter(Preacher.status == preacher_status)
        if gender:
            q = q.filter(Preacher.gender == gender)
        if approval_status:
            q = q.filter(Preacher.approval_status == approval_status)
        if nationality_country_id:
            q = q.filter(Preacher.nationality_country_id == nationality_country_id)
        if org_id:
            q = q.filter(Preacher.org_id == org_id)

        # 3. Languages (Multi-select)
        if languages:
            q = q.join(PreacherLanguage).filter(PreacherLanguage.language_id.in_(languages))
            # Optional: Ensure it has ALL selected languages? Usually, IN is enough for "any of"
            # If "all of" is needed: q = q.group_by(Preacher.preacher_id).having(func.count(PreacherLanguage.language_id) == len(languages))

        # 4. Date Range
        if joined_after:
            q = q.filter(Preacher.created_at >= joined_after)
        if joined_before:
            q = q.filter(Preacher.created_at <= joined_before)

        # 5. Sorting
        if order_by == "oldest":
            q = q.order_by(Preacher.created_at.asc())
        else:
            q = q.order_by(Preacher.created_at.desc())

        preachers = q.offset(skip).limit(limit).all()

        # جيب أسماء الجنسيات واللغات دفعة واحدة (بدل N+1 queries)
        from app.models.reference import Country, Language
        from app.models.preacher import PreacherLanguage

        country_ids = {p.nationality_country_id for p in preachers if p.nationality_country_id}
        countries   = {c.country_id: c.country_name for c in db.query(Country).filter(Country.country_id.in_(country_ids)).all()} if country_ids else {}

        preacher_ids = [p.preacher_id for p in preachers]
        lang_rows = (
            db.query(PreacherLanguage.preacher_id, Language.language_name)
            .join(Language, PreacherLanguage.language_id == Language.language_id)
            .filter(PreacherLanguage.preacher_id.in_(preacher_ids))
            .all()
        ) if preacher_ids else []

        lang_map: dict[int, list[str]] = {}
        for pid, lname in lang_rows:
            lang_map.setdefault(pid, []).append(lname)

        data = []
        for p in preachers:
            data.append({
                "preacher_id":              p.preacher_id,
                "full_name":                p.full_name,
                "email":                    p.email,
                "phone":                    p.phone,
                "gender":                   p.gender.value if p.gender else None,
                "type":                     p.type.value,
                "status":                   p.status.value,
                "approval_status":          p.approval_status.value,
                "nationality_country_id":   p.nationality_country_id,
                "nationality_name":         countries.get(p.nationality_country_id, "—"),
                "language_names":           lang_map.get(p.preacher_id, []),
                "scientific_qualification": p.scientific_qualification,
                "org_id":                   p.org_id,
                "created_at":               p.created_at.isoformat(),
            })

        return {"message": PreacherMessages.LISTED, "data": data}

    @staticmethod
    def get_preacher(db: Session, preacher_id: int):
        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not preacher:
            raise HTTPException(status_code=404, detail=PreacherMessages.NOT_FOUND)
        
        # جلب البيانات الأساسية للبروفايل فقط
        from app.models.reference import Country, Language
        from app.models.preacher import PreacherLanguage
        from app.models.organization import Organization
        
        # 1. الجنسية
        nationality = db.query(Country).filter(Country.country_id == preacher.nationality_country_id).first()
        
        # 2. اللغات (استخراج الـ IDs والأسماء معاً لضمان التطابق)
        from app.models.reference import Language
        from app.models.preacher import PreacherLanguage
        
        lang_data = (
            db.query(Language.language_id, Language.language_name)
            .join(PreacherLanguage, PreacherLanguage.language_id == Language.language_id)
            .filter(PreacherLanguage.preacher_id == preacher_id)
            .all()
        )
        
        language_ids = [l.language_id for l in lang_data]
        language_names = [l.language_name for l in lang_data]
        
        # 3. كل اللغات المتاحة في النظام
        all_langs = db.query(Language).all()
        all_available_languages = [{"id": l.language_id, "name": l.language_name} for l in all_langs]
        
        # 4. الجمعية
        org_name = "منفرد"
        if preacher.org_id:
            org = db.query(Organization).filter(Organization.org_id == preacher.org_id).first()
            if org:
                org_name = org.organization_name

        data = {
            "preacher_id": preacher.preacher_id,
            "full_name": preacher.full_name,
            "email": preacher.user.email if preacher.user else preacher.email,
            "preacher_email": preacher.email,
            "phone": preacher.phone,
            "gender": preacher.gender.value if preacher.gender else None,
            "scientific_qualification": preacher.scientific_qualification,
            "status": preacher.status.value,
            "approval_status": preacher.approval_status.value,
            "nationality_country_id": preacher.nationality_country_id,
            "nationality_name": nationality.country_name if nationality else "—",
            "language_names": language_names,
            "languages": language_ids,
            "all_available_languages": all_available_languages, # إرسال كل اللغات
            "organization_name": org_name,
            "qualification_file": preacher.qualification_file,
            "created_at": preacher.created_at.isoformat(),
        }

        return {"message": PreacherMessages.FETCHED, "data": data}

    @staticmethod
    def update_preacher(db: Session, preacher_id: int, payload: PreacherUpdate):
        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not preacher:
            raise HTTPException(status_code=404, detail=PreacherMessages.NOT_FOUND)

        from app.models.preacher import PreacherLanguage
        
        # تحديث الحقول النصية والأساسية
        data_to_update = payload.model_dump(exclude_unset=True)
        if "languages" in data_to_update:
            # تحديث اللغات
            new_lang_ids = data_to_update.pop("languages")
            if new_lang_ids is not None:
                # مسح القديم
                db.query(PreacherLanguage).filter(PreacherLanguage.preacher_id == preacher_id).delete()
                # إضافة الجديد
                for lang_id in new_lang_ids:
                    db.add(PreacherLanguage(preacher_id=preacher_id, language_id=lang_id))

        for field, value in data_to_update.items():
            setattr(preacher, field, value)

        # منطق استرداد الطلبات في حالة الإيقاف
        if payload.status == PreacherStatus.suspended:
            # إعادة كل الطلبات الحالية (in_progress) لتصبح (pending)
            db.query(DawahRequest).filter(
                DawahRequest.assigned_preacher_id == preacher_id,
                DawahRequest.status == RequestStatus.in_progress
            ).update({
                DawahRequest.status: RequestStatus.pending,
                DawahRequest.assigned_preacher_id: None
            })
            
            # تحديث حالة حساب المستخدم المرتبط للإيقاف أيضاً
            if preacher.user:
                preacher.user.status = AccountStatus.suspended

        # في حالة التفعيل مرة أخرى والموافقة
        if (payload.status == PreacherStatus.active or payload.approval_status == ApprovalStatus.approved) and preacher.approval_status == ApprovalStatus.approved:
             if preacher.user:
                preacher.user.status = AccountStatus.active
             NotificationsController.create_notification(
                 db, preacher.user_id, NotificationType.account_approved,
                 "تمت الموافقة على حسابك", "تم تفعيل حسابك كداعية بنجاح، يمكنك الآن البدء في استقبال طلبات الدعوة."
             )
        
        # في حالة الرفض
        elif payload.approval_status == ApprovalStatus.rejected:
            if preacher.user:
                preacher.user.status = AccountStatus.suspended
            NotificationsController.create_notification(
                db, preacher.user_id, NotificationType.account_rejected,
                "تم رفض طلب الانضمام", f"نأسف لإبلاغك بأنه تم رفض طلبك. السبب: {preacher.rejection_reason or 'غير محدد'}"
            )

        db.commit()
        db.refresh(preacher)
        return {"message": PreacherMessages.UPDATED, "data": preacher}

    @staticmethod
    def delete_preacher(db: Session, preacher_id: int):
        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not preacher:
            raise HTTPException(status_code=404, detail=PreacherMessages.NOT_FOUND)

        if preacher.user_id:
            user = db.query(User).filter(User.user_id == preacher.user_id).first()
            if user:
                user.deleted_at = datetime.now(timezone.utc)
                user.status = AccountStatus.suspended

        db.delete(preacher)
        db.commit()
        return {"message": PreacherMessages.DELETED}
    @staticmethod
    def list_countries(db: Session):
        from app.models.reference import Country
        countries = db.query(Country).all()
        data = [{"id": c.country_id, "name": c.country_name} for c in countries]
        if not data: # Fallback to common ones if empty
             data = [{"id": 1, "name": "مصر"}, {"id": 2, "name": "السعودية"}, {"id": 3, "name": "الكويت"}]
        return {"data": data}

    @staticmethod
    def list_religions(db: Session):
        from app.models.religion import Religion
        religions = db.query(Religion).all()
        data = [{"id": r.religion_id, "name": r.religion_name} for r in religions]
        if not data: # Fallback 
             data = [{"id": 1, "name": "نصراني"}, {"id": 2, "name": "ملحد"}, {"id": 3, "name": "هندوسي"}]
        return {"data": data}
