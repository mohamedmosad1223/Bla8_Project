# Postman E2E Test Guide — Balagh Platform

This guide walks you through the complete lifecycle of a Dawah request, testing Muslims Callers, Organizations, Preachers, and Admins.

## 0. Preparation
1. **Start the Server**: Run this in your terminal from the `server` folder:
   ```cmd
   C:/Python313/python.exe -m uvicorn app.main:app --reload
   ```
2. **Access Docs**: [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
3. **Postman Base URL**: `http://127.0.0.1:8000`

---

## 1. Login as Super Admin
- **Endpoint**: `POST /api/auth/login`
- **Method**: `POST` (Body: `form-data`)
- **Fields**:
  - `username`: `superadmin@balagh.com`
  - `password`: `Password123`
- **Goal**: Get the session cookie (Postman handles this automatically if cookies are enabled).

---

## 2. Register a Muslim Caller
- **Endpoint**: `POST /api/muslim-callers/register`
- **Method**: `POST` (Body: `JSON`)
- **Payload**:
  ```json
  {
    "email": "caller1@example.com",
    "password": "Password123",
    "password_confirm": "Password123",
    "full_name": "محمد الداعي",
    "phone": "+20123456789",
    "country_id": 2,
    "governorate": "القاهرة"
  }
  ```

---

## 3. Submit a Dawah Request (Lead Tracking)
- **Login as Caller** (Same as step 1 but with `caller1@example.com`).
- **Endpoint**: `POST /api/dawah-requests/`
- **Payload**:
  ```json
  {
    "request_type": "invited",
    "invited_first_name": "John",
    "invited_last_name": "Doe",
    "invited_gender": "male",
    "invited_language_id": 2,
    "communication_channel": "messenger",
    "deep_link": "https://m.me/johndoe_profile",
    "invited_nationality_id": 2,
    "invited_current_country_id": 2,
    "notes": "يرغب في معرفة المزيد عن الإسلام"
  }
  ```
- **Note**: `deep_link` is mandatory for `messenger`, `telegram`, or `other`.

---

## 4. Register & Approve an Organization
- **Endpoint**: `POST /api/organizations/register`
- **Method**: `POST` (Body: `form-data`)
- **Fields**: email, password, organization_name, etc.
- **Admin Approval**: Login as Admin, then:
  - `PATCH /api/organizations/{org_id}` with `{"approval_status": "approved"}`.

---

## 4.1 Check Registration Status
- **Endpoint**: `GET /api/auth/me`
- **Goal**: Organizations can see their `approval_status` (pending, approved, rejected) and any `rejection_reason`.
- **Notifications**: `GET /api/notifications/` to see the "Under Review" or "Approved" messages.

---

## 5. Organization Registers a Preacher
- **Login as Organization**.
- **Endpoint**: `POST /api/preachers/`
- **Payload**:
  ```json
  {
    "email": "preacher1@example.com",
    "password": "Password123",
    "password_confirm": "Password123",
    "full_name": "الشيخ عبد الله",
    "phone": "+201111111111",
    "gender": "male",
    "preacher_type": "volunteer",
    "nationality_country_id": 2,
    "languages": [{"language_id": 1}, {"language_id": 2}]
  }
  ```

---

## 6. Preacher Flow (Accept, Track, Chat)
- **Login as Preacher1**.
- **Accept Request**: `POST /api/dawah-requests/{request_id}/accept`.
- **Track Link Click**: Open in browser or Postman GET:
  - `GET /api/track/{request_id}`
  - **Result**: Redirects to the deep link and changes status to `under_persuasion`.
- **Chat with Org (Unified Inbox)**:
  - Send DM to Org: `POST /api/messages/` with `{"receiver_id": [ORG_USER_ID], "message_text": "السلام عليكم، لقد بدأت التواصل مع الحالة"}`.
  - Preview Chats: `GET /api/messages/preview`.

---

## 7. Mandatory Daily Report (Constraint)
- **Wait/Simulate 24h** or try to send a message without a report.
- **Submit Report**: `POST /api/dawah-reports/`
  ```json
  {
    "request_id": 1,
    "communication_type": "Social Media",
    "communication_details": "Facebook Messenger",
    "content": "تم التواصل بنجاح وتم شرح أساسيات التوحيد."
  }
  ```

---

## 8. Finalize Request
- **Preacher Update**: `PATCH /api/dawah-requests/{id}/status`
  ```json
  {
    "status": "converted",
    "preacher_feedback": "نطق الشهادة اليوم بفضل الله"
  }
  ```
- **Note**: You CANNOT close the request without `preacher_feedback`.
