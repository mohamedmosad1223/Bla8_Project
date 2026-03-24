"""Add under_persuasion to request_status enum

Revision ID: ee8ec816b99d
Revises: ee8ec816b99c
Create Date: 2026-03-14 16:55:20.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ee8ec816b99d'
down_revision = 'ee8ec816b99c'
branch_labels = None
depends_on = None


def upgrade():
    # PostgreSQL requires a separate TRANSACTION to alter an enum type
    # but Alembic usually runs everything in one transaction.
    # We use commit() to ensure the lock isn't held.
    op.execute("COMMIT")
    op.execute("ALTER TYPE request_status ADD VALUE 'under_persuasion'")


def downgrade():
    # PostgreSQL doesn't easily support removing enum values
    pass
