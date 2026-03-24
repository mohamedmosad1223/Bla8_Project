from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id:      Mapped[int]       = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:     Mapped[int|None]  = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"))
    org_id:      Mapped[int|None]  = mapped_column(sa.BigInteger, sa.ForeignKey("organizations.org_id"))  # v3
    action:      Mapped[str]       = mapped_column(sa.String(100), nullable=False)
    table_name:  Mapped[str|None]  = mapped_column(sa.String(100))
    record_id:   Mapped[int|None]  = mapped_column(sa.BigInteger)
    old_data:    Mapped[dict|None] = mapped_column(sa.JSON)
    new_data:    Mapped[dict|None] = mapped_column(sa.JSON)
    ip_address:  Mapped[str|None]  = mapped_column(sa.String(50))
    user_agent:  Mapped[str|None]  = mapped_column(sa.Text)          # v3
    duration_ms: Mapped[int|None]  = mapped_column(sa.Integer)       # v3: أداء العملية
    created_at:  Mapped[datetime]  = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    __table_args__ = (
        sa.Index("idx_audit_table_record", "table_name", "record_id"),
        sa.Index("idx_audit_org",          "org_id",     "created_at"),   # v3
        sa.Index("idx_audit_action",       "action",     "created_at"),   # v3
    )
