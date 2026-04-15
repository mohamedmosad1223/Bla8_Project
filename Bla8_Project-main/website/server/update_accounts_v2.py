
from sqlalchemy import select
from app.database import SessionLocal, engine
from app.models.preacher import Preacher, PreacherLanguage
from app.models.interested_person import InterestedPerson
from app.models.reference import Country, Language
from app.models.religion import Religion

engine.echo = False
session = SessionLocal()

# 1. Update Robert Brown (Interested Person)
robert = session.execute(select(InterestedPerson).where(InterestedPerson.email == 'robert@example.com')).scalar_one_or_none()
if robert:
    robert.nationality_country_id = 5 # India
    robert.communication_lang_id = 7 # Urdu
    print("Updated Robert Brown's nationality to India and language to Urdu")

# 2. Update David Wilson (Preacher)
david = session.execute(select(Preacher).where(Preacher.email == 'david@example.com')).scalar_one_or_none()
if david:
    # David's nationality is already 5 (India).
    # Update languages to match nationality -> Hindi (4)
    session.query(PreacherLanguage).filter(PreacherLanguage.preacher_id == david.preacher_id).delete()
    session.add(PreacherLanguage(preacher_id=david.preacher_id, language_id=4, proficiency='native')) # Hindi
    print("Updated David Wilson's language to match nationality (Hindi)")

session.commit()
session.close()
