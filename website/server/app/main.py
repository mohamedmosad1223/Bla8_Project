from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

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


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "app": "Balagh API", "env": settings.APP_ENV}


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}
