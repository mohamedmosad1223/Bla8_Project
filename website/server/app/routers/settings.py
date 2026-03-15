from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.setting import SystemSetting

router = APIRouter(prefix="/api/settings", tags=["Settings"])

DEFAULT_HELP_CENTER_SETTINGS = {
    "faq_url": "https://example.com/faq",
    "customer_service_url": "https://example.com/support",
    "help_center_phone": "+20 123 232 323",
    "working_hours": "من السبت الى الخميس الساعة 08 صباحا الى 05 مساء"
}

@router.get("/help-center")
def get_help_center(db: Session = Depends(get_db)):
    """جلب بيانات مركز المساعدة (الأسئلة الشائعة، خدمة العملاء، رقم الهاتف، أوقات العمل)"""
    keys_to_fetch = ["faq_url", "customer_service_url", "help_center_phone", "working_hours"]
    
    settings_db = db.query(SystemSetting).filter(SystemSetting.key.in_(keys_to_fetch)).all()
    # Build dictionary
    settings_dict = {setting.key: setting.value for setting in settings_db}
    
    # Fill missing ones with defaults
    result = {}
    for key, default_val in DEFAULT_HELP_CENTER_SETTINGS.items():
        result[key] = settings_dict.get(key, default_val)
        
    return {
        "message": "تم جلب بيانات مركز المساعدة المحدثة",
        "data": {
            "faq_url": result["faq_url"],
            "customer_service_url": result["customer_service_url"],
            "phone": result["help_center_phone"],
            "working_hours": result["working_hours"]
        }
    }
