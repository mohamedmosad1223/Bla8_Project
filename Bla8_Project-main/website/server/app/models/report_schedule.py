from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import mapped_column, Mapped
from app.database import Base

class ReportSchedule(Base):
    """
    جدول لتخزين جداول التقارير التلقائية للأدمن/المؤسسات.
    """
    __tablename__ = "report_schedules"

    id:          Mapped[int]      = mapped_column(sa.BigInteger, primary_key=True, autoincrement=True)
    user_id:     Mapped[int]      = mapped_column(sa.BigInteger, sa.ForeignKey("users.user_id"), nullable=False, index=True)
    name:        Mapped[str]      = mapped_column(sa.String(255), nullable=False)
    timing:      Mapped[str]      = mapped_column(sa.String(255), nullable=False) # مثل: "كل أول يوم من الشهر الساعة 9 صباحاً"
    report_type: Mapped[str]      = mapped_column(sa.String(255), nullable=False) # مثل: "تقرير شامل عن الجمعيات"
    created_at:  Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now())
