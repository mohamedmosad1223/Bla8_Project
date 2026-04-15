import sys
import os
from sqlalchemy import select

# Ensure we can import app if running from website/server
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.reference import Country, Language

session = SessionLocal()

LANGUAGES = [
    {"code": "ur", "name": "Urdu"},
    {"code": "ar", "name": "العربية"},
    {"code": "en", "name": "الإنجليزية"},
    {"code": "tl", "name": "التاغالوغية"},
    {"code": "hi", "name": "الهندية"},
    {"code": "fr", "name": "الفرنسية"},
    {"code": "es", "name": "الإسبانية"}
]

COUNTRIES = [
    {"code": "TEMP_LK", "name": "سريلانكا", "phone_code": "+94"},
    {"code": "TEMP_NP", "name": "نيبال", "phone_code": "+977"},
    {"code": "TEMP_US", "name": "أمريكا", "phone_code": "+1"},
    {"code": "TEMP_GB", "name": "بريطانيا", "phone_code": "+44"},
    {"code": "EG", "name": "مصر", "phone_code": "+20"},
    {"code": "SA", "name": "السعودية", "phone_code": "+966"},
    {"code": "SY", "name": "سورية", "phone_code": "+963"},
    {"code": "JO", "name": "الأردن", "phone_code": "+962"},
    {"code": "KW", "name": "الكويت", "phone_code": "+965"},
    {"code": "IN", "name": "India", "phone_code": "+91"},
    {"code": "PH", "name": "Philippines", "phone_code": "+63"},
    {"code": "US", "name": "United States", "phone_code": "+1"},
    {"code": "GB", "name": "United Kingdom", "phone_code": "+44"},
    {"code": "PK", "name": "Pakistan", "phone_code": "+92"},
]

def seed_references():
    print("--- Seeding Missing Languages ---")
    for lang_data in LANGUAGES:
        code = lang_data["code"]
        lang = session.execute(select(Language).where(Language.language_code == code)).scalar_one_or_none()
        if not lang:
            print(f"✅ Adding Language: {lang_data['name']} ({code})")
            new_lang = Language(language_code=code, language_name=lang_data['name'], is_active=True)
            session.add(new_lang)
        else:
            print(f"ℹ️ Language already exists: {lang_data['name']} ({code})")

    print("\n--- Seeding Missing Countries ---")
    for country_data in COUNTRIES:
        code = country_data["code"]
        country = session.execute(select(Country).where(Country.country_code == code)).scalar_one_or_none()
        if not country:
            print(f"✅ Adding Country: {country_data['name']} ({code})")
            new_country = Country(country_code=code, country_name=country_data['name'], phone_code=country_data['phone_code'])
            session.add(new_country)
        else:
            print(f"ℹ️ Country already exists: {country_data['name']} ({code})")
            
    session.commit()
    print("\n🎉 Reference seeding completed successfully!")

if __name__ == "__main__":
    try:
        seed_references()
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
    finally:
        session.close()
