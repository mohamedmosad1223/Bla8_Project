from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped

from app.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key:           Mapped[str]      = mapped_column(sa.String(100), primary_key=True)
    value:         Mapped[str|None] = mapped_column(sa.Text)
    description:   Mapped[str|None] = mapped_column(sa.String(255))
    updated_at:    Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now())
