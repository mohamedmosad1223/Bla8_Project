import sys
import os

sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.admin import Admin
import json

def check():
    db = SessionLocal()
    admins = db.query(Admin).all()
    for a in admins:
        print(f"ID={a.admin_id}, Name={a.full_name}, Level={a.level}, UserID={a.user_id}")
        
if __name__ == "__main__":
    check()
