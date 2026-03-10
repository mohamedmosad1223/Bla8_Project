"""Diagnostic: runs each import step and writes results to diag.txt"""
import sys
import traceback

LOG = "diag.txt"

def log(msg):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg, flush=True)

# Clear log
with open(LOG, "w", encoding="utf-8") as f:
    f.write("")

log(f"Python: {sys.version}")
log(f"CWD: {__import__('os').getcwd()}")

steps = [
    ("pathlib",      "from pathlib import Path"),
    ("urllib",       "from urllib.parse import quote_plus"),
    ("sqlalchemy",   "import sqlalchemy"),
    ("psycopg2",     "import psycopg2"),
    ("alembic",      "import alembic"),
    ("app.config",   "from app.config import settings; log(f'DB URL: {settings.DATABASE_URL}')"),
    ("app.models",   "import app.models"),
    ("db connect",   """
import psycopg2, sys
sys.path.insert(0, '.')
from app.config import settings
from urllib.parse import urlparse
u = urlparse(settings.DATABASE_URL)
log(f'Connecting: host={u.hostname} port={u.port} user={u.username}')
conn = psycopg2.connect(host=u.hostname, port=u.port, user=u.username, 
                         password=u.password, dbname=u.path.lstrip('/'),
                         connect_timeout=5)
conn.close()
log('DB connection: OK')
"""),
]

all_ok = True
for name, code in steps:
    try:
        exec(compile(code, "<step>", "exec"), {"log": log})
        log(f"  OK: {name}")
    except Exception as e:
        log(f"  FAIL: {name} → {type(e).__name__}: {e}")
        log(traceback.format_exc())
        all_ok = False
        break

if all_ok:
    log("\nAll checks passed! Running alembic...")
    import subprocess
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        capture_output=True, text=True, timeout=120
    )
    log(f"Alembic stdout:\n{result.stdout}")
    log(f"Alembic stderr:\n{result.stderr}")
    log(f"Exit code: {result.returncode}")

log("\n=== DONE ===")
