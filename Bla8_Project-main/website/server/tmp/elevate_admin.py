import sys
import os

sys.path.append(os.getcwd())

try:
    from app.database import engine
    from sqlalchemy import text
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def elevate():
    try:
        with engine.connect() as conn:
            conn.execute(text("UPDATE admins SET level = 'super_admin';"))
            conn.commit()
            print("✅ Successfully updated all admins to super_admin in the database!")
    except Exception as e:
        print(f"Failed to elevate admins: {e}")

if __name__ == "__main__":
    elevate()
