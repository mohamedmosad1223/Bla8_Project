
from sqlalchemy import select
from app.database import SessionLocal
from app.models.reference import Country, Language

session = SessionLocal()

print("--- Countries ---")
countries = session.execute(select(Country)).scalars().all()
for c in countries:
    print(f"{c.country_id}: {c.country_name} ({c.country_code})")

print("\n--- Languages ---")
langs = session.execute(select(Language)).scalars().all()
for l in langs:
    print(f"{l.language_id}: {l.language_name} ({l.language_code})")

session.close()
