
from sqlalchemy import select
from app.database import SessionLocal
from app.models.reference import Language

session = SessionLocal()

print("\n--- All Languages ---")
langs = session.execute(select(Language)).scalars().all()
for l in langs:
    print(f"ID {l.language_id}: ({l.language_code})")

session.close()
