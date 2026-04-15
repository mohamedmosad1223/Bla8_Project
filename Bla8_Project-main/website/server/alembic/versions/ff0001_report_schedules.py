"""add_report_schedules_table

Revision ID: ff0001_report_schedules
Revises: consolidated_tmp_updates
Create Date: 2026-04-15
"""
from alembic import op
import sqlalchemy as sa

revision = 'ff0001_report_schedules'
down_revision = 'consolidated_tmp_updates'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'report_schedules',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.BigInteger(), sa.ForeignKey('users.user_id'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('timing', sa.String(255), nullable=False),
        sa.Column('report_type', sa.String(255), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_report_schedules_user_id', 'report_schedules', ['user_id'])


def downgrade():
    op.drop_index('idx_report_schedules_user_id', table_name='report_schedules')
    op.drop_table('report_schedules')
