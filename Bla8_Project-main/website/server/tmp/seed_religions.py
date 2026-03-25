import sys
import os

# Ensure we can find the 'app' module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.database import engine, Base
    from sqlalchemy import text
    from app.models.religion import Religion  # Import to register with Base
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def seed():
    try:
        # 1. إنشاء جدول الأديان لو مش موجود
        print("Creating 'religions' table if it doesn't exist...")
        Base.metadata.create_all(bind=engine, tables=[Religion.__table__])
        
        with engine.connect() as conn:
            # 2. التأكد من وجود البيانات الأساسية
            religions = [
                (1, "الإسلام"),
                (2, "المسيحية"),
                (3, "الهندوسية"),
                (4, "البوذية"),
                (5, "لاديني"),
                (6, "أخرى")
            ]
            
            print("Seeding religions data...")
            for rid, name in religions:
                conn.execute(
                    text("INSERT INTO religions (religion_id, religion_name) VALUES (:rid, :name) ON CONFLICT (religion_id) DO NOTHING;"),
                    {"rid": rid, "name": name}
                )
            conn.commit()
            print("✅ Religions table created and seeded successfully!")
            
    except Exception as e:
        print(f"Failed to seed religions: {e}")

if __name__ == "__main__":
    seed()
