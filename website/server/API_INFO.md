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
- `POST /api/dawah-requests/` — رفع طلب دعوي جديد (للمسلم الداعي أو المهتم). السيرفر يكتشف أوتوماتيكياً نوع الطلب (`request_type`) وهوية الشخص من الـ Token.
- `GET /api/dawah-requests/pool` — جلب الطلبات الأحدث (Pending) المتاحة للقبول (خاص بالدعاة والجمعيات).
- `GET /api/dawah-requests/my` — (للدعاة) جلب الطلبات التي قبلها الداعية ليتابعها.
- `GET /api/dawah-requests/org-requests` — (للجمعيات) جلب طلبات كل الدعاة التابعين لها شاملة الملاحظات (`preacher_feedback` و `submitter_feedback` و `notes`).
- `GET /api/dawah-requests/my-submissions` — (لرافع الطلب) رؤية الطلبات التي رفعها وحالتها لمعرفة ما إذا قبلها داعية.
- `GET /api/dawah-requests/{request_id}` — جلب تفاصيل طلب معين (مُأمنة بصلاحيات).
- `POST /api/dawah-requests/{request_id}/accept` — (للدعاة) قبول الطلب وربطه بالداعية.
- `PATCH /api/dawah-requests/{request_id}/status` — (للدعاة) تحديث الحالة أو فقط إضافة ملاحظات للجمعية. معامل `new_status` هنا *اختياري* (Optional)، مما يسمح بإرسال `preacher_feedback` أو `note` فقط دون تغيير حالة الطلب.
- `POST /api/dawah-requests/{request_id}/feedback` — (لرافع الطلب) تقييم التجربة، وهذا التقييم يظهر للجمعية باسم `submitter_feedback`.

---

## 🔔 Notifications (الإشعارات)
- `GET /api/notifications/` — جلب قائمة إشعارات العضو الحالي (مع Pagination).
- `PATCH /api/notifications/{notification_id}/read` — تحديد الإشعار كمقروء.

---

## 💬 Messages & Chat (المحادثات المباشرة)
*(أي طلب يتحول لحالة in_progress يفتح أوتوماتيكياً غرفة دردشة بين الداعية ورافع الطلب)*

1. `GET /api/messages/my-chats`: **(شاشة الـ Inbox الرئيسية)**
   - يجلب قائمة (Previews) لكل المحادثات الناشطة للمستخدم الحالي.
   - يعيد `request_id` (بمثابة Room ID)، اسم الطرف الآخر (`other_party_name`)، آخر رسالة (`last_message`)، وعدد الرسائل غير المقروءة (`unread_count`).
2. `GET /api/messages/chat-history/{request_id}`: **(عند الدخول للمحادثة)**
   - يجلب التاريخ الكامل للرسائل (`Array of Messages`) بين الطرفين من الأقدم للأحدث، وتُحسب فيه الرسائل غير المقروءة على أنها مقروءة أوتوماتيكياً.
   - شكل الرسالة المردود: `{"message_id": 1, "sender_id": 12, "receiver_id": 15, "message_text": "...", "created_at": "..."}`
3. `POST /api/messages/`: **(إرسال رسالة)**
   - Body المطلوب فقط: `{"request_id": 1, "message_text": "نص الرسالة هنا"}`.
   - السيرفر سيعرف المُرسل والمُستقبل تلقائياً.

---

## 📊 Dashboard
- `GET /api/dashboard/preacher`: جلب إحصائيات لوحة التحكم للداعية (لنفسه).
- `GET /api/dashboard/preacher/{preacher_id}`: جلب إحصائيات لوحة التحكم لداعية معين (خاص بالجمعية أو الأدمن).
- `GET /api/dashboard/organization`: جلب إحصائيات لوحة التحكم الشاملة للجمعية (إجمالي الدعاة، المحادثات، إلخ).

---

## 📝 ملاحظات هامة للفرونت
- **Headers:** دائماً استخدم `Content-Type: application/json` في طلبات الـ POST و الـ PATCH.
- **Pagination:** استخدم `?skip=0&limit=50` في كل طلبات الـ GET للقوائم.
- **Success Response:** الداتا دائماً بترجع داخل Object اسمه `data`.
- **Registration (Uploads):** عمليات تسجيل الجمعية والداعية تتطلب استخدام `multipart/form-data` لإرسال الملفات (PDF/Images) مع بقية البيانات.
- **Static Files:** الملفات المرفوعة يمكن الوصول إليها عبر الرابط: `/uploads/{الرابط_المخزن}`.
