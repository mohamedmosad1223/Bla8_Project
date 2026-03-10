# 🕌 Balagh Server — FastAPI + Alembic + PostgreSQL

## Quick Start

### 1. Start PostgreSQL via Docker
```bash
cd docker
docker-compose up -d
# Check health:
docker-compose ps
```

### 2. Install Python dependencies
```bash
cd server
pip install -r requirements.txt
```

### 3. Run Alembic Migrations
```bash
# From server/ directory
alembic upgrade head
```

### 4. Start FastAPI
```bash
uvicorn app.main:app --reload --port 8000
```
API Docs: http://localhost:8000/api/docs

---

## Project Structure

```
server/
├── app/
│   ├── main.py          # FastAPI app + CORS
│   ├── config.py        # Pydantic settings (reads docker/.env)
│   ├── database.py      # SQLAlchemy engine + get_db()
│   ├── models/          # SQLAlchemy ORM models (14 models)
│   │   ├── enums.py     # All PostgreSQL ENUMs
│   │   ├── reference.py # Language, Country
│   │   ├── user.py
│   │   ├── admin.py
│   │   ├── organization.py
│   │   ├── preacher.py  # + PreacherLanguage, Document, Statistics
│   │   ├── muslim_caller.py
│   │   ├── interested_person.py
│   │   ├── dawah_request.py  # + RequestDocument, StatusHistory
│   │   ├── message.py
│   │   ├── notification.py
│   │   ├── audit_log.py
│   │   └── report_metric.py
│   └── schemas/
│       └── schemas.py   # Pydantic v2 validation schemas
├── alembic/
│   ├── env.py
│   └── versions/
│       ├── 001_initial_schema.py   # كل جداول v2
│       └── 002_v3_enhancements.py  # قنوات التواصل + نظام الاسترداد + ...
├── alembic.ini
└── requirements.txt
docker/
├── docker-compose.yml
├── .env                 # ← لا يُرفع على Git
├── .env.example
└── .gitignore
```

---

## Schema v3 Features

| Feature | Details |
|---------|---------|
| **قنوات التواصل** | `communication_channel` ENUM + `deep_link` في `dawah_requests` |
| **48h Alert** | Function `send_pending_alerts()` — يُشغَّل بـ cron كل ساعة |
| **Auto Reclaim (72h)** | Function `auto_reclaim_stale_requests()` — يُعيد الطلب لـ pending |
| **Audit Logs** | موسّع بـ `org_id`, `duration_ms`, `user_agent` |
| **Dynamic Reports** | جدول `report_metrics` — أضف metrics بدون تعديل الـ schema |
| **Privacy View** | `v_caller_dashboard` — الاسم فقط بدون phone/email الداعية |
| **Preacher Indexes** | فلتر بـ name, type, status, gender, nationality, language, date |

## Running Cron Jobs (Alert + Reclaim)

```python
# مثال: استدعاء من Python scheduler (rq, celery, apscheduler)
from sqlalchemy import text
with db.begin():
    db.execute(text("SELECT send_pending_alerts()"))
    db.execute(text("SELECT auto_reclaim_stale_requests()"))
```
