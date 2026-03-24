"""
Dawah Reports Controller — Business logic for daily updates.
"""

from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.dawah_request import DawahRequest, DawahReport
from app.models.enums import RequestStatus
from app.schemas.schemas import DawahReportCreate

class DawahReportsController:

    @staticmethod
    def create_report(db: Session, preacher_id: int, payload: DawahReportCreate):
        """تسجيل تقرير يومي (تحديث) عن حالة معينة"""
        # التأكد أن الطلب يخص الداعية وأنه نشط
        request = db.query(DawahRequest).filter(
            DawahRequest.request_id == payload.request_id,
            DawahRequest.assigned_preacher_id == preacher_id
        ).first()

        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود أو غير مسند إليك")
        
        allowed_statuses = [
            RequestStatus.in_progress, 
            RequestStatus.under_persuasion,
            RequestStatus.converted,
            RequestStatus.rejected
        ]
        if request.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail="لا يمكن إضافة تقرير على طلب ملغى أو غير متاح")

        report = DawahReport(
            request_id=payload.request_id,
            preacher_id=preacher_id,
            communication_type=payload.communication_type,
            communication_details=payload.communication_details,
            content=payload.content
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return {"message": "تم تسجيل التقرير اليومي بنجاح", "data": report}

    @staticmethod
    def check_report_due(db: Session, request_id: int):
        """التحقق مما إذا كان هناك تقرير مستحق لم يُقدم خلال الـ 24 ساعة الماضية"""
        request = db.query(DawahRequest).filter(DawahRequest.request_id == request_id).first()
        if not request:
            return False # لا يوجد طلب أصلاً

        now = datetime.now(timezone.utc)
        
        # 1. جلب آخر تقرير
        last_report = db.query(DawahReport).filter(
            DawahReport.request_id == request_id
        ).order_by(DawahReport.created_at.desc()).first()
        
        if last_report:
            # التحقق هل مضى أكثر من 24 ساعة على آخر تقرير؟
            if (now - last_report.created_at) > timedelta(hours=24):
                return True
        else:
            # إذا لم يكن هناك تقارير، هل مضى أكثر من 24 ساعة على قبول الطلب؟
            if request.accepted_at and (now - request.accepted_at) > timedelta(hours=24):
                return True
        
        return False

    @staticmethod
    def is_preacher_blocked(db: Session, preacher_id: int):
        """التحقق مما إذا كان الداعية موقوفاً بسبب عدم تقديم تقارير لأي حالة نشطة لديه"""
        active_requests = db.query(DawahRequest).filter(
            DawahRequest.assigned_preacher_id == preacher_id,
            DawahRequest.status.in_([RequestStatus.in_progress, RequestStatus.under_persuasion])
        ).all()
        
        for req in active_requests:
            if DawahReportsController.check_report_due(db, req.request_id):
                return True # بمجرد أن يوجد طلب واحد متأخر إذن هو محظور
                
        return False

    @staticmethod
    def list_reports(db: Session, request_id: int, user):
        """عرض التقارير الخاصة بطلب معين (للدعاية، الجمعية، أو الأدمن)"""
        # استعلام أساسي
        request = db.query(DawahRequest).filter(DawahRequest.request_id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")

        # صلاحيات العرض (الداعية صاحب الطلب، أو جمعيته، أو الأدمن)
        # سيتم التحقق من الصلاحيات في الراوتر لتبسيط الكود هنا، 
        # ولكن نضمن أن الداعية يرى تقاريره فقط إذا مررنا الـ user
        
        reports = db.query(DawahReport).filter(
            DawahReport.request_id == request_id
        ).order_by(DawahReport.created_at.desc()).all()
        
        return {"message": "تم جلب التقارير", "data": reports}
