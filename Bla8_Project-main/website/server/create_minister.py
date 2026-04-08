"""
سكريبت لإضافة قيمة 'minister' إلى enum user_role في PostgreSQL
ثم إنشاء حساب مشرف الأوقاف
"""

import sys, os, traceback
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models.user import User
from app.models.enums import UserRole, AccountStatus
from app.auth import get_password_hash
from sqlalchemy import text

EMAIL    = "minister@awqaf.com"
PASSWORD = "Awqaf@2026"

LOG_FILE = os.path.join(os.path.dirname(__file__), "create_minister.log")

def run():
    output = []

    # ─── الخطوة 1: نشوف القيم الحالية في الـ enum ───
    with engine.connect() as conn:
        result = conn.execute(text("SELECT unnest(enum_range(NULL::user_role))::text AS val"))
        existing_vals = [row[0] for row in result]
        output.append(f"[INFO] Current user_role enum values: {existing_vals}")

    # ─── الخطوة 2: نضيف minister لو مش موجود ───
    if "minister" not in existing_vals:
        with engine.connect() as conn:
            conn.execute(text("ALTER TYPE user_role ADD VALUE 'minister'"))
            conn.commit()
            output.append("[SUCCESS] Added 'minister' to user_role enum in PostgreSQL")
    else:
        output.append("[INFO] 'minister' already exists in enum, no ALTER needed")

    # ─── الخطوة 3: ننشئ المستخدم ───
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == EMAIL).first()
        if existing_user:
            output.append(f"[WARNING] User already exists: id={existing_user.user_id}, role={existing_user.role}, status={existing_user.status}")
        else:
            user = User(
                email=EMAIL,
                password_hash=get_password_hash(PASSWORD),
                role=UserRole.minister,
                status=AccountStatus.active,
                app_language="ar",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            output.append(f"[SUCCESS] Minister account created!")
            output.append(f"  email    = {EMAIL}")
            output.append(f"  password = {PASSWORD}")
            output.append(f"  role     = {user.role.value}")
            output.append(f"  user_id  = {user.user_id}")
    except Exception as e:
        db.rollback()
        output.append(f"[ERROR] {e}")
        output.append(traceback.format_exc())
    finally:
        db.close()

    final = "\n".join(output)
    print(final)
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write(final)

if __name__ == "__main__":
    run()
