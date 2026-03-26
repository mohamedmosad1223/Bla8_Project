"""add last_seen to users

Revision ID: 009_add_last_seen
Revises: fd60211f3a3d
Create Date: 2026-03-26 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '009_add_last_seen'
down_revision = '5c4652d62c25'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('last_seen', sa.TIMESTAMP(timezone=True), nullable=True))


def downgrade():
    op.drop_column('users', 'last_seen')
