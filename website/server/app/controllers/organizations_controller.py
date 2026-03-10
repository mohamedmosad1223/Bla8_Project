"""
Organizations Controller — Business logic for Organization CRUD operations.
"""

import hashlib
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.organization import Organization
from app.models.enums import UserRole, AccountStatus
from app.models.responses import OrganizationMessages, UserMessages
from app.schemas import OrganizationUpdate, OrganizationRegister


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class OrganizationsController:

    @staticmethod
    def register(db: Session, payload: OrganizationRegister):
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail=UserMessages.EMAIL_REGISTERED)

        user = User(
            email=payload.email,
            password_hash=_hash_password(payload.password),
            role=UserRole.organization,
            status=AccountStatus.pending,
        )
        db.add(user)
        db.flush()

        org = Organization(
            user_id=user.user_id,
            organization_name=payload.organization_name,
            license_number=payload.license_number,
            establishment_date=payload.establishment_date,
            country_id=payload.country_id,
            governorate=payload.governorate,
            manager_name=payload.manager_name,
            phone=payload.phone,
            email=payload.org_email,
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        return {"message": OrganizationMessages.REGISTERED, "data": org}

    @staticmethod
    def list_organizations(db: Session, skip: int, limit: int, approval: str | None):
        q = db.query(Organization)
        if approval:
            q = q.filter(Organization.approval_status == approval)
        orgs = q.order_by(Organization.created_at.desc()).offset(skip).limit(limit).all()
        return {"message": OrganizationMessages.LISTED, "data": orgs}

    @staticmethod
    def get_organization(db: Session, org_id: int):
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail=OrganizationMessages.NOT_FOUND)
        return {"message": OrganizationMessages.FETCHED, "data": org}

    @staticmethod
    def update_organization(db: Session, org_id: int, payload: OrganizationUpdate):
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail=OrganizationMessages.NOT_FOUND)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(org, field, value)

        db.commit()
        db.refresh(org)
        return {"message": OrganizationMessages.UPDATED, "data": org}

    @staticmethod
    def delete_organization(db: Session, org_id: int):
        org = db.query(Organization).filter(Organization.org_id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail=OrganizationMessages.NOT_FOUND)

        user = db.query(User).filter(User.user_id == org.user_id).first()
        if user:
            user.deleted_at = datetime.now(timezone.utc)
            user.status = AccountStatus.suspended

        db.delete(org)
        db.commit()
        return {"message": OrganizationMessages.DELETED}
