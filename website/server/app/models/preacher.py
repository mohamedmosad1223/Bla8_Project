from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base
from app.models.enums import (
    preacher_type_enum, preacher_status_enum, gender_type_enum,
    approval_status_enum,
    PreacherType, PreacherStatus, GenderType, ApprovalStatus
)


class Preacher(Base):
    __tablename__ = "preachers"

    preacher_id:              Mapped[int]             = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:                  Mapped[int|None]         = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"))
    org_id:                   Mapped[int|None]         = mapped_column(sa.BigInteger, sa.ForeignKey("organizations.org_id"))
    type:                     Mapped[PreacherType]     = mapped_column(preacher_type_enum, nullable=False)
    full_name:                Mapped[str]              = mapped_column(sa.String(255), nullable=False)
    phone:                    Mapped[str]              = mapped_column(sa.String(30), nullable=False)
    email:                    Mapped[str]              = mapped_column(sa.String(255), nullable=False, unique=True)
    gender:                   Mapped[GenderType|None]  = mapped_column(gender_type_enum)
    nationality_country_id:   Mapped[int]              = mapped_column(sa.Integer, sa.ForeignKey("countries.country_id"), nullable=False)
    identity_number:          Mapped[str|None]         = mapped_column(sa.String(100))
    scientific_qualification: Mapped[str]              = mapped_column(sa.String(255), nullable=False)
    qualification_file:       Mapped[str|None]         = mapped_column(sa.String(500)) # PDF of certificates
    status:                   Mapped[PreacherStatus]   = mapped_column(preacher_status_enum, nullable=False, default=PreacherStatus.active)
    approval_status:          Mapped[ApprovalStatus]   = mapped_column(approval_status_enum, nullable=False, default=ApprovalStatus.pending)
    approved_by_admin:        Mapped[int|None]         = mapped_column(sa.BigInteger, sa.ForeignKey("admins.admin_id"))
    approved_at:              Mapped[datetime|None]    = mapped_column(sa.TIMESTAMP(timezone=True))
    rejection_reason:         Mapped[str|None]         = mapped_column(sa.Text)
    created_at:               Mapped[datetime]         = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    updated_at:               Mapped[datetime]         = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())

    # Relationships
    user:         Mapped["User"]               = relationship("User", back_populates="preacher", foreign_keys=[user_id])
    organization: Mapped["Organization"]       = relationship("Organization", back_populates="preachers")
    languages:    Mapped[list["PreacherLanguage"]]   = relationship("PreacherLanguage", back_populates="preacher", cascade="all, delete-orphan")
    documents:    Mapped[list["PreacherDocument"]]   = relationship("PreacherDocument", back_populates="preacher", cascade="all, delete-orphan")
    statistics:   Mapped["PreacherStatistics"] = relationship("PreacherStatistics", back_populates="preacher", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        # فلتر مركّب للجمعية (org_id + status + type + gender + approval_status)
        sa.Index("idx_preachers_org_filter", "org_id", "status", "type", "gender", "approval_status"),
        # فلتر جنسية
        sa.Index("idx_preachers_nationality", "nationality_country_id"),
        # فلتر تاريخ انضمام
        sa.Index("idx_preachers_created", "created_at"),
        # type + status فقط (للأدمن)
        sa.Index("idx_preachers_type_status", "type", "status", "approval_status"),
        # Constraints
        sa.CheckConstraint("NOT (type = 'volunteer' AND org_id IS NOT NULL)", name="chk_volunteer_no_org"),
        sa.CheckConstraint("NOT (type = 'official'  AND org_id IS NULL)",    name="chk_official_has_org"),
    )


class PreacherLanguage(Base):
    __tablename__ = "preacher_languages"

    id:          Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    preacher_id: Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("preachers.preacher_id", ondelete="CASCADE"), nullable=False)
    language_id: Mapped[int]      = mapped_column(sa.Integer, sa.ForeignKey("languages.language_id"), nullable=False)
    proficiency: Mapped[str|None] = mapped_column(sa.String(50))  # beginner/intermediate/fluent/native

    preacher: Mapped["Preacher"] = relationship("Preacher", back_populates="languages")

    __table_args__ = (
        sa.UniqueConstraint("preacher_id", "language_id", name="uq_preacher_language"),
        # فلتر باللغة
        sa.Index("idx_preacher_lang", "language_id", "preacher_id"),
    )


class PreacherDocument(Base):
    __tablename__ = "preacher_documents"

    document_id: Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    preacher_id: Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("preachers.preacher_id", ondelete="CASCADE"), nullable=False)
    doc_type:    Mapped[str|None] = mapped_column(sa.String(100))
    doc_name:    Mapped[str]      = mapped_column(sa.String(255), nullable=False)
    file_path:   Mapped[str]      = mapped_column(sa.String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    preacher: Mapped["Preacher"] = relationship("Preacher", back_populates="documents")


class PreacherStatistics(Base):
    __tablename__ = "preacher_statistics"

    stat_id:               Mapped[int]         = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    preacher_id:           Mapped[int]         = mapped_column(sa.BigInteger, sa.ForeignKey("preachers.preacher_id", ondelete="CASCADE"), nullable=False, unique=True)
    total_accepted:        Mapped[int]         = mapped_column(sa.Integer, nullable=False, default=0)
    converted_count:       Mapped[int]         = mapped_column(sa.Integer, nullable=False, default=0)
    in_progress_count:     Mapped[int]         = mapped_column(sa.Integer, nullable=False, default=0)
    rejected_count:        Mapped[int]         = mapped_column(sa.Integer, nullable=False, default=0)
    no_response_count:     Mapped[int]         = mapped_column(sa.Integer, nullable=False, default=0)
    avg_response_time_min: Mapped[float|None]  = mapped_column(sa.Numeric(10, 2))
    total_messages_sent:   Mapped[int]         = mapped_column(sa.Integer, nullable=False, default=0)
    updated_at:            Mapped[datetime]    = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())

    preacher: Mapped["Preacher"] = relationship("Preacher", back_populates="statistics")
