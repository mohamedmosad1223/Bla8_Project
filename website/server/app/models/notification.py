from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped

from app.database import Base
from app.models.enums import notification_type_enum, NotificationType


class Notification(Base):
    __tablename__ = "notifications"

    notification_id: Mapped[int]              = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:         Mapped[int]              = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=False)
    type:            Mapped[NotificationType] = mapped_column(notification_type_enum, nullable=False)
    title:           Mapped[str]             = mapped_column(sa.String(255), nullable=False)
    body:            Mapped[str|None]        = mapped_column(sa.Text)
    related_id:      Mapped[int|None]        = mapped_column(sa.BigInteger)
    is_read:         Mapped[bool]            = mapped_column(sa.Boolean, nullable=False, default=False)
    created_at:      Mapped[datetime]        = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    __table_args__ = (
        sa.Index("idx_notifications_user", "user_id", "is_read"),
    )
