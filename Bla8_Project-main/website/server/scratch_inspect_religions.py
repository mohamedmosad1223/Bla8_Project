
from sqlalchemy import select
from app.database import SessionLocal
from app.models.religion import Religion

session = SessionLocal()

print("\n--- Religions ---")
rels = session.execute(select(Religion)).scalars().all()
for r in rels:
    print(f"ID {r.religion_id}: {r.religion_name}")

session.close()
