import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the server directory to sys.path to import app modules if needed
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Database URL from environment or default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://balagh_admin:balagh2026@127.0.0.1:5434/balagh_main")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_nationalities():
    db = SessionLocal()
    try:
        print("Fixing nationalities in 'countries' table...")
        
        # 1. Ensure IDs 1-4 exist or update them if they do
        # We use UPSERT or separate UPDATEs. To be safe, we check one by one.
        
        data = [
            (1, 'مصر', 'EG', '+20'),
            (2, 'السعودية', 'SA', '+966'),
            (3, 'سورية', 'SY', '+963'),
            (4, 'الأردن', 'JO', '+962'),
            (5, 'الكويت', 'KW', '+965')
        ]
        
        for cid, name, code, phone in data:
            # Check if exists
            res = db.execute(text("SELECT 1 FROM countries WHERE country_id = :id"), {"id": cid}).fetchone()
            if res:
                print(f"Updating ID {cid} to {name}...")
                db.execute(
                    text("UPDATE countries SET country_name = :name, country_code = :code, phone_code = :phone WHERE country_id = :id"),
                    {"name": name, "code": code, "phone": phone, "id": cid}
                )
            else:
                print(f"Inserting ID {cid} as {name}...")
                db.execute(
                    text("INSERT INTO countries (country_id, country_name, country_code, phone_code) VALUES (:id, :name, :code, :phone)"),
                    {"id": cid, "name": name, "code": code, "phone": phone}
                )
        
        # Sync the sequence to avoid collisions on new inserts
        db.execute(text("SELECT setval('countries_country_id_seq', COALESCE((SELECT MAX(country_id) FROM countries), 1))"))
        
        db.commit()
        print("Success! Nationalities aligned with IDs 1-4.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_nationalities()
