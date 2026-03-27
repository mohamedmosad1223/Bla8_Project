import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the server directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load DB URL (matching app/config.py fallback)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://balagh_admin:balagh2026@127.0.0.1:5434/balagh_main")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def sync_data():
    db = SessionLocal()
    try:
        print("=== Balagh System Data Sync ===")
        
        # 1. Fix Countries/Nationalities (IDs 1-5)
        country_data = [
            (1, 'مصر', 'EG', '+20'),
            (2, 'السعودية', 'SA', '+966'),
            (3, 'سورية', 'SY', '+963'),
            (4, 'الأردن', 'JO', '+962'),
            (5, 'الكويت', 'KW', '+965')
        ]
        
        print("\n[1/2] Aligning Countries/Nationalities...")
        
        # To avoid UniqueViolation on country_code, we first set them to temp values
        db.execute(text("UPDATE countries SET country_code = 'TEMP_' || country_code WHERE country_id <= 10"))
        
        for cid, name, code, phone in country_data:
            res = db.execute(text("SELECT 1 FROM countries WHERE country_id = :id"), {"id": cid}).fetchone()
            if res:
                print(f"  -> Updating ID {cid}: {name}")
                db.execute(
                    text("UPDATE countries SET country_name = :name, country_code = :code, phone_code = :phone WHERE country_id = :id"),
                    {"name": name, "code": code, "phone": phone, "id": cid}
                )
            else:
                print(f"  -> Inserting ID {cid}: {name}")
                db.execute(
                    text("INSERT INTO countries (country_id, country_name, country_code, phone_code) VALUES (:id, :name, :code, :phone)"),
                    {"id": cid, "name": name, "code": code, "phone": phone}
                )
        
        # Sync Seq
        db.execute(text("SELECT setval('countries_country_id_seq', COALESCE((SELECT MAX(country_id) FROM countries), 5))"))
        
        # 2. Note on Governorates
        print("\n[2/2] Governorates Status:")
        print("  - Governorates are stored as plain strings in 'organizations' and 'dawah_requests' tables.")
        print("  - New registrations will now use Kuwaiti regions (jahra, asima, etc.) from the updated frontend.")
        
        # Check existing stats
        res = db.execute(text("SELECT governorate, count(*) FROM organizations GROUP BY governorate")).fetchall()
        if res:
            print("  - Existing organizations by governorate in DB:")
            for gov, count in res:
                print(f"    * {gov}: {count}")
        else:
            print("  - No organizations registered yet.")

        db.commit()
        print("\n=== Sync Completed Successfully ===")
        print("Now you can use the Admin Dashboard and Registration forms with consistent data.")
        
    except Exception as e:
        db.rollback()
        print(f"\n!!! Error during sync: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_data()
