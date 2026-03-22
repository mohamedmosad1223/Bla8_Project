from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base

class DashboardSnapshot(Base):
    __tablename__ = "dashboard_snapshots"

    snapshot_id:   Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    entity_type:   Mapped[str]      = mapped_column(sa.String(50), nullable=False) # "platform", "minister", "organization", "preacher"
    entity_id:     Mapped[int]      = mapped_column(sa.BigInteger, nullable=False, default=0) # 0 for platform/minister, org_id or preacher_id otherwise
    snapshot_data: Mapped[dict]     = mapped_column(JSONB, nullable=False, default=dict)
    computed_at:   Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    __table_args__ = (
        sa.UniqueConstraint("entity_type", "entity_id", name="uq_dashboard_snapshot_entity"),
        sa.Index("idx_dashboard_snapshot_lookup", "entity_type", "entity_id"),
    )
