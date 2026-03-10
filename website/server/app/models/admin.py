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
    level:      Mapped[AdminLevel] = mapped_column(admin_level_enum, nullable=False, default=AdminLevel.admin)
    created_at: Mapped[datetime]   = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    updated_at: Mapped[datetime]   = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())

    user: Mapped["User"] = relationship("User", back_populates="admin")
