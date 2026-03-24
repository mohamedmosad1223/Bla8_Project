import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Check, 
  X, 
  User, 
  Globe, 
  MessageCircle, 
  Moon, 
  Mail, 
  PhoneCall, 
  Users, 
  Calendar, 
  Link2,
  FileText
} from 'lucide-react';
import './AdminPreacherRequestDetails.css';

const AdminPreacherRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  // Mock data representing the detail page
  const requestDetails = {
    id: id || '201',
    applicantName: 'عبدالرحمن حسين',
    nationality: 'مصر',
    language: 'اللغة العربية',
    religion: 'مسلم',
    applicantEmail: 'Boody@gmail.com',
    applicantPhone: '+2001155591759',
    gender: 'ذكر',
    age: '33 عام',
    communicationMethod: 'فيس بوك',
    communicationLink: 'https://www.facebook.com/',
    documentName: 'السيرة الذاتية.pdf',
    documentUrl: '#',
  };

  const handleAccept = () => {
    setSuccessModalOpen(true);
  };

  const handleReject = () => {
    setRejectModalOpen(true);
  };

  return (
    <div className="aprd-detail-page">
      {/* ── Detail Header Wrapper ── */}
      <div className="aprd-detail-header-wrapper">
        <div className="aprd-detail-header-titles">
          <div className="aprd-breadcrumb">
            <button className="aprd-breadcrumb-link" onClick={() => navigate('/admin/requests')}>الطلبات الجديدة</button>
            <ChevronLeft size={16} />
            <span>عرض الطلب الجديد</span>
          </div>
          <h1 className="aprd-detail-title">عرض الطلب الجديد</h1>
        </div>

        <div className="aprd-detail-actions">
          <button className="aprd-detail-btn aprd-detail-accept" onClick={handleAccept}>
            <Check size={18} />
            استلام الطلب
          </button>
          <button className="aprd-detail-btn aprd-detail-reject" onClick={handleReject}>
            <X size={18} />
            رفض الطلب
          </button>
        </div>
      </div>

      {/* ── Content Card ── */}
      <div className="aprd-detail-card">
        
        <div className="aprd-drow">
          {/* Row 1 */}
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><User size={16} /></span>
              <span>اسم الشخص</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.applicantName}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Globe size={16} /></span>
              <span>الجنسية</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.nationality}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><MessageCircle size={16} /></span>
              <span>اللغة</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.language}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Moon size={16} /></span>
              <span>الديانة</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.religion}</div>
          </div>

          {/* Row 2 */}
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Mail size={16} /></span>
              <span>البريد الإلكتروني</span>
            </div>
            <div className="aprd-dfield-value" dir="ltr">{requestDetails.applicantEmail}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><PhoneCall size={16} /></span>
              <span>رقم الهاتف</span>
            </div>
            <div className="aprd-dfield-value" dir="ltr">{requestDetails.applicantPhone}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Users size={16} /></span>
              <span>النوع</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.gender}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Calendar size={16} /></span>
              <span>السن</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.age}</div>
          </div>

          {/* Row 3 */}
          <div className="aprd-dfield aprd-dfield-span2">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Link2 size={16} /></span>
              <span>طرق التواصل</span>
            </div>
            <div className="aprd-contact-row">
              <span className="aprd-fb-badge">
                {requestDetails.communicationMethod}
              </span>
              <a href={requestDetails.communicationLink} target="_blank" rel="noreferrer" className="aprd-link" dir="ltr">
                {requestDetails.communicationLink}
              </a>
            </div>
          </div>

          {/* Row 4 - Document */}
          <div className="aprd-dfield aprd-dfield-span2">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><FileText size={16} /></span>
              <span>الملف المرفق</span>
            </div>
            <div className="aprd-document-wrapper">
              <a href={requestDetails.documentUrl} className="aprd-document-link">
                <FileText size={18} />
                <span>{requestDetails.documentName}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {successModalOpen && (
        <div className="aprd-modal-overlay">
          <div className="aprd-modal-content aprd-success-modal">
            <button className="aprd-modal-close" onClick={() => setSuccessModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="aprd-modal-icon-wrapper success">
              <Check size={40} className="aprd-modal-icon" />
            </div>
            <h2 className="aprd-modal-title">تم بنجاح!</h2>
            <p className="aprd-modal-subtitle">تم استلام الطلب بنجاح</p>
            <button className="aprd-modal-btn aprd-success-btn" onClick={() => {
              setSuccessModalOpen(false);
              navigate('/admin/requests');
            }}>
              تم
            </button>
          </div>
        </div>
      )}

      {rejectModalOpen && (
        <div className="aprd-modal-overlay">
          <div className="aprd-modal-content aprd-reject-modal" dir="rtl">
            <button className="aprd-modal-close" onClick={() => setRejectModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="aprd-modal-icon-wrapper reject">
              <X size={45} strokeWidth={3} className="aprd-modal-icon" />
            </div>
            <h2 className="aprd-modal-title">رفض الطلب</h2>
            <p className="aprd-modal-subtitle">هل تود ان تتخذ هذا الاجراء ؟</p>
            
            <div className="aprd-reject-note-container">
              <label className="aprd-reject-label">ملاحظة</label>
              <textarea 
                className="aprd-reject-textarea" 
                placeholder="مثال ملاحظة"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              ></textarea>
            </div>

            <div className="aprd-modal-actions" dir="ltr">
              <button 
                className="aprd-modal-btn aprd-confirm-btn" 
                disabled={!rejectNote.trim()}
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectNote('');
                  navigate('/admin/requests');
                }}
              >
                تأكيد
              </button>
              <button className="aprd-modal-btn aprd-cancel-btn" onClick={() => setRejectModalOpen(false)}>
                الغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPreacherRequestDetails;
