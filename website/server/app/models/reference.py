import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base


class Language(Base):
    __tablename__ = "languages"

    language_id:   Mapped[int]  = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    language_name: Mapped[str]  = mapped_column(sa.String(100), nullable=False)
    language_code: Mapped[str]  = mapped_column(sa.String(10), nullable=False, unique=True)
    is_active:     Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=True)


class Country(Base):
    __tablename__ = "countries"

    country_id:   Mapped[int]          = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    country_name: Mapped[str]          = mapped_column(sa.String(100), nullable=False)
    country_code: Mapped[str]          = mapped_column(sa.String(10), nullable=False, unique=True)
    phone_code:   Mapped[str | None]   = mapped_column(sa.String(20))
