import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException
from typing import List

# المجلد الرئيسي للرفع
UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}

def ensure_upload_dirs():
    """التأكد من وجود المجلدات اللازمة للتخزين"""
    dirs = [
        os.path.join(UPLOAD_DIR, "organizations", "licenses"),
        os.path.join(UPLOAD_DIR, "preachers", "certificates"),
        os.path.join(UPLOAD_DIR, "messages", "files"),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

def save_upload_file(upload_file: UploadFile, sub_dir: str) -> str:
    """
    حفظ ملف مرفوع وإرجاع المسار النسبي له
    """
    ext = os.path.splitext(upload_file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"نوع الملف غير مسموح به. المسموح فقط: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # ضمان وجود المجلد
    target_dir = os.path.join(UPLOAD_DIR, sub_dir)
    os.makedirs(target_dir, exist_ok=True)
    
    # اسم فريد للملف لمنع التداخل
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(target_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
        
    # إرجاع المسار بصيغة تناسب الروابط (استخدام / دائماً)
    return f"{sub_dir}/{filename}".replace("\\", "/")

def delete_file(file_path: str):
    """حذف ملف من السيرفر"""
    full_path = os.path.join(UPLOAD_DIR, file_path)
    if os.path.exists(full_path):
        os.remove(full_path)
