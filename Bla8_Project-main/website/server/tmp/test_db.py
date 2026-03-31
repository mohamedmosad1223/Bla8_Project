import sys
import os
sys.path.append("/home/mohamed/Bla8_Project/Bla8_Project-main/website/server")

from app.database import SessionLocal
from app.models.user import User
from app.models.organization import Organization
from app.utils.analytics_service import SafeSQLExecutor

db = SessionLocal()

print("--- USERS & ROLES ---")
users = db.query(User).limit(5).all()
for u in users:
    print(f"UID: {u.user_id}, Email: {u.email}, Role: {u.role}")

print("\n--- ORGANIZATIONS ---")
orgs = db.query(Organization).limit(5).all()
for o in orgs:
    print(f"OrgID: {o.org_id}, UserID: {o.user_id}, Name: {o.organization_name}")

print("\n--- Testing Minister SQL ---")
sql = "SELECT organization_name, approval_status FROM organizations LIMIT 5"
print("SQL:", sql)
result = SafeSQLExecutor.execute(sql, db, role="minister")
print(result)

db.close()
