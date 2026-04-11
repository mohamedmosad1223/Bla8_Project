"""Consolidate tmp updates into Alembic

Revision ID: consolidated_tmp_updates
Revises: 009_add_last_seen
Create Date: 2026-04-10 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'consolidated_tmp_updates'
# This combines the two concurrent heads that existed previously
down_revision = ('009_add_last_seen', '123456789abc')
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. Increase column lengths for country_code and language_code
    op.alter_column('countries', 'country_code', type_=sa.String(30))
    op.alter_column('languages', 'language_code', type_=sa.String(30))

    # 2. Add columns to interested_persons and dawah_requests if missing
    def col_exists(table, col_name):
        cols = [c['name'] for c in inspector.get_columns(table)]
        return col_name in cols

    if 'interested_persons' in existing_tables:
        if not col_exists('interested_persons', 'religion'):
            op.add_column('interested_persons', sa.Column('religion', sa.String(100), nullable=True))
        if not col_exists('interested_persons', 'religion_id'):
            op.add_column('interested_persons', sa.Column('religion_id', sa.Integer(), nullable=True))
            
    if 'dawah_requests' in existing_tables:
        if not col_exists('dawah_requests', 'invited_religion_id'):
            op.add_column('dawah_requests', sa.Column('invited_religion_id', sa.Integer(), nullable=True))
        if not col_exists('dawah_requests', 'invited_religion'):
            op.add_column('dawah_requests', sa.Column('invited_religion', sa.String(100), nullable=True))

    # 3. Create faqs table if missing
    if 'faqs' not in existing_tables:
        op.create_table(
            'faqs',
            sa.Column('faq_id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('question', sa.String(length=500), nullable=False),
            sa.Column('answer', sa.Text(), nullable=False),
            sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('faq_id')
        )
        op.execute(sa.text("""
            INSERT INTO faqs (question, answer) VALUES 
            ('من نحن؟', 'منصة بلاغ هي منصة دعوية تهدف لتسهيل التواصل بين الدعاة والمهتمين بالإسلام.'),
            ('ما هو هدف المنصة؟', 'تهدف المنصة لرقمنة العمل الدعوي ومتابعة الحالات بفعالية واحترافية عالية.'),
            ('كيف يمكنني الانضمام كداعية؟', 'يمكنك التسجيل عبر خيار "تسجيل داعية" ورفع المؤهلات المطلوبة للمراجعة.'),
            ('هل المنصة مجانية؟', 'نعم، المنصة تعمل كخدمة وقفية دعوية لخدمة المسلمين والمهتمين بالدين الإسلامي.')
        """))

    # 4. Create dashboard_snapshots if missing (to complete the broken chain)
    if 'dashboard_snapshots' not in existing_tables:
        op.create_table(
            'dashboard_snapshots',
            sa.Column('snapshot_id', sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column('entity_type', sa.String(length=50), nullable=False),
            sa.Column('entity_id', sa.BigInteger(), nullable=False),
            sa.Column('snapshot_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column('computed_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('snapshot_id'),
            sa.UniqueConstraint('entity_type', 'entity_id', name='uq_dashboard_snapshot_entity')
        )
        op.create_index('idx_dashboard_snapshot_lookup', 'dashboard_snapshots', ['entity_type', 'entity_id'], unique=False)

    # 5. Temporary rename to avoid UniqueViolation on seeding
    op.execute("UPDATE languages SET language_code = language_code || '_old' WHERE language_code NOT LIKE '%_old';")
    op.execute("UPDATE countries SET country_code = country_code || '_old' WHERE country_code NOT LIKE '%_old';")

    # 6. Seed Reference Data
    # Languages
    languages = [
        (1, 'العربية', 'ar'),
        (2, 'الإنجليزية', 'en'),
        (3, 'التاغالوغية', 'tl'),
        (4, 'الهندية', 'hi'),
        (5, 'الفرنسية', 'fr'),
        (6, 'الإسبانية', 'es'),
    ]
    for lid, name, code in languages:
        op.execute(
            sa.text(
                "INSERT INTO languages (language_id, language_name, language_code) "
                "VALUES (:lid, :name, :code) "
                "ON CONFLICT (language_id) DO UPDATE SET language_name = EXCLUDED.language_name, language_code = EXCLUDED.language_code;"
            ).bindparams(lid=lid, name=name, code=code)
        )

    # Countries
    countries = [
        (1, 'الكويت', 'KW', '+965'),
        (2, 'مصر', 'EG', '+20'),
        (3, 'السعودية', 'SA', '+966'),
        (4, 'الفلبين', 'PH', '+63'),
        (5, 'الهند', 'IN', '+91'),
        (6, 'سريلانكا', 'LK', '+94'),
        (7, 'نيبال', 'NP', '+977'),
        (8, 'أمريكا', 'US', '+1'),
        (9, 'بريطانيا', 'GB', '+44'),
    ]
    for cid, name, code, pcode in countries:
        op.execute(
            sa.text(
                "INSERT INTO countries (country_id, country_name, country_code, phone_code) "
                "VALUES (:cid, :name, :code, :pcode) "
                "ON CONFLICT (country_id) DO UPDATE SET country_name = EXCLUDED.country_name, country_code = EXCLUDED.country_code, phone_code = EXCLUDED.phone_code;"
            ).bindparams(cid=cid, name=name, code=code, pcode=pcode)
        )

    # Religions
    religions = [
        (1, "الإسلام"),
        (2, "المسيحية"),
        (3, "الهندوسية"),
        (4, "البوذية"),
        (5, "لاديني"),
        (6, "أخرى")
    ]
    for rid, name in religions:
        op.execute(
            sa.text(
                "INSERT INTO religions (religion_id, religion_name) "
                "VALUES (:rid, :name) "
                "ON CONFLICT (religion_id) DO UPDATE SET religion_name = EXCLUDED.religion_name;"
            ).bindparams(rid=rid, name=name)
        )

    # 4. Cleanup old codes (Optional/Safe)
    op.execute("DELETE FROM languages WHERE language_code LIKE '%_old' AND language_id NOT IN (SELECT language_id FROM preacher_languages);")
    op.execute("DELETE FROM countries WHERE country_code LIKE '%_old' AND country_id NOT IN (SELECT nationality_country_id FROM preachers) AND country_id NOT IN (SELECT country_id FROM organizations);")

    # Sync sequences
    op.execute("SELECT setval('languages_language_id_seq', COALESCE((SELECT MAX(language_id) FROM languages), 6))")
    op.execute("SELECT setval('countries_country_id_seq', COALESCE((SELECT MAX(country_id) FROM countries), 9))")
    op.execute("SELECT setval('religions_religion_id_seq', COALESCE((SELECT MAX(religion_id) FROM religions), 6))")

def downgrade():
    op.alter_column('countries', 'country_code', type_=sa.String(10))
    op.alter_column('languages', 'language_code', type_=sa.String(10))
