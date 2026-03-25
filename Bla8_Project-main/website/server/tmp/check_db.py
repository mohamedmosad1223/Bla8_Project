import sys
import os

# إضافة مسار المشروع عشان الـ imports تشتغل
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.reference import Country
from app.models.preacher import Preacher

db = SessionLocal()
try:
    print("--- Countries ---")
    countries = db.query(Country).all()
    for c in countries:
        print(f"ID: {c.country_id}, Name: {c.country_name}")
    
    print("\n--- Last 5 Preachers ---")
    preachers = db.query(Preacher).order_by(Preacher.preacher_id.desc()).limit(5).all()
    for p in preachers:
        print(f"ID: {p.preacher_id}, FullName: {p.full_name}, CountryID: {p.nationality_country_id}, Gender: {p.gender}")
finally:
    db.close()
