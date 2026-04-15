
from sqlalchemy import select
from app.database import SessionLocal
from app.models.reference import Country

session = SessionLocal()

print("--- All Countries ---")
countries = session.execute(select(Country)).scalars().all()
for c in countries:
    # Use repr to handle potential encoding issues
    print(f"ID {c.country_id}: {c.country_code}")

session.close()
