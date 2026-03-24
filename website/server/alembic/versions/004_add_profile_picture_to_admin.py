"""add profile picture to admin

Revision ID: 004_add_profile_picture_to_admin
Revises: 003_v4_inactivity_alert_42h
Create Date: 2026-03-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_profile_picture_to_admin'
down_revision = '003_v4_inactivity_alert_42h'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('admins', sa.Column('profile_picture', sa.String(length=500), nullable=True))


def downgrade():
    op.drop_column('admins', 'profile_picture')
