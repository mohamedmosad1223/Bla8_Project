from sqlalchemy.orm import Session
from app.models.faq import FAQ

class HelpCenterController:

    @staticmethod
    def list_faqs(db: Session):
        return db.query(FAQ).filter(FAQ.is_active == True).all()
