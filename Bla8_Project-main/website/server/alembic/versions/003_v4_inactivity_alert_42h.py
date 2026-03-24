"""Update inactivity alert to 42h and notify admins

Revision ID: 003_v4_inactivity_alert_42h
Revises: fd60211f3a3d
Create Date: 2026-03-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_v4_inactivity_alert_42h'
down_revision = 'fd60211f3a3d'
branch_labels = None
depends_on = None


def upgrade():
    # ── 1. Update Notification Type ENUM ──────────────────────────────────────
    # op.execute is safer for adding enum values in some PG versions
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'alert_42h'")

    # ── 2. Rename Column in dawah_requests ─────────────────────────────────────
    op.alter_column('dawah_requests', 'alert_48h_sent_at', new_column_name='alert_42h_sent_at')

    # ── 3. Update send_pending_alerts() Function ──────────────────────────────
    # Modifications: 48h -> 42h, notify Admins & SuperAdmins
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
              AND r.alert_42h_sent_at IS NULL
              AND r.accepted_at < NOW() - INTERVAL '42 hours'
        LOOP
            -- 1. تنبيه الداعية (42h)
            INSERT INTO notifications(user_id, type, title, body, related_id)
            VALUES (rec.preacher_user_id, 'alert_42h',
                    'تذكير: تأخر التواصل مع الحالة',
                    'مضى أكثر من 42 ساعة على قبولك للطلب دون تحديث. يرجى التواصل مع الحالة أو كتابة تقرير.',
                    rec.request_id);

            -- 2. تنبيه مشرف الجمعية
            INSERT INTO notifications(user_id, type, title, body, related_id)
            SELECT u.user_id, 'alert_42h',
                   'تنبيه: داعية متأخر في التواصل',
                   'أحد دعاة الجمعية تجاوز 42 ساعة دون تحديث لحالة الطلب.',
                   rec.request_id
            FROM organizations o
            JOIN users u ON u.user_id = o.user_id
            WHERE o.org_id = rec.org_id;

            -- 3. تنبيه الـ Admin والـ Super Admin (جديد)
            INSERT INTO notifications(user_id, type, title, body, related_id)
            SELECT user_id, 'alert_42h',
                   'تنبيه المنصة: تأخر داعية (42 ساعة)',
                   'هناك طلب متأخر لدى أحد الدعاة لأكثر من 42 ساعة دون تواصل.',
                   rec.request_id
            FROM users
            WHERE role IN ('admin', 'super_admin') AND status = 'active';

            -- تحديث حقل الإرسال
            UPDATE dawah_requests SET alert_42h_sent_at = NOW()
            WHERE request_id = rec.request_id;

            -- سجل الـ audit
            INSERT INTO audit_logs(action, table_name, record_id, new_data)
            VALUES ('alert_42h_sent', 'dawah_requests', rec.request_id,
                    jsonb_build_object('request_id', rec.request_id, 'sent_at', NOW()));

            v_count := v_count + 1;
        END LOOP;
        RETURN v_count;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # ── 4. Update auto_reclaim_stale_requests() ───────────────────────────────
    # Adding notification to admin when reclaimed
    op.execute("""
    CREATE OR REPLACE FUNCTION auto_reclaim_stale_requests()
    RETURNS INT AS $$
    DECLARE
        v_count INT := 0;
        rec RECORD;
    BEGIN
        FOR rec IN
            SELECT request_id, assigned_preacher_id, invited_first_name, invited_last_name
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
                alert_42h_sent_at    = NULL,
                auto_reclaim_at      = NULL,
                updated_at           = NOW()
            WHERE request_id = rec.request_id;

            INSERT INTO request_status_history(request_id, old_status, new_status, note)
            VALUES (rec.request_id, 'in_progress', 'pending',
                    'تم الاسترداد تلقائياً بعد 72 ساعة بدون تحديث');

            -- تنبيه الإدارة بالسحب (جديد)
            INSERT INTO notifications(user_id, type, title, body, related_id)
            SELECT user_id, 'auto_reclaimed',
                   'نظام المنصة: سحب طلب تلقائياً',
                   'تم سحب الطلب بخصوص (' || COALESCE(rec.invited_first_name, '') || ') وإعادته للمسبح العام بسبب عدم التواصل.',
                   rec.request_id
            FROM users
            WHERE role IN ('admin', 'super_admin') AND status = 'active';

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


def downgrade():
    op.alter_column('dawah_requests', 'alert_42h_sent_at', new_column_name='alert_48h_sent_at')
    # Note: Enum values and Functions are usually left as is or reverted to 48h logic if needed.
    # Reverting to 48h logic for Functions:
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
            INSERT INTO notifications(user_id, type, title, body, related_id)
            VALUES (rec.preacher_user_id, 'alert_48h', 'تذكير: طلب يحتاج تحديثاً', 'مضى أكثر من 48 ساعة...', rec.request_id);
            
            UPDATE dawah_requests SET alert_48h_sent_at = NOW() WHERE request_id = rec.request_id;
            v_count := v_count + 1;
        END LOOP;
        RETURN v_count;
    END;
    $$ LANGUAGE plpgsql;
    """)
