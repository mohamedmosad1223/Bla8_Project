from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.preacher import Preacher
from app.models.dawah_request import DawahRequest
from app.models.enums import RequestStatus, PreacherStatus

class MainDashboardController:
    """
    Controller for the new Global Professional Dashboard.
    Provides real-time statistics, charts, and recent activity.
    """

    @staticmethod
    def get_main_dashboard(db: Session):
        # ── Optional: REAL QUERIES SECTION (For demonstration) ──
        # In a full real-world DB, you would uncomment or adapt these:
        
        # 1. Total Invited People
        # total_invited_count = db.query(DawahRequest).count()
        
        # 2. Active Du'ah
        # active_duah_count = db.query(Preacher).filter(Preacher.status == PreacherStatus.active).count()
        
        # 3. Successful Conversions
        # conversions_count = db.query(DawahRequest).filter(DawahRequest.status == RequestStatus.converted).count()
        
        # 4. Pending Follow-ups (in_progress & under_persuasion)
        # pending_followups = db.query(DawahRequest).filter(
        #     DawahRequest.status.in_([RequestStatus.in_progress, RequestStatus.under_persuasion])
        # ).count()

        # Returning MOCKED DATA as a solid basis for UI integration and testing.
        return {
            "total_invited": {
                "title": "إجمالي المدعوين",
                "value": 1542,
                "change_percentage": 12.5,
                "is_positive": True
            },
            "active_duah": {
                "title": "الدعاة النشطين",
                "value": 85,
                "change_percentage": 5.2,
                "is_positive": True
            },
            "invitations_this_week": {
                "title": "دعوات هذا الأسبوع",
                "value": 120,
                "change_percentage": -2.4,
                "is_positive": False
            },
            "successful_conversions": {
                "title": "حالات الإسلام",
                "value": 315,
                "change_percentage": 18.0,
                "is_positive": True
            },
            "pending_followups": {
                "title": "متابعات معلقة",
                "value": 42,
                "change_percentage": None,
                "is_positive": True
            },
            # Charts Data
            "invitations_over_time": [
                {"label": "يناير", "value": 50},
                {"label": "فبراير", "value": 80},
                {"label": "مارس", "value": 120},
                {"label": "أبريل", "value": 200},
            ],
            "nationalities_distribution": [
                {"label": "الفلبين", "value": 40},
                {"label": "الهند", "value": 25},
                {"label": "سريلانكا", "value": 20},
                {"label": "أخرى", "value": 15},
            ],
            "invitations_by_duah": [
                {"label": "محمد الداعي", "value": 45},
                {"label": "أحمد عبد الله", "value": 38},
                {"label": "خالد محمود", "value": 30},
            ],
            "funnel_chart": [
                {"label": "تمت الدعوة", "value": 1542},
                {"label": "قيد المتابعة", "value": 900},
                {"label": "أسلم بفضل الله", "value": 315},
            ],
            # Activity Panel
            "recent_activities": [
                {
                    "id": 1,
                    "name": "جوزيف سميث",
                    "action": "تم إضافة شخص مدعو جديد",
                    "time": "منذ 10 دقائق",
                    "timestamp": datetime.now()
                },
                {
                    "id": 2,
                    "name": "الداعية/ محمود",
                    "action": "أكمل متابعة (حالة ديفيد كارتر)",
                    "time": "منذ ساعتين",
                    "timestamp": datetime.now()
                },
                {
                    "id": 3,
                    "name": "مارك جونز",
                    "action": "نطق الشهادة بفضل الله!",
                    "time": "منذ 5 ساعات",
                    "timestamp": datetime.now()
                }
            ]
        }
