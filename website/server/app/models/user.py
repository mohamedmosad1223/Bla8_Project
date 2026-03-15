from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base
from app.models.enums import (
    user_role_enum, account_status_enum, UserRole, AccountStatus
)


class User(Base):
    __tablename__ = "users"

    user_id:       Mapped[int]           = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    email:         Mapped[str]           = mapped_column(sa.String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str]           = mapped_column(sa.String(255), nullable=False)
    role:          Mapped[UserRole]      = mapped_column(user_role_enum, nullable=False)
    status:        Mapped[AccountStatus] = mapped_column(account_status_enum, nullable=False, default=AccountStatus.pending)
    last_login:    Mapped[datetime|None] = mapped_column(sa.TIMESTAMP(timezone=True))
    reset_otp:     Mapped[str|None]      = mapped_column(sa.String(10))
    reset_otp_expires_at: Mapped[datetime|None] = mapped_column(sa.TIMESTAMP(timezone=True))
    created_at:    Mapped[datetime]      = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    updated_at:    Mapped[datetime]      = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
    deleted_at:    Mapped[datetime|None] = mapped_column(sa.TIMESTAMP(timezone=True))

    # Relationships
    admin:           Mapped["Admin"]          = relationship("Admin",           back_populates="user", uselist=False)
    organization:    Mapped["Organization"]   = relationship("Organization",    back_populates="user", uselist=False)
    preacher:        Mapped["Preacher"]       = relationship("Preacher",        back_populates="user", uselist=False, foreign_keys="Preacher.user_id")
    muslim_caller:   Mapped["MuslimCaller"]   = relationship("MuslimCaller",   back_populates="user", uselist=False)
    interested_person: Mapped["InterestedPerson"] = relationship("InterestedPerson", back_populates="user", uselist=False)

    __table_args__ = (
        sa.Index("idx_users_role", "role"),
    )
