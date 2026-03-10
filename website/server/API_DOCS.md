# 📘 Balagh API Documentation — دليل الـ Frontend

> **Base URL:** `http://localhost:8000`
> **Swagger UI:** `http://localhost:8000/api/docs`

كل الـ APIs بترجع response بالشكل ده:

```json
{
  "message": "رسالة نجاح أو خطأ",
  "data": { ... }
}
```

---

## 🔑 HTTP Status Codes

| Code | المعنى |
|------|--------|
| `200` | العملية تمت بنجاح |
| `201` | تم الإنشاء بنجاح |
| `204` | تم الحذف بنجاح (بدون body) |
| `404` | العنصر غير موجود |
| `409` | تعارض (مثلاً: الإيميل مسجل بالفعل) |
| `422` | خطأ في الـ validation |

---

## 👤 Users — `/api/users`

### `GET /api/users/` — قائمة المستخدمين

جلب كل المستخدمين مع إمكانية الفلترة.

| Query Param | النوع | الوصف |
|-------------|-------|-------|
| `skip` | int | عدد السجلات المراد تخطيها (default: 0) |
| `limit` | int | الحد الأقصى للنتائج (default: 50, max: 200) |
| `role` | string | فلترة بالدور: `admin`, `organization`, `preacher`, `muslim_caller`, `interested` |
| `status` | string | فلترة بالحالة: `active`, `suspended`, `pending` |

**Response:**
```json
{
  "message": "تم جلب قائمة المستخدمين بنجاح",
  "data": [
    {
      "user_id": 1,
      "email": "admin@balagh.com",
      "role": "admin",
      "status": "active",
      "created_at": "2026-03-10T20:00:00Z"
    }
  ]
}
```

---

### `GET /api/users/{user_id}` — جلب مستخدم بالـ ID

**Response:**
```json
{
  "message": "تم جلب بيانات المستخدم بنجاح",
  "data": { "user_id": 1, "email": "...", "role": "...", "status": "...", "created_at": "..." }
}
```

---

### `PATCH /api/users/{user_id}` — تحديث مستخدم

**Request Body** (أرسل الحقول اللي عايز تحدثها بس):
```json
{
  "email": "new@email.com",
  "status": "suspended"
}
```

---

### `DELETE /api/users/{user_id}` — حذف مستخدم (Soft Delete)

بيحط `deleted_at` ويغير الـ status لـ `suspended`. **مش بيمسح من الداتابيز.**

**Response:** `204 No Content`

---

## 🛡️ Admins — `/api/admins`

### `POST /api/admins/register` — تسجيل أدمن جديد

بينشئ `User` + `Admin` profile في عملية واحدة.

**Request Body:**
```json
{
  "email": "admin@balagh.com",
  "password": "Admin123!",
  "full_name": "أحمد محمد",
  "phone": "+966501234567",
  "level": "admin"
}
```

| حقل | مطلوب | الوصف |
|-----|-------|-------|
| `email` | ✅ | بريد إلكتروني فريد |
| `password` | ✅ | 8 أحرف minimum + حرف كبير + رقم |
| `full_name` | ✅ | الاسم الكامل (2-255 حرف) |
| `phone` | ❌ | رقم هاتف (يبدأ بـ +) |
| `level` | ❌ | `admin` (default) أو `super_admin` |

**Response:** `201`
```json
{
  "message": "تم تسجيل الأدمن بنجاح",
  "data": { "admin_id": 1, "user_id": 1, "full_name": "أحمد محمد", "level": "admin", "created_at": "..." }
}
```

---

### `GET /api/admins/` — قائمة الأدمنز

| Query Param | النوع | الوصف |
|-------------|-------|-------|
| `skip` | int | default: 0 |
| `limit` | int | default: 50 |

---

### `GET /api/admins/{admin_id}` — جلب أدمن بالـ ID

### `PATCH /api/admins/{admin_id}` — تحديث أدمن

```json
{
  "full_name": "اسم جديد",
  "phone": "+966509999999",
  "level": "super_admin"
}
```

### `DELETE /api/admins/{admin_id}` — حذف أدمن

يحذف الـ Admin profile + يعمل soft-delete للـ User.

---

## 🏢 Organizations — `/api/organizations`

### `POST /api/organizations/register` — تسجيل جمعية جديدة

**Request Body:**
```json
{
  "email": "org@balagh.com",
  "password": "Org12345",
  "organization_name": "جمعية النور للدعوة",
  "license_number": "LIC-2026-001",
  "establishment_date": "2020-01-15",
  "country_id": 1,
  "governorate": "الرياض",
  "manager_name": "خالد عبدالله",
  "phone": "+966501234567",
  "org_email": "info@alnoor.org"
}
```

| حقل | مطلوب | الوصف |
|-----|-------|-------|
| `email` | ✅ | إيميل تسجيل الدخول |
| `password` | ✅ | كلمة مرور قوية |
| `organization_name` | ✅ | اسم الجمعية (3-255) |
| `manager_name` | ✅ | اسم المدير المسؤول |
| `license_number` | ❌ | رقم الترخيص |
| `establishment_date` | ❌ | تاريخ التأسيس (لا يقبل تاريخ مستقبلي) |
| `country_id` | ❌ | FK → countries |
| `governorate` | ❌ | المحافظة |
| `phone` | ❌ | رقم هاتف |
| `org_email` | ❌ | إيميل الجمعية (مختلف عن إيميل الدخول) |

> ⚠️ الجمعية تُنشأ بحالة `pending` — تحتاج موافقة أدمن.

---

### `GET /api/organizations/` — قائمة الجمعيات

| Query Param | النوع | الوصف |
|-------------|-------|-------|
| `skip` | int | default: 0 |
| `limit` | int | default: 50 |
| `approval` | string | فلترة: `pending`, `approved`, `rejected` |

### `GET /api/organizations/{org_id}` — جلب جمعية بالـ ID

### `PATCH /api/organizations/{org_id}` — تحديث جمعية

```json
{
  "organization_name": "اسم جديد",
  "approval_status": "approved",
  "manager_name": "مدير جديد"
}
```

### `DELETE /api/organizations/{org_id}` — حذف جمعية

---

## 🕌 Preachers — `/api/preachers`

### `POST /api/preachers/register` — تسجيل داعية جديد

**Request Body:**
```json
{
  "email": "preacher@balagh.com",
  "password": "Preacher1",
  "type": "volunteer",
  "full_name": "عبدالرحمن سعيد",
  "phone": "+966501234567",
  "preacher_email": "abdulrahman@gmail.com",
  "gender": "male",
  "nationality_country_id": 1,
  "identity_number": "1234567890",
  "scientific_qualification": "بكالوريوس شريعة"
}
```

| حقل | مطلوب | الوصف |
|-----|-------|-------|
| `email` | ✅ | إيميل تسجيل الدخول |
| `password` | ✅ | كلمة مرور قوية |
| `type` | ✅ | `volunteer` (منفرد) أو `official` (تابع لجمعية) |
| `full_name` | ✅ | الاسم الكامل |
| `org_id` | شرطي | **مطلوب** إذا `type = official`، **ممنوع** إذا `volunteer` |
| `phone` | ❌ | رقم هاتف |
| `preacher_email` | ❌ | إيميل الداعية (مختلف عن إيميل الدخول) |
| `gender` | ❌ | `male` أو `female` |
| `nationality_country_id` | ❌ | FK → countries |
| `identity_number` | ❌ | رقم الهوية |
| `scientific_qualification` | ❌ | المؤهل العلمي |

---

### `GET /api/preachers/` — قائمة الدعاة (مع فلترة متقدمة)

| Query Param | النوع | الوصف |
|-------------|-------|-------|
| `skip` | int | default: 0 |
| `limit` | int | default: 50 |
| `full_name` | string | بحث بالاسم (جزئي) |
| `type` | string | `volunteer` أو `official` |
| `status` | string | `active` أو `suspended` |
| `gender` | string | `male` أو `female` |
| `approval_status` | string | `pending`, `approved`, `rejected` |
| `nationality_country_id` | int | فلترة بالجنسية |
| `org_id` | int | فلترة بالجمعية |

### `GET /api/preachers/{preacher_id}` — جلب داعية بالـ ID

### `PATCH /api/preachers/{preacher_id}` — تحديث داعية

```json
{
  "full_name": "اسم جديد",
  "status": "suspended",
  "approval_status": "approved"
}
```

### `DELETE /api/preachers/{preacher_id}` — حذف داعية

---

## 🤲 Muslim Callers — `/api/muslim-callers`

### `POST /api/muslim-callers/register` — تسجيل مسلم داعي

**Request Body:**
```json
{
  "email": "caller@balagh.com",
  "password": "Caller123",
  "full_name": "محمد علي",
  "phone": "+966501234567",
  "nationality_country_id": 1,
  "gender": "male"
}
```

| حقل | مطلوب | الوصف |
|-----|-------|-------|
| `email` | ✅ | إيميل تسجيل الدخول |
| `password` | ✅ | كلمة مرور قوية |
| `full_name` | ✅ | الاسم الكامل |
| `phone` | ❌ | رقم هاتف |
| `nationality_country_id` | ❌ | FK → countries |
| `gender` | ❌ | `male` أو `female` |

---

### `GET /api/muslim-callers/` — قائمة المسلمين الدعاة

| Query Param | النوع | الوصف |
|-------------|-------|-------|
| `skip` | int | default: 0 |
| `limit` | int | default: 50 |
| `full_name` | string | بحث بالاسم (جزئي) |

### `GET /api/muslim-callers/{caller_id}` — جلب بالـ ID

### `PATCH /api/muslim-callers/{caller_id}` — تحديث

```json
{
  "full_name": "اسم جديد",
  "gender": "female"
}
```

### `DELETE /api/muslim-callers/{caller_id}` — حذف

---

## 🌟 Interested Persons — `/api/interested-persons`

### `POST /api/interested-persons/register` — تسجيل شخص مهتم

**Request Body:**
```json
{
  "email": "person@balagh.com",
  "password": "Person123",
  "first_name": "John",
  "father_name": "Michael",
  "last_name": "Smith",
  "gender": "male",
  "nationality_country_id": 5,
  "current_country_id": 1,
  "communication_lang_id": 2,
  "person_email": "john@gmail.com",
  "phone": "+1234567890"
}
```

| حقل | مطلوب | الوصف |
|-----|-------|-------|
| `email` | ✅ | إيميل تسجيل الدخول |
| `password` | ✅ | كلمة مرور قوية |
| `first_name` | ✅ | الاسم الأول |
| `last_name` | ✅ | الاسم الأخير |
| `father_name` | ❌ | اسم الأب |
| `gender` | ❌ | `male` أو `female` |
| `nationality_country_id` | ❌ | الجنسية FK → countries |
| `current_country_id` | ❌ | بلد الإقامة FK → countries |
| `communication_lang_id` | ❌ | لغة التواصل FK → languages |
| `person_email` | ❌ | إيميل شخصي (غير إيميل الدخول) |
| `phone` | ❌ | رقم هاتف |

---

### `GET /api/interested-persons/` — قائمة المهتمين

| Query Param | النوع | الوصف |
|-------------|-------|-------|
| `skip` | int | default: 0 |
| `limit` | int | default: 50 |
| `first_name` | string | بحث بالاسم الأول |
| `last_name` | string | بحث بالاسم الأخير |

### `GET /api/interested-persons/{person_id}` — جلب بالـ ID

### `PATCH /api/interested-persons/{person_id}` — تحديث

```json
{
  "first_name": "اسم جديد",
  "current_country_id": 3
}
```

### `DELETE /api/interested-persons/{person_id}` — حذف

---

## 💚 Health — `/`

| Method | Endpoint | الوصف |
|--------|----------|-------|
| `GET` | `/` | حالة التطبيق |
| `GET` | `/health` | Health check |

---

## 📝 ملاحظات للفرونت

1. **كلمة المرور** — لازم تكون 8 أحرف minimum + حرف كبير + رقم
2. **الهاتف** — لازم يبدأ بـ `+` وأرقام فقط (7-20 رقم)
3. **PATCH** — أرسل الحقول اللي عايز تحدثها بس (partial update)
4. **Delete** — الحذف soft delete — يحط `deleted_at` ومش بيمسح فعلياً
5. **Pagination** — استخدم `skip` و `limit` في كل الـ list endpoints
6. **الـ Preacher الرسمي** — لازم يكون عنده `org_id` (تابع لجمعية)
7. **الـ Organization** — بتتسجل بحالة `pending` — لازم أدمن يوافق عليها
