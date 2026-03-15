from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class FAQ(Base):
    __tablename__ = "faqs"

    faq_id:     Mapped[int]      = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    question:   Mapped[str]      = mapped_column(sa.String(500), nullable=False)
    answer:     Mapped[str]      = mapped_column(sa.Text, nullable=False)
    is_active:  Mapped[bool]     = mapped_column(sa.Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
    updated_at: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
