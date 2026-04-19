"""add_languages_and_nationalities

Revision ID: d64a9d15c46c
Revises: ff0001_report_schedules
Create Date: 2026-04-19 18:10:01.124794

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd64a9d15c46c'
down_revision = 'ff0001_report_schedules'
branch_labels = None
depends_on = None


def upgrade():
    # Insert/Update Languages
    languages = [
        ('العربية', 'ar'),
        ('الإنجليزية', 'en'),
        ('الفرنسية', 'fr'),
        ('الألمانية', 'de'),
        ('الإسبانية', 'es'),
        ('الأوردو', 'ur'),
        ('الهندية', 'hi'),
        ('التاغالوغية', 'tl'),
        ('التاملية', 'ta'),
        ('التلغو', 'te')
    ]
    for name, code in languages:
        op.execute(
            sa.text(
                "INSERT INTO languages (language_name, language_code, is_active) "
                "VALUES (:name, :code, true) "
                "ON CONFLICT (language_code) DO UPDATE SET language_name = EXCLUDED.language_name"
            ).bindparams(name=name, code=code)
        )

    # Insert/Update Countries
    countries = [
        ('السعودية', 'SA', '966'),
        ('أمريكا', 'US', '1'),
        ('فرنسا', 'FR', '33'),
        ('ألمانيا', 'DE', '49'),
        ('إسبانيا', 'ES', '34'),
        ('باكستان', 'PK', '92'),
        ('الهند', 'IN', '91'),
        ('الفلبين', 'PH', '63'),
        ('سريلانكا', 'LK', '94'),
        ('تشاد', 'TD', '235'),
        ('نيجيريا', 'NG', '234'),
        ('السنغال', 'SN', '221'),
        ('الكويت', 'KW', '965')
    ]
    for name, code, phone in countries:
        op.execute(
            sa.text(
                "INSERT INTO countries (country_name, country_code, phone_code) "
                "VALUES (:name, :code, :phone) "
                "ON CONFLICT (country_code) DO UPDATE SET country_name = EXCLUDED.country_name, phone_code = EXCLUDED.phone_code"
            ).bindparams(name=name, code=code, phone=phone)
        )


def downgrade():
    # No downgrade for data insertion
    pass
