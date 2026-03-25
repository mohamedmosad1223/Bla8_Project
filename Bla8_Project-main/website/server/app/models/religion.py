import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Religion(Base):
    __tablename__ = "religions"

    religion_id: Mapped[int] = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    religion_name: Mapped[str] = mapped_column(sa.String(100), nullable=False)

    def to_dict(self):
        return {
            "religion_id": self.religion_id,
            "religion_name": self.religion_name
        }
