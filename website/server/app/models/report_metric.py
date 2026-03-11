from datetime import date, datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped

from app.database import Base


class ReportMetric(Base):
    """
    جدول التقارير الديناميكية — يمكن إضافة metrics جديدة بدون تعديل الـ schema.

    مثال:
        metric_name = 'requests_per_channel'
        dimension   = 'whatsapp'
        value       = 42
        period_start = 2026-03-01
    """
    __tablename__ = "report_metrics"

    metric_id:    Mapped[int]         = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    metric_name:  Mapped[str]         = mapped_column(sa.String(100), nullable=False)
    dimension:    Mapped[str|None]    = mapped_column(sa.String(100))       # مثلاً 'whatsapp' أو org_name
    value:        Mapped[float]       = mapped_column(sa.Numeric(15, 4), nullable=False)
    period_start: Mapped[date|None]   = mapped_column(sa.Date)
    period_end:   Mapped[date|None]   = mapped_column(sa.Date)
    org_id:       Mapped[int|None]    = mapped_column(sa.BigInteger, sa.ForeignKey("organizations.org_id"))
    created_at:   Mapped[datetime]    = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())

    __table_args__ = (
        sa.Index("idx_metrics_name_period", "metric_name", "period_start"),
    )
