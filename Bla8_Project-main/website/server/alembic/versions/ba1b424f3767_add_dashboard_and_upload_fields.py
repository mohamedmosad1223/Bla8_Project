"""add_dashboard_and_upload_fields

Revision ID: ba1b424f3767
Revises: 08a9018b1b02
Create Date: 2026-03-12 17:31:24.797763

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ba1b424f3767'
down_revision = '08a9018b1b02'
branch_labels = None
depends_on = None


def create_type(name, values):
    values_str = ", ".join([f"'{v}'" for v in values])
    op.execute(f"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{name}') THEN CREATE TYPE {name} AS ENUM ({values_str}); END IF; END $$;")

def upgrade():
    # ─── Drop Views/Functions/Constraints that depend on columns ─────────────
    op.execute("DROP VIEW IF EXISTS v_pending_requests CASCADE")
    op.execute("DROP VIEW IF EXISTS v_caller_dashboard CASCADE")
    op.execute("DROP VIEW IF EXISTS v_org_response_speed CASCADE")
    
    # Drop constraints from dawah_requests
    op.execute("ALTER TABLE dawah_requests DROP CONSTRAINT IF EXISTS chk_invited_has_caller")
    op.execute("ALTER TABLE dawah_requests DROP CONSTRAINT IF EXISTS chk_self_has_person")
    op.execute("ALTER TABLE dawah_requests DROP CONSTRAINT IF EXISTS chk_inprogress_has_preacher")
    
    # Drop constraints from preachers
    op.execute("ALTER TABLE preachers DROP CONSTRAINT IF EXISTS chk_volunteer_no_org")
    op.execute("ALTER TABLE preachers DROP CONSTRAINT IF EXISTS chk_official_has_org")

    # ─── Create Types ────────────────────────────────────────────────────────
    create_type('admin_level', ['super_admin', 'admin'])
    create_type('request_type', ['invited', 'self_interested'])
    create_type('gender_type', ['male', 'female'])
    create_type('request_status', ['pending', 'in_progress', 'converted', 'rejected', 'no_response'])
    create_type('communication_channel', ['phone', 'whatsapp', 'messenger', 'telegram', 'email', 'in_person', 'other'])
    create_type('message_type', ['text', 'image', 'file', 'audio'])
    create_type('notification_type', ['new_request', 'request_accepted', 'status_changed', 'new_message', 'account_approved', 'account_rejected', 'alert_48h', 'auto_reclaimed'])
    create_type('approval_status', ['pending', 'approved', 'rejected'])
    create_type('preacher_type', ['volunteer', 'official'])
    create_type('preacher_status', ['active', 'suspended'])
    create_type('user_role', ['admin', 'organization', 'preacher', 'muslim_caller', 'interested'])
    create_type('account_status', ['active', 'suspended', 'pending'])

    # ─── Convert Columns ─────────────────────────────────────────────────────
    
    # Admins
    op.execute("ALTER TABLE admins ALTER COLUMN level DROP DEFAULT")
    op.execute("ALTER TABLE admins ALTER COLUMN level TYPE admin_level USING level::admin_level")
    op.execute("ALTER TABLE admins ALTER COLUMN level SET DEFAULT 'admin'::admin_level")

    # Dawah Requests
    op.add_column('dawah_requests', sa.Column('governorate', sa.String(length=150), nullable=True))
    op.execute("ALTER TABLE dawah_requests ALTER COLUMN request_type TYPE request_type USING request_type::request_type")
    op.execute("ALTER TABLE dawah_requests ALTER COLUMN invited_gender TYPE gender_type USING invited_gender::gender_type")
    
    op.execute("ALTER TABLE dawah_requests ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE dawah_requests ALTER COLUMN status TYPE request_status USING status::request_status")
    op.execute("ALTER TABLE dawah_requests ALTER COLUMN status SET DEFAULT 'pending'::request_status")
    
    op.execute("ALTER TABLE dawah_requests ALTER COLUMN communication_channel TYPE communication_channel USING communication_channel::communication_channel")

    # Other tables
    op.execute("ALTER TABLE interested_persons ALTER COLUMN gender TYPE gender_type USING gender::gender_type")
    
    op.execute("ALTER TABLE messages ALTER COLUMN message_type DROP DEFAULT")
    op.execute("ALTER TABLE messages ALTER COLUMN message_type TYPE message_type USING message_type::message_type")
    op.execute("ALTER TABLE messages ALTER COLUMN message_type SET DEFAULT 'text'::message_type")
    
    op.execute("ALTER TABLE muslim_callers ALTER COLUMN gender TYPE gender_type USING gender::gender_type")
    op.execute("ALTER TABLE notifications ALTER COLUMN type TYPE notification_type USING type::notification_type")

    # Organizations
    op.execute("ALTER TABLE organizations ALTER COLUMN approval_status DROP DEFAULT")
    op.execute("ALTER TABLE organizations ALTER COLUMN approval_status TYPE approval_status USING approval_status::approval_status")
    op.execute("ALTER TABLE organizations ALTER COLUMN approval_status SET DEFAULT 'pending'::approval_status")
    
    # Organizations NULL handling
    op.execute("INSERT INTO countries (country_id, country_name, country_code) VALUES (1, 'Default Country', 'DEF') ON CONFLICT (country_id) DO NOTHING")
    op.execute("UPDATE organizations SET license_number = 'N/A' WHERE license_number IS NULL")
    op.execute("UPDATE organizations SET license_file = 'N/A' WHERE license_file IS NULL")
    op.execute("UPDATE organizations SET establishment_date = '1970-01-01' WHERE establishment_date IS NULL")
    op.execute("UPDATE organizations SET country_id = 1 WHERE country_id IS NULL")
    op.execute("UPDATE organizations SET governorate = 'N/A' WHERE governorate IS NULL")
    op.execute("UPDATE organizations SET phone = 'N/A' WHERE phone IS NULL")
    op.execute("UPDATE organizations SET email = 'N/A' WHERE email IS NULL")

    op.alter_column('organizations', 'license_number', existing_type=sa.VARCHAR(length=100), nullable=False)
    op.alter_column('organizations', 'license_file', existing_type=sa.VARCHAR(length=500), nullable=False)
    op.alter_column('organizations', 'establishment_date', existing_type=sa.DATE(), nullable=False)
    op.alter_column('organizations', 'country_id', existing_type=sa.INTEGER(), nullable=False)
    op.alter_column('organizations', 'governorate', existing_type=sa.VARCHAR(length=150), nullable=False)
    op.alter_column('organizations', 'phone', existing_type=sa.VARCHAR(length=30), nullable=False)
    op.alter_column('organizations', 'email', existing_type=sa.VARCHAR(length=255), nullable=False)

    # Preachers NULL handling
    op.execute("UPDATE preachers SET phone = 'N/A' WHERE phone IS NULL")
    op.execute("UPDATE preachers SET email = 'N/A' WHERE email IS NULL")
    op.execute("UPDATE preachers SET nationality_country_id = 1 WHERE nationality_country_id IS NULL")
    op.execute("UPDATE preachers SET scientific_qualification = 'N/A' WHERE scientific_qualification IS NULL")

    op.add_column('preachers', sa.Column('qualification_file', sa.String(length=500), nullable=True))
    op.execute("ALTER TABLE preachers ALTER COLUMN type TYPE preacher_type USING type::preacher_type")
    op.execute("ALTER TABLE preachers ALTER COLUMN gender TYPE gender_type USING gender::gender_type")
    
    op.execute("ALTER TABLE preachers ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE preachers ALTER COLUMN status TYPE preacher_status USING status::preacher_status")
    op.execute("ALTER TABLE preachers ALTER COLUMN status SET DEFAULT 'active'::preacher_status")
    
    op.execute("ALTER TABLE preachers ALTER COLUMN approval_status DROP DEFAULT")
    op.execute("ALTER TABLE preachers ALTER COLUMN approval_status TYPE approval_status USING approval_status::approval_status")
    op.execute("ALTER TABLE preachers ALTER COLUMN approval_status SET DEFAULT 'pending'::approval_status")

    op.alter_column('preachers', 'phone', existing_type=sa.VARCHAR(length=30), nullable=False)
    op.alter_column('preachers', 'email', existing_type=sa.VARCHAR(length=255), nullable=False)
    op.alter_column('preachers', 'nationality_country_id', existing_type=sa.INTEGER(), nullable=False)
    op.alter_column('preachers', 'scientific_qualification', existing_type=sa.VARCHAR(length=255), nullable=False)

    op.drop_index(op.f('idx_preachers_name'), table_name='preachers', postgresql_using='gin')
    op.drop_index(op.f('idx_preachers_org'), table_name='preachers')
    op.create_unique_constraint(None, 'preachers', ['email'])

    # History
    op.execute("ALTER TABLE request_status_history ALTER COLUMN old_status TYPE request_status USING old_status::request_status")
    op.execute("ALTER TABLE request_status_history ALTER COLUMN new_status TYPE request_status USING new_status::request_status")

    # Users
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role")
    
    op.execute("ALTER TABLE users ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN status TYPE account_status USING status::account_status")
    op.execute("ALTER TABLE users ALTER COLUMN status SET DEFAULT 'pending'::account_status")

    op.drop_index(op.f('idx_users_email'), table_name='users')
    op.drop_constraint('users_email_key', 'users', type_='unique')
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # ─── Recreate Constraints ────────────────────────────────────────────────
    op.create_check_constraint('chk_invited_has_caller', 'dawah_requests', "NOT (request_type = 'invited' AND submitted_by_caller_id IS NULL)")
    op.create_check_constraint('chk_self_has_person', 'dawah_requests', "NOT (request_type = 'self_interested' AND submitted_by_person_id IS NULL)")
    op.create_check_constraint('chk_inprogress_has_preacher', 'dawah_requests', "NOT (status != 'pending' AND assigned_preacher_id IS NULL)")
    op.create_check_constraint('chk_volunteer_no_org', 'preachers', "NOT (type = 'volunteer' AND org_id IS NOT NULL)")
    op.create_check_constraint('chk_official_has_org', 'preachers', "NOT (type = 'official' AND org_id IS NULL)")

    # ─── Recreate Views ──────────────────────────────────────────────────────
    op.execute("""
    CREATE VIEW v_pending_requests AS
    SELECT r.request_id, r.request_type, r.invited_first_name, r.invited_last_name,
           r.invited_gender, c1.country_name AS nationality, c2.country_name AS current_country,
           l.language_name AS language, r.invited_phone, r.invited_email, r.submission_date
    FROM dawah_requests r
    LEFT JOIN countries c1 ON c1.country_id = r.invited_nationality_id
    LEFT JOIN countries c2 ON c2.country_id = r.invited_current_country_id
    LEFT JOIN languages l  ON l.language_id = r.invited_language_id
    WHERE r.status = 'pending'
    """)

    op.execute("""
    CREATE VIEW v_caller_dashboard AS
    SELECT
        r.request_id,
        r.request_type,
        r.status,
        r.communication_channel,
        r.notes,
        r.submission_date,
        r.accepted_at,
        r.updated_at,
        p.full_name AS preacher_name
    FROM dawah_requests r
    LEFT JOIN preachers p ON p.preacher_id = r.assigned_preacher_id
    """)

    op.execute("""
    CREATE VIEW v_org_response_speed AS
    SELECT
        o.org_id,
        o.organization_name,
        COUNT(r.request_id)                                       AS total_requests,
        AVG(EXTRACT(EPOCH FROM (r.accepted_at - r.submission_date))/60) AS avg_accept_time_min,
        MIN(EXTRACT(EPOCH FROM (r.accepted_at - r.submission_date))/60) AS min_accept_time_min
    FROM dawah_requests r
    JOIN preachers p   ON p.preacher_id = r.assigned_preacher_id
    JOIN organizations o ON o.org_id   = p.org_id
    WHERE r.accepted_at IS NOT NULL
    GROUP BY o.org_id, o.organization_name
    """)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.create_unique_constraint(op.f('users_email_key'), 'users', ['email'], postgresql_nulls_not_distinct=False)
    op.create_index(op.f('idx_users_email'), 'users', ['email'], unique=False)
    op.alter_column('users', 'status',
               existing_type=sa.Enum('active', 'suspended', 'pending', name='account_status'),
               type_=sa.TEXT(),
               existing_nullable=False,
               existing_server_default=sa.text("'pending'::text"))
    op.alter_column('users', 'role',
               existing_type=sa.Enum('admin', 'organization', 'preacher', 'muslim_caller', 'interested', name='user_role'),
               type_=sa.TEXT(),
               existing_nullable=False)
    op.alter_column('request_status_history', 'new_status',
               existing_type=sa.Enum('pending', 'in_progress', 'converted', 'rejected', 'no_response', name='request_status'),
               type_=sa.TEXT(),
               existing_nullable=False)
    op.alter_column('request_status_history', 'old_status',
               existing_type=sa.Enum('pending', 'in_progress', 'converted', 'rejected', 'no_response', name='request_status'),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.drop_constraint(None, 'preachers', type_='unique')
    op.create_index(op.f('idx_preachers_org'), 'preachers', ['org_id'], unique=False)
    op.create_index(op.f('idx_preachers_name'), 'preachers', [sa.literal_column("to_tsvector('simple'::regconfig, full_name::text)")], unique=False, postgresql_using='gin')
    op.alter_column('preachers', 'approval_status',
               existing_type=sa.Enum('pending', 'approved', 'rejected', name='approval_status'),
               type_=sa.TEXT(),
               existing_nullable=False,
               existing_server_default=sa.text("'pending'::text"))
    op.alter_column('preachers', 'status',
               existing_type=sa.Enum('active', 'suspended', name='preacher_status'),
               type_=sa.TEXT(),
               existing_nullable=False,
               existing_server_default=sa.text("'active'::text"))
    op.alter_column('preachers', 'scientific_qualification',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)
    op.alter_column('preachers', 'nationality_country_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('preachers', 'gender',
               existing_type=sa.Enum('male', 'female', name='gender_type'),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('preachers', 'email',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)
    op.alter_column('preachers', 'phone',
               existing_type=sa.VARCHAR(length=30),
               nullable=True)
    op.alter_column('preachers', 'type',
               existing_type=sa.Enum('volunteer', 'official', name='preacher_type'),
               type_=sa.TEXT(),
               existing_nullable=False)
    op.drop_column('preachers', 'qualification_file')
    op.alter_column('organizations', 'approval_status',
               existing_type=sa.Enum('pending', 'approved', 'rejected', name='approval_status'),
               type_=sa.TEXT(),
               existing_nullable=False,
               existing_server_default=sa.text("'pending'::text"))
    op.alter_column('organizations', 'email',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)
    op.alter_column('organizations', 'phone',
               existing_type=sa.VARCHAR(length=30),
               nullable=True)
    op.alter_column('organizations', 'governorate',
               existing_type=sa.VARCHAR(length=150),
               nullable=True)
    op.alter_column('organizations', 'country_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('organizations', 'establishment_date',
               existing_type=sa.DATE(),
               nullable=True)
    op.alter_column('organizations', 'license_file',
               existing_type=sa.VARCHAR(length=500),
               nullable=True)
    op.alter_column('organizations', 'license_number',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
    op.alter_column('notifications', 'type',
               existing_type=sa.Enum('new_request', 'request_accepted', 'status_changed', 'new_message', 'account_approved', 'account_rejected', 'alert_48h', 'auto_reclaimed', name='notification_type'),
               type_=sa.TEXT(),
               existing_nullable=False)
    op.alter_column('muslim_callers', 'gender',
               existing_type=sa.Enum('male', 'female', name='gender_type'),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('messages', 'message_type',
               existing_type=sa.Enum('text', 'image', 'file', 'audio', name='message_type'),
               type_=sa.TEXT(),
               existing_nullable=False,
               existing_server_default=sa.text("'text'::text"))
    op.alter_column('interested_persons', 'gender',
               existing_type=sa.Enum('male', 'female', name='gender_type'),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('dawah_requests', 'communication_channel',
               existing_type=sa.Enum('phone', 'whatsapp', 'messenger', 'telegram', 'email', 'in_person', 'other', name='communication_channel'),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('dawah_requests', 'status',
               existing_type=sa.Enum('pending', 'in_progress', 'converted', 'rejected', 'no_response', name='request_status'),
               type_=sa.TEXT(),
               existing_nullable=False,
               existing_server_default=sa.text("'pending'::text"))
    op.alter_column('dawah_requests', 'invited_gender',
               existing_type=sa.Enum('male', 'female', name='gender_type'),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('dawah_requests', 'request_type',
               existing_type=sa.Enum('invited', 'self_interested', name='request_type'),
               type_=sa.TEXT(),
               existing_nullable=False)
    op.drop_column('dawah_requests', 'governorate')
    op.alter_column('admins', 'level',
               existing_type=sa.Enum('super_admin', 'admin', name='admin_level'),
               type_=sa.TEXT(),
               existing_nullable=False,
               existing_server_default=sa.text("'admin'::text"))
    # ### end Alembic commands ###
