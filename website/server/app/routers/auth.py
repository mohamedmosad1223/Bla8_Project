from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.enums import UserRole, AccountStatus
from app.models.responses import UserMessages
from app.models.admin import Admin
from app.models.organization import Organization
from app.models.preacher import Preacher
from app.models.muslim_caller import MuslimCaller
from app.models.interested_person import InterestedPerson
from app.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login")
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="كلمة المرور أو البريد الإلكتروني غير صحيح",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="كلمة المرور أو البريد الإلكتروني غير صحيح",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "role": user.role,
            "id": user.user_id,
            "status": user.status
        }
    }

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
