"""002 v3 enhancements - communication channels, reclaim system, audit, reports, privacy view

Revision ID: 002
Revises: 001
Create Date: 2026-03-10
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Communication Channel ENUM + fields in dawah_requests ─────────────
    op.execute("""
    CREATE TYPE communication_channel AS ENUM (
        'phone','whatsapp','messenger','telegram','email','in_person','other'
    )
    """)
    op.add_column('dawah_requests', sa.Column('communication_channel', sa.Text()))
    op.add_column('dawah_requests', sa.Column('deep_link', sa.Text()))

    # ── 2. نظام الاسترداد (48h + 72h) ────────────────────────────────────────
    op.add_column('dawah_requests', sa.Column('alert_48h_sent_at', sa.TIMESTAMP(timezone=True)))
    op.add_column('dawah_requests', sa.Column('auto_reclaim_at',   sa.TIMESTAMP(timezone=True)))
    op.add_column('dawah_requests', sa.Column('reclaimed_at',      sa.TIMESTAMP(timezone=True)))

    # Index للاسترداد التلقائي
    op.create_index('idx_requests_channel', 'dawah_requests', ['communication_channel'])
    op.create_index('idx_requests_reclaim', 'dawah_requests', ['status', 'auto_reclaim_at'])

    # ── 3. Full-text search index on preacher name (GIN) ─────────────────────
    op.execute("CREATE INDEX idx_preachers_name ON preachers USING gin(to_tsvector('simple', full_name))")

    # ── 4. Audit Logs v3 columns ──────────────────────────────────────────────
    op.add_column('audit_logs', sa.Column('org_id',      sa.BigInteger(), sa.ForeignKey('organizations.org_id')))
    op.add_column('audit_logs', sa.Column('duration_ms', sa.Integer()))
    op.add_column('audit_logs', sa.Column('user_agent',  sa.Text()))
    op.create_index('idx_audit_org',    'audit_logs', ['org_id',  'created_at'])
    op.create_index('idx_audit_action', 'audit_logs', ['action',  'created_at'])

    # ── 5. Extended notification_type ENUM ───────────────────────────────────
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'alert_48h'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'auto_reclaimed'")

    # ── 6. Dynamic Reports Table ─────────────────────────────────────────────
    op.create_table('report_metrics',
        sa.Column('metric_id',    sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('metric_name',  sa.String(100),  nullable=False),
        sa.Column('dimension',    sa.String(100)),
        sa.Column('value',        sa.Numeric(15, 4), nullable=False),
        sa.Column('period_start', sa.Date()),
        sa.Column('period_end',   sa.Date()),
        sa.Column('org_id',       sa.BigInteger(), sa.ForeignKey('organizations.org_id')),
        sa.Column('created_at',   sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_metrics_name_period', 'report_metrics', ['metric_name', 'period_start'])

    # ── 7. Privacy View (المسلم الداعي) ──────────────────────────────────────
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

    # ── 8. Organization response speed view ───────────────────────────────────
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

    # ── 9. Alert + Auto-Reclaim Functions ────────────────────────────────────
    op.execute("""
    CREATE OR REPLACE FUNCTION send_pending_alerts()
    RETURNS INT AS $$
    DECLARE
        v_count INT := 0;
        rec RECORD;
    BEGIN
        FOR rec IN
            SELECT r.request_id, r.assigned_preacher_id,
                   p.org_id, p.user_id AS preacher_user_id
            FROM dawah_requests r
            JOIN preachers p ON p.preacher_id = r.assigned_preacher_id
            WHERE r.status = 'in_progress'
              AND r.alert_48h_sent_at IS NULL
              AND r.accepted_at < NOW() - INTERVAL '48 hours'
        LOOP
            -- تنبيه الداعية
            INSERT INTO notifications(user_id, type, title, body, related_id)
            VALUES (rec.preacher_user_id, 'alert_48h',
                    'تذكير: طلب يحتاج تحديثاً',
                    'مضى أكثر من 48 ساعة على قبولك للطلب دون تحديث للحالة.',
                    rec.request_id);

            -- تنبيه مشرف الجمعية
            INSERT INTO notifications(user_id, type, title, body, related_id)
            SELECT u.user_id, 'alert_48h',
                   'تنبيه: داعية لم يحدّث الحالة',
                   'أحد دعاة الجمعية تجاوز 48 ساعة دون تحديث.',
                   rec.request_id
            FROM organizations o
            JOIN users u ON u.user_id = o.user_id
            WHERE o.org_id = rec.org_id;

            -- تحديث حقل الإرسال
            UPDATE dawah_requests SET alert_48h_sent_at = NOW()
            WHERE request_id = rec.request_id;

            -- سجل الـ audit
            INSERT INTO audit_logs(action, table_name, record_id, new_data)
            VALUES ('alert_48h_sent', 'dawah_requests', rec.request_id,
                    jsonb_build_object('request_id', rec.request_id, 'sent_at', NOW()));

            v_count := v_count + 1;
        END LOOP;
        RETURN v_count;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE OR REPLACE FUNCTION auto_reclaim_stale_requests()
    RETURNS INT AS $$
    DECLARE
        v_count INT := 0;
        rec RECORD;
    BEGIN
        FOR rec IN
            SELECT request_id, assigned_preacher_id
            FROM dawah_requests
            WHERE status = 'in_progress'
              AND auto_reclaim_at IS NOT NULL
              AND auto_reclaim_at < NOW()
              AND reclaimed_at IS NULL
        LOOP
            UPDATE dawah_requests
            SET status               = 'pending',
                assigned_preacher_id = NULL,
                accepted_at          = NULL,
                reclaimed_at         = NOW(),
                alert_48h_sent_at    = NULL,
                auto_reclaim_at      = NULL,
                updated_at           = NOW()
            WHERE request_id = rec.request_id;

            INSERT INTO request_status_history(request_id, old_status, new_status, note)
            VALUES (rec.request_id, 'in_progress', 'pending',
                    'تم الاسترداد تلقائياً بعد 72 ساعة بدون تحديث');

            INSERT INTO audit_logs(action, table_name, record_id, new_data)
            VALUES ('auto_reclaimed', 'dawah_requests', rec.request_id,
                    jsonb_build_object('request_id', rec.request_id,
                                       'old_preacher', rec.assigned_preacher_id,
                                       'reclaimed_at', NOW()));

            v_count := v_count + 1;
        END LOOP;
        RETURN v_count;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # تحديث accept_dawah_request لتضبط auto_reclaim_at تلقائياً
    op.execute("""
    CREATE OR REPLACE FUNCTION accept_dawah_request(p_request_id BIGINT, p_preacher_id BIGINT)
    RETURNS BOOLEAN AS $$
    DECLARE v_rows INT;
    BEGIN
        UPDATE dawah_requests
        SET assigned_preacher_id = p_preacher_id,
            status               = 'in_progress',
            accepted_at          = NOW(),
            auto_reclaim_at      = NOW() + INTERVAL '72 hours',
            updated_at           = NOW()
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


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS v_caller_dashboard")
    op.execute("DROP VIEW IF EXISTS v_org_response_speed")
    op.execute("DROP FUNCTION IF EXISTS send_pending_alerts() CASCADE")
    op.execute("DROP FUNCTION IF EXISTS auto_reclaim_stale_requests() CASCADE")
    op.execute("DROP TABLE IF EXISTS report_metrics CASCADE")
    op.drop_index('idx_audit_action', 'audit_logs')
    op.drop_index('idx_audit_org', 'audit_logs')
    op.drop_column('audit_logs', 'user_agent')
    op.drop_column('audit_logs', 'duration_ms')
    op.drop_column('audit_logs', 'org_id')
    op.execute("DROP INDEX IF EXISTS idx_preachers_name")
    op.drop_index('idx_requests_reclaim', 'dawah_requests')
    op.drop_index('idx_requests_channel', 'dawah_requests')
    op.drop_column('dawah_requests', 'reclaimed_at')
    op.drop_column('dawah_requests', 'auto_reclaim_at')
    op.drop_column('dawah_requests', 'alert_48h_sent_at')
    op.drop_column('dawah_requests', 'deep_link')
    op.drop_column('dawah_requests', 'communication_channel')
    op.execute("DROP TYPE IF EXISTS communication_channel")
