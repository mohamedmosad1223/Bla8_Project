
from app.database import SessionLocal
from app.models.user import User
from app.models.admin import Admin
from app.models.enums import UserRole, AccountStatus, AdminLevel
from app.auth import get_password_hash

def seed_first_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_user = db.query(User).filter(User.email == "superadmin@balagh.com").first()
        if not admin_user:
            user = User(
                email="superadmin@balagh.com",
                password_hash=get_password_hash("Password123"),
                role=UserRole.admin,
                status=AccountStatus.active,
            )
            db.add(user)
            db.flush()

            admin = Admin(
                user_id=user.user_id,
                full_name="Super Admin",
                phone="+966500000000",
                level=AdminLevel.super_admin,
            )
            db.add(admin)
            db.commit()
            print("Seeded superadmin account.")
        else:
            print("Superadmin already exists.")
    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_first_admin()
