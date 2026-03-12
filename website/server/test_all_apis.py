import requests
import json
import os
import time

BASE_URL = "http://127.0.0.1:8000/api"

def create_dummy_pdf(filename):
    with open(filename, 'wb') as f:
        f.write(b'%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
    return filename

def login(email, password, role_name):
    print(f"\n--- Login as {role_name} ({email}) ---")
    url = f"{BASE_URL}/auth/login"
    data = {"username": email, "password": password}
    response = requests.post(url, data=data)
    if response.status_code == 200:
        token = response.json().get("access_token")
        print(f"Login successful. [{role_name}]")
        return token
    else:
        print(f"Login failed: {response.text}")
        return None

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}

def test_api_flow():
    # 1. Login as Super Admin
    admin_token = login("superadmin@balagh.com", "Password123", "Super Admin")
    if not admin_token: return

    # 2. Register Organization
    print("\n--- Registering Organization ---")
    dummy_pdf_org = create_dummy_pdf("test_org_license.pdf")
    with open(dummy_pdf_org, 'rb') as f:
        response = requests.post(f"{BASE_URL}/organizations/register", data={
            "email": "org1@test.com", "password": "Password123", "password_confirm": "Password123",
            "organization_name": "جمعية الهدى", "license_number": "ORG123", "establishment_date": "2020-01-01",
            "country_id": 2, "governorate": "القاهرة", "manager_name": "أحمد", "phone": "+20123456789", "org_email": "org1@test.com"
        }, files={'license_file': ('test_org_license.pdf', f, 'application/pdf')})
    print(response.status_code, response.json())
    os.remove(dummy_pdf_org)
    
    # 3. Admin approves Organization
    print("\n--- Admin: Approving Organization ---")
    res = requests.get(f"{BASE_URL}/organizations", headers=auth_header(admin_token), params={"approval_status": "pending"})
    orgs = res.json().get('data', [])
    org_id = next((o['org_id'] for o in orgs if o['email'] == 'org1@test.com'), None)
    if org_id:
        requests.put(f"{BASE_URL}/organizations/{org_id}", headers=auth_header(admin_token), json={"approval_status": "approved"})
        print(f"Organization {org_id} approved.")
    else:
        print("Organization not found in pending.")

    # Login as Org
    org_token = login("org1@test.com", "Password123", "Organization")
    
    # 4. Org Registers Preacher
    print("\n--- Organization: Registering Official Preacher ---")
    dummy_pdf_preacher = create_dummy_pdf("test_qual.pdf")
    with open(dummy_pdf_preacher, 'rb') as f:
        data = [
            ("email", "preacher1@test.com"), ("password", "Password123"), ("password_confirm", "Password123"),
            ("full_name", "داعية رسمي"), ("phone", "+20155555555"), ("preacher_email", "preacher1@test.com"),
            ("nationality_country_id", 2), ("scientific_qualification", "ماجستير"), ("gender", "male")
        ]
        requests.post(f"{BASE_URL}/preachers/register", headers=auth_header(org_token), data=data, files={'qualification_file': ('test_qual.pdf', f, 'application/pdf')})
    os.remove(dummy_pdf_preacher)

    # 5. Register Volunteer Preacher
    print("\n--- Registering Volunteer Preacher ---")
    dummy_pdf_vol = create_dummy_pdf("test_vol.pdf")
    with open(dummy_pdf_vol, 'rb') as f:
        requests.post(f"{BASE_URL}/preachers/register", data={
            "email": "preacher2@test.com", "password": "Password123", "password_confirm": "Password123",
            "full_name": "داعية متطوع", "phone": "+966501111111", "preacher_email": "preacher2@test.com",
            "nationality_country_id": 1, "scientific_qualification": "بكالوريوس", "gender": "male"
        }, files={'qualification_file': ('test_vol.pdf', f, 'application/pdf')})
    os.remove(dummy_pdf_vol)
    
    # 6. Admin approves Preachers
    print("\n--- Admin: Approving Preachers ---")
    res = requests.get(f"{BASE_URL}/preachers", headers=auth_header(admin_token), params={"approval_status": "pending"})
    preachers = res.json().get('data', [])
    for p in preachers:
        requests.put(f"{BASE_URL}/preachers/{p['preacher_id']}", headers=auth_header(admin_token), json={"approval_status": "approved", "status": "active"})
        print(f"Approved preacher: {p['full_name']}")

    # 7. Register Muslim Caller
    print("\n--- Registering Muslim Caller ---")
    res = requests.post(f"{BASE_URL}/muslim_callers/register", json={
        "email": "caller@test.com", "password": "Password123", "password_confirm": "Password123",
        "full_name": "مسلم مبشر", "phone": "+20100000000", "nationality_country_id": 2, "gender": "male"
    })
    print(res.status_code, res.json())
    
    # Login Caller
    caller_token = login("caller@test.com", "Password123", "Muslim Caller")
    
    # 8. Register Interested Person (Auth via caller - but actually interested person is public or via caller in Dawah request)
    print("\n--- Registering Interested Person (Stand-alone) ---")
    res = requests.post(f"{BASE_URL}/interested_persons/register", json={
        "email": "interested@test.com", "password": "Password123", "password_confirm": "Password123",
        "first_name": "John", "last_name": "Doe", "gender": "male", "nationality_country_id": 2,
        "current_country_id": 2, "communication_lang_id": 2, "person_email": "interested@test.com", "phone": "+123456789"
    })
    print(res.status_code, res.json())
    
    # Login Interested
    interested_token = login("interested@test.com", "Password123", "Interested Person")

    # 9. Caller Submits Dawah Request for someone
    print("\n--- Caller: Submitting Dawah Request ---")
    res = requests.post(f"{BASE_URL}/dawah_requests/invited", headers=auth_header(caller_token), json={
        "invited_first_name": "Alice", "invited_last_name": "Smith", "invited_gender": "female",
        "invited_nationality_id": 2, "invited_current_country_id": 2, "invited_language_id": 2,
        "invited_phone": "+1987654321", "invited_email": "alice@test.com", "communication_channel": "email",
        "notes": "Please contact her about Islam"
    })
    print(res.status_code, res.json())

    # 10. Preacher Views and Accepts Request
    print("\n--- Preacher: Viewing and Accepting Request ---")
    preacher_token = login("preacher1@test.com", "Password123", "Preacher")
    
    res = requests.get(f"{BASE_URL}/dawah_requests/pending", headers=auth_header(preacher_token))
    pending_reqs = res.json().get('data', [])
    if pending_reqs:
        req_id = pending_reqs[0]['request_id']
        requests.post(f"{BASE_URL}/dawah_requests/{req_id}/accept", headers=auth_header(preacher_token))
        print(f"Accepted request {req_id}")
        
        # 11. Messaging
        print("\n--- Messaging on Request ---")
        requests.post(f"{BASE_URL}/messages/{req_id}", headers=auth_header(preacher_token), data={"message_text": "Hello Alice. This is your preacher."})
        print("Preacher sent message.")
        
        # Org Views Dashboard and Messages
        print("\n--- Organization: Viewing Dashboard and Messages ---")
        res = requests.get(f"{BASE_URL}/dashboard/organization", headers=auth_header(org_token))
        print("Org Dashboard:", res.status_code, "OK")
        
        res = requests.get(f"{BASE_URL}/messages/{req_id}/history", headers=auth_header(org_token))
        print("Org Msg View:", res.status_code, "OK")

    else:
        print("No pending requests found.")

    # 12. Check Notifications
    print("\n--- Checking Notifications ---")
    res = requests.get(f"{BASE_URL}/notifications", headers=auth_header(preacher_token))
    print("Preacher notifications:", len(res.json().get("data", [])))

    print("\n--- End of API Flow Test ---")

if __name__ == "__main__":
    test_api_flow()
