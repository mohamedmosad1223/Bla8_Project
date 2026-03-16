from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base

class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id:         Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:    Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=False, index=True)
    role:       Mapped[str]      = mapped_column(sa.String(20), nullable=False) # "user" or "ai"
    content:    Mapped[str]      = mapped_column(sa.Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    user: Mapped["User"] = relationship("User")
