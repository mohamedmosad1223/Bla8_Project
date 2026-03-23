from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.database import SessionLocal
from app.controllers.chats_controller import ChatsController
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def run_guest_cleanup():
    db = SessionLocal()
    try:
        # system_run=True يسمح بمسح الرسائل بدون الحاجة لمدير
        result = ChatsController.cleanup_guest_chats(db, user=None, days=30, system_run=True)
        logger.info(f"Scheduled Cleanup: {result['message']}")
    except Exception as e:
        logger.error(f"Error during scheduled guest chat cleanup: {e}")
    finally:
        db.close()

def start_scheduler():
    # جدول لتنظيف الرسائل أوتوماتيكياً كل يوم (24 ساعة)
    scheduler.add_job(
        run_guest_cleanup,
        trigger=IntervalTrigger(days=1),
        id="cleanup_guest_chats_job",
        name="Cleanup old guest AI chats every 24 hours",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Background scheduler started successfully.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Background scheduler shut down successfully.")
