"""
App configuration — reads docker/.env using standard library only.
No extra pip packages needed beyond what's already in requirements.txt.
"""
from pathlib import Path
from urllib.parse import quote_plus
import os


# ── Read docker/.env manually (no python-dotenv needed) ─────────────────────

_ENV_FILE = Path(__file__).parent.parent.parent / "docker" / ".env"
_env_vars: dict = {}

if _ENV_FILE.exists():
    with open(_ENV_FILE, "r", encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                _env_vars[_k.strip()] = _v.strip()


def _get(key: str, default: str = "") -> str:
    """Reads from env var first, then from .env file, then default."""
    return os.environ.get(key) or _env_vars.get(key, default)


def _build_url() -> str:
    """Builds DATABASE_URL safely with quote_plus for the password."""
    # If DATABASE_URL set directly (shell/CI), use it as-is
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


settings = Settings()


