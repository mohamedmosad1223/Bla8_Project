
from sqlalchemy import select
from app.database import SessionLocal
from app.models.reference import Country, Language

session = SessionLocal()

def get_country(code):
    return session.execute(select(Country).where(Country.country_code == code)).scalar_one_or_none()

def get_lang(code):
    return session.execute(select(Language).where(Language.language_code == code)).scalar_one_or_none()

codes = ['KW', 'IN', 'PH']
lang_codes = ['ar', 'en', 'ur', 'hi', 'tl']

print("--- Countries ---")
for c in codes:
    obj = get_country(c)
    if obj:
        print(f"Code {c} -> ID {obj.country_id}")
    else:
        print(f"Code {c} -> NOT FOUND")

print("\n--- Languages ---")
for l in lang_codes:
    obj = get_lang(l)
    if obj:
        print(f"Code {l} -> ID {obj.language_id}")
    else:
        print(f"Code {l} -> NOT FOUND")

session.close()
