from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.database import Base
from app.models.enums import message_type_enum, MessageType


class Message(Base):
    __tablename__ = "messages"

    message_id:        Mapped[int]         = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    request_id:        Mapped[int]         = mapped_column(sa.BigInteger, sa.ForeignKey("dawah_requests.request_id"), nullable=False)
    sender_id:         Mapped[int]         = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=False)
    receiver_id:       Mapped[int]         = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=False)
    message_text:      Mapped[str|None]    = mapped_column(sa.Text)
    message_type:      Mapped[MessageType] = mapped_column(message_type_enum, nullable=False, default=MessageType.text)
    file_path:         Mapped[str|None]    = mapped_column(sa.String(500))
    is_read:           Mapped[bool]        = mapped_column(sa.Boolean, nullable=False, default=False)
    is_first_response: Mapped[bool]        = mapped_column(sa.Boolean, nullable=False, default=False)
    created_at:        Mapped[datetime]    = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    __table_args__ = (
        sa.Index("idx_messages_request", "request_id"),
    )
