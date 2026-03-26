"""
Pydantic Schemas — Input validation + output serialization
كل schema بيفرض validation صارمة على البيانات الداخلة
"""

from __future__ import annotations
from datetime import date, datetime
from typing import Optional, List, Any, Union
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


# Note: Password/OTP requests moved to security section for better organization


# ─── Admin ───────────────────────────────────────────────────────────────────

class AdminCreate(BaseModel):
    user_id: int = Field(..., gt=0)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
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
    organization_name:  str            = Field(..., min_length=3, max_length=255)
    license_number:     str            = Field(..., min_length=1, max_length=100)
    license_file:       str            = Field(..., min_length=1, max_length=500)
    establishment_date: date
    country_id:         int            = Field(..., gt=0)
    governorate:        str            = Field(..., min_length=2, max_length=150)
    manager_name:       str            = Field(..., min_length=3, max_length=255)
    phone:              str            = Field(..., min_length=7, max_length=30)
    email:              EmailStr

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
    phone:                    Optional[str]  = Field(None, max_length=30)
    email:                    Optional[EmailStr] = Field(None, max_length=255)
    gender:                   Optional[GenderType] = None
    nationality_country_id:   Optional[int]  = Field(None, gt=0)
    org_id:                   Optional[int]  = Field(None, gt=0)
    identity_number:          Optional[str]  = Field(None, max_length=100)
    scientific_qualification: str            = Field(..., min_length=2, max_length=255)
    qualification_file:       Optional[str]  = Field(None, max_length=500)
    languages:                List[int]      = Field(default_factory=list)

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
    phone:                 Optional[str]  = Field(None, max_length=30)
    nationality_country_id:Optional[int]  = Field(None, gt=0)
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
    nationality_country_id: Optional[int]  = Field(None, gt=0)
    current_country_id:     Optional[int]  = Field(None, gt=0)
    communication_lang_id:  Optional[int]  = Field(None, gt=0)
    email:                  Optional[EmailStr] = Field(None, max_length=255)
    phone:                  Optional[str]  = Field(None, max_length=30)

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)


class InterestedPersonRead(InterestedPersonCreate):
    person_id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Dawah Request ───────────────────────────────────────────────────────────

class DawahRequestCreate(BaseModel):
    request_type: Optional[RequestType] = None

    # بيانات المدعو
    invited_first_name:         Optional[str]  = Field(None, max_length=150)
    invited_last_name:          Optional[str]  = Field(None, max_length=150)
    invited_gender:             Optional[GenderType] = None
    invited_nationality_id:     int            = Field(..., gt=0)
    invited_current_country_id: Optional[int]  = Field(None, gt=0)
    invited_language_id:        int            = Field(..., gt=0)
    invited_phone:              Optional[str]  = Field(None, max_length=30)
    invited_email:              Optional[EmailStr] = Field(None, max_length=255)
    invited_religion_id:        int            = Field(..., gt=0)
    invited_religion:           Optional[str]  = Field(None, max_length=100) # For 'Other'

    # من رفعه
    submitted_by_caller_id: Optional[int] = Field(None, gt=0)
    submitted_by_person_id: Optional[int] = Field(None, gt=0)

    # قناة التواصل (v3)
    communication_channel: Optional[CommunicationChannel] = None
    deep_link:             Optional[str] = Field(None, max_length=500)
    notes:                 Optional[str] = Field(None, max_length=3000)

    @field_validator("invited_phone")
    @classmethod
    def phone_valid(cls, v): return validate_phone(v)

    @model_validator(mode="after")
    def check_consistency(self) -> "DawahRequestCreate":
        if self.communication_channel == CommunicationChannel.whatsapp and self.invited_phone:
            if not self.deep_link:
                clean = re.sub(r"[\s\-\(\)]", "", self.invited_phone or "")
                self.deep_link = f"https://wa.me/{clean}"
        
        # v4: Deep link is mandatory for social channels except WhatsApp/Phone
        social_channels = [
            CommunicationChannel.messenger, 
            CommunicationChannel.telegram, 
            CommunicationChannel.other
        ]
        if self.communication_channel in social_channels and not self.deep_link:
            raise ValueError(f"رابط التواصل مطلوب لقناة {self.communication_channel.value}")
            
        if self.communication_channel in [CommunicationChannel.whatsapp, CommunicationChannel.phone] and not self.invited_phone:
            raise ValueError(f"رقم الهاتف مطلوب لقناة {self.communication_channel.value}")

        return self


class DawahRequestRead(BaseModel):
    request_id:            int
    request_type:          RequestType
    status:                RequestStatus
    communication_channel: Optional[CommunicationChannel]
    deep_link:             Optional[str]
    submission_date:       datetime
    accepted_at:           Optional[datetime]
    submitter_feedback:    Optional[str] = None
    preacher_feedback:     Optional[str] = None
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
    new_status: Optional[RequestStatus] = None
    note: Optional[str] = Field(None, max_length=1000)
    preacher_feedback: Optional[str] = Field(None, max_length=2000)
    conversion_date: Optional[date] = None

    @model_validator(mode="after")
    def check_conversion(self) -> "StatusUpdateRequest":
        if self.new_status == RequestStatus.converted and not self.conversion_date:
            raise ValueError("تاريخ الإسلام مطلوب عند تغيير الحالة إلى 'converted'")
        return self


class SubmitterFeedbackRequest(BaseModel):
    feedback: str = Field(..., min_length=5, max_length=2000)


# ─── Dawah Reports (Daily Updates) ──────────────────────────────────────────

class DawahReportCreate(BaseModel):
    request_id:            int
    communication_type:    Optional[str] = None # e.g. "Platform", "Social Media", "Phone"
    communication_details: Optional[str] = None # e.g. "Facebook Messenger"
    content:               str

class DawahReportRead(BaseModel):
    report_id:             int
    request_id:            int
    preacher_id:           int
    communication_type:    Optional[str] = None
    communication_details: Optional[str] = None
    content:               str
    created_at:            datetime

    model_config = {"from_attributes": True}


# ─── Contact Attempts ────────────────────────────────────────────────────────

class ContactAttemptRead(BaseModel):
    attempt_id: int
    request_id: int
    preacher_id: int
    channel:     CommunicationChannel
    clicked_at:  datetime
    model_config = {"from_attributes": True}


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
    password:           Optional[str]       = Field(None, min_length=6, max_length=100)
    password_confirm:   Optional[str]       = Field(None, min_length=6, max_length=100)
    approval_status:    Optional[ApprovalStatus] = None
    is_active:          Optional[bool] = None
    rejection_reason:   Optional[str] = None

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
    rejection_reason:         Optional[str] = None
    languages:                Optional[list[int]]      = None # الحقل المفقود

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): 
        if v: return validate_phone(v)
        return v


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
    password_confirm: str = Field(..., min_length=8, max_length=128)
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

    @model_validator(mode="after")
    def passwords_match(self) -> "AdminRegister":
        if self.password != self.password_confirm:
            raise ValueError("كلمتا المرور غير متطابقتين")
        return self


class OrganizationRegister(BaseModel):
    """Register a new Organization: creates User + Organization profile atomically."""
    email:              EmailStr
    password:           str            = Field(..., min_length=8, max_length=72)
    password_confirm:   str            = Field(..., min_length=8, max_length=72)
    organization_name:  str            = Field(..., min_length=3, max_length=255)
    license_number:     str            = Field(..., min_length=1, max_length=100)
    license_file:       str            = Field(..., min_length=1, max_length=500, description="مسار ملف الترخيص PDF")
    establishment_date: date
    country_id:         int            = Field(..., gt=0)
    governorate:        str            = Field(..., min_length=2, max_length=150)
    manager_name:       str            = Field(..., min_length=3, max_length=255)
    phone:              str            = Field(..., min_length=7, max_length=30)
    org_email:          EmailStr

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
    def passwords_match(self) -> "OrganizationRegister":
        if self.password != self.password_confirm:
            raise ValueError("كلمتا المرور غير متطابقتين")
        return self


class PreacherRegister(BaseModel):
    """Register a new Preacher: creates User + Preacher profile atomically."""
    email:                    EmailStr
    password:                 str            = Field(..., min_length=8, max_length=72)
    password_confirm:         str            = Field(..., min_length=8, max_length=72)
    type:                     Optional[PreacherType] = None
    full_name:                str            = Field(..., min_length=2, max_length=255)
    phone:                    str            = Field(..., min_length=7, max_length=30)
    preacher_email:           EmailStr
    gender:                   Optional[GenderType] = None
    nationality_country_id:   int            = Field(..., gt=0)
    org_id:                   Optional[int]  = Field(None, gt=0)
    scientific_qualification: str            = Field(..., min_length=2, max_length=255)
    qualification_file:       str            = Field(..., min_length=1, max_length=500, description="مسار ملف الشهادات PDF")
    languages:                list[int]      = Field(default_factory=list, description="قائمة معرفات اللغات")
    languages:                list[int]      = Field(default_factory=list, description="قائمة معرفات اللغات")

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
    def check_register_consistency(self) -> "PreacherRegister":
        if self.password != self.password_confirm:
            raise ValueError("كلمتا المرور غير متطابقتين")
        
        if self.type == PreacherType.official:
            if self.org_id is None:
                raise ValueError("الداعية الرسمي يجب أن ينتمي لجمعية (org_id مطلوب)")
            if not self.languages:
                raise ValueError("يجب تحديد لغة واحدة على الأقل للداعية التابع لجمعية")
        
        if self.type == PreacherType.volunteer and self.org_id is not None:
            raise ValueError("الداعية المنفرد لا ينتمي لجمعية")
            
        return self


class MuslimCallerRegister(BaseModel):
    """Register a new MuslimCaller: creates User + MuslimCaller profile atomically."""
    email:                  EmailStr
    password:               str            = Field(..., min_length=8, max_length=72)
    password_confirm:       str            = Field(..., min_length=8, max_length=72)
    full_name:              str            = Field(..., min_length=2, max_length=255)
    phone:                  Optional[str]  = Field(None, max_length=30)
    nationality_country_id: Optional[int]  = Field(None, gt=0)
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

    @model_validator(mode="after")
    def passwords_match(self) -> "MuslimCallerRegister":
        if self.password != self.password_confirm:
            raise ValueError("كلمتا المرور غير متطابقتين")
        return self


class InterestedPersonRegister(BaseModel):
    """Register a new InterestedPerson: creates User + InterestedPerson profile atomically."""
    email:                  EmailStr
    password:               str            = Field(..., min_length=8, max_length=72)
    first_name:             str            = Field(..., min_length=1, max_length=150)
    father_name:            Optional[str]  = Field(None, max_length=150)
    last_name:              str            = Field(..., min_length=1, max_length=150)
    gender:                 Optional[GenderType] = None
    nationality_country_id: int            = Field(..., gt=0)
    current_country_id:     Optional[int]  = Field(None, gt=0)
    communication_lang_id:  int            = Field(..., gt=0)
    religion_id:            int            = Field(..., gt=0)
    religion:               Optional[str]  = Field(None, max_length=100) # For 'Other'
    person_email:           Optional[EmailStr] = Field(None, max_length=255)
    phone:                  Optional[str]  = Field(None, max_length=30)
    guest_session_id:       Optional[str]  = Field(None, max_length=255, description="إذا كان الزائر يتحدث مع الذكاء الاصطناعي، أرسل الـ Session ID ليتم ربط الرسائل بحسابه الجديد")

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
    """Query parameters for preacher search"""
    search:        Optional[str]           = None # Name or ID
    type:          Optional[PreacherType]  = None
    status:        Optional[PreacherStatus]= None
    gender:        Optional[GenderType]    = None
    approval_status: Optional[ApprovalStatus] = None
    nationality_country_id: Optional[int]  = None
    languages:     list[int]               = Field(default_factory=list) # Multi-select
    joined_after:  Optional[datetime]      = None
    joined_before: Optional[datetime]      = None
    order_by:      Optional[str]           = "latest" # latest, oldest

    @model_validator(mode="after")
    def check_date_range(self) -> "PreacherFilterParams":
        if self.joined_after and self.joined_before:
            if self.joined_after > self.joined_before:
                raise ValueError("joined_after يجب أن يكون قبل joined_before")
        return self

class OrganizationFilterParams(BaseModel):
    """Query parameters for organization search"""
    search:          Optional[str]          = None
    approval_status: Optional[ApprovalStatus]= None
    created_after:  Optional[datetime]      = None
    created_before: Optional[datetime]      = None
    order_by:        Optional[str]          = "latest" # latest, oldest

    @model_validator(mode="after")
    def check_date_range(self) -> "OrganizationFilterParams":
        if self.created_after and self.created_before:
            if self.created_after > self.created_before:
                raise ValueError("created_after يجب أن يكون قبل created_before")
        return self


# ─── Messages (Chat) ─────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    request_id:   Optional[int] = None
    receiver_id:  Optional[int] = None # Required if request_id is None
    message_text: str
    message_type: Optional[MessageType] = MessageType.text
    file_path:    Optional[str] = None

class MessageRead(BaseModel):
    message_id:   int
    request_id:   Optional[int]
    sender_id:    int
    receiver_id:  int
    message_text: Optional[str]
    message_type: MessageType
    file_path:    Optional[str]
    is_read:      bool
    created_at:   datetime
    model_config = {"from_attributes": True}

class ChatPreviewRead(BaseModel):
    request_id:      Optional[int] = None
    other_user_id:   Optional[int] = None
    other_party_name: str
    last_message:    Optional[str]
    last_message_at: Optional[datetime]
    unread_count:    int
    status:          Optional[RequestStatus] = None
    is_online:       bool = False
    last_seen:       Optional[datetime] = None
    model_config = {"from_attributes": True}

# ─── Dashboard ───────────────────────────────────────────────────────────────

class StatCard(BaseModel):
    title: str
    value: int
    change_percentage: Optional[float] = None
    is_positive: bool = True

class ChartDataPoint(BaseModel):
    label: str
    value: float

class ResponseTimePoint(BaseModel):
    name: str # Label on X axis
    time: float # Value on Y axis (minutes)

class PreacherInfoRead(BaseModel):
    full_name: str
    email: str
    phone: str
    gender: Optional[str]
    nationality_name: str
    language_names: List[str]
    organization_name: str
    status: str
    religion: str = "إسلام"

class PreacherDashboardRead(BaseModel):
    # Basic Info
    preacher_info: PreacherInfoRead

    # Top Stats
    total_requests: StatCard
    converted_count: StatCard
    in_progress_count: StatCard
    rejected_count: StatCard
    
    # Charts
    response_speed_chart: list[ResponseTimePoint] # Time in minutes per month/period
    requests_by_status: list[ChartDataPoint]  # Distribution for donut chart
    follow_up_24h_rate: float                 # Percentage
    ai_suggestions_rate: float                # Percentage
    governorates_distribution: list[ChartDataPoint]
    countries_distribution: list[ChartDataPoint]
    
    # Activity over time
    activity_chart: list[ChartDataPoint]
    
    model_config = {"from_attributes": True}

class OrganizationDashboardRead(BaseModel):
    # Top Stats (8 Cards)
    total_preachers: StatCard
    new_requests_today: StatCard
    active_conversations: StatCard
    total_beneficiaries: StatCard
    needs_followup_count: StatCard
    total_messages: StatCard
    total_converts: StatCard
    total_rejections: StatCard
    
    # Charts
    top_nationalities: list[ChartDataPoint] # horizontal bar chart
    requests_distribution: list[ChartDataPoint] # donut chart
    conversion_trends: list[ChartDataPoint] # grouped bar chart
    
class RecentActivityRead(BaseModel):
    id: int
    name: str
    action: str
    time: str
    timestamp: datetime
    model_config = {"from_attributes": True}

class TopPreacherRead(BaseModel):
    preacher_id: int
    full_name: str
    organization_name: Optional[str]
    success_rate: float

class OrgStatRead(BaseModel):
    org_id: int
    organization_name: str
    preachers_count: int

class PreacherPresenceRead(BaseModel):
    online: int
    busy: int
    offline: int

class MainDashboardRead(BaseModel):
    """البيانات الخاصة بالصفحة الرئيسية (داشبورد الأدمن)"""
    # Top Stats (Row 1)
    total_organizations: StatCard
    total_preachers: StatCard
    total_individuals: StatCard
    
    # Top Stats (Row 2)
    total_cases: StatCard
    total_converted: StatCard
    total_rejected: StatCard

    # Tables
    top_preachers: list[TopPreacherRead]
    organization_stats: list[OrgStatRead]

    # Charts & Distribution
    nationalities_distribution: list[ChartDataPoint]
    preacher_presence: PreacherPresenceRead

    # Recent Activity
    recent_activities: list[RecentActivityRead]

    model_config = {"from_attributes": True}


# ─── Admin Management Schemas ──────────────────────────────────────────────

class AdminOrganizationListRead(BaseModel):
    org_id: int
    organization_name: str
    manager_name: str
    preachers_count: int
    total_requests: int
    converted_count: int
    under_persuasion_count: int
    rejected_count: int
    created_at: datetime
    status: AccountStatus
    model_config = {"from_attributes": True}

class AdminOrganizationDetailRead(BaseModel):
    org_id: int
    organization_name: str
    license_number: str
    phone: str
    email: str
    country: str
    governorate: str
    created_at: datetime
    status: AccountStatus
    manager_name: str
    
    # Top Stats
    stats: list[StatCard]
    
    # Charts
    conversion_trends: list[ChartDataPoint]
    requests_distribution: list[ChartDataPoint]
    nationalities_distribution: list[ChartDataPoint]
    
    model_config = {"from_attributes": True}

class AdminPreacherListRead(BaseModel):
    preacher_id: int
    full_name: str
    nationality: str
    organization_name: str
    total_requests: int
    created_at: datetime
    languages: list[str]
    status: PreacherStatus
    model_config = {"from_attributes": True}

class AdminPreacherDetailRead(BaseModel):
    preacher_id: int
    full_name: str
    email: str
    phone: str
    languages: list[str]
    nationality: str
    organization_name: Optional[str]
    status: PreacherStatus
    scientific_qualification: str
    gender: Optional[GenderType]
    
    # Stats
    stats: list[StatCard]
    
    # Charts
    countries_distribution: list[ChartDataPoint]
    response_speed_chart: list[ChartDataPoint]
    
    model_config = {"from_attributes": True}

class AdminUpdateStatusRequest(BaseModel):
    status: Union[AccountStatus, PreacherStatus]

class AdminProfileRead(BaseModel):
    user_id:         int
    email:           EmailStr
    full_name:       str
    phone:           Optional[str] = None
    profile_picture: Optional[str] = None
    level:           AdminLevel
    languages:       list[str] = [] # List of language names
    created_at:      datetime
    model_config = {"from_attributes": True}

# ─── Security & Authentication ───────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ValidateOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)
    new_password: str = Field(..., min_length=8)
    new_password_confirm: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
        if not re.search(r"[0-9]", v):
            raise ValueError("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordRequest":
        if self.new_password != self.new_password_confirm:
            raise ValueError("كلمتا المرور غير متطابقتين")
        return self

class ChangePasswordRequest(BaseModel):
    old_password: Optional[str] = None
    new_password: str = Field(..., min_length=8)
    password_confirm: Optional[str] = None
    otp:          Optional[str] = None

    @model_validator(mode="after")
    def validate_password_confirm(self) -> "ChangePasswordRequest":
        if self.password_confirm and self.new_password != self.password_confirm:
            raise ValueError("كلمتا المرور غير متطابقتين")
        return self

class AdminLanguageUpdate(BaseModel):
    language_ids: list[int]

class AdminDeleteAccountRequest(BaseModel):
    password: str

class FAQRead(BaseModel):
    faq_id:     int
    question:   str
    answer:     str
    model_config = {"from_attributes": True}

class AdminProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email:     Optional[EmailStr] = None
    phone:     Optional[str] = None
    # profile_picture handled via UploadFile in router if provided

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v): 
        if v: return validate_phone(v)
        return v
# ─── Universal Profile & Settings ──────────────────────────────────────────

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email:     Optional[EmailStr] = None
    phone:     Optional[str] = None
    app_language: Optional[str] = Field(None, min_length=2, max_length=10)
    # Profile picture is handled via UploadFile in multipart/form-data

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v):
        return validate_phone(v)

class ProfileRead(BaseModel):
    user_id: int
    email: EmailStr
    role: UserRole
    status: AccountStatus
    full_name: str
    phone: Optional[str]
    profile_picture: Optional[str]
    app_language: str
    created_at: datetime
    # Support for role-specific extra data
    extra_data: Optional[dict] = None
    model_config = {"from_attributes": True}

class AppLanguageUpdate(BaseModel):
    language_code: str = Field(..., min_length=2, max_length=10)

class ProfileLanguageUpdate(BaseModel):
    language_ids: List[int] = Field(..., min_items=1)

class HelpCenterResponse(BaseModel):
    contact_info: dict
    faqs: List[FAQRead]

class PolicyRead(BaseModel):
    key: str
    value: str
    description: Optional[str]

class AccountDeletionRequest(BaseModel):
    password: str = Field(...)

# ─── Chat & AI ────────────────────────────────────────────────────────────

class AIChatConversationCreate(BaseModel):
    title: Optional[str] = Field("محادثة جديدة", max_length=255)

class AIChatConversationRead(BaseModel):
    id: int
    title: str
    created_at: datetime
    model_config = {"from_attributes": True}

class AIChatConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)

class AIChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    conversation_id: Optional[int] = None

class GuestAIChatCreate(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=255, description="معرف الجلسة الخاص بالزائر")
    message: str = Field(..., min_length=1)

class AIChatMessageRead(BaseModel):
    id: int
    role: str
    content: str
    conversation_id: Optional[int] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class AIChatHistoryResponse(BaseModel):
    history: List[AIChatMessageRead]
    welcome_message: str

class AIChatConversationListResponse(BaseModel):
    conversations: List[AIChatConversationRead]
