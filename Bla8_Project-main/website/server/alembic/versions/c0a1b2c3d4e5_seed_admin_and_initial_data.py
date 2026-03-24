"""seed admin and initial data

Revision ID: c0a1b2c3d4e5
Revises: ba1b424f3767
Create Date: 2026-03-12 21:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from app.auth import get_password_hash

# revision identifiers, used by Alembic.
revision = 'c0a1b2c3d4e5'
down_revision = 'ba1b424f3767'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Sync sequences to prevent ID collisions with previous manual inserts
    op.execute("SELECT setval('languages_language_id_seq', COALESCE((SELECT MAX(language_id) FROM languages), 1));")
    op.execute("SELECT setval('countries_country_id_seq', COALESCE((SELECT MAX(country_id) FROM countries), 1));")

    # Seed languages
    op.execute(
        """
        INSERT INTO languages (language_name, language_code) 
        VALUES 
            ('العربية', 'ar'), 
            ('English', 'en'), 
            ('Français', 'fr')
        ON CONFLICT (language_code) DO NOTHING;
        """
    )
    
    # Seed countries
    op.execute(
        """
        INSERT INTO countries (country_name, country_code, phone_code) 
        VALUES 
            ('السعودية', 'SA', '+966'), 
            ('مصر', 'EG', '+20'), 
            ('الكويت', 'KW', '+965')
        ON CONFLICT (country_code) DO NOTHING;
        """
    )
    
    # Sync sequences again just to be safe
    op.execute("SELECT setval('languages_language_id_seq', COALESCE((SELECT MAX(language_id) FROM languages), 1));")
    op.execute("SELECT setval('countries_country_id_seq', COALESCE((SELECT MAX(country_id) FROM countries), 1));")

    # Seed Admin User
    import bcrypt
    pwd_hash = bcrypt.hashpw(b"Password123", bcrypt.gensalt()).decode('utf-8')
    
    op.execute(
        f"""
        DO $$
        DECLARE
            v_user_id BIGINT;
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@balagh.com') THEN
                INSERT INTO users (email, password_hash, role, status)
                VALUES ('superadmin@balagh.com', '{pwd_hash}', 'admin', 'active')
                RETURNING user_id INTO v_user_id;

                INSERT INTO admins (user_id, full_name, phone, level)
                VALUES (v_user_id, 'Super Admin', '+966500000000', 'super_admin');
            END IF;
        END $$;
        """
    )

def downgrade() -> None:
    # Delete super admin
    op.execute("DELETE FROM admins WHERE user_id IN (SELECT user_id FROM users WHERE email = 'superadmin@balagh.com');")
    op.execute("DELETE FROM users WHERE email = 'superadmin@balagh.com';")
    
    # Delete seed languages
    op.execute("DELETE FROM languages WHERE language_code IN ('ar', 'en', 'fr');")
    
    # Delete seed countries
    op.execute("DELETE FROM countries WHERE country_code IN ('SA', 'EG', 'KW');")
