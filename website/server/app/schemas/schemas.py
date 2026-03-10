"""
Pydantic Schemas — Input validation + output serialization
كل schema بيفرض validation صارمة على البيانات الداخلة
"""

from __future__ import annotations
from datetime import date, datetime
from typing import Optional
import re

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.models.enums import (
    UserRole, AccountStatus, AdminLevel, ApprovalStatus,
    PreacherType, PreacherStatus, GenderType,
    RequestType, RequestStatus, CommunicationChannel,
    MessageType, NotificationType,
)


# ─── Helpers ────────────────────────────────────────────────────────────────

PHONE_REGEX = re.compile(r"^\+?[0-9\s\-\(\)]{7,20}$")


def validate_phone(v: str | None) -> str | None:
    if v is None:
        return v
    v = v.strip()
    if not PHONE_REGEX.match(v):
        raise ValueError("رقم الهاتف غير صالح — يجب أن يبدأ بـ + ويحتوي على أرقام فقط")
    return v


# ─── Reference ───────────────────────────────────────────────────────────────

class LanguageBase(BaseModel):
    language_name: str = Field(..., min_length=2, max_length=100)
    language_code: str = Field(..., min_length=2, max_length=10, pattern=r"^[a-zA-Z\-]+$")
    is_active: bool = True


class LanguageCreate(LanguageBase):
    pass


class LanguageRead(LanguageBase):
    language_id: int
    model_config = {"from_attributes": True}


class CountryBase(BaseModel):
    country_name: str = Field(..., min_length=2, max_length=100)
    country_code: str = Field(..., min_length=2, max_length=10, pattern=r"^[A-Z]{2,3}$")
    phone_code: Optional[str] = Field(None, max_length=20)


class CountryCreate(CountryBase):
    pass


class CountryRead(CountryBase):
    country_id: int
    model_config = {"from_attributes": True}


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128,
                          description="8 أحرف على الأقل")
    role: UserRole

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
        if not re.search(r"[0-9]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
        return v


class UserRead(BaseModel):
    user_id: int
    email: EmailStr
    role: UserRole
    status: AccountStatus
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Admin ───────────────────────────────────────────────────────────────────

class AdminCreate(BaseModel):
    user_id: int
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None
    level: AdminLevel = AdminLevel.admin

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class AdminRead(AdminCreate):
    admin_id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Organization ────────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    organization_name: str  = Field(..., min_length=3, max_length=255)
    license_number:    Optional[str] = Field(None, max_length=100)
    establishment_date:Optional[date] = None
    country_id:        Optional[int]  = None
    governorate:       Optional[str]  = Field(None, max_length=150)
    manager_name:      str            = Field(..., min_length=3, max_length=255)
    phone:             Optional[str]  = None
    email:             Optional[EmailStr] = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)

    @field_validator("establishment_date")
    @classmethod
    def date_not_future(cls, v: date | None) -> date | None:
        if v and v > date.today():
            raise ValueError("تاريخ التأسيس لا يمكن أن يكون في المستقبل")
        return v


class OrganizationRead(OrganizationCreate):
    org_id: int
    approval_status: ApprovalStatus
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Preacher ────────────────────────────────────────────────────────────────

class PreacherCreate(BaseModel):
    type:                     PreacherType
    full_name:                str            = Field(..., min_length=2, max_length=255)
    phone:                    Optional[str]  = None
    email:                    Optional[EmailStr] = None
    gender:                   Optional[GenderType] = None
    nationality_country_id:   Optional[int]  = None
    org_id:                   Optional[int]  = None
    identity_number:          Optional[str]  = Field(None, max_length=100)
    scientific_qualification: Optional[str]  = Field(None, max_length=255)

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)

    @model_validator(mode="after")
    def check_org_consistency(self) -> "PreacherCreate":
        if self.type == PreacherType.official and self.org_id is None:
            raise ValueError("الداعية الرسمي يجب أن ينتمي لجمعية (org_id مطلوب)")
        if self.type == PreacherType.volunteer and self.org_id is not None:
            raise ValueError("الداعية المنفرد لا ينتمي لجمعية")
        return self


class PreacherLanguageCreate(BaseModel):
    language_id: int
    proficiency: Optional[str] = Field(None, pattern=r"^(beginner|intermediate|fluent|native)$")


class PreacherRead(PreacherCreate):
    preacher_id: int
    status: PreacherStatus
    approval_status: ApprovalStatus
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Muslim Caller ───────────────────────────────────────────────────────────

class MuslimCallerCreate(BaseModel):
    full_name:             str            = Field(..., min_length=2, max_length=255)
    phone:                 Optional[str]  = None
    nationality_country_id:Optional[int]  = None
    gender:                Optional[GenderType] = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class MuslimCallerRead(MuslimCallerCreate):
    caller_id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Interested Person ────────────────────────────────────────────────────────

class InterestedPersonCreate(BaseModel):
    first_name:             str            = Field(..., min_length=1, max_length=150)
    father_name:            Optional[str]  = Field(None, max_length=150)
    last_name:              str            = Field(..., min_length=1, max_length=150)
    gender:                 Optional[GenderType] = None
    nationality_country_id: Optional[int]  = None
    current_country_id:     Optional[int]  = None
    communication_lang_id:  Optional[int]  = None
    email:                  Optional[EmailStr] = None
    phone:                  Optional[str]  = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class InterestedPersonRead(InterestedPersonCreate):
    person_id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Dawah Request ───────────────────────────────────────────────────────────

class DawahRequestCreate(BaseModel):
    request_type: RequestType

    # بيانات المدعو
    invited_first_name:         Optional[str]  = Field(None, max_length=150)
    invited_last_name:          Optional[str]  = Field(None, max_length=150)
    invited_gender:             Optional[GenderType] = None
    invited_nationality_id:     Optional[int]  = None
    invited_current_country_id: Optional[int]  = None
    invited_language_id:        Optional[int]  = None
    invited_phone:              Optional[str]  = None
    invited_email:              Optional[EmailStr] = None

    # من رفعه
    submitted_by_caller_id: Optional[int] = None
    submitted_by_person_id: Optional[int] = None

    # قناة التواصل (v3)
    communication_channel: Optional[CommunicationChannel] = None
    deep_link:             Optional[str] = Field(None, max_length=500)
    notes:                 Optional[str] = None

    @field_validator("invited_phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)

    @model_validator(mode="after")
    def check_consistency(self) -> "DawahRequestCreate":
        if self.request_type == RequestType.invited and not self.submitted_by_caller_id:
            raise ValueError("نوع الطلب 'invited' يتطلب submitted_by_caller_id")
        if self.request_type == RequestType.self_interested and not self.submitted_by_person_id:
            raise ValueError("نوع الطلب 'self_interested' يتطلب submitted_by_person_id")
        if self.communication_channel == CommunicationChannel.whatsapp and self.invited_phone:
            # توليد deep_link تلقائياً لو مش موجود
            if not self.deep_link:
                clean = re.sub(r"[\s\-\(\)]", "", self.invited_phone or "")
                self.deep_link = f"https://wa.me/{clean}"
        return self


class DawahRequestRead(BaseModel):
    request_id:            int
    request_type:          RequestType
    status:                RequestStatus
    communication_channel: Optional[CommunicationChannel]
    deep_link:             Optional[str]
    submission_date:       datetime
    accepted_at:           Optional[datetime]
    updated_at:            datetime
    model_config = {"from_attributes": True}


# لوحة المسلم الداعي — بدون بيانات تواصل الداعية
class CallerDashboardRead(BaseModel):
    request_id:            int
    request_type:          RequestType
    status:                RequestStatus
    communication_channel: Optional[CommunicationChannel]
    submission_date:       datetime
    accepted_at:           Optional[datetime]
    updated_at:            datetime
    preacher_name:         Optional[str]   # الاسم فقط — بدون رقم أو إيميل
    model_config = {"from_attributes": True}


# ─── Status Update ───────────────────────────────────────────────────────────

class StatusUpdateRequest(BaseModel):
    new_status: RequestStatus
    note: Optional[str] = Field(None, max_length=1000)
    conversion_date: Optional[date] = None

    @model_validator(mode="after")
    def check_conversion(self) -> "StatusUpdateRequest":
        if self.new_status == RequestStatus.converted and not self.conversion_date:
            raise ValueError("تاريخ الإسلام مطلوب عند تغيير الحالة إلى 'converted'")
        return self


# ─── Notification ────────────────────────────────────────────────────────────

class NotificationRead(BaseModel):
    notification_id: int
    type: NotificationType
    title: str
    body: Optional[str]
    related_id: Optional[int]
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Update Schemas ──────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    email:  Optional[EmailStr]      = None
    status: Optional[AccountStatus] = None


class AdminUpdate(BaseModel):
    full_name: Optional[str]        = Field(None, min_length=2, max_length=255)
    phone:     Optional[str]        = None
    level:     Optional[AdminLevel] = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class OrganizationUpdate(BaseModel):
    organization_name:  Optional[str]       = Field(None, min_length=3, max_length=255)
    license_number:     Optional[str]       = Field(None, max_length=100)
    license_file:       Optional[str]       = Field(None, max_length=500)
    establishment_date: Optional[date]      = None
    country_id:         Optional[int]       = None
    governorate:        Optional[str]       = Field(None, max_length=150)
    manager_name:       Optional[str]       = Field(None, min_length=3, max_length=255)
    phone:              Optional[str]       = None
    email:              Optional[EmailStr]  = None
    approval_status:    Optional[ApprovalStatus] = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)

    @field_validator("establishment_date")
    @classmethod
    def date_not_future(cls, v: date | None) -> date | None:
        if v and v > date.today():
            raise ValueError("تاريخ التأسيس لا يمكن أن يكون في المستقبل")
        return v


class PreacherUpdate(BaseModel):
    full_name:                Optional[str]            = Field(None, min_length=2, max_length=255)
    phone:                    Optional[str]            = None
    email:                    Optional[EmailStr]       = None
    gender:                   Optional[GenderType]     = None
    nationality_country_id:   Optional[int]            = None
    identity_number:          Optional[str]            = Field(None, max_length=100)
    scientific_qualification: Optional[str]            = Field(None, max_length=255)
    status:                   Optional[PreacherStatus] = None
    approval_status:          Optional[ApprovalStatus] = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class MuslimCallerUpdate(BaseModel):
    full_name:              Optional[str]        = Field(None, min_length=2, max_length=255)
    phone:                  Optional[str]        = None
    nationality_country_id: Optional[int]        = None
    gender:                 Optional[GenderType] = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class InterestedPersonUpdate(BaseModel):
    first_name:             Optional[str]        = Field(None, min_length=1, max_length=150)
    father_name:            Optional[str]        = Field(None, max_length=150)
    last_name:              Optional[str]        = Field(None, min_length=1, max_length=150)
    gender:                 Optional[GenderType] = None
    nationality_country_id: Optional[int]        = None
    current_country_id:     Optional[int]        = None
    communication_lang_id:  Optional[int]        = None
    email:                  Optional[EmailStr]   = None
    phone:                  Optional[str]        = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


# ─── Registration (User + Profile in one request) ───────────────────────────

class AdminRegister(BaseModel):
    """Register a new Admin: creates User + Admin profile atomically."""
    email:     EmailStr
    password:  str        = Field(..., min_length=8, max_length=128)
    full_name: str        = Field(..., min_length=2, max_length=255)
    phone:     Optional[str] = None
    level:     AdminLevel = AdminLevel.admin

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
        if not re.search(r"[0-9]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class OrganizationRegister(BaseModel):
    """Register a new Organization: creates User + Organization profile atomically."""
    email:              EmailStr
    password:           str            = Field(..., min_length=8, max_length=128)
    organization_name:  str            = Field(..., min_length=3, max_length=255)
    license_number:     Optional[str]  = Field(None, max_length=100)
    establishment_date: Optional[date] = None
    country_id:         Optional[int]  = None
    governorate:        Optional[str]  = Field(None, max_length=150)
    manager_name:       str            = Field(..., min_length=3, max_length=255)
    phone:              Optional[str]  = None
    org_email:          Optional[EmailStr] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
        if not re.search(r"[0-9]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class PreacherRegister(BaseModel):
    """Register a new Preacher: creates User + Preacher profile atomically."""
    email:                    EmailStr
    password:                 str            = Field(..., min_length=8, max_length=128)
    type:                     PreacherType
    full_name:                str            = Field(..., min_length=2, max_length=255)
    phone:                    Optional[str]  = None
    preacher_email:           Optional[EmailStr] = None
    gender:                   Optional[GenderType] = None
    nationality_country_id:   Optional[int]  = None
    org_id:                   Optional[int]  = None
    identity_number:          Optional[str]  = Field(None, max_length=100)
    scientific_qualification: Optional[str]  = Field(None, max_length=255)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
        if not re.search(r"[0-9]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)

    @model_validator(mode="after")
    def check_org_consistency(self) -> "PreacherRegister":
        if self.type == PreacherType.official and self.org_id is None:
            raise ValueError("الداعية الرسمي يجب أن ينتمي لجمعية (org_id مطلوب)")
        if self.type == PreacherType.volunteer and self.org_id is not None:
            raise ValueError("الداعية المنفرد لا ينتمي لجمعية")
        return self


class MuslimCallerRegister(BaseModel):
    """Register a new MuslimCaller: creates User + MuslimCaller profile atomically."""
    email:                  EmailStr
    password:               str            = Field(..., min_length=8, max_length=128)
    full_name:              str            = Field(..., min_length=2, max_length=255)
    phone:                  Optional[str]  = None
    nationality_country_id: Optional[int]  = None
    gender:                 Optional[GenderType] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
        if not re.search(r"[0-9]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class InterestedPersonRegister(BaseModel):
    """Register a new InterestedPerson: creates User + InterestedPerson profile atomically."""
    email:                  EmailStr
    password:               str            = Field(..., min_length=8, max_length=128)
    first_name:             str            = Field(..., min_length=1, max_length=150)
    father_name:            Optional[str]  = Field(None, max_length=150)
    last_name:              str            = Field(..., min_length=1, max_length=150)
    gender:                 Optional[GenderType] = None
    nationality_country_id: Optional[int]  = None
    current_country_id:     Optional[int]  = None
    communication_lang_id:  Optional[int]  = None
    person_email:           Optional[EmailStr] = None
    phone:                  Optional[str]  = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
        if not re.search(r"[0-9]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


# ─── Preacher Filter (Query params) ──────────────────────────────────────────

class PreacherFilterParams(BaseModel):
    """Query parameters for preacher search — used by organization dashboard"""
    full_name:     Optional[str]           = None
    type:          Optional[PreacherType]  = None
    status:        Optional[PreacherStatus]= None
    gender:        Optional[GenderType]    = None
    approval_status: Optional[ApprovalStatus] = None
    nationality_country_id: Optional[int]  = None
    language_id:   Optional[int]           = None
    joined_after:  Optional[date]          = None
    joined_before: Optional[date]          = None

    @model_validator(mode="after")
    def check_date_range(self) -> "PreacherFilterParams":
        if self.joined_after and self.joined_before:
            if self.joined_after > self.joined_before:
                raise ValueError("joined_after يجب أن يكون قبل joined_before")
        return self
