import sys
from sqlalchemy import create_engine
from pathlib import Path

# Add server/ folder to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings

def test_conn():
    url = settings.DATABASE_URL.replace("127.0.0.1", "localhost")
    if "?" in url:
        url += "&connect_timeout=10"
    else:
        url += "?connect_timeout=10"
    print(f"Testing connection to: {url}")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            print("Successfully connected to the database!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_conn()
