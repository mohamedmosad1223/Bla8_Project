"""001 initial schema - all v2 tables

Revision ID: 001
Revises: 
Create Date: 2026-03-10
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── ENUMs ────────────────────────────────────────────────────────────────
    op.execute("CREATE TYPE user_role AS ENUM ('admin','organization','preacher','muslim_caller','interested')")
    op.execute("CREATE TYPE account_status AS ENUM ('active','suspended','pending')")
    op.execute("CREATE TYPE admin_level AS ENUM ('super_admin','admin')")
    op.execute("CREATE TYPE approval_status AS ENUM ('pending','approved','rejected')")
    op.execute("CREATE TYPE preacher_type AS ENUM ('volunteer','official')")
    op.execute("CREATE TYPE preacher_status AS ENUM ('active','suspended')")
    op.execute("CREATE TYPE gender_type AS ENUM ('male','female')")
    op.execute("CREATE TYPE request_type AS ENUM ('invited','self_interested')")
    op.execute("CREATE TYPE request_status AS ENUM ('pending','in_progress','converted','rejected','no_response')")
    op.execute("CREATE TYPE message_type AS ENUM ('text','image','file','audio')")
    op.execute("CREATE TYPE notification_type AS ENUM ('new_request','request_accepted','status_changed','new_message','account_approved','account_rejected')")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    # ── REFERENCE TABLES ─────────────────────────────────────────────────────
    op.create_table('languages',
        sa.Column('language_id',   sa.Integer(),    primary_key=True, autoincrement=True),
        sa.Column('language_name', sa.String(100),  nullable=False),
        sa.Column('language_code', sa.String(10),   nullable=False, unique=True),
        sa.Column('is_active',     sa.Boolean(),    nullable=False, server_default='true'),
    )
    op.create_table('countries',
        sa.Column('country_id',   sa.Integer(),   primary_key=True, autoincrement=True),
        sa.Column('country_name', sa.String(100), nullable=False),
        sa.Column('country_code', sa.String(10),  nullable=False, unique=True),
        sa.Column('phone_code',   sa.String(20)),
    )

    # ── USERS ────────────────────────────────────────────────────────────────
    op.create_table('users',
        sa.Column('user_id',       sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('email',         sa.String(255),  nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255),  nullable=False),
        sa.Column('role',          sa.Text(),       nullable=False),
        sa.Column('status',        sa.Text(),       nullable=False, server_default='pending'),
        sa.Column('last_login',    sa.TIMESTAMP(timezone=True)),
        sa.Column('created_at',    sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',    sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at',    sa.TIMESTAMP(timezone=True)),
    )
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role',  'users', ['role'])

    # ── ADMINS ───────────────────────────────────────────────────────────────
    op.create_table('admins',
        sa.Column('admin_id',   sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id',    sa.BigInteger(), sa.ForeignKey('users.user_id'), nullable=False, unique=True),
        sa.Column('full_name',  sa.String(255),  nullable=False),
        sa.Column('phone',      sa.String(30)),
        sa.Column('level',      sa.Text(),       nullable=False, server_default='admin'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── ORGANIZATIONS ────────────────────────────────────────────────────────
    op.create_table('organizations',
        sa.Column('org_id',             sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id',            sa.BigInteger(), sa.ForeignKey('users.user_id'), nullable=False, unique=True),
        sa.Column('organization_name',  sa.String(255),  nullable=False),
        sa.Column('license_number',     sa.String(100)),
        sa.Column('license_file',       sa.String(500)),
        sa.Column('establishment_date', sa.Date()),
        sa.Column('country_id',         sa.Integer(),    sa.ForeignKey('countries.country_id')),
        sa.Column('governorate',        sa.String(150)),
        sa.Column('manager_name',       sa.String(255),  nullable=False),
        sa.Column('phone',              sa.String(30)),
        sa.Column('email',              sa.String(255)),
        sa.Column('approval_status',    sa.Text(),       nullable=False, server_default='pending'),
        sa.Column('approved_by',        sa.BigInteger(), sa.ForeignKey('admins.admin_id')),
        sa.Column('approved_at',        sa.TIMESTAMP(timezone=True)),
        sa.Column('rejection_reason',   sa.Text()),
        sa.Column('created_at',         sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',         sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── PREACHERS ────────────────────────────────────────────────────────────
    op.create_table('preachers',
        sa.Column('preacher_id',              sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id',                  sa.BigInteger(), sa.ForeignKey('users.user_id')),
        sa.Column('org_id',                   sa.BigInteger(), sa.ForeignKey('organizations.org_id')),
        sa.Column('type',                     sa.Text(),       nullable=False),
        sa.Column('full_name',                sa.String(255),  nullable=False),
        sa.Column('phone',                    sa.String(30)),
        sa.Column('email',                    sa.String(255)),
        sa.Column('gender',                   sa.Text()),
        sa.Column('nationality_country_id',   sa.Integer(),    sa.ForeignKey('countries.country_id')),
        sa.Column('identity_number',          sa.String(100)),
        sa.Column('scientific_qualification', sa.String(255)),
        sa.Column('status',                   sa.Text(),       nullable=False, server_default='active'),
        sa.Column('approval_status',          sa.Text(),       nullable=False, server_default='pending'),
        sa.Column('approved_by_admin',        sa.BigInteger(), sa.ForeignKey('admins.admin_id')),
        sa.Column('approved_at',              sa.TIMESTAMP(timezone=True)),
        sa.Column('rejection_reason',         sa.Text()),
        sa.Column('created_at',               sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',               sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("NOT (type = 'volunteer' AND org_id IS NOT NULL)", name='chk_volunteer_no_org'),
        sa.CheckConstraint("NOT (type = 'official'  AND org_id IS NULL)",    name='chk_official_has_org'),
    )
    op.create_index('idx_preachers_org',          'preachers', ['org_id'])
    op.create_index('idx_preachers_type_status',   'preachers', ['type', 'status', 'approval_status'])
    op.create_index('idx_preachers_org_filter',    'preachers', ['org_id', 'status', 'type', 'gender', 'approval_status'])
    op.create_index('idx_preachers_nationality',   'preachers', ['nationality_country_id'])
    op.create_index('idx_preachers_created',       'preachers', ['created_at'])

    op.create_table('preacher_languages',
        sa.Column('id',          sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('preacher_id', sa.BigInteger(), sa.ForeignKey('preachers.preacher_id', ondelete='CASCADE'), nullable=False),
        sa.Column('language_id', sa.Integer(),    sa.ForeignKey('languages.language_id'), nullable=False),
        sa.Column('proficiency', sa.String(50)),
        sa.UniqueConstraint('preacher_id', 'language_id', name='uq_preacher_language'),
    )
    op.create_index('idx_preacher_lang', 'preacher_languages', ['language_id', 'preacher_id'])

    op.create_table('preacher_documents',
        sa.Column('document_id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('preacher_id', sa.BigInteger(), sa.ForeignKey('preachers.preacher_id', ondelete='CASCADE'), nullable=False),
        sa.Column('doc_type',    sa.String(100)),
        sa.Column('doc_name',    sa.String(255),  nullable=False),
        sa.Column('file_path',   sa.String(500),  nullable=False),
        sa.Column('uploaded_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table('preacher_statistics',
        sa.Column('stat_id',               sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('preacher_id',           sa.BigInteger(), sa.ForeignKey('preachers.preacher_id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('total_accepted',        sa.Integer(),    nullable=False, server_default='0'),
        sa.Column('converted_count',       sa.Integer(),    nullable=False, server_default='0'),
        sa.Column('in_progress_count',     sa.Integer(),    nullable=False, server_default='0'),
        sa.Column('rejected_count',        sa.Integer(),    nullable=False, server_default='0'),
        sa.Column('no_response_count',     sa.Integer(),    nullable=False, server_default='0'),
        sa.Column('avg_response_time_min', sa.Numeric(10,2)),
        sa.Column('total_messages_sent',   sa.Integer(),    nullable=False, server_default='0'),
        sa.Column('updated_at',            sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── MUSLIM CALLERS ───────────────────────────────────────────────────────
    op.create_table('muslim_callers',
        sa.Column('caller_id',              sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id',               sa.BigInteger(), sa.ForeignKey('users.user_id'), nullable=False, unique=True),
        sa.Column('full_name',             sa.String(255),  nullable=False),
        sa.Column('phone',                 sa.String(30)),
        sa.Column('nationality_country_id',sa.Integer(),    sa.ForeignKey('countries.country_id')),
        sa.Column('gender',                sa.Text()),
        sa.Column('created_at',            sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',            sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── INTERESTED PERSONS ───────────────────────────────────────────────────
    op.create_table('interested_persons',
        sa.Column('person_id',             sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id',               sa.BigInteger(), sa.ForeignKey('users.user_id'), unique=True),
        sa.Column('first_name',            sa.String(150),  nullable=False),
        sa.Column('father_name',           sa.String(150)),
        sa.Column('last_name',             sa.String(150),  nullable=False),
        sa.Column('gender',                sa.Text()),
        sa.Column('nationality_country_id',sa.Integer(),    sa.ForeignKey('countries.country_id')),
        sa.Column('current_country_id',    sa.Integer(),    sa.ForeignKey('countries.country_id')),
        sa.Column('communication_lang_id', sa.Integer(),    sa.ForeignKey('languages.language_id')),
        sa.Column('email',                 sa.String(255)),
        sa.Column('phone',                 sa.String(30)),
        sa.Column('created_at',            sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',            sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── DAWAH REQUESTS ───────────────────────────────────────────────────────
    op.create_table('dawah_requests',
        sa.Column('request_id',                sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('request_type',              sa.Text(),       nullable=False),
        sa.Column('invited_first_name',        sa.String(150)),
        sa.Column('invited_last_name',         sa.String(150)),
        sa.Column('invited_gender',            sa.Text()),
        sa.Column('invited_nationality_id',    sa.Integer(),    sa.ForeignKey('countries.country_id')),
        sa.Column('invited_current_country_id',sa.Integer(),    sa.ForeignKey('countries.country_id')),
        sa.Column('invited_language_id',       sa.Integer(),    sa.ForeignKey('languages.language_id')),
        sa.Column('invited_phone',             sa.String(30)),
        sa.Column('invited_email',             sa.String(255)),
        sa.Column('submitted_by_caller_id',    sa.BigInteger(), sa.ForeignKey('muslim_callers.caller_id')),
        sa.Column('submitted_by_person_id',    sa.BigInteger(), sa.ForeignKey('interested_persons.person_id')),
        sa.Column('assigned_preacher_id',      sa.BigInteger(), sa.ForeignKey('preachers.preacher_id')),
        sa.Column('accepted_at',               sa.TIMESTAMP(timezone=True)),
        sa.Column('status',                    sa.Text(),       nullable=False, server_default='pending'),
        sa.Column('conversion_date',           sa.Date()),
        sa.Column('notes',                     sa.Text()),
        sa.Column('submission_date',           sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_at',                sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',                sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("NOT (request_type = 'invited' AND submitted_by_caller_id IS NULL)", name='chk_invited_has_caller'),
        sa.CheckConstraint("NOT (request_type = 'self_interested' AND submitted_by_person_id IS NULL)", name='chk_self_has_person'),
        sa.CheckConstraint("NOT (status != 'pending' AND assigned_preacher_id IS NULL)", name='chk_inprogress_has_preacher'),
    )
    op.create_index('idx_requests_status',   'dawah_requests', ['status'])
    op.create_index('idx_requests_type',     'dawah_requests', ['request_type'])
    op.create_index('idx_requests_preacher', 'dawah_requests', ['assigned_preacher_id'])
    op.create_index('idx_requests_caller',   'dawah_requests', ['submitted_by_caller_id'])
    op.create_index('idx_requests_person',   'dawah_requests', ['submitted_by_person_id'])

    op.create_table('request_documents',
        sa.Column('document_id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('request_id',  sa.BigInteger(), sa.ForeignKey('dawah_requests.request_id', ondelete='CASCADE'), nullable=False),
        sa.Column('doc_name',    sa.String(255),  nullable=False),
        sa.Column('file_path',   sa.String(500),  nullable=False),
        sa.Column('uploaded_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table('request_status_history',
        sa.Column('history_id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('request_id', sa.BigInteger(), sa.ForeignKey('dawah_requests.request_id', ondelete='CASCADE'), nullable=False),
        sa.Column('old_status', sa.Text()),
        sa.Column('new_status', sa.Text(), nullable=False),
        sa.Column('changed_by', sa.BigInteger(), sa.ForeignKey('users.user_id')),
        sa.Column('note',       sa.Text()),
        sa.Column('changed_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── MESSAGES ─────────────────────────────────────────────────────────────
    op.create_table('messages',
        sa.Column('message_id',        sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('request_id',        sa.BigInteger(), sa.ForeignKey('dawah_requests.request_id'), nullable=False),
        sa.Column('sender_id',         sa.BigInteger(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('receiver_id',       sa.BigInteger(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('message_text',      sa.Text()),
        sa.Column('message_type',      sa.Text(), nullable=False, server_default='text'),
        sa.Column('file_path',         sa.String(500)),
        sa.Column('is_read',           sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_first_response', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at',        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_messages_request', 'messages', ['request_id'])

    # ── NOTIFICATIONS ────────────────────────────────────────────────────────
    op.create_table('notifications',
        sa.Column('notification_id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id',         sa.BigInteger(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('type',            sa.Text(), nullable=False),
        sa.Column('title',           sa.String(255), nullable=False),
        sa.Column('body',            sa.Text()),
        sa.Column('related_id',      sa.BigInteger()),
        sa.Column('is_read',         sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at',      sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_notifications_user', 'notifications', ['user_id', 'is_read'])

    # ── AUDIT LOGS ───────────────────────────────────────────────────────────
    op.create_table('audit_logs',
        sa.Column('log_id',     sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id',    sa.BigInteger(), sa.ForeignKey('users.user_id')),
        sa.Column('action',     sa.String(100),  nullable=False),
        sa.Column('table_name', sa.String(100)),
        sa.Column('record_id',  sa.BigInteger()),
        sa.Column('old_data',   sa.JSON()),
        sa.Column('new_data',   sa.JSON()),
        sa.Column('ip_address', sa.String(50)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_audit_table_record', 'audit_logs', ['table_name', 'record_id'])

    # ── ACCEPT REQUEST FUNCTION ───────────────────────────────────────────────
    op.execute("""
    CREATE OR REPLACE FUNCTION accept_dawah_request(p_request_id BIGINT, p_preacher_id BIGINT)
    RETURNS BOOLEAN AS $$
    DECLARE v_rows INT;
    BEGIN
        UPDATE dawah_requests
        SET assigned_preacher_id = p_preacher_id,
            status = 'in_progress',
            accepted_at = NOW(),
            auto_reclaim_at = NOW() + INTERVAL '72 hours',
            updated_at = NOW()
        WHERE request_id = p_request_id AND status = 'pending';
        GET DIAGNOSTICS v_rows = ROW_COUNT;
        IF v_rows > 0 THEN
            INSERT INTO request_status_history(request_id, old_status, new_status, changed_by)
            VALUES (p_request_id, 'pending', 'in_progress',
                (SELECT user_id FROM preachers WHERE preacher_id = p_preacher_id));
        END IF;
        RETURN v_rows > 0;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # ── VIEWS ────────────────────────────────────────────────────────────────
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
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql
    """)
    for tbl in ['users','admins','organizations','preachers','muslim_callers','interested_persons','dawah_requests']:
        op.execute(f"""
        CREATE TRIGGER trg_{tbl}_upd BEFORE UPDATE ON {tbl}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
        """)


def downgrade() -> None:
    for tbl in ['users','admins','organizations','preachers','muslim_callers','interested_persons','dawah_requests']:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{tbl}_upd ON {tbl}")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at() CASCADE")
    op.execute("DROP VIEW IF EXISTS v_pending_requests")
    op.execute("DROP FUNCTION IF EXISTS accept_dawah_request(BIGINT, BIGINT) CASCADE")
    for tbl in ['audit_logs','notifications','messages','request_status_history','request_documents',
                'dawah_requests','interested_persons','muslim_callers','preacher_statistics',
                'preacher_documents','preacher_languages','preachers','organizations','admins','users',
                'countries','languages']:
        op.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE")
    for enum in ['user_role','account_status','admin_level','approval_status','preacher_type',
                 'preacher_status','gender_type','request_type','request_status','message_type','notification_type']:
        op.execute(f"DROP TYPE IF EXISTS {enum}")
