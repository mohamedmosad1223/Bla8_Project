from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.schemas import FAQRead
from app.controllers.help_controller import HelpCenterController

router = APIRouter(prefix="/api/help", tags=["Help Center"])

@router.get("/", response_model=List[FAQRead])
def get_faqs(db: Session = Depends(get_db)):
    """جلب الأسئلة الشائعة ومركز المساعدة"""
    return HelpCenterController.list_faqs(db)
