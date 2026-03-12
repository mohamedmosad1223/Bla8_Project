from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.enums import UserRole, AccountStatus
from app.auth import verify_password, create_access_token, get_current_user
from app.limiter import limiter
from app.config import settings

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
