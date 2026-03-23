"""
Interested Persons Controller — Business logic for InterestedPerson CRUD operations.
"""

import hashlib
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.interested_person import InterestedPerson
from app.models.enums import UserRole, AccountStatus
from app.models.responses import InterestedPersonMessages, UserMessages
from app.schemas import InterestedPersonUpdate, InterestedPersonRegister
from app.models.dawah_request import DawahRequest, RequestStatusHistory
from app.models.enums import RequestType, RequestStatus


from app.auth import get_password_hash

def _hash_password(password: str) -> str:
    return get_password_hash(password)


class InterestedPersonsController:

    @staticmethod
    def register(db: Session, payload: InterestedPersonRegister):
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        user = User(
            email=payload.email,
            password_hash=_hash_password(payload.password),
            role=UserRole.interested,
            status=AccountStatus.active,
        )
        db.add(user)
        db.flush()

        person = InterestedPerson(
            user_id=user.user_id,
            first_name=payload.first_name,
            father_name=payload.father_name,
            last_name=payload.last_name,
            gender=payload.gender,
            nationality_country_id=payload.nationality_country_id,
            current_country_id=payload.current_country_id,
            communication_lang_id=payload.communication_lang_id,
            email=payload.person_email,
            phone=payload.phone,
        )
        db.add(person)
        db.flush()

        # أوتوماتيك: عمل طلب دعوة جديد لهذا الشخص
        request = DawahRequest(
            request_type=RequestType.self_interested,
            submitted_by_person_id=person.person_id,
            status=RequestStatus.pending,
            notes="طلب تسجيل ذاتي من النظام"
        )
        db.add(request)
        db.flush()

        history = RequestStatusHistory(
            request_id=request.request_id,
            new_status=RequestStatus.pending,
            note="تم إنشاء طلب آلي عند تسجيل الشخص المهتم"
        )
        db.add(history)
        db.commit()
        db.refresh(person)
        
        # إذا سجل المستخدم وكان له تاريخ كمستخدم زائر في الشات
        if payload.guest_session_id:
            from app.models.ai_chat import AIChatMessage
            updated = db.query(AIChatMessage).filter(
                AIChatMessage.session_id == payload.guest_session_id
            ).update({"user_id": user.user_id, "session_id": None}, synchronize_session=False)
            if updated > 0:
                db.commit()
                
        return {"message": InterestedPersonMessages.REGISTERED, "data": person}

    @staticmethod
    def list_persons(db: Session, skip: int, limit: int, first_name: str | None, last_name: str | None):
        q = db.query(InterestedPerson)
        if first_name:
            q = q.filter(InterestedPerson.first_name.ilike(f"%{first_name}%"))
        if last_name:
            q = q.filter(InterestedPerson.last_name.ilike(f"%{last_name}%"))
        persons = q.order_by(InterestedPerson.created_at.desc()).offset(skip).limit(limit).all()
        return {"message": InterestedPersonMessages.LISTED, "data": persons}

    @staticmethod
    def get_person(db: Session, person_id: int):
        person = db.query(InterestedPerson).filter(InterestedPerson.person_id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail=InterestedPersonMessages.NOT_FOUND)
        return {"message": InterestedPersonMessages.FETCHED, "data": person}

    @staticmethod
    def update_person(db: Session, person_id: int, payload: InterestedPersonUpdate):
        person = db.query(InterestedPerson).filter(InterestedPerson.person_id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail=InterestedPersonMessages.NOT_FOUND)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(person, field, value)

        db.commit()
        db.refresh(person)
        return {"message": InterestedPersonMessages.UPDATED, "data": person}

    @staticmethod
    def delete_person(db: Session, person_id: int):
        person = db.query(InterestedPerson).filter(InterestedPerson.person_id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail=InterestedPersonMessages.NOT_FOUND)

        if person.user_id:
            user = db.query(User).filter(User.user_id == person.user_id).first()
            if user:
                user.deleted_at = datetime.now(timezone.utc)
                user.status = AccountStatus.suspended

        db.delete(person)
        db.commit()
        return {"message": InterestedPersonMessages.DELETED}
