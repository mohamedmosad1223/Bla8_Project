
from sqlalchemy import select
from app.database import SessionLocal
from app.models.reference import Language

session = SessionLocal()

lang = session.execute(select(Language).where(Language.language_code == 'ur')).scalar_one_or_none()
if lang:
    print(f"Urdu Language ID: {lang.language_id}")
else:
    print("Urdu not found.")

session.close()
