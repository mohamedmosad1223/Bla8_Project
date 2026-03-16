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

## 3.1 Muslim Caller Dashboard (Track My Requests)
- **Endpoint**: `GET /api/dawah-requests/my-submissions`
- **Method**: `GET`
- **Goal**: Allow the caller to view all their submitted cases along with their current statuses, preacher name, and submission/update dates.
- **Expected Data**:
  ```json
  {
    "message": "تم جلب طلباتك التي سجلتها",
    "data": [
      {
        "request_id": 1,
        "status": "pending",
        "request_type": "invited",
        "invited_name": "John Doe",
        "preacher_name": "قيد الانتظار",
        "submission_date": "2023-01-22T07:00:00Z",
        "updated_at": "2023-01-22T08:00:00Z",
        "accepted_at": null,
        "submitter_feedback": null
      }
    ]
  }
  ```

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
- **Wait/Simulate 42h** or try to send a message without a report.
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

---

---

## 9. Help Center & FAQs
- **Endpoint**: `GET /api/help/`
- **Method**: `GET`
- **Goal**: Fetch the official FAQs (Who are we, Goals, etc.) seeded in the database.
- **Expected Response**:
  ```json
  [
    {
      "faq_id": 1,
      "question": "من نحن؟",
      "answer": "منصة بلاغ هي منصة دعوية..."
    }
  ]
  ```

---

## 10. Authentication (Password Reset & Change)
- **Forgot Password**: `POST /api/auth/forgot-password`
  - **Body**: `{"email": "caller1@example.com"}` (Generates 6-digit OTP).
- **Verify OTP**: `POST /api/auth/verify-otp`
- **Reset Password**: `POST /api/auth/reset-password`

---

## 11. Admin Dashboard (Platform Overview)
- **Endpoint**: `GET /api/dashboard/admin`
- **Goal**: Fetch real-time aggregated metrics and recent activity.

---

## 12. Admin Extended Profile & Security
### 12.1 Profile Management
- **Get My Profile**: `GET /api/admins/me`
- **Update Profile**: `PATCH /api/admins/me` (Body: `form-data`)
  - Fields: `full_name`, `email`, `phone`, `profile_picture` (file).
- **Sync Languages**: `PATCH /api/admins/me/languages`
  - Payload: `{"language_ids": [1, 2, 3]}`

### 12.2 Security Extensions
- **Change Password (Old Pass)**: `POST /api/admins/me/change-password`
  - Body: `{"old_password": "Password123", "new_password": "New!Password"}`
- **Change Password (OTP Fallback)**: `POST /api/admins/me/change-password`
  - Body: `{"otp": "123456", "new_password": "New!Password"}`
- **Delete Account**: `POST /api/admins/me/delete-account`
  - Body: `{"password": "Password123"}` (Soft-delete/Suspension).

---

## 13. Advanced Platform Management (Admins Only)
- **Filtered Organizations**: `GET /api/admins/management/organizations`
  - **Query Params**: `search=اسم`, `approval_status=approved`, `order_by=latest`
- **Direct Org Registration**: `POST /api/admins/management/organizations`
  - **Body**: Same as regular register but bypasses approval.
- **Filtered Preachers**: `GET /api/admins/management/preachers`
  - **Query Params**: `search=ID`, `type=official`, `languages=1,2`, `order_by=oldest`

---

## 14. Universal Profile & Settings (All Roles)
- **Base Endpoint**: `/api/profile`
- **Goal**: Unified management for Admin, Preacher, Org, Muslim Caller, and Interested Persons.

### 14.1 Profile Management
- **Get My Profile**: `GET /api/profile/me`
- **Update Profile**: `PATCH /api/profile/me` (Body: `form-data`)
  - Fields: `full_name`, `email`, `phone`, `profile_picture` (file).

### 14.2 Account Security
- **Change Password**: `POST /api/profile/change-password`
  - Body: `{"old_password": "...", "new_password": "...", "password_confirm": "..."}`
- **Delete My Account**: `POST /api/profile/delete-account`
  - Body: `{"password": "..."}` (Soft-delete/Suspension).

### 14.3 Reference & Support
- **List App Languages**: `GET /api/profile/languages` (Available UI languages).
- **Update App Language**: `PATCH /api/profile/app-language`
  - Body: `{"language_code": "ar"}` (Sets application UI language).
- **Update Spoken Languages**: `PATCH /api/profile/spoken-languages`
  - Body: `{"language_ids": [1, 2]}` (For Preachers/Admins).
- **FAQs**: `GET /api/profile/faqs`
- **Contact Info**: `GET /api/profile/contact` (Call us, Working hours).
- **Platform Policies**: `GET /api/profile/policies` (Privacy, Terms).

---

### 14.4 Logout
- **Endpoint**: `POST /api/profile/logout`
- **Method**: `POST`
- **Goal**: Clears the session cookie for any logged-in user.

---

## 15. Chat & AI Features
### 15.1 AI Support (Non-Muslims/Interested Persons)
- **Get AI Memory/History**: `GET /api/chat/ai/history`
  - Returns `welcome_message` and full message `history`.
- **Send Message to AI**: `POST /api/chat/ai/send`
  - Body: `{"content": "I want to know more about Islam"}`
  - Returns user message and a placeholder AI response.

### 15.2 Preacher Conversations
- **List Preacher Chats**: `GET /api/chat/preachers`
  - Returns all active chats (from requests or DMs) with preachers.
- **Open Specific Chat**:
  - For Request chats: Use `GET /api/messages/chat-history/{request_id}`
  - For Direct chats: Use `GET /api/messages/chat-history?other_user_id={preacher_user_id}`

---
   #########################################################################################################################################

## 16. Minister of Endowments Dashboard
- **Login as Minister**: `POST /api/auth/login`
  - **username**: `minister@awqaf.gov.eg`
  - **password**: `minister123`

### 16.0 Global Platform Dashboard (Advanced)
- **Endpoint**: `GET /api/minister/global-dashboard`
- **Method**: `GET`
- **Query Params**: 
  - `org_id`: (optional) filter by specific organization ID. Use `0` for volunteers.
  - `period`: (optional) `this_month`, `last_month`, `all_time`.
- **Goal**: Performance overview for all preachers.
  - **Top Cards**: Total Preachers, Activities (Assigned Requests), New Interested (Pending Requests), Overall Performance %.
  - **Top 6 Preachers**: Ranked by converts. Status label is "نشط" (>85%), "متوسط" (>70%), or "غير نشط".
- **Expected Output**:
  ```json
  {
    "top_cards": [
      { "title": "عدد الدعاة", "value": 142, "icon": "preachers" },
      { "title": "عدد الأنشطة المنفذة", "value": 856, "icon": "activities" },
      { "title": "عدد المهتدين الجدد", "value": 324, "icon": "converts" },
      { "title": "نسبة الأداء العام", "value": "87%", "icon": "performance" }
    ],
    "charts": { ... },
    "top_preachers": [
      {
        "rank": 1,
        "name": "أحمد محمد السالم",
        "organization": "جمعية البر والتقوى",
        "activities_count": 45,
        "converts_count": 12,
        "performance_pct": "92%",
        "status_label": "نشط"
      }
    ]
  }
  ```

- **Endpoint**: `GET /api/minister/dashboard`
- **Goal**: Allow the Minister to view high-level platform statistics and governorate distribution.
- **Expected Output**:
  ```json
  {
    "top_cards": [
      { "title": "إجمالي عدد الدعاة", "value": 133, "icon": "preachers" },
      { "title": "إجمالي عدد طلبات الجمعية", "value": 10, "icon": "requests" },
      { "title": "إجمالي عدد المحادثات", "value": 2350, "icon": "messages" },
      { "title": "المحالون للتعليم والمتابعة", "value": 89, "icon": "referrals" },
      { "title": "من أسلموا", "value": 100, "icon": "converted" },
      { "title": "من رفضوا", "value": 100, "icon": "rejected" },
      { "title": "إجمالي الحالات المسجلة", "value": 4000, "icon": "cases" },
      { "title": "إجمالي الأفراد المسجلين", "value": 5000, "icon": "individuals" }
    ],
    "governorates": [
        { "name": "القاهرة", "value": 45 },
        { "name": "الإسكندرية", "value": 22 }
    ],
    "requests_summary": {
        "total": 10,
        "converted": 100,
        "in_progress": 89,
        "rejected": 100
    }
  }
  ```

### 16.1 Minister Organizations List
- **Endpoint**: `GET /api/minister/organizations`
- **Goal**: Allow the Minister to view stats for all organizations.
- **Expected Output**:
  ```json
  [
    {
      "org_id": 1,
      "organization_name": "جمعية الهداية الخيرية",
      "governorate": "المنطقة العامة",
      "phone": "34567890",
      "stats": {
        "new_muslims": 32,
        "interested_count": 324,
        "preachers_count": 15,
        "conversion_rate": 8.3
      }
    }
  ]
  ```

### 16.2 Minister Organization Details
- **Endpoint**: `GET /api/minister/organizations/{org_id}`
- **Goal**: Allow the Minister to view detailed stats and info for one organization.
- **Expected Output**:
  ```json
  {
    "organization_info": {
      "name": "جمعية رسالة الإسلام",
      "license_number": "12345678",
      "email": "John2025@gmail.com",
      "phone": "+2001155591759",
      "governorate": "المحافظة",
      "manager_name": "أحمد عاطف",
      "status": "مفعل"
    },
    "performance_stats": [
      { "title": "إجمالي عدد الدعاة", "value": 100, "icon": "preachers" },
      { "title": "إجمالي عدد طلبات الجمعية", "value": 100, "icon": "requests" },
      { "title": "من أسلموا", "value": 100, "icon": "converted" },
      { "title": "من رفضوا", "value": 100, "icon": "rejected" }
    ],
    "charts": {
      "requests_distribution": [],
      "conversion_trends": [
        { "month": "Jan 2026", "converts": 10, "rejects": 2 }
      ],
      "nationalities": [
        { "label": "الهند", "value": 45 },
        { "label": "باكستان", "value": 22 }
      ]
    },
    "requests_summary": {
        "total": 100,
        "converted": 80,
        "in_progress": 15,
        "rejected": 5
    }
  }
  ```

### 16.3 Minister Preachers List (Filtered)
- **Endpoint**: `GET /api/minister/organizations/{org_id}/preachers`
- **Query Params**: `search=جون`, `nationality_id=5`, `language_id=1`, `status=active`, `joining_date=2023-02-22`
- **Goal**: List all preachers in an organization with advanced filtering.
- **Expected Output**:
  ```json
  [
    {
      "preacher_id": 123456,
      "full_name": "جون سميث",
      "nationality": "فرنسا",
      "languages": ["الانجليزية", "الفرنسية"],
      "joining_date": "22/02/2023 07:00 AM",
      "status": "active",
      "phone": "+201111111111"
    }
  ]
  ```

### 16.4 Minister Preacher Details
- **Endpoint**: `GET /api/minister/preachers/{preacher_id}`
- **Goal**: Fetch complete preacher profile, performance statistics (Converted, In-progress, Rejected), and response time trends.
- **Expected Output**:
  ```json
  {
    "preacher_info": {
      "preacher_id": 123456,
      "full_name": "أحمد عاطف",
      "email": "John2025@gmail.com",
      "phone": "+2001155591759",
      "languages": ["الإسكندرية", "الإنجليزية"],
      "religion": "مسلم",
      "organization_name": "جمعية رسالة الإسلام",
      "status": "active",
      "joining_date": "16/03/2026"
    },
    "performance_stats": [
      { "title": "إجمالي عدد الطلبات", "value": 100, "icon": "requests", "change": "+10.5%" },
      { "title": "عدد من أسلموا", "value": 100, "icon": "converted", "change": "-10.5%" },
      { "title": "إجمالي قيد الإقناع", "value": 100, "icon": "in_progress", "change": "+10.5%" },
      { "title": "عدد من رفضوا", "value": 100, "icon": "rejected", "change": "+10.5%" }
    ],
    "charts": {
      "nationalities": [
        { "label": "الهند", "value": 45 },
        { "label": "باكستان", "value": 22 }
      ],
      "response_time_trend": [
        { "month": "يناير", "value": 10 }
      ]
    }
  }
  ```

### 16.5 Toggle Preacher Status (Activate/Suspend)
- **Endpoint**: `PATCH /api/minister/preachers/{preacher_id}/toggle-status`
- **Method**: `PATCH`
- **Goal**: Enable or disable a preacher's account. Suspending a preacher will automatically re-assign their "In-Progress" requests back to "Pending".
- **Expected Output**:
  ```json
  {
    "preacher_id": 123456,
    "new_status": "suspended"
  }
  ```

### 16.6 Delete Preacher Account
- **Endpoint**: `DELETE /api/minister/preachers/{preacher_id}`
- **Method**: `DELETE`
- **Goal**: Permanently or soft-delete a preacher account from the platform.
- **Expected Output**:
  ```json
  {
    "message": "تم حذف حساب الداعية بنجاح"
  }
  ```
### 16.7 Minister Profile & Security
- **Get Profile**: `GET /api/minister/profile`
- **Update Profile**: `PATCH /api/minister/profile` (Body: `form-data`)
  - Fields: `full_name`, `email`, `phone`, `profile_picture` (file).
- **Change Password**: `POST /api/minister/change-password`
  - Body: `{"old_password": "minister123", "new_password": "NewMinisterPass!1", "password_confirm": "NewMinisterPass!1"}`
- **Help Center**: `GET /api/minister/help-center`
  - Returns contact info and working hours.
- **Policies**: `GET /api/minister/policies`
  - Returns Privacy Policy and Terms of Service.
- **Delete/Suspend Account**: `POST /api/minister/delete-account`
  - Body: `{"password": "NewMinisterPass!1"}` (Soft-delete/Suspension).
