from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base
from app.models.enums import admin_level_enum, AdminLevel


class Admin(Base):
    __tablename__ = "admins"

    admin_id:   Mapped[int]        = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:    Mapped[int]        = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=False, unique=True)
    full_name:  Mapped[str]        = mapped_column(sa.String(255), nullable=False)
    phone:      Mapped[str|None]   = mapped_column(sa.String(30))
    level:           Mapped[AdminLevel] = mapped_column(admin_level_enum, nullable=False, default=AdminLevel.admin)
    profile_picture: Mapped[str|None]   = mapped_column(sa.String(500))
    created_at: Mapped[datetime]   = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    updated_at: Mapped[datetime]   = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())

    user: Mapped["User"] = relationship("User", back_populates="admin")
    languages: Mapped[list["AdminLanguage"]] = relationship("AdminLanguage", back_populates="admin", cascade="all, delete-orphan")


class AdminLanguage(Base):
    __tablename__ = "admin_languages"

    id:          Mapped[int] = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    admin_id:    Mapped[int] = mapped_column(sa.BigInteger, sa.ForeignKey("admins.admin_id", ondelete="CASCADE"), nullable=False)
    language_id: Mapped[int] = mapped_column(sa.Integer, sa.ForeignKey("languages.language_id"), nullable=False)

    admin: Mapped["Admin"] = relationship("Admin", back_populates="languages")

    __table_args__ = (
        sa.UniqueConstraint("admin_id", "language_id", name="uq_admin_language"),
    )
