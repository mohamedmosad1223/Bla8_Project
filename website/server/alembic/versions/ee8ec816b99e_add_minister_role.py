"""Add minister to user_role enum

Revision ID: ee8ec816b99e
Revises: ee8ec816b99d
Create Date: 2026-03-16 16:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ee8ec816b99e'
down_revision = '008_seed_all_languages'
branch_labels = None
depends_on = None


def upgrade():
    # PostgreSQL requires a separate TRANSACTION to alter an enum type
    op.execute("COMMIT")
    op.execute("ALTER TYPE user_role ADD VALUE 'minister'")


def downgrade():
    # PostgreSQL doesn't easily support removing enum values
    pass
