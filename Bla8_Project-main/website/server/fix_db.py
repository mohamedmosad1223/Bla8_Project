def fix_last_seen():
    from sqlalchemy import text
    from app.database import engine
    
    print("Attempting to add 'last_seen' column to 'users' table...")
    
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;"))
            conn.commit()
        print("Column 'last_seen' checked/added successfully.")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("Column 'last_seen' already exists.")
        else:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    fix_last_seen()
