from app.db.session import SessionLocal
from app.models.user import User
from app.models.admin import Admin
from app.models.enums import UserRole, AccountStatus
from app.auth import get_password_hash
import sys

def create_minister(email, password, full_name):
    db = SessionLocal()
    try:
        # Check if user exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Error: User with email {email} already exists.")
            return

        # Create User
        user = User(
            email=email,
            password_hash=get_password_hash(password),
            role=UserRole.minister,
            status=AccountStatus.active
        )
        db.add(user)
        db.flush()

        # Create Admin entry (Ministers/Supervisors are stored in Admin table with level/role distinction)
        admin = Admin(
            user_id=user.user_id,
            full_name=full_name,
            level="admin" # Level is still admin for permission checks, but user.role is minister
        )
        db.add(admin)
        db.commit()
        print(f"Successfully created Awqaf Supervisor account:")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Role: {UserRole.minister}")
    except Exception as e:
        db.rollback()
        print(f"Error creating account: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_minister("awqaf_supervisor@bla8.com", "Awqaf@2024", "مشرف أوقاف (تجريبي)")
