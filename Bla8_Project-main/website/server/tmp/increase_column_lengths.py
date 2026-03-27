import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://balagh_admin:balagh2026@127.0.0.1:5434/balagh_main")
engine = create_engine(DATABASE_URL)

def update_schema():
    print("=== Updating Database Schema ===")
    queries = [
        "ALTER TABLE countries ALTER COLUMN country_code TYPE VARCHAR(30);",
        "ALTER TABLE languages ALTER COLUMN language_code TYPE VARCHAR(30);"
    ]
    
    with engine.connect() as conn:
        for query in queries:
            print(f"Executing: {query}")
            try:
                conn.execute(text(query))
                conn.commit()
                print("  -> Success")
            except Exception as e:
                print(f"  -> Error: {e}")

if __name__ == "__main__":
    update_schema()
