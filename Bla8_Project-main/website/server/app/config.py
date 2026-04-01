from pathlib import Path
from urllib.parse import quote_plus
import os
from dotenv import load_dotenv

# ── Load .env ───────────────────────────────────────────────────────────────
_BASE_DIR = Path(__file__).parent.parent
_ENV_FILE = _BASE_DIR / ".env"
load_dotenv(_ENV_FILE)

def _get(key: str, default: str = "") -> str:
    return os.environ.get(key, default)

def _build_url() -> str:
    """Builds DATABASE_URL safely with quote_plus for the password."""
    direct = _get("DATABASE_URL")
    if direct:
        return direct
    user     = _get("POSTGRES_USER",     "balagh_admin")
    password = _get("POSTGRES_PASSWORD", "balagh2026")
    host     = _get("POSTGRES_HOST",     "127.0.0.1")
    port     = _get("POSTGRES_PORT",     "5434")
    db       = _get("POSTGRES_DB",       "balagh_main")
    return f"postgresql://{user}:{quote_plus(password)}@{host}:{port}/{db}"


# ── Settings object ──────────────────────────────────────────────────────────

class Settings:
    DATABASE_URL: str  = _build_url()
    APP_ENV:      str  = _get("APP_ENV",      "development")
    SECRET_KEY:   str  = _get("SECRET_KEY",   "change-me-in-production")
    DEBUG:        bool = _get("DEBUG", "true").lower() == "true"
    JWT_SECRET_KEY: str = _get("JWT_SECRET_KEY", "705fae3e46180cf2823652de9e33842c510fc14187640f0f58079234857")
    ALGORITHM:      str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # SMTP Settings
    SMTP_SERVER:   str = _get("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT:     int = int(_get("SMTP_PORT", "587"))
    SMTP_USERNAME: str = _get("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = _get("SMTP_PASSWORD", "")

    # LLM Settings
    GROQ_API_KEY: str = _get("GROQ_API_KEY", "")

    # Qdrant / RAG Settings
    URL_QDRANT:       str   = _get("URL_QDRANT", "")
    API_KEY_QDRANT:   str   = _get("API_KEY_QDRANT", "")
    COLLECTION_NAME:  str   = _get("COLLECTION_NAME", "islamic_knowledge")
    RAG_TOP_K:        int   = int(_get("RAG_TOP_K", "3"))
    MAX_CONTEXT_CHARS: int  = int(_get("RAG_MAX_CONTEXT_CHARS", "4000"))
    SCORE_THRESHOLD:  float = float(_get("RAG_SCORE_THRESHOLD", "0.25"))
    RAG_EMBEDDING_BACKEND: str = _get("RAG_EMBEDDING_BACKEND", "local")
    HF_TOKEN:         str   = _get("HF_TOKEN", "")
    RAG_HF_EMBEDDING_MODEL: str = _get("RAG_HF_EMBEDDING_MODEL", "intfloat/multilingual-e5-large")


settings = Settings()


