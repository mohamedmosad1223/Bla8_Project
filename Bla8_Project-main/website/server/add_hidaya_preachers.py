
import sys
import os
import random
from sqlalchemy import select
from app.database import SessionLocal, engine
from app.models.user import User
from app.models.enums import UserRole, AccountStatus, ApprovalStatus, PreacherType, PreacherStatus, GenderType
from app.models.organization import Organization
from app.models.preacher import Preacher, PreacherStatistics, PreacherLanguage
from app.models.reference import Country, Language
from app.auth import get_password_hash

# Disable echo
engine.echo = False

session = SessionLocal()

# 1. Find the association
org = session.execute(select(Organization).where(Organization.organization_name.ilike('%الهداية%'))).scalars().first()
if not org:
    print("Error: Could not find association 'الهداية'")
    sys.exit(1)

# No print here to avoid unicode errors
pass


# 2. Reference data
india = session.execute(select(Country).where(Country.country_code == 'IN')).scalar_one()
phil = session.execute(select(Country).where(Country.country_code == 'PH')).scalar_one()
lang_en = session.execute(select(Language).where(Language.language_code == 'en')).scalar_one()
lang_hi = session.execute(select(Language).where(Language.language_code == 'hi')).scalar_one()
lang_tl = session.execute(select(Language).where(Language.language_code == 'tl')).scalar_one()

# 3. Create Preachers
new_preachers = []
for i in range(1, 6):
    email = f"hidaya_preacher{i}@example.com"
    existing = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing: continue
    
    user = User(
        email=email,
        password_hash=get_password_hash("password123"),
        role=UserRole.preacher,
        status=AccountStatus.active,
        app_language="ar"
    )
    session.add(user)
    session.flush()
    
    preacher = Preacher(
        user_id=user.user_id,
        org_id=org.org_id,
        type=PreacherType.official,
        full_name=f"داعية هداية {i}",
        phone=f"+965900000{i}0",
        email=email,
        gender=GenderType.male,
        nationality_country_id=random.choice([india.country_id, phil.country_id]),
        scientific_qualification="إجازة في علوم الشريعة",
        status=PreacherStatus.active,
        approval_status=ApprovalStatus.approved
    )
    session.add(preacher)
    session.flush()
    
    # Assign languages
    session.add(PreacherLanguage(preacher_id=preacher.preacher_id, language_id=lang_en.language_id, proficiency='fluent'))
    if preacher.nationality_country_id == india.country_id:
        session.add(PreacherLanguage(preacher_id=preacher.preacher_id, language_id=lang_hi.language_id, proficiency='native'))
    else:
        session.add(PreacherLanguage(preacher_id=preacher.preacher_id, language_id=lang_tl.language_id, proficiency='native'))
        
    session.add(PreacherStatistics(preacher_id=preacher.preacher_id))
    new_preachers.append(email)

session.commit()
session.close()

if new_preachers:
    print(f"Successfully added {len(new_preachers)} preachers:")
    for email in new_preachers:
        print(email)
else:
    print("No new preachers added (might already exist).")
