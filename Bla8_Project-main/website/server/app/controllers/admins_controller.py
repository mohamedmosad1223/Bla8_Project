from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from fastapi import UploadFile
    from app.schemas import AdminUpdate, AdminRegister, AdminProfileUpdate, ChangePasswordRequest, AdminLanguageUpdate, AdminDeleteAccountRequest

from app.models.user import User
from app.models.admin import Admin, AdminLanguage
from app.models.enums import UserRole, AccountStatus
from app.models.responses import AdminMessages, UserMessages
from app.auth import verify_password, get_password_hash


class AdminsController:

    @staticmethod
    def register(db: Session, payload: "AdminRegister"):
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        user = User(
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            role=payload.role,
            status=AccountStatus.active,
        )
        db.add(user)
        db.flush()

        admin = Admin(
            user_id=user.user_id,
            full_name=payload.full_name,
            phone=payload.phone,
            level=payload.level,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return {"message": AdminMessages.REGISTERED, "data": admin}

    @staticmethod
    def list_admins(db: Session, skip: int, limit: int):
        admins = db.query(Admin).order_by(Admin.created_at.desc()).offset(skip).limit(limit).all()
        return {"message": AdminMessages.LISTED, "data": admins}

    @staticmethod
    def get_admin(db: Session, admin_id: int):
        admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail=AdminMessages.NOT_FOUND)
        return {"message": AdminMessages.FETCHED, "data": admin}

    @staticmethod
    def update_admin(db: Session, admin_id: int, payload: "AdminUpdate"):
        admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail=AdminMessages.NOT_FOUND)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(admin, field, value)

        db.commit()
        db.refresh(admin)
        return {"message": AdminMessages.UPDATED, "data": admin}

    @staticmethod
    def get_admin_profile(db: Session, user_id: int):
        admin = db.query(Admin).filter(Admin.user_id == user_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail="الملف الشخصي للأدمن غير موجود")
        
        # Fetch language names
        from app.models.reference import Language
        lang_names = db.query(Language.language_name).join(AdminLanguage).filter(AdminLanguage.admin_id == admin.admin_id).all()
        lang_names = [ln[0] for ln in lang_names]

        return {
            "user_id": admin.user_id,
            "email": admin.user.email,
            "full_name": admin.full_name,
            "phone": admin.phone,
            "profile_picture": admin.profile_picture,
            "level": admin.level,
            "languages": lang_names,
            "created_at": admin.created_at
        }

    @staticmethod
    def update_admin_profile(
        db: Session, 
        user_id: int, 
        payload: "AdminProfileUpdate",
        profile_picture: "UploadFile | None" = None
    ):
        from app.utils.file_handler import save_upload_file, delete_file
        
        admin = db.query(Admin).filter(Admin.user_id == user_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail="الملف الشخصي غير موجود")

        if payload.email and payload.email != admin.user.email:
             if db.query(User).filter(User.email == payload.email, User.user_id != user_id).first():
                 raise HTTPException(status_code=409, detail="البريد الإلكتروني مسجل لمستقل آخر")
             admin.user.email = payload.email

        if payload.full_name:
            admin.full_name = payload.full_name
        if payload.phone:
            admin.phone = payload.phone

        if profile_picture:
            if admin.profile_picture:
                delete_file(admin.profile_picture)
            admin.profile_picture = save_upload_file(profile_picture, "admins/profiles")

        db.commit()
        db.refresh(admin)
        return {"message": "تم تحديث الملف الشخصي بنجاح", "data": admin}

    @staticmethod
    def change_self_password(db: Session, current_user: User, payload: "ChangePasswordRequest"):
        # 1. Option A: Using Old Password
        if payload.old_password:
            if not verify_password(payload.old_password, current_user.password_hash):
                raise HTTPException(status_code=400, detail="كلمة المرور الحالية غير صحيحة")
        # 2. Option B: Using OTP (Fallback)
        elif payload.otp:
            if current_user.reset_otp != payload.otp:
                raise HTTPException(status_code=400, detail="كود التحقق غير صحيح")
            if current_user.reset_otp_expires_at and current_user.reset_otp_expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="انتهت صلاحية كود التحقق")
            # Clear OTP after success
            current_user.reset_otp = None
            current_user.reset_otp_expires_at = None
        else:
            raise HTTPException(status_code=400, detail="يجب إدخال كلمة المرور القديمة أو كود التحقق")

        # Update Password
        current_user.password_hash = get_password_hash(payload.new_password)
        db.commit()
        return {"message": "تم تغيير كلمة المرور بنجاح"}

    @staticmethod
    def sync_admin_languages(db: Session, user_id: int, payload: "AdminLanguageUpdate"):
        admin = db.query(Admin).filter(Admin.user_id == user_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail="الملف الشخصي غير موجود")

        # Validate language IDs
        if payload.language_ids:
            from app.models.reference import Language
            valid_lang_count = db.query(Language).filter(Language.language_id.in_(payload.language_ids)).count()
            if valid_lang_count != len(set(payload.language_ids)):
                raise HTTPException(status_code=400, detail="بعض اللغات المختارة غير موجودة في النظام")

        # Clear existing
        db.query(AdminLanguage).filter(AdminLanguage.admin_id == admin.admin_id).delete()
        
        # Add new
        for lang_id in payload.language_ids:
            db.add(AdminLanguage(admin_id=admin.admin_id, language_id=lang_id))
        
        db.commit()
        return {"message": "تم تحديث اللغات بنجاح"}

    @staticmethod
    def delete_self_account(db: Session, current_user: User, payload: "AdminDeleteAccountRequest"):
        if not verify_password(payload.password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="كلمة المرور غير صحيحة")

        # Soft Delete
        current_user.status = AccountStatus.suspended
        current_user.deleted_at = datetime.now(timezone.utc)
        
        db.commit()
        return {"message": "تم حذف الحساب بنجاح"}

    @staticmethod
    def delete_admin(db: Session, admin_id: int):
        admin = db.query(Admin).filter(Admin.admin_id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=404, detail=AdminMessages.NOT_FOUND)

        user = db.query(User).filter(User.user_id == admin.user_id).first()
        if user:
            user.deleted_at = datetime.now(timezone.utc)
            user.status = AccountStatus.suspended

        db.delete(admin)
        db.commit()
        return {"message": AdminMessages.DELETED}
