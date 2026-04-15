
import sys
import os
import random
from datetime import datetime, date, timedelta

# Ensure we can import app
sys.path.append(os.getcwd())

from sqlalchemy import select
from app.database import SessionLocal, engine
engine.echo = False
from app.models.user import User
from app.models.enums import (
    UserRole, AccountStatus, ApprovalStatus, PreacherType, 
    PreacherStatus, GenderType, RequestType, RequestStatus, AdminLevel,
    CommunicationChannel
)
from app.models.organization import Organization
from app.models.preacher import Preacher, PreacherLanguage, PreacherStatistics
from app.models.muslim_caller import MuslimCaller
from app.models.interested_person import InterestedPerson
from app.models.admin import Admin
from app.models.dawah_request import DawahRequest
from app.models.reference import Country, Language
from app.models.religion import Religion
from app.auth import get_password_hash

session = SessionLocal()

def get_or_create_lang(code, name):
    lang = session.execute(select(Language).where(Language.language_code == code)).scalar_one_or_none()
    if not lang:
        lang = Language(language_code=code, language_name=name)
        session.add(lang)
        session.commit()
        session.refresh(lang)
    return lang

# Setup required references
kuwait = session.execute(select(Country).where(Country.country_code == 'KW')).scalar_one_or_none()
india = session.execute(select(Country).where(Country.country_code == 'IN')).scalar_one_or_none()
phil = session.execute(select(Country).where(Country.country_code == 'PH')).scalar_one_or_none()
usa = session.execute(select(Country).where(Country.country_code == 'US')).scalar_one_or_none()
if not usa:
    usa = Country(country_code='US', country_name='United States')
    session.add(usa)
    session.commit()

lang_ar = get_or_create_lang('ar', 'Arabic')
lang_en = get_or_create_lang('en', 'English')
lang_tl = get_or_create_lang('tl', 'Tagalog')
lang_hi = get_or_create_lang('hi', 'Hindi')
lang_ur = get_or_create_lang('ur', 'Urdu')

rel_christian = session.execute(select(Religion).where(Religion.religion_name.ilike('%Christian%'))).scalars().first()
if not rel_christian:
    rel_christian = Religion(religion_name='Christianity')
    session.add(rel_christian)
    session.commit()

rel_hindu = session.execute(select(Religion).where(Religion.religion_name.ilike('%Hindu%'))).scalars().first()
if not rel_hindu:
    rel_hindu = Religion(religion_name='Hinduism')
    session.add(rel_hindu)
    session.commit()

# --- 1. Organizations (10 in Kuwait) ---
govs = ['العاصمة', 'حولي', 'الفروانية', 'الأحمدي', 'الجهراء', 'مبارك الكبير']
orgs = []
print("Creating 10 Organizations...")
for i in range(1, 11):
    email = f"org{i}@example.com"
    existing = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing: continue
    
    user = User(
        email=email,
        password_hash=get_password_hash("password123"),
        role=UserRole.organization,
        status=AccountStatus.active
    )
    session.add(user)
    session.flush()
    
    org = Organization(
        user_id=user.user_id,
        organization_name=f"جمعية {random.choice(['الهداية', 'الرحمة', 'الإصلاح', 'النجاة'])} {i}",
        license_number=f"LIC-{1000+i}",
        license_file="/uploads/licenses/dummy.pdf",
        establishment_date=date(2010, 1, 1),
        country_id=kuwait.country_id,
        governorate=random.choice(govs),
        manager_name=f"مدير {i}",
        phone=f"+9651234567{i}",
        email=email,
        approval_status=ApprovalStatus.approved
    )
    session.add(org)
    orgs.append(org)

session.commit()

# --- 2. Preachers (Indian, Filipino, 2 English) ---
print("Creating Preachers...")
# Preacher 1: Indian
p_data = [
    {"name": "Rajesh Kumar", "email": "rajesh@example.com", "country": india, "langs": [lang_hi, lang_en]},
    {"name": "Juan Dela Cruz", "email": "juan@example.com", "country": phil, "langs": [lang_tl, lang_en]},
    {"name": "John Smith", "email": "john@example.com", "country": usa, "langs": [lang_en]},
    {"name": "David Wilson", "email": "david@example.com", "country": usa, "langs": [lang_en]},
]

preachers_objs = []
for p in p_data:
    existing = session.execute(select(User).where(User.email == p['email'])).scalar_one_or_none()
    if existing: continue
    
    user = User(
        email=p['email'],
        password_hash=get_password_hash("password123"),
        role=UserRole.preacher,
        status=AccountStatus.active
    )
    session.add(user)
    session.flush()
    
    preacher = Preacher(
        user_id=user.user_id,
        org_id=random.choice(orgs).org_id if orgs else None,
        type=PreacherType.official,
        full_name=p['name'],
        phone=f"+91{random.randint(1000000000, 9999999999)}",
        email=p['email'],
        gender=GenderType.male,
        nationality_country_id=p['country'].country_id,
        scientific_qualification="Bachelor of Islamic Studies",
        status=PreacherStatus.active,
        approval_status=ApprovalStatus.approved
    )
    session.add(preacher)
    session.flush()
    
    for l in p['langs']:
        session.add(PreacherLanguage(preacher_id=preacher.preacher_id, language_id=l.language_id, proficiency='fluent'))
    
    session.add(PreacherStatistics(preacher_id=preacher.preacher_id))
    preachers_objs.append(preacher)

session.commit()

# --- 3. Interested Persons (Non-Muslims) ---
print("Creating Non-Muslims...")
nm_data = [
    {"first": "Amit", "last": "Sharma", "email": "amit@example.com", "country": india, "lang": lang_hi, "rel": rel_hindu},
    {"first": "Maria", "last": "Santos", "email": "maria@example.com", "country": phil, "lang": lang_tl, "rel": rel_christian},
    {"first": "Ali", "last": "Hassan", "email": "ali_urdu@example.com", "country": india, "lang": lang_ur, "rel": rel_christian}, # Urdu speaker in India
    {"first": "Robert", "last": "Brown", "email": "robert@example.com", "country": usa, "lang": lang_en, "rel": None},
]

for nm in nm_data:
    existing = session.execute(select(User).where(User.email == nm['email'])).scalar_one_or_none()
    if existing: continue
    
    user = User(
        email=nm['email'],
        password_hash=get_password_hash("password123"),
        role=UserRole.interested,
        status=AccountStatus.active
    )
    session.add(user)
    session.flush()
    
    person = InterestedPerson(
        user_id=user.user_id,
        first_name=nm['first'],
        last_name=nm['last'],
        gender=GenderType.male if nm['first'] != "Maria" else GenderType.female,
        nationality_country_id=nm['country'].country_id,
        current_country_id=nm['country'].country_id,
        communication_lang_id=nm['lang'].language_id,
        email=nm['email'],
        religion_id=nm['rel'].religion_id if nm['rel'] else None
    )
    session.add(person)

session.commit()

# --- 4. Muslim Callers (5 total) ---
print("Creating Muslim Callers...")
callers = []
for i in range(1, 6):
    email = f"caller{i}@example.com"
    existing_user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing_user: 
        caller = session.execute(select(MuslimCaller).where(MuslimCaller.user_id == existing_user.user_id)).scalar_one_or_none()
        if caller:
            callers.append(caller)
        continue
    
    user = User(
        email=email,
        password_hash=get_password_hash("password123"),
        role=UserRole.muslim_caller,
        status=AccountStatus.active
    )
    session.add(user)
    session.flush()
    
    caller = MuslimCaller(
        user_id=user.user_id,
        full_name=f"داعي مسلم {i}",
        phone=f"+9655555555{i}",
        nationality_country_id=kuwait.country_id
    )
    session.add(caller)
    callers.append(caller)

session.commit()

# One or two have invited 3 people (Filipino, Urdu, Indian, English)
print("Creating invitations...")
if len(callers) >= 1:
    inviter = callers[0]
    inv_data = [
        {"f": "Peter", "l": "P", "c": phil, "l_id": lang_tl},
        {"f": "Zahid", "l": "K", "c": india, "l_id": lang_ur},
        {"f": "Vikram", "l": "S", "c": india, "l_id": lang_hi},
        {"f": "Kevin", "l": "M", "c": usa, "l_id": lang_en},
    ]
    for inv in inv_data:
        req = DawahRequest(
            request_type=RequestType.invited,
            invited_first_name=inv['f'],
            invited_last_name=inv['l'],
            invited_gender=GenderType.male,
            invited_nationality_id=inv['c'].country_id,
            invited_language_id=inv['l_id'].language_id,
            submitted_by_caller_id=inviter.caller_id,
            status=RequestStatus.pending,
            communication_channel=CommunicationChannel.whatsapp
        )
        session.add(req)

session.commit()

# --- 5. Admins (3) ---
print("Creating 3 Admins...")
for i in range(1, 4):
    email = f"admin{i}@example.com"
    existing = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing: continue
    
    user = User(
        email=email,
        password_hash=get_password_hash("password123"),
        role=UserRole.admin,
        status=AccountStatus.active
    )
    session.add(user)
    session.flush()
    
    admin = Admin(
        user_id=user.user_id,
        full_name=f"أدمن {i}",
        level=AdminLevel.admin
    )
    session.add(admin)

session.commit()

# --- 6. Accept 2 requests for 2 preachers ---
print("Accepting 2 requests...")
pending_reqs = session.execute(select(DawahRequest).where(DawahRequest.status == RequestStatus.pending)).scalars().all()
if len(pending_reqs) >= 2 and len(preachers_objs) >= 2:
    for i in range(2):
        req = pending_reqs[i]
        preacher = preachers_objs[i]
        req.status = RequestStatus.in_progress
        req.assigned_preacher_id = preacher.preacher_id
        req.accepted_at = datetime.now()

session.commit()
session.close()

print("Seeding completed successfully!")
