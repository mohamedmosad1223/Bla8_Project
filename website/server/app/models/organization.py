from datetime import date, datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base
from app.models.enums import approval_status_enum, ApprovalStatus


class Organization(Base):
    __tablename__ = "organizations"

    org_id:             Mapped[int]            = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:            Mapped[int]            = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=False, unique=True)
    organization_name:  Mapped[str]            = mapped_column(sa.String(255), nullable=False)
    license_number:     Mapped[str|None]       = mapped_column(sa.String(100))
    license_file:       Mapped[str|None]       = mapped_column(sa.String(500))
    establishment_date: Mapped[date|None]      = mapped_column(sa.Date)
    country_id:         Mapped[int|None]       = mapped_column(sa.Integer, sa.ForeignKey("countries.country_id"))
    governorate:        Mapped[str|None]       = mapped_column(sa.String(150))
    manager_name:       Mapped[str]            = mapped_column(sa.String(255), nullable=False)
    phone:              Mapped[str|None]       = mapped_column(sa.String(30))
    email:              Mapped[str|None]       = mapped_column(sa.String(255))
    approval_status:    Mapped[ApprovalStatus] = mapped_column(approval_status_enum, nullable=False, default=ApprovalStatus.pending)
    approved_by:        Mapped[int|None]       = mapped_column(sa.BigInteger, sa.ForeignKey("admins.admin_id"))
    approved_at:        Mapped[datetime|None]  = mapped_column(sa.TIMESTAMP(timezone=True))
    rejection_reason:   Mapped[str|None]       = mapped_column(sa.Text)
    created_at:         Mapped[datetime]       = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    updated_at:         Mapped[datetime]       = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())

    user:      Mapped["User"]      = relationship("User",  back_populates="organization")
    preachers: Mapped[list["Preacher"]] = relationship("Preacher", back_populates="organization")
