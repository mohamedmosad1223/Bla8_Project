"""seed minister account

Revision ID: ee8ec816b99f
Revises: ee8ec816b99e
Create Date: 2026-03-16 17:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
import bcrypt

# revision identifiers, used by Alembic.
revision = 'ee8ec816b99f'
down_revision = 'ee8ec816b99e'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Seed Minister User
    pwd_hash = bcrypt.hashpw(b"minister123", bcrypt.gensalt()).decode('utf-8')
    
    op.execute(
        f"""
        DO $$
        DECLARE
            v_user_id BIGINT;
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'minister@awqaf.gov.eg') THEN
                -- Insert into users
                INSERT INTO users (email, password_hash, role, status, app_language)
                VALUES ('minister@awqaf.gov.eg', '{pwd_hash}', 'minister', 'active', 'ar')
                RETURNING user_id INTO v_user_id;

                -- Insert into admins (minister uses admin profile table)
                INSERT INTO admins (user_id, full_name, phone, level)
                VALUES (v_user_id, 'وزير الأوقاف', '+201000000000', 'super_admin');
            END IF;
        END $$;
        """
    )

def downgrade() -> None:
    # Delete minister
    op.execute("DELETE FROM admins WHERE user_id IN (SELECT user_id FROM users WHERE email = 'minister@awqaf.gov.eg');")
    op.execute("DELETE FROM users WHERE email = 'minister@awqaf.gov.eg';")
