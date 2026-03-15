from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.admin import Admin
from app.models.organization import Organization
from app.models.preacher import Preacher
from app.models.muslim_caller import MuslimCaller
from app.models.interested_person import InterestedPerson
from app.models.enums import UserRole, AccountStatus
from app.auth import verify_password, create_access_token, get_current_user
from app.limiter import limiter
from app.config import settings
from app.utils.email_service import EmailService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, response: Response, db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="كلمة المرور أو البريد الإلكتروني غير صحيح",
        )
    
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="كلمة المرور أو البريد الإلكتروني غير صحيح",
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=True, # Note: requires HTTPS
    )

    return {
        "message": "تم تسجيل الدخول بنجاح",
        "user": {
            "email": user.email,
            "role": user.role,
            "id": user.user_id,
            "status": user.status
        }
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "تم تسجيل الخروج بنجاح"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """جلب بيانات البروفايل للمستخدم الحالي بناءً على دوره"""
    role = current_user.role
    profile_data = None
    
    if role == UserRole.admin:
        profile_data = db.query(Admin).filter(Admin.user_id == current_user.user_id).first()
    elif role == UserRole.organization:
        profile_data = db.query(Organization).filter(Organization.user_id == current_user.user_id).first()
    elif role == UserRole.preacher:
        profile_data = db.query(Preacher).filter(Preacher.user_id == current_user.user_id).first()
    elif role == UserRole.muslim_caller:
        profile_data = db.query(MuslimCaller).filter(MuslimCaller.user_id == current_user.user_id).first()
    elif role == UserRole.interested:
        profile_data = db.query(InterestedPerson).filter(InterestedPerson.user_id == current_user.user_id).first()
        
    return {
        "user": {
            "email": current_user.email,
            "role": current_user.role,
            "status": current_user.status,
            "user_id": current_user.user_id
        },
        "profile": profile_data
    }


import random
from app.schemas import (
    ForgotPasswordRequest, ValidateOTPRequest, ResetPasswordRequest, ChangePasswordRequest
)
from app.auth import get_password_hash

# Note: In a real system, you'd integrate with an email provider (like SendGrid/SMTP) here.
def send_email_stub(to_email: str, subject: str, body: str):
    print(f"--- EMAIL TO: {to_email} ---")
    print(f"Subject: {subject}")
    print(body)
    print("----------------------------")

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """طلب إعادة تعيين كلمة المرور - يرسل رمز OTP للبريد"""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Don't reveal if user exists or not, just return "success" message.
        return {"message": "إذا كان البريد الإكتروني موجوداً ستصلك رسالة تحتوي على رمز التأكيد."}

    # Generate a 6-digit OTP
    otp = str(random.randint(100000, 999999))
    user.reset_otp = otp
    from datetime import datetime, timedelta, timezone
    user.reset_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    # Send actual email
    EmailService.send_otp_email(
        to_email=user.email,
        otp=otp
    )

    return {"message": "تم إرسال رمز التأكيد إلى البريد الإلكتروني (إن وجد)."}

@router.post("/verify-otp")
def verify_otp(payload: ValidateOTPRequest, db: Session = Depends(get_db)):
    """التحقق من صحة كود الـ OTP"""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.reset_otp != payload.otp:
        raise HTTPException(status_code=400, detail="الرمز غير صحيح أو البريد الإلكتروني غير صحيح.")
    
    from datetime import datetime, timezone
    if user.reset_otp_expires_at and user.reset_otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="انتهت صلاحية الرمز، يرجى طلب رمز جديد.")

    return {"message": "الرمز صحيح. يمكنك الآن تعيين كلمة مرور جديدة."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """إعادة تعيين كلمة المرور باستخدام الـ OTP"""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.reset_otp != payload.otp:
        raise HTTPException(status_code=400, detail="الرمز غير صحيح.")
    
    from datetime import datetime, timezone
    if user.reset_otp_expires_at and user.reset_otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="انتهت صلاحية الرمز.")

    # Update password and clear OTP
    user.password_hash = get_password_hash(payload.new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()

    return {"message": "تم تغيير كلمة المرور بنجاح."}

@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تغيير كلمة المرور من داخل الإعدادات"""
    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="كلمة المرور الحالية غير صحيحة.")

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "تم تغيير كلمة المرور بنجاح."}
