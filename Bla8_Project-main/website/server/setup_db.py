import sys
import os
import subprocess
from pathlib import Path

# إضافة مسار المشروع عشان الكود يشوف الـ app module
sys.path.append(os.getcwd())

def run_setup():
    print("🚀 Starting Balagh Database Setup...")

    # 1. التأكد من وجود المتطلبات
    try:
        import alembic
        import sqlalchemy
    except ImportError:
        print("❌ Missing dependencies. Please run: pip install -r requirements.txt")
        return

    # 2. تشغيل الـ Migrations باستخدام Alembic
    print("\n📦 Running Alembic migrations...")
    try:
        # بنشغل الأمر كـ subprocess عشان نتفادى مشاكل الـ PYTHONPATH في بعض الأنظمة
        result = subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Migrations applied successfully!")
            print(result.stdout)
        else:
            print("⚠️ Alembic warning/error. Let's try a manual fix for common issues...")
            print(result.stderr)
            
            # محاولة تشغيل الإصلاحات اليدوية لو الـ alembic فشل (زي مشكلة الـ last_seen)
            if "last_seen" in result.stderr or "Table already exists" in result.stderr:
                try:
                    from fix_db import fix_last_seen
                    fix_last_seen()
                except ImportError:
                    print("⚠️ Could not find 'fix_db.py' for manual fixes.")

    except Exception as e:
        print(f"❌ Error running migrations: {e}")

    print("\n✨ Database setup finished! You can now start the server with: uvicorn app.main:app --reload")

if __name__ == "__main__":
    run_setup()
