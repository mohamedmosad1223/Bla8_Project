# 🚀 Balagh API — Quick Info for Frontend

> **Base URL:** `http://localhost:8000`
> **Total Endpoints:** 33

هذا الملف ملخص سريع لكل الـ APIs الجاهزة حالياً في السيستم وطريقة مناداتها.

---

## 🏥 Health & System
1. `GET /` — التأكد أن السيرفر يعمل.
2. `GET /health` — فحص حالة النظام.

---

## 👤 Users (إدارة المستخدمين عامة)
- `GET /api/users/` — قائمة كل المستخدمين (مع Pagination).
- `GET /api/users/{user_id}` — جلب بيانات مستخدم معين.
- `PATCH /api/users/{user_id}` — تحديث (Email / Status).
- `DELETE /api/users/{user_id}` — حذف (Soft Delete).

---

## 🛡️ Admins
- `POST /api/admins/register` — تسجيل أدمن جديد.
- `GET /api/admins/` — قائمة الأدمنز.
- `GET /api/admins/{admin_id}` — بيانات أدمن معين.
- `PATCH /api/admins/{admin_id}` — تحديث بيانات أدمن.
- `DELETE /api/admins/{admin_id}` — حذف أدمن.

---

## 🏢 Organizations (الجمعيات)
- `POST /api/organizations/register` — تسجيل جمعية جديدة (تبدأ بـ pending).
- `GET /api/organizations/` — قائمة الجمعيات.
- `GET /api/organizations/{org_id}` — بيانات جمعية معينة.
- `PATCH /api/organizations/{org_id}` — تحديث بيانات جمعية.
- `DELETE /api/organizations/{org_id}` — حذف جمعية.

---

## 🕌 Preachers (الدعاة)
- `POST /api/preachers/register` — تسجيل داعية (متطوع أو رسمي).
- `GET /api/preachers/` — قائمة الدعاة (مع فلترة متقدمة).
- `GET /api/preachers/{preacher_id}` — بيانات داعية معين.
- `PATCH /api/preachers/{preacher_id}` — تحديث بيانات داعية.
- `DELETE /api/preachers/{preacher_id}` — حذف داعية.

---

## 🤲 Muslim Callers (المسلمون الدعاة)
- `POST /api/muslim-callers/register` — تسجيل مسلم داعي جديد.
- `GET /api/muslim-callers/` — قائمة المسلمين الدعاة.
- `GET /api/muslim-callers/{caller_id}` — بيانات فردية.
- `PATCH /api/muslim-callers/{caller_id}` — تحديث بيانات.
- `DELETE /api/muslim-callers/{caller_id}` — حذف حقيقي للبروفايل.

---

## 🌟 Interested Persons (المهتمون بالإسلام)
- `POST /api/interested-persons/register` — تسجيل شخص مهتم جديد.
- `GET /api/interested-persons/` — قائمة الأشخاص المهتمين.
- `GET /api/interested-persons/{person_id}` — بيانات فردية.
- `PATCH /api/interested-persons/{person_id}` — تحديث بيانات.
- `DELETE /api/interested-persons/{person_id}` — حذف.

---

## 🤝 Dawah Requests (الطلبات الدعوية والتقييم)
- `POST /api/dawah-requests/` — رفع طلب دعوي جديد (للمسلم الداعي أو المهتم).
- `GET /api/dawah-requests/pool` — جلب الطلبات الجديدة (Pending) المتاحة للقبول (للدعاة والجمعيات).
- `GET /api/dawah-requests/my` — (للدعاة) جلب الطلبات التي قبلها الداعية ومسؤول عنها.
- `GET /api/dawah-requests/org-requests` — (للجمعيات) جلب طلبات كل الدعاة التابعين لها شاملة `preacher_feedback`.
- `GET /api/dawah-requests/my-submissions` — (لرافع الطلب) جلب الطلبات التي رفعها وأسماء الدعاة الذين استلموها.
- `GET /api/dawah-requests/{request_id}` — جلب تفاصيل الطلب (يطبق نظام حماية الخصوصية والـ Masking للملاحظات المتبادلة).
- `POST /api/dawah-requests/{request_id}/accept` — (للدعاة) قبول الطلب وسدحبه للـ Dashboard الخاصة به.
- `PATCH /api/dawah-requests/{request_id}/status` — (للدعاة) تحديث الحالة وتضمين ملاحظة (`preacher_feedback`) للجمعية.
- `POST /api/dawah-requests/{request_id}/feedback` — (لرافع الطلب) تقييم التجربة والملاحظة (`submitter_feedback`) للجمعية والأدمن.

---

## 🔔 Notifications (الإشعارات)
- `GET /api/notifications/` — جلب قائمة إشعارات العضو الحالي (مع Pagination).
- `PATCH /api/notifications/{notification_id}/read` — تحديد الإشعار كمقروء.

---

## 📝 ملاحظات هامة للفرونت
- **Headers:** دائماً استخدم `Content-Type: application/json` في طلبات الـ POST و الـ PATCH.
- **Pagination:** استخدم `?skip=0&limit=50` في كل طلبات الـ GET للقوائم.
- **Success Response:** الداتا دائماً بترجع داخل Object اسمه `data`.
