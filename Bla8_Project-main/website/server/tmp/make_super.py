import sys
import os

sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.admin import Admin
from app.models.enums import AdminLevel

def elevate():
    db = SessionLocal()
    admins = db.query(Admin).all()
    for a in admins:
        a.level = AdminLevel.super_admin
    db.commit()
    print("Elevated all admins to super_admin.")

if __name__ == "__main__":
    elevate()
