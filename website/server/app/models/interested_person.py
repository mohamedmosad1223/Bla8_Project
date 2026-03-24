from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base
from app.models.enums import gender_type_enum, GenderType


class InterestedPerson(Base):
    __tablename__ = "interested_persons"

    person_id:             Mapped[int]            = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:               Mapped[int|None]       = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), unique=True)
    first_name:            Mapped[str]            = mapped_column(sa.String(150), nullable=False)
    father_name:           Mapped[str|None]       = mapped_column(sa.String(150))
    last_name:             Mapped[str]            = mapped_column(sa.String(150), nullable=False)
    gender:                Mapped[GenderType|None]= mapped_column(gender_type_enum)
    nationality_country_id:Mapped[int|None]       = mapped_column(sa.Integer, sa.ForeignKey("countries.country_id"))
    current_country_id:    Mapped[int|None]       = mapped_column(sa.Integer, sa.ForeignKey("countries.country_id"))
    communication_lang_id: Mapped[int|None]       = mapped_column(sa.Integer, sa.ForeignKey("languages.language_id"))
    email:                 Mapped[str|None]       = mapped_column(sa.String(255))
    phone:                 Mapped[str|None]       = mapped_column(sa.String(30))
    created_at:            Mapped[datetime]       = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    updated_at:            Mapped[datetime]       = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())

    user: Mapped["User"] = relationship("User", back_populates="interested_person")
