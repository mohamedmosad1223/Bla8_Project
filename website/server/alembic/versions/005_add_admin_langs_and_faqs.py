"""add admin languages and faqs

Revision ID: 005_add_admin_langs_and_faqs
Revises: 004_add_profile_picture_to_admin
Create Date: 2026-03-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_admin_langs_and_faqs'
down_revision = '004_add_profile_picture_to_admin'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create FAQs table
    op.create_table(
        'faqs',
        sa.Column('faq_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('question', sa.String(length=500), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('faq_id')
    )

    # 2. Create Admin Languages table
    op.create_table(
        'admin_languages',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('admin_id', sa.BigInteger(), nullable=False),
        sa.Column('language_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['admins.admin_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['language_id'], ['languages.language_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('admin_id', 'language_id', name='uq_admin_language')
    )

    # 3. Seed initial FAQs
    op.execute("""
        INSERT INTO faqs (question, answer) VALUES 
        ('من نحن؟', 'منصة بلاغ هي منصة دعوية تهدف لتسهيل التواصل بين الدعاة والمهتمين بالإسلام.'),
        ('ما هو هدف المنصة؟', 'تهدف المنصة لرقمنة العمل الدعوي ومتابعة الحالات بفعالية واحترافية عالية.'),
        ('كيف يمكنني الانضمام كداعية؟', 'يمكنك التسجيل عبر خيار "تسجيل داعية" ورفع المؤهلات المطلوبة للمراجعة.'),
        ('هل المنصة مجانية؟', 'نعم، المنصة تعمل كخدمة وقفية دعوية لخدمة المسلمين والمهتمين بالدين الإسلامي.')
    """)


def downgrade():
    op.drop_table('admin_languages')
    op.drop_table('faqs')
