"""
SQLAlchemy Models Package
Import all models here so Alembic can detect them during autogenerate.
"""

from app.models.enums import *  # noqa: F401,F403
from app.models.user import User  # noqa: F401
from app.models.organization import Organization  # noqa: F401
from app.models.admin import Admin  # noqa: F401
from app.models.preacher import Preacher, PreacherLanguage, PreacherDocument, PreacherStatistics  # noqa: F401
from app.models.muslim_caller import MuslimCaller  # noqa: F401
from app.models.interested_person import InterestedPerson  # noqa: F401
from app.models.dawah_request import (  # noqa: F401
    DawahRequest, RequestDocument, RequestStatusHistory,
    DawahReport, ContactAttempt
)
from app.models.message import Message  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.report_metric import ReportMetric  # noqa: F401
from app.models.reference import Language, Country  # noqa: F401

__all__ = [
    "User", "Admin", "Organization",
    "Preacher", "PreacherLanguage", "PreacherDocument", "PreacherStatistics",
    "MuslimCaller", "InterestedPerson",
    "DawahRequest", "RequestDocument", "RequestStatusHistory",
    "DawahReport", "ContactAttempt",
    "Message", "Notification", "AuditLog", "ReportMetric",
    "Language", "Country",
]
