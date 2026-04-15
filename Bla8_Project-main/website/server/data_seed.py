
import sys
import os
import random
from datetime import datetime, date, timedelta
from sqlalchemy import select

# Ensure we can import app
sys.path.append(os.getcwd())

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

def get_lang(code):
    return session.execute(select(Language).where(Language.language_code == code)).scalar_one_or_none()

def get_country(code):
    return session.execute(select(Country).where(Country.country_code == code)).scalar_one_or_none()

# --- Phase 0: Get References ---
print("Fetching references (Countries, Languages, Religions)...")
kuwait = get_country('KW')
india = get_country('IN')
phil = get_country('PH')
pakistan = get_country('PK')
usa = get_country('US')
gb = get_country('GB')

lang_ar = get_lang('ar')
lang_en = get_lang('en')
lang_tl = get_lang('tl')
lang_hi = get_lang('hi')
lang_ur = get_lang('ur')

rel_christian = session.execute(select(Religion).where(Religion.religion_name.ilike('%Christian%'))).scalars().first()
rel_hindu = session.execute(select(Religion).where(Religion.religion_name.ilike('%Hindu%'))).scalars().first()

# --- Phase 1: Organizations (10 in Kuwait) ---
govs = ['العاصمة', 'حولي', 'الفروانية', 'الأحمدي', 'الجهراء', 'مبارك الكبير']
orgs_objs = []
print("Creating 10 Organizations...")
for i in range(1, 11):
    if not kuwait:
        print("Skipping organizations: Kuwait not found in DB.")
        break
    email = f"org{i}@example.com"
    user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            password_hash=get_password_hash("password123"),
            role=UserRole.organization,
            status=AccountStatus.active,
            app_language="ar"
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
        orgs_objs.append(org)
    else:
        org = session.execute(select(Organization).where(Organization.user_id == user.user_id)).scalar_one_or_none()
        if org: orgs_objs.append(org)

session.commit()

# --- Phase 2: Base Preachers ---
print("Creating Base Preachers...")
p_data = [
    {"name": "Rajesh Kumar", "email": "rajesh@example.com", "country": india, "langs": [(lang_hi, 'native'), (lang_en, 'fluent')]},
    {"name": "Juan Dela Cruz", "email": "juan@example.com", "country": phil, "langs": [(lang_tl, 'native'), (lang_en, 'fluent')]},
    {"name": "John Smith", "email": "john@example.com", "country": gb, "langs": [(lang_en, 'native')]},
    {"name": "David Wilson", "email": "david@example.com", "country": india, "langs": [(lang_ur, 'native'), (lang_en, 'fluent')]},
]

preachers_objs = []
for p in p_data:
    if not p['country']:
        print(f"Skipping preacher {p['name']}: Country not found.")
        continue
    user = session.execute(select(User).where(User.email == p['email'])).scalar_one_or_none()
    if not user:
        user = User(
            email=p['email'],
            password_hash=get_password_hash("password123"),
            role=UserRole.preacher,
            status=AccountStatus.active,
            app_language="en"
        )
        session.add(user)
        session.flush()
        
        preacher = Preacher(
            user_id=user.user_id,
            org_id=random.choice(orgs_objs).org_id if orgs_objs else None,
            type=PreacherType.official,
            full_name=p['name'],
            phone=f"+{random.randint(10,99)}{random.randint(100000000, 999999999)}",
            email=p['email'],
            gender=GenderType.male,
            nationality_country_id=p['country'].country_id,
            scientific_qualification="Bachelor of Islamic Studies",
            status=PreacherStatus.active,
            approval_status=ApprovalStatus.approved
        )
        session.add(preacher)
        session.flush()
        
        for l, prof in p['langs']:
            if l:
                session.add(PreacherLanguage(preacher_id=preacher.preacher_id, language_id=l.language_id, proficiency=prof))
        
        session.add(PreacherStatistics(preacher_id=preacher.preacher_id))
        preachers_objs.append(preacher)
    else:
        preacher = session.execute(select(Preacher).where(Preacher.user_id == user.user_id)).scalar_one_or_none()
        if preacher: preachers_objs.append(preacher)

session.commit()

# --- Phase 3: Special Hidaya Preachers ---
hidaya_org = session.execute(select(Organization).where(Organization.organization_name.ilike('%الهداية%'))).scalars().first()
if hidaya_org:
    print("Creating 5 Hidaya Preachers...")
    for i in range(1, 6):
        email = f"hidaya_preacher{i}@example.com"
        user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
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
                org_id=hidaya_org.org_id,
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
            
            session.add(PreacherLanguage(preacher_id=preacher.preacher_id, language_id=lang_en.language_id, proficiency='fluent'))
            if preacher.nationality_country_id == india.country_id:
                session.add(PreacherLanguage(preacher_id=preacher.preacher_id, language_id=lang_hi.language_id, proficiency='native'))
            else:
                session.add(PreacherLanguage(preacher_id=preacher.preacher_id, language_id=lang_tl.language_id, proficiency='native'))
            
            session.add(PreacherStatistics(preacher_id=preacher.preacher_id))

session.commit()

# --- Phase 4: Interested Persons (Non-Muslims) ---
print("Creating Interested Persons...")
nm_data = [
    {"first": "Amit", "last": "Sharma", "email": "amit@example.com", "country": india, "lang": lang_hi, "rel": rel_hindu},
    {"first": "Maria", "last": "Santos", "email": "maria@example.com", "country": phil, "lang": lang_tl, "rel": rel_christian},
    {"first": "Ali", "last": "Hassan", "email": "ali_urdu@example.com", "country": india, "lang": lang_ur, "rel": rel_christian},
    {"first": "Zubair", "last": "Khan", "email": "zubair@example.com", "country": pakistan, "lang": lang_ur, "rel": rel_christian},
    {"first": "Robert", "last": "Brown", "email": "robert@example.com", "country": india, "lang": lang_ur, "rel": None},
]

for nm in nm_data:
    if not nm['country'] or not nm['lang']:
        print(f"Skipping interested person {nm['first']}: Country or Language not found.")
        continue
    user = session.execute(select(User).where(User.email == nm['email'])).scalar_one_or_none()
    if not user:
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

# --- Phase 5: Muslim Callers (5) ---
print("Creating Muslim Callers...")
callers_objs = []
for i in range(1, 6):
    if not kuwait:
        print("Skipping Muslim Callers: Kuwait not found.")
        break
    email = f"caller{i}@example.com"
    user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            password_hash=get_password_hash("password123"),
            role=UserRole.muslim_caller,
            status=AccountStatus.active,
            app_language="ar"
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
        callers_objs.append(caller)
    else:
        caller = session.execute(select(MuslimCaller).where(MuslimCaller.user_id == user.user_id)).scalar_one_or_none()
        if caller: callers_objs.append(caller)

session.commit()

# --- Phase 6: Dawah Requests (Invitations) ---
print("Creating invitations...")
if callers_objs:
    inviter = callers_objs[0]
    inv_data = [
        {"f": "Peter", "l": "P", "c": phil, "l_id": lang_tl},
        {"f": "Zahid", "l": "K", "c": india, "l_id": lang_ur},
        {"f": "Vikram", "l": "S", "c": india, "l_id": lang_hi},
        {"f": "Kevin", "l": "M", "c": usa, "l_id": lang_en},
    ]
    for inv in inv_data:
        if not inv['c'] or not inv['l_id']:
            print(f"Skipping invitation {inv['f']}: Country or Language not found.")
            continue
        exists = session.execute(select(DawahRequest).where(
            DawahRequest.invited_first_name == inv['f'],
            DawahRequest.invited_last_name == inv['l']
        )).scalars().first()
        if not exists:
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

# --- Phase 7: Admins (3) ---
print("Creating Admins...")
for i in range(1, 4):
    email = f"admin{i}@example.com"
    user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            password_hash=get_password_hash("password123"),
            role=UserRole.admin,
            status=AccountStatus.active,
            app_language="ar"
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

# --- Phase 8: Assign some requests ---
print("Assigning some requests to preachers...")
pending_reqs = session.execute(select(DawahRequest).where(DawahRequest.status == RequestStatus.pending)).scalars().all()
if len(pending_reqs) >= 2 and len(preachers_objs) >= 2:
    for i in range(2):
        req = pending_reqs[i]
        if req.assigned_preacher_id is None:
            preacher = preachers_objs[i]
            req.status = RequestStatus.in_progress
            req.assigned_preacher_id = preacher.preacher_id
            req.accepted_at = datetime.now()

session.commit()
session.close()

print("\n" + "="*30)
print("POLLUTION COMPLETED SUCCESSFULLY!")
print("All users, organizations, and preachers are ready.")
print("="*30)