from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base
from app.models.enums import gender_type_enum, GenderType


class MuslimCaller(Base):
    __tablename__ = "muslim_callers"

    caller_id:             Mapped[int]           = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:               Mapped[int]           = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=False, unique=True)
    full_name:             Mapped[str]           = mapped_column(sa.String(255), nullable=False)
    phone:                 Mapped[str|None]      = mapped_column(sa.String(30))
    nationality_country_id:Mapped[int|None]      = mapped_column(sa.Integer, sa.ForeignKey("countries.country_id"))
    gender:                Mapped[GenderType|None]= mapped_column(gender_type_enum)
    created_at:            Mapped[datetime]      = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    updated_at:            Mapped[datetime]      = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())

    user: Mapped["User"] = relationship("User", back_populates="muslim_caller")
