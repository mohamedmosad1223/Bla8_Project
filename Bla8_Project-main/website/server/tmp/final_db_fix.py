import sys
import os

# Ensure we can find the 'app' module
sys.path.append(os.path.abspath("."))

try:
    from app.database import engine
    from sqlalchemy import text
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def fix():
    try:
        with engine.connect() as conn:
            print("Connected to DB. Adding 'religion' column to interested_persons...")
            
            # إضافة عمود النص الخاص بالديانة لو مش موجود
            conn.execute(text("ALTER TABLE interested_persons ADD COLUMN IF NOT EXISTS religion VARCHAR(100);"))
            print("Successfully checked/added 'religion' column")
            
            # التأكد من وجود religion_id في الجداول
            conn.execute(text("ALTER TABLE dawah_requests ADD COLUMN IF NOT EXISTS invited_religion_id INTEGER;"))
            conn.execute(text("ALTER TABLE interested_persons ADD COLUMN IF NOT EXISTS religion_id INTEGER;"))
            
            conn.commit()
            print("✅ Database schema updated and ready!")
    except Exception as e:
        print(f"Schema update failed: {e}")

if __name__ == "__main__":
    fix()
