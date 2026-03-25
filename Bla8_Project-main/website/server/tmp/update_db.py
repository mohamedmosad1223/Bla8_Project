import sys
import os

# إضافة مسار المشروع عشان الكود يشوف الـ app module
sys.path.append(os.getcwd())

from app.database import engine
from sqlalchemy import text

def update_schema():
    with engine.connect() as conn:
        print("Starting Database Schema Update...")
        
        # 1. تحديث جدول دياوة ريكويستات
        try:
            conn.execute(text("ALTER TABLE dawah_requests ADD COLUMN IF NOT EXISTS invited_religion_id INTEGER REFERENCES religions(religion_id);"))
            print("Successfully added invited_religion_id to dawah_requests")
        except Exception as e:
            print(f"Error updating dawah_requests: {e}")

        # 2. تحديث جدول الأشخاص المهتمين
        try:
            conn.execute(text("ALTER TABLE interested_persons ADD COLUMN IF NOT EXISTS religion_id INTEGER REFERENCES religions(religion_id);"))
            print("Successfully added religion_id to interested_persons")
        except Exception as e:
            print(f"Error updating interested_persons: {e}")
            
        conn.commit()
        print("✅ Database schema is now up to date!")

if __name__ == "__main__":
    update_schema()
