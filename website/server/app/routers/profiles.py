from fastapi import APIRouter, Depends, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas.schemas import (
    ProfileRead, ProfileUpdate, ChangePasswordRequest, 
    LanguageRead, ProfileLanguageUpdate, AppLanguageUpdate,
    AccountDeletionRequest, FAQRead
)
from app.controllers.profiles_controller import ProfilesController

router = APIRouter(prefix="/api/profile", tags=["Profile & Settings"])

@router.get("/me", response_model=ProfileRead)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب بيانات الملف الشخصي الكاملة للمستخدم الحالي"""
    return ProfilesController.get_user_profile(db, current_user)

@router.patch("/me", response_model=ProfileRead)
def update_my_profile(
    full_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    app_language: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """تحديث بيانات الملف الشخصي (الاسم، البريد، الهاتف، اللغة المختارة، الصورة)"""
    payload = ProfileUpdate(full_name=full_name, email=email, phone=phone, app_language=app_language)
    return ProfilesController.update_profile(db, current_user, payload, profile_picture)

@router.patch("/app-language")
def set_app_language(payload: AppLanguageUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تحديث لغة واجهة التطبيق المفضلة"""
    return ProfilesController.set_app_language(db, current_user, payload)

@router.post("/change-password")
def change_my_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تغيير كلمة المرور"""
    return ProfilesController.change_password(db, current_user, payload)

@router.get("/languages", response_model=List[LanguageRead])
def list_available_languages(db: Session = Depends(get_db)):
    """قائمة اللغات المتاحة في النظام للاختيار منها"""
    return ProfilesController.list_languages(db)

@router.patch("/spoken-languages")
def update_my_spoken_languages(payload: ProfileLanguageUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تحديث اللغات التي يتحدثها المستخدم (خاص بالدعاة والأدمن)"""
    return ProfilesController.sync_spoken_languages(db, current_user, payload)

@router.get("/faqs", response_model=List[FAQRead])
def get_faqs(db: Session = Depends(get_db)):
    """جلب قائمة الأسئلة الشائعة"""
    return ProfilesController.get_faqs(db)

@router.get("/contact")
def get_contact_support(db: Session = Depends(get_db)):
    """جلب بيانات اتصل بنا وخدمة العملاء"""
    return ProfilesController.get_contact_info(db)

@router.get("/policies")
def get_platform_policies(db: Session = Depends(get_db)):
    """جلب سياسات الخصوصية وشروط الاستخدام"""
    return ProfilesController.get_policies(db)

@router.post("/delete-account")
def delete_my_account(payload: AccountDeletionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تعطيل الحساب نهائياً (Soft Delete)"""
    return ProfilesController.delete_account(db, current_user, payload)
