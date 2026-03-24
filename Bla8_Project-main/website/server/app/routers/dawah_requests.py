from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DawahRequestCreate, StatusUpdateRequest, SubmitterFeedbackRequest
from app.controllers.dawah_requests_controller import DawahRequestsController
from app.auth import get_current_user, check_role
from app.models.user import User
from app.models.enums import UserRole, ApprovalStatus

router = APIRouter(prefix="/api/dawah-requests", tags=["Dawah Requests"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_request(payload: DawahRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تقديم طلب دعوة جديد (متاح للمسلمين الدعاة وللأشخاص المهتمين)"""
    return DawahRequestsController.create_request(db, payload, current_user)

@router.get("/pool", dependencies=[Depends(check_role([UserRole.preacher, UserRole.admin, UserRole.organization]))])
def get_incoming_pool(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """رؤية الطلبات الواردة (صندوق الوارد) — متاح للدعاة والجمعيات"""
    if current_user.role == UserRole.preacher:
        if current_user.preacher.approval_status != ApprovalStatus.approved:
            raise HTTPException(status_code=403, detail="لا يمكنك رؤية الطلبات الجديدة حتى تتم الموافقة على حسابك")
    return DawahRequestsController.list_pool(db, skip, limit)

@router.post("/{request_id}/accept", dependencies=[Depends(check_role([UserRole.preacher]))])
def accept_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """قبول طلب من قبل الداعية الحالي"""
    if current_user.preacher.approval_status != ApprovalStatus.approved:
        raise HTTPException(status_code=403, detail="لا يمكنك قبول طلبات حتى تتم الموافقة على حسابك")
    preacher_id = current_user.preacher.preacher_id
    return DawahRequestsController.accept_request(db, request_id, preacher_id)
@router.get("/my", dependencies=[Depends(check_role([UserRole.preacher]))])
def get_my_requests(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """رؤية الطلبات المسندة للداعية الحالي"""
    if current_user.preacher.approval_status != ApprovalStatus.approved:
        raise HTTPException(status_code=403, detail="حسابك قيد المراجعة")
    preacher_id = current_user.preacher.preacher_id
    return DawahRequestsController.list_my_requests(db, preacher_id, skip, limit)

@router.get("/my-submissions", dependencies=[Depends(check_role([UserRole.muslim_caller, UserRole.interested]))])
def get_my_submissions(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """رؤية الطلبات التي قمت برفعها بنفسي"""
    return DawahRequestsController.list_my_submissions(db, current_user.user_id, current_user.role, skip, limit)

@router.patch("/{request_id}/status", dependencies=[Depends(check_role([UserRole.preacher]))])
def update_request_status(request_id: int, payload: StatusUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تحديث حالة الطلب (تم بحمد الله، رفض، إلخ) مع إمكانية إضافة ملاحظات سرية للجمعية"""
    if current_user.preacher.approval_status != ApprovalStatus.approved:
        raise HTTPException(status_code=403, detail="حسابك قيد المراجعة")
    preacher_id = current_user.preacher.preacher_id
    return DawahRequestsController.update_status(db, request_id, preacher_id, payload)

@router.post("/{request_id}/feedback", dependencies=[Depends(check_role([UserRole.muslim_caller, UserRole.interested]))])
def submit_feedback(request_id: int, payload: SubmitterFeedbackRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """تقديم تقييم وملاحظات من قبل الشخص اللي رفع الطلب (الداعي أو المهتم)"""
    return DawahRequestsController.submit_submitter_feedback(db, request_id, current_user.user_id, current_user.role, payload.feedback)

@router.get("/org-requests", dependencies=[Depends(check_role([UserRole.organization]))])
def get_org_requests(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """رؤية كل الطلبات التابعة لجمعية معينة (كل دُعاتها)"""
    org_id = current_user.organization.org_id
    return DawahRequestsController.list_org_requests(db, org_id, skip, limit)

@router.get("/{request_id}")
def get_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """جلب بيانات طلب محدد مع التحقق من الهوية والحماية"""
    res = DawahRequestsController.get_request(db, request_id)
    request = res["data"]
    
    # ─── حماية الخصوصية والبيانات المتبادلة (Masking) ───
    
    # 1. لو أدمن: يشوف كل حاجة
    if current_user.role == UserRole.admin:
        return res
        
    # 2. لو جمعية: تشوف كل التقييمات التابعة لدُعاتها
    if current_user.role == UserRole.organization:
        from app.models.preacher import Preacher
        if request.assigned_preacher_id:
            preacher = db.query(Preacher).filter(Preacher.preacher_id == request.assigned_preacher_id).first()
            if preacher and preacher.org_id == current_user.organization.org_id:
                return res # يشوف كل حاجة بما فيها التعليقات السرية
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لعرض هذا الطلب")

    # 3. لو الطلب لسه في البول (pending): مفيش تقييمات لسه
    if request.status == "pending":
        if current_user.role in [UserRole.preacher, UserRole.organization]:
             return res

    # 4. لو داعية: يشوف ملاحظاته هو بس، ميشوفش تقييم المدعو له
    if current_user.role == UserRole.preacher:
        if request.assigned_preacher_id == current_user.preacher.preacher_id:
            request.submitter_feedback = "******** (مخفي للخصوصية)"
            if request.preacher_feedback:
                request.preacher_feedback = "تم الإرسال للجمعية (مخفي للخصوصية)"
            return res
            
    # 5. لو الشخص اللي رفع الطلب: يشوف تقييمه هو بس، ميشوفش ملاحظات الداعية السرية
    is_owner = False
    if current_user.role == UserRole.muslim_caller and request.submitted_by_caller_id == current_user.muslim_caller.caller_id:
        is_owner = True
    elif current_user.role == UserRole.interested and request.submitted_by_person_id == current_user.interested_person.person_id:
        is_owner = True
        
    if is_owner:
        request.preacher_feedback = "******** (مخفي للخصوصية)"
        return res

    raise HTTPException(status_code=403, detail="ليس لديك صلاحية لعرض هذا الطلب")
