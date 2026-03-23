import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Check, 
  X, 
  User, 
  MapPin, 
  PhoneCall, 
  Mail, 
  Calendar, 
  FileBadge, 
  Users, 
  Building,
  FileText
} from 'lucide-react';
import './AdminAssociationRequestDetails.css';

const AdminAssociationRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  // Mock data representing the detail page for Association
  const requestDetails = {
    id: id || '2001',
    associationName: 'جمعية الرسالة الخيرية',
    managerName: 'أحمد محمود إسماعيل',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    phone: '+201122334455',
    email: 'info@resala-charity.org',
    requestDate: '2025-01-15',
    licenseNumber: 'LIG-992384',
    preachersCount: '150 داعية',
    documentName: 'ملف الترخيص الرسمي.pdf',
    documentUrl: '#',
  };

  const handleAccept = () => {
    setSuccessModalOpen(true);
  };

  const handleReject = () => {
    setRejectModalOpen(true);
  };

  return (
    <div className="aard-detail-page">
      {/* ── Detail Header Wrapper ── */}
      <div className="aard-detail-header-wrapper">
        <div className="aard-detail-header-titles">
          <div className="aard-breadcrumb">
            <button className="aard-breadcrumb-link" onClick={() => navigate('/admin/requests')}>الطلبات الجديدة</button>
            <ChevronLeft size={16} />
            <span>عرض تفاصيل جمعية</span>
          </div>
          <h1 className="aard-detail-title">عرض طلب الجمعية</h1>
        </div>

        <div className="aard-detail-actions">
          <button className="aard-detail-btn aard-detail-accept" onClick={handleAccept}>
            <Check size={18} />
            استلام الطلب
          </button>
          <button className="aard-detail-btn aard-detail-reject" onClick={handleReject}>
            <X size={18} />
            رفض الطلب
          </button>
        </div>
      </div>

      {/* ── Content Card ── */}
      <div className="aard-detail-card">
        
        <div className="aard-drow">
          {/* Row 1 */}
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><Building size={16} /></span>
              <span>اسم الجمعية</span>
            </div>
            <div className="aard-dfield-value">{requestDetails.associationName}</div>
          </div>
          
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><User size={16} /></span>
              <span>مدير الجمعية</span>
            </div>
            <div className="aard-dfield-value">{requestDetails.managerName}</div>
          </div>
          
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><MapPin size={16} /></span>
              <span>المحافظة</span>
            </div>
            <div className="aard-dfield-value">{requestDetails.governorate}</div>
          </div>
          
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><MapPin size={16} /></span>
              <span>المدينة / العنوان</span>
            </div>
            <div className="aard-dfield-value">{requestDetails.city}</div>
          </div>

          {/* Row 2 */}
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><PhoneCall size={16} /></span>
              <span>رقم الهاتف</span>
            </div>
            <div className="aard-dfield-value" dir="ltr">{requestDetails.phone}</div>
          </div>
          
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><Mail size={16} /></span>
              <span>البريد الإلكتروني</span>
            </div>
            <div className="aard-dfield-value" dir="ltr">{requestDetails.email}</div>
          </div>
          
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><Calendar size={16} /></span>
              <span>تاريخ الطلب</span>
            </div>
            <div className="aard-dfield-value">{requestDetails.requestDate}</div>
          </div>
          
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><FileBadge size={16} /></span>
              <span>رقم الترخيص</span>
            </div>
            <div className="aard-dfield-value" dir="ltr">{requestDetails.licenseNumber}</div>
          </div>

          {/* Row 3 */}
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><Users size={16} /></span>
              <span>عدد الدعاة التابعين</span>
            </div>
            <div className="aard-dfield-value">{requestDetails.preachersCount}</div>
          </div>

          {/* Row - Document */}
          <div className="aard-dfield aard-dfield-span2">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><FileText size={16} /></span>
              <span>الملف المرفق</span>
            </div>
            <div className="aard-document-wrapper">
              <a href={requestDetails.documentUrl} className="aard-document-link">
                <FileText size={18} />
                <span>{requestDetails.documentName}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {successModalOpen && (
        <div className="aard-modal-overlay">
          <div className="aard-modal-content aard-success-modal">
            <button className="aard-modal-close" onClick={() => setSuccessModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="aard-modal-icon-wrapper success">
              <Check size={40} className="aard-modal-icon" />
            </div>
            <h2 className="aard-modal-title">تم بنجاح!</h2>
            <p className="aard-modal-subtitle">تم استلام الطلب الخاص بالجمعية بنجاح</p>
            <button className="aard-modal-btn aard-success-btn" onClick={() => {
              setSuccessModalOpen(false);
              navigate('/admin/requests');
            }}>
              تم
            </button>
          </div>
        </div>
      )}

      {rejectModalOpen && (
        <div className="aard-modal-overlay">
          <div className="aard-modal-content aard-reject-modal" dir="rtl">
            <button className="aard-modal-close" onClick={() => setRejectModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="aard-modal-icon-wrapper reject">
              <X size={45} strokeWidth={3} className="aard-modal-icon" />
            </div>
            <h2 className="aard-modal-title">رفض طلب الجمعية</h2>
            <p className="aard-modal-subtitle">هل تود ان تتخذ هذا الاجراء ؟</p>
            
            <div className="aard-reject-note-container">
              <label className="aard-reject-label">ملاحظة</label>
              <textarea 
                className="aard-reject-textarea" 
                placeholder="برجاء كتابة سبب الرفض"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              ></textarea>
            </div>

            <div className="aard-modal-actions" dir="ltr">
              <button 
                className="aard-modal-btn aard-confirm-btn" 
                disabled={!rejectNote.trim()}
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectNote('');
                  navigate('/admin/requests');
                }}
              >
                تأكيد
              </button>
              <button className="aard-modal-btn aard-cancel-btn" onClick={() => setRejectModalOpen(false)}>
                الغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAssociationRequestDetails;
