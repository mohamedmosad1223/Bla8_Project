from datetime import date, datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base
from app.models.enums import (
    request_type_enum, request_status_enum, gender_type_enum, comm_channel_enum,
    RequestType, RequestStatus, GenderType, CommunicationChannel
)


class DawahRequest(Base):
    __tablename__ = "dawah_requests"

    request_id:   Mapped[int]           = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    request_type: Mapped[RequestType]   = mapped_column(request_type_enum, nullable=False)

    # ── بيانات المدعو (لو invited) ──────────────────────────
    invited_first_name:         Mapped[str|None]          = mapped_column(sa.String(150))
    invited_last_name:          Mapped[str|None]          = mapped_column(sa.String(150))
    invited_gender:             Mapped[GenderType|None]   = mapped_column(gender_type_enum)
    invited_nationality_id:     Mapped[int|None]          = mapped_column(sa.Integer, sa.ForeignKey("countries.country_id"))
    invited_current_country_id: Mapped[int|None]          = mapped_column(sa.Integer, sa.ForeignKey("countries.country_id"))
    invited_language_id:        Mapped[int|None]          = mapped_column(sa.Integer, sa.ForeignKey("languages.language_id"))
    invited_phone:              Mapped[str|None]          = mapped_column(sa.String(30))
    invited_email:              Mapped[str|None]          = mapped_column(sa.String(255))

    # ── من رفع الطلب ────────────────────────────────────────
    submitted_by_caller_id: Mapped[int|None] = mapped_column(sa.BigInteger, sa.ForeignKey("muslim_callers.caller_id"))
    submitted_by_person_id: Mapped[int|None] = mapped_column(sa.BigInteger, sa.ForeignKey("interested_persons.person_id"))

    # ── الداعية المسؤول ──────────────────────────────────────
    assigned_preacher_id: Mapped[int|None] = mapped_column(sa.BigInteger, sa.ForeignKey("preachers.preacher_id"))
    accepted_at:          Mapped[datetime|None] = mapped_column(sa.TIMESTAMP(timezone=True))

    # ── الحالة ───────────────────────────────────────────────
    status:          Mapped[RequestStatus] = mapped_column(request_status_enum, nullable=False, default=RequestStatus.pending)
    conversion_date: Mapped[date|None]    = mapped_column(sa.Date)
    notes:           Mapped[str|None]     = mapped_column(sa.Text)
    
    # ── التقييم والملاحظات المتبادلة (خاص للأدمن والجمعية) ──────
    submitter_feedback: Mapped[str|None] = mapped_column(sa.Text)
    preacher_feedback:  Mapped[str|None] = mapped_column(sa.Text)

    # ── v3: قناة التواصل + Deep Link ─────────────────────────
    communication_channel: Mapped[CommunicationChannel|None] = mapped_column(comm_channel_enum)
    deep_link:             Mapped[str|None] = mapped_column(sa.Text)  # e.g. wa.me/+201234567890
    governorate:           Mapped[str|None] = mapped_column(sa.String(150))

    # ── v3: نظام الاسترداد (48h + 72h) ──────────────────────
    alert_42h_sent_at: Mapped[datetime|None] = mapped_column(sa.TIMESTAMP(timezone=True))
    auto_reclaim_at:   Mapped[datetime|None] = mapped_column(sa.TIMESTAMP(timezone=True))  # = accepted_at + 72h
    reclaimed_at:      Mapped[datetime|None] = mapped_column(sa.TIMESTAMP(timezone=True))  # وقت السحب الفعلي

    submission_date: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    created_at:      Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    updated_at:      Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())

    # Relationships
    documents:      Mapped[list["RequestDocument"]]     = relationship("RequestDocument",     back_populates="request", cascade="all, delete-orphan")
    status_history: Mapped[list["RequestStatusHistory"]] = relationship("RequestStatusHistory", back_populates="request", cascade="all, delete-orphan")
    preacher:       Mapped["Preacher"]                  = relationship("Preacher", foreign_keys=[assigned_preacher_id])
    messages:       Mapped[list["Message"]]             = relationship("Message", back_populates="request", cascade="all, delete-orphan")
    reports:        Mapped[list["DawahReport"]]         = relationship("DawahReport", back_populates="request", cascade="all, delete-orphan")
    contact_attempts:Mapped[list["ContactAttempt"]]     = relationship("ContactAttempt", back_populates="request", cascade="all, delete-orphan")

    __table_args__ = (
        sa.Index("idx_requests_status",    "status"),
        sa.Index("idx_requests_type",      "request_type"),
        sa.Index("idx_requests_preacher",  "assigned_preacher_id"),
        sa.Index("idx_requests_caller",    "submitted_by_caller_id"),
        sa.Index("idx_requests_person",    "submitted_by_person_id"),
        sa.Index("idx_requests_channel",   "communication_channel"),
        # للاسترداد التلقائي (cron job يجلب: in_progress + auto_reclaim_at < NOW())
        sa.Index("idx_requests_reclaim",   "status", "auto_reclaim_at"),
        sa.CheckConstraint(
            "NOT (request_type = 'invited' AND submitted_by_caller_id IS NULL)",
            name="chk_invited_has_caller"
        ),
        sa.CheckConstraint(
            "NOT (request_type = 'self_interested' AND submitted_by_person_id IS NULL)",
            name="chk_self_has_person"
        ),
        sa.CheckConstraint(
            "NOT (status != 'pending' AND assigned_preacher_id IS NULL)",
            name="chk_inprogress_has_preacher"
        ),
    )


class RequestDocument(Base):
    __tablename__ = "request_documents"

    document_id: Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    request_id:  Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("dawah_requests.request_id", ondelete="CASCADE"), nullable=False)
    doc_name:    Mapped[str]      = mapped_column(sa.String(255), nullable=False)
    file_path:   Mapped[str]      = mapped_column(sa.String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    request: Mapped["DawahRequest"] = relationship("DawahRequest", back_populates="documents")


class RequestStatusHistory(Base):
    __tablename__ = "request_status_history"

    history_id: Mapped[int]              = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[int]              = mapped_column(sa.BigInteger, sa.ForeignKey("dawah_requests.request_id", ondelete="CASCADE"), nullable=False)
    old_status: Mapped[RequestStatus|None]= mapped_column(request_status_enum)
    new_status: Mapped[RequestStatus]    = mapped_column(request_status_enum, nullable=False)
    changed_by: Mapped[int|None]         = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"))
    note:       Mapped[str|None]         = mapped_column(sa.Text)
    changed_at: Mapped[datetime]         = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    request: Mapped["DawahRequest"] = relationship("DawahRequest", back_populates="status_history")


class DawahReport(Base):
    __tablename__ = "dawah_reports"

    report_id:             Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    request_id:            Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("dawah_requests.request_id", ondelete="CASCADE"), nullable=False)
    preacher_id:           Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("preachers.preacher_id", ondelete="CASCADE"), nullable=False)
    communication_type:    Mapped[str|None] = mapped_column(sa.String(100)) # e.g. "Platform", "Social Media", "Phone"
    communication_details: Mapped[str|None] = mapped_column(sa.String(255)) # e.g. "WhatsApp", "Facebook Messenger"
    content:               Mapped[str]      = mapped_column(sa.Text, nullable=False)
    created_at:            Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    request: Mapped["DawahRequest"] = relationship("DawahRequest", back_populates="reports")


class ContactAttempt(Base):
    __tablename__ = "contact_attempts"

    attempt_id:  Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    request_id:  Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("dawah_requests.request_id", ondelete="CASCADE"), nullable=False)
    preacher_id: Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("preachers.preacher_id", ondelete="CASCADE"), nullable=False)
    channel:     Mapped[comm_channel_enum] = mapped_column(comm_channel_enum, nullable=False)
    clicked_at:  Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    request: Mapped["DawahRequest"] = relationship("DawahRequest", back_populates="contact_attempts")
