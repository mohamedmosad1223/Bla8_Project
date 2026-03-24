from datetime import datetime
from typing import List, Optional
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base

class AIChatConversation(Base):
    __tablename__ = "ai_chat_conversations"

    id:         Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:    Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=False, index=True)
    title:      Mapped[str]      = mapped_column(sa.String(255), nullable=False, server_default="محادثة جديدة")
    created_at: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    user: Mapped["User"] = relationship("User")
    messages: Mapped[List["AIChatMessage"]] = relationship("AIChatMessage", back_populates="conversation", cascade="all, delete-orphan")

class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id:         Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:    Mapped[int|None] = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=True, index=True)
    session_id: Mapped[str|None] = mapped_column(sa.String(255), nullable=True, index=True) # for guests
    conversation_id: Mapped[int|None] = mapped_column(sa.BigInteger, sa.ForeignKey("ai_chat_conversations.id"), nullable=True, index=True)
    
    role:       Mapped[str]      = mapped_column(sa.String(20), nullable=False) # "user" or "ai"
    content:    Mapped[str]      = mapped_column(sa.Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    user: Mapped["User"] = relationship("User")
    conversation: Mapped[Optional["AIChatConversation"]] = relationship("AIChatConversation", back_populates="messages")
