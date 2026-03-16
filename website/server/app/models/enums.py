"""
PostgreSQL ENUMs - defined here as Python Enums and SQLAlchemy types.
"""

import enum
import sqlalchemy as sa


class UserRole(str, enum.Enum):
    admin = "admin"
    organization = "organization"
    preacher = "preacher"
    muslim_caller = "muslim_caller"
    interested = "interested"


class AccountStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    pending = "pending"


class AdminLevel(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class PreacherType(str, enum.Enum):
    volunteer = "volunteer"
    official = "official"


class PreacherStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"


class GenderType(str, enum.Enum):
    male = "male"
    female = "female"


class RequestType(str, enum.Enum):
    invited = "invited"
    self_interested = "self_interested"


class RequestStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    under_persuasion = "under_persuasion"
    converted = "converted"
    rejected = "rejected"
    no_response = "no_response"


class CommunicationChannel(str, enum.Enum):
    phone = "phone"
    whatsapp = "whatsapp"
    messenger = "messenger"
    telegram = "telegram"
    email = "email"
    in_person = "in_person"
    other = "other"


class MessageType(str, enum.Enum):
    text = "text"
    image = "image"
    file = "file"
    audio = "audio"


class NotificationType(str, enum.Enum):
    new_request = "new_request"
    request_accepted = "request_accepted"
    status_changed = "status_changed"
    new_message = "new_message"
    account_approved = "account_approved"
    account_rejected = "account_rejected"
    alert_42h = "alert_42h"
    auto_reclaimed = "auto_reclaimed"


# SQLAlchemy ENUM types (reflect actual PG enum names)
user_role_enum          = sa.Enum(UserRole,           name="user_role")
account_status_enum     = sa.Enum(AccountStatus,      name="account_status")
admin_level_enum        = sa.Enum(AdminLevel,         name="admin_level")
approval_status_enum    = sa.Enum(ApprovalStatus,     name="approval_status")
preacher_type_enum      = sa.Enum(PreacherType,       name="preacher_type")
preacher_status_enum    = sa.Enum(PreacherStatus,     name="preacher_status")
gender_type_enum        = sa.Enum(GenderType,         name="gender_type")
request_type_enum       = sa.Enum(RequestType,        name="request_type")
request_status_enum     = sa.Enum(RequestStatus,      name="request_status")
comm_channel_enum       = sa.Enum(CommunicationChannel, name="communication_channel")
message_type_enum       = sa.Enum(MessageType,        name="message_type")
notification_type_enum  = sa.Enum(NotificationType,   name="notification_type")
