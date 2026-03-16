from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.limiter import limiter

from fastapi.staticfiles import StaticFiles
from app.utils.file_handler import ensure_upload_dirs

from app.config import settings
from app.routers import (
    users_router,
    admins_router,
    organizations_router,
    preachers_router,
    muslim_callers_router,
    interested_persons_router,
    auth_router,
    dawah_requests_router,
    notifications_router,
    messages_router,
    dashboard_router,
    dawah_reports_router,
    track_router,
    settings_router,
    help_router,
    profiles_router,
    chats_router,
    minister_router,
)

app = FastAPI(
    title="Balagh API",
    description="منصة بلاغ للتعريف بالإسلام — REST API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # يُضبط في production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# التأكد من مجلدات الرفع وربطها برابط ثابت
ensure_upload_dirs()
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── Register Routers ───────────────────────────────────────────────────────

app.include_router(users_router)
app.include_router(admins_router)
app.include_router(organizations_router)
app.include_router(preachers_router)
app.include_router(muslim_callers_router)
app.include_router(interested_persons_router)
app.include_router(auth_router)
app.include_router(dawah_requests_router)
app.include_router(notifications_router)
app.include_router(messages_router)
app.include_router(dashboard_router)
app.include_router(dawah_reports_router)
app.include_router(track_router)
app.include_router(settings_router)
app.include_router(help_router)
app.include_router(profiles_router)
app.include_router(chats_router)
app.include_router(minister_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": "Balagh API", "env": settings.APP_ENV}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
