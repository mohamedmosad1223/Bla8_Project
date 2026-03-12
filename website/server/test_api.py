
import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000/api"

def create_dummy_pdf(filename):
    with open(filename, 'wb') as f:
        f.write(b'%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
    return filename

def login(email, password):
    print(f"\n--- Logging stays as {email} ---")
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": email,
        "password": password
    }
    # OAuth2PasswordRequestForm uses form-data
    response = requests.post(url, data=data)
    if response.status_code == 200:
        token = response.json().get("access_token")
        print("Login successful.")
        return token
    else:
        print(f"Login failed: {response.text}")
        return None

def test_admin_registration(token):
    print("\n--- Testing Admin Registration ---")
    url = f"{BASE_URL}/admins/register"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "email": "another_admin@balagh.com",
        "password": "Password123",
        "password_confirm": "Password123",
        "full_name": "Another Admin",
        "phone": "+966500000001",
        "level": "admin"
    }
    response = requests.post(url, json=data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_organization_registration():
    print("\n--- Testing Organization Registration ---")
    url = f"{BASE_URL}/organizations/register"
    
    dummy_pdf = create_dummy_pdf("test_license.pdf")
    
    with open(dummy_pdf, 'rb') as f:
        files = {'license_file': ('test_license.pdf', f, 'application/pdf')}
        data = {
            "email": "org_test_v5@test.com",
            "password": "Password123",
            "password_confirm": "Password123",
            "organization_name": "جمعية الهدى الدعوية",
            "license_number": "123456/ORG",
            "establishment_date": "2020-01-01",
            "country_id": 2, # Egypt
            "governorate": "القاهرة",
            "manager_name": "أحمد محمد",
            "phone": "+20123456789",
            "org_email": "manager_new@org1.com"
        }
        response = requests.post(url, data=data, files=files)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    os.remove(dummy_pdf)
    return response.json().get('data', {}).get('org_id')

def test_preacher_volunteer_registration():
    print("\n--- Testing Volunteer Preacher Registration ---")
    url = f"{BASE_URL}/preachers/register"
    
    dummy_pdf = create_dummy_pdf("test_qual.pdf")
    
    with open(dummy_pdf, 'rb') as f:
        files = {'qualification_file': ('test_qual.pdf', f, 'application/pdf')}
        data = {
            "email": "preacher_v5@test.com",
            "password": "Password123",
            "password_confirm": "Password123",
            "type": "volunteer",
            "full_name": "داعية متطوع",
            "phone": "+966501111111",
            "preacher_email": "preacher_v5@test.com",
            "nationality_country_id": 1, # Saudi
            "org_id": "", # None for volunteer
            "scientific_qualification": "بكالوريوس أصول دين",
            "gender": "male"
        }
        response = requests.post(url, data=data, files=files)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    os.remove(dummy_pdf)

def test_preacher_official_registration(org_id, token):
    print("\n--- Testing Official Preacher Registration ---")
    url = f"{BASE_URL}/preachers/register"
    headers = {"Authorization": f"Bearer {token}"}
    
    dummy_pdf = create_dummy_pdf("test_qual_official.pdf")
    
    with open(dummy_pdf, 'rb') as f:
        files = {'qualification_file': ('test_qual_official.pdf', f, 'application/pdf')}
        data = [
            ("email", "preacher_o5@test.com"),
            ("password", "Password123"),
            ("password_confirm", "Password123"),
            ("type", "official"),
            ("full_name", "داعية رسمي"),
            ("phone", "+20155555555"),
            ("preacher_email", "preacher_o5@test.com"),
            ("nationality_country_id", 2),
            ("org_id", org_id),
            ("scientific_qualification", "ماجستير فقه"),
            ("languages", 1),
            ("languages", 2),
            ("gender", "male")
        ]
        response = requests.post(url, data=data, files=files, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    os.remove(dummy_pdf)

if __name__ == "__main__":
    try:
        # 1. Login
        token = login("superadmin@balagh.com", "Password123")
        
        # 2. Test Admin (requires token)
        if token:
            test_admin_registration(token)
            
        # 3. Test Organization (Public)
        org_id = test_organization_registration()
        
        # 4. Test Preacher (Public)
        test_preacher_volunteer_registration()
        if org_id and token:
            test_preacher_official_registration(org_id, token)
            
    except Exception as e:
        print(f"An error occurred during testing: {e}")
