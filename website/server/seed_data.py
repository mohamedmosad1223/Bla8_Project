
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.reference import Language, Country

def seed():
    db = SessionLocal()
    try:
        # Seed languages
        existing_langs = db.query(Language.language_code).all()
        existing_codes = [l[0] for l in existing_langs]
        
        langs_to_add = []
        for name, code in [("العربية", "ar"), ("English", "en"), ("Français", "fr")]:
            if code not in existing_codes:
                langs_to_add.append(Language(language_name=name, language_code=code))
        
        if langs_to_add:
            db.add_all(langs_to_add)
            print(f"Added {len(langs_to_add)} languages.")

        # Seed countries
        existing_countries = db.query(Country.country_code).all()
        existing_country_codes = [c[0] for c in existing_countries]
        
        countries_to_add = []
        for name, code, phone in [("السعودية", "SA", "+966"), ("مصر", "EG", "+20"), ("الكويت", "KW", "+965")]:
            if code not in existing_country_codes:
                countries_to_add.append(Country(country_name=name, country_code=code, phone_code=phone))
        
        if countries_to_add:
            db.add_all(countries_to_add)
            print(f"Added {len(countries_to_add)} countries.")
        
        db.commit()
        
        # Sync sequences (important for Postgres after manual ID inserts)
        db.execute(text("SELECT setval('languages_language_id_seq', (SELECT MAX(language_id) FROM languages))"))
        db.execute(text("SELECT setval('countries_country_id_seq', (SELECT MAX(country_id) FROM countries))"))
        db.commit()
        print("Sequences synced.")

    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
