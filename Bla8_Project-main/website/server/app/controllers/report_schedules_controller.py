from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.models.report_schedule import ReportSchedule
from app.models.user import User
from app.schemas.schemas import ReportScheduleCreate
from fastapi import HTTPException, status

class ReportSchedulesController:
    @staticmethod
    def create_schedule(db: Session, user: User, data: ReportScheduleCreate):
        """
        إنشاء جدول تقرير جديد للمستخدم الحالي.
        """
        new_schedule = ReportSchedule(
            user_id=user.user_id,
            name=data.name,
            timing=data.timing,
            report_type=data.report_type
        )
        db.add(new_schedule)
        db.commit()
        db.refresh(new_schedule)
        return new_schedule

    @staticmethod
    def list_schedules(db: Session, user: User):
        """
        عرض جميع الجداول الخاصة بالمستخدم (أو جميعها للأدمن الرئيس).
        """
        # إذا كان أدمن رئيسي، قد يرغب في رؤية الكل، لكن حالياً سنقتصر على جداول المستخدم نفسه
        query = select(ReportSchedule).where(ReportSchedule.user_id == user.user_id)
        result = db.execute(query)
        return result.scalars().all()

    @staticmethod
    def delete_schedule(db: Session, user: User, schedule_id: int):
        """
        حذف جدول معين.
        """
        schedule = db.get(ReportSchedule, schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="الجدول غير موجود")
        
        if schedule.user_id != user.user_id:
             raise HTTPException(status_code=403, detail="ليس لديك صلاحية لحذف هذا الجدول")

        db.delete(schedule)
        db.commit()
        return {"message": "تم حذف الجدول بنجاح"}
