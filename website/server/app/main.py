from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    users_router,
    admins_router,
    organizations_router,
    preachers_router,
    muslim_callers_router,
    interested_persons_router,
)

app = FastAPI(
    title="Balagh API",
    description="منصة بلاغ للتعريف بالإسلام — REST API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # يُضبط في production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ───────────────────────────────────────────────────────

app.include_router(users_router)
app.include_router(admins_router)
app.include_router(organizations_router)
app.include_router(preachers_router)
app.include_router(muslim_callers_router)
app.include_router(interested_persons_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": "Balagh API", "env": settings.APP_ENV}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
