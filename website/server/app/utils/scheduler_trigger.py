from sqlalchemy import text
from app.database import SessionLocal

def trigger_alerts():
    db = SessionLocal()
    try:
        print("Checking for pending inactivity alerts (42h)...")
        alerts_sent = db.execute(text("SELECT send_pending_alerts();")).scalar()
        print(f"Sent {alerts_sent or 0} alerts.")

        print("Checking for stale requests to reclaim (72h)...")
        reclaimed = db.execute(text("SELECT auto_reclaim_stale_requests();")).scalar()
        print(f"Reclaimed {reclaimed or 0} requests.")
        
        db.commit()
    except Exception as e:
        print(f"Error triggering background tasks: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    trigger_alerts()
