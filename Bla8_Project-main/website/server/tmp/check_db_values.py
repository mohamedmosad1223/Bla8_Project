import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://balagh_admin:balagh2026@127.0.0.1:5434/balagh_main")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT country_id, country_code FROM countries WHERE country_id <= 10"))
    for row in result:
        print(f"ID: {row[0]}, Code: '{row[1]}', Length: {len(row[1])}")
