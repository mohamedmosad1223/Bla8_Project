from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, HTTPException, File, UploadFile, Form, Response, Request
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import EmailStr, ValidationError

from app.database import get_db
from app.models.enums import PreacherType, PreacherStatus, GenderType, ApprovalStatus, UserRole, AccountStatus
from app.schemas import PreacherUpdate, PreacherRegister
from app.controllers.preachers_controller import PreachersController
from app.controllers.profiles_controller import ProfilesController
from app.auth import check_role, get_optional_current_user, get_current_user
from app.models.user import User
from app.models.preacher import Preacher

router = APIRouter(
    prefix="/api/preachers",
    tags=["Preachers"]
)

@router.get("/languages")
def get_all_languages(db: Session = Depends(get_db)):
    """جلب كل اللغات المتاحة في النظام"""
    from app.models.reference import Language
    langs = db.query(Language).all()
    return {"data": [{"id": l.language_id, "name": l.language_name} for l in langs]}

@router.get("/countries")
def get_all_countries(db: Session = Depends(get_db)):
    """جلب كل البلاد المتاحة في النظام"""
    from app.models.reference import Country
    countries = db.query(Country).all()
    return {"data": [{"id": c.country_id, "name": c.country_name} for c in countries]}
@router.get("/religions")
def get_all_religions(db: Session = Depends(get_db)):
    """جلب كل الأديان المتاحة في النظام"""
    from app.models.religion import Religion
    religions = db.query(Religion).all()
    return {"data": [{"id": r.religion_id, "name": r.religion_name} for r in religions]}

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_preacher(
    email: EmailStr = Form(...),
    password: str = Form(...),
    password_confirm: str = Form(...),
    full_name: str = Form(...),
    phone: str = Form(...),
    preacher_email: EmailStr = Form(...),
    scientific_qualification: str = Form(...),
    nationality_country_id: int = Form(...),
    org_id: Optional[int] = Form(None),
    type: Optional[PreacherType] = Form(None),
    gender: Optional[GenderType] = Form(None),
    languages: List[str] = Form([]), # استقبالها كـ List[str] لزيادة المرونة
    qualification_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """تسجيل داعية مع رفع ملف المؤهلات"""
    try:
        # معالجة اللغات بشكل يدوي للتأكد من تحويلها لـ integers
        processed_languages = []
        for lang in languages:
            if ',' in lang:
                processed_languages.extend([int(x.strip()) for x in lang.split(',') if x.strip().isdigit()])
            elif lang.isdigit():
                processed_languages.append(int(lang))

        payload = PreacherRegister(
            email=email,
            password=password,
            password_confirm=password_confirm,
            full_name=full_name,
            phone=phone,
            preacher_email=preacher_email,
            scientific_qualification=scientific_qualification,
            nationality_country_id=nationality_country_id,
            org_id=org_id,
            type=type,
            gender=gender,
            languages=processed_languages,
            qualification_file="placeholder"
        )
    except ValidationError as e:
        # تحويل الأخطاء لنصوص واضحة لتجنب مشاكل الـ Serialization
        error_messages = [{"msg": err["msg"], "loc": err["loc"]} for err in e.errors()]
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error_messages)
        
    if current_user and current_user.role == UserRole.organization and current_user.status == AccountStatus.suspended:
        raise HTTPException(status_code=403, detail="لا يمكنك إضافة دعاة جدد لأن حساب الجمعية موقوف")
        
    return PreachersController.register(db, payload, qualification_file, current_user)


@router.get("/", dependencies=[Depends(check_role([UserRole.admin, UserRole.organization]))])
def list_preachers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="بحث بالاسم أو الرقم التعريفى"),
    type: Optional[PreacherType] = Query(None),
    preacher_status: Optional[PreacherStatus] = Query(None, alias="status"),
    gender: Optional[GenderType] = Query(None),
    approval_status: Optional[ApprovalStatus] = Query(None),
    nationality_country_id: Optional[int] = Query(None),
    org_id: Optional[int] = Query(None, description="Filter by organization"),
    languages: List[int] = Query([], description="قائمة معرفات اللغات (فلترة متعددة)"),
    joined_after: Optional[datetime] = Query(None),
    joined_before: Optional[datetime] = Query(None),
    order_by: str = Query("latest", regex="^(latest|oldest)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """قائمة الدعاة — مع فلترة متقدمة (يتم تحديد الجمعية تلقائياً إذا كان المستخدم جمعية)"""
    
    # لو المستخدم عبارة عن جمعية، نجبر الفلتر إنه يجيب الدعاة بتوعها بس
    if current_user.role == UserRole.organization:
        org_id = current_user.organization.org_id

    return PreachersController.list_preachers(
        db=db, skip=skip, limit=limit, 
        search=search, type=type,
        preacher_status=preacher_status, gender=gender, 
        approval_status=approval_status,
        nationality_country_id=nationality_country_id, 
        org_id=org_id,
        languages=languages,
        joined_after=joined_after,
        joined_before=joined_before,
        order_by=order_by
    )


@router.get("/{preacher_id}")
def get_preacher(preacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب داعية بالـ ID"""
    preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
    if not preacher:
        raise HTTPException(status_code=404, detail="الداعية غير موجود")

    # لو أدمن: تمام
    if current_user.role == UserRole.admin:
        pass
    # لو جمعية: لازم الداعية يكون تبعها
    elif current_user.role == UserRole.organization:
        if preacher.org_id != current_user.organization.org_id:
            raise HTTPException(status_code=403, detail="لا يمكنك الوصول لداعية لا ينتمي لجمعيتك")
    # لو داعية: لازم يكون هو نفسه
    elif current_user.role == UserRole.preacher:
        if preacher.preacher_id != current_user.preacher.preacher_id:
            raise HTTPException(status_code=403, detail="لا يمكنك الوصول لبيانات داعية آخر")
    else:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية")

    return PreachersController.get_preacher(db, preacher_id)


@router.patch("/{preacher_id}", dependencies=[Depends(check_role([UserRole.admin, UserRole.organization, UserRole.preacher]))])
@router.post("/{preacher_id}")
async def update_preacher(
    preacher_id: int, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    full_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    preacher_email: Optional[str] = Form(None),
    scientific_qualification: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    status: Optional[PreacherStatus] = Form(None),
    approval_status: Optional[ApprovalStatus] = Form(None),
    rejection_reason: Optional[str] = Form(None),
    languages: List[str] = Form([]),
    qualification_file: Optional[UploadFile] = File(None)
):
    """تحديث بيانات الداعية (يدعم JSON و Multipart/Form)"""
    # 1. Check if it's JSON
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            payload_data = await request.json()
            payload = PreacherUpdate(**payload_data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {str(e)}")
        
        if current_user.role == UserRole.organization and current_user.status == AccountStatus.suspended:
            raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات الدعاة لأن حساب الجمعية موقوف")

    # Check permissions for JSON update (Admin/Org/Self)
        preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
        if not preacher:
            raise HTTPException(status_code=404, detail="الداعية غير موجود")
            
        if current_user.role == UserRole.admin: pass
        elif current_user.role == UserRole.organization:
            if preacher.org_id != current_user.organization.org_id:
                raise HTTPException(status_code=403, detail="لا يمكنك تعديل داعية لا ينتمي لجمعيتك")
        elif current_user.role == UserRole.preacher:
            if preacher.preacher_id != current_user.preacher.preacher_id:
                raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات داعية آخر")
        
        return PreachersController.update_preacher(db, preacher_id, payload)

    # 2. Handle Form data (original logic)
    preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
    if not preacher:
        raise HTTPException(status_code=404, detail="الداعية غير موجود")

    update_dict = {}
    if full_name: update_dict["full_name"] = full_name
    if phone: update_dict["phone"] = phone
    if preacher_email: update_dict["preacher_email"] = preacher_email
    if scientific_qualification: update_dict["scientific_qualification"] = scientific_qualification
    if gender: update_dict["gender"] = gender
    if status: update_dict["status"] = status
    if approval_status: update_dict["approval_status"] = approval_status
    if rejection_reason: update_dict["rejection_reason"] = rejection_reason
    
    # معالجة اللغات (دعم حالتي النص الواحد أو القائمة)
    lang_ids = []
    if languages:
        for item in languages:
            try:
                # لو باعت "1,2" في نص واحد
                if "," in item:
                    lang_ids.extend([int(x.strip()) for x in item.split(",") if x.strip()])
                else:
                    lang_ids.append(int(item))
            except: continue
        
        if lang_ids:
            update_dict["languages"] = list(set(lang_ids))

    try:
        payload = PreacherUpdate(**update_dict)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # معالجة الملف لو موجود
    if qualification_file:
        import os, uuid
        UPLOAD_DIR = "static/uploads/qualifications"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(qualification_file.filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(qualification_file.file.read())
        preacher.qualification_file = f"/static/uploads/qualifications/{filename}"

    if not payload:
        raise HTTPException(status_code=400, detail="لم يتم إرسال بيانات لتحديثها")

    # التحقق من الصلاحيات
    if current_user.role == UserRole.organization and current_user.status == AccountStatus.suspended:
        raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات الدعاة لأن حساب الجمعية موقوف")

    if current_user.role == UserRole.admin:
        pass
    elif current_user.role == UserRole.organization:
        if preacher.org_id != current_user.organization.org_id:
            raise HTTPException(status_code=403, detail="لا يمكنك تعديل داعية لا ينتمي لجمعيتك")
    elif current_user.role == UserRole.preacher:
        if preacher.preacher_id != current_user.preacher.preacher_id:
            raise HTTPException(status_code=403, detail="لا يمكنك تعديل بيانات داعية آخر")
        
        # منع الداعية من تعديل حالة الموافقة الخاصة به
        if payload.approval_status is not None or payload.rejection_reason is not None:
             raise HTTPException(status_code=403, detail="لا تملك صلاحية تعديل حالة الموافقة")
            
    return PreachersController.update_preacher(db, preacher_id, payload)


@router.delete("/{preacher_id}", dependencies=[Depends(check_role([UserRole.admin, UserRole.organization]))])
def delete_preacher(preacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """حذف داعية — يحذف البروفايل ويعمل soft-delete للمستخدم"""
    preacher = db.query(Preacher).filter(Preacher.preacher_id == preacher_id).first()
    if not preacher:
         raise HTTPException(status_code=404, detail="الداعية غير موجود")

    if current_user.role == UserRole.organization:
        if current_user.status == AccountStatus.suspended:
            raise HTTPException(status_code=403, detail="لا يمكنك حذف الدعاة لأن حساب الجمعية موقوف")
            
        if preacher.org_id != current_user.organization.org_id:
            raise HTTPException(status_code=403, detail="لا يمكنك حذف داعية لا ينتمي لجمعيتك")

    return PreachersController.delete_preacher(db, preacher_id)

@router.post("/logout")
def logout_preacher(response: Response):
    """تسجيل خروج الداعية ومسح كوكيز الجلسة"""
    response.delete_cookie("access_token")
    return ProfilesController.logout()
