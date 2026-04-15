
from sqlalchemy import select
from app.database import SessionLocal, engine
from app.models.preacher import Preacher, PreacherLanguage
from app.models.reference import Country, Language

engine.echo = False
session = SessionLocal()

# 1. Update John Smith
john = session.execute(select(Preacher).where(Preacher.email == 'john@example.com')).scalar_one_or_none()
if john:
    john.nationality_country_id = 9 # GB
    print("Updated John Smith's nationality to GB")

# 2. Update David Wilson
david = session.execute(select(Preacher).where(Preacher.email == 'david@example.com')).scalar_one_or_none()
if david:
    david.nationality_country_id = 5 # India
    # Update languages
    # Remove existing languages for him
    session.query(PreacherLanguage).filter(PreacherLanguage.preacher_id == david.preacher_id).delete()
    # Add Urdu (7) and English (2)
    session.add(PreacherLanguage(preacher_id=david.preacher_id, language_id=7, proficiency='native'))
    session.add(PreacherLanguage(preacher_id=david.preacher_id, language_id=2, proficiency='fluent'))
    print("Updated David Wilson's nationality to IN and languages to Urdu/English")

session.commit()
session.close()
