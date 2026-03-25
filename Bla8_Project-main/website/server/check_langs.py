import sys
import os
sys.path.append(os.getcwd())
from app.database import SessionLocal
from app.models.reference import Language
db = SessionLocal()
langs = db.query(Language).all()
for l in langs:
    print(f"ID: {l.language_id}, Name: {l.language_name}")
db.close()
