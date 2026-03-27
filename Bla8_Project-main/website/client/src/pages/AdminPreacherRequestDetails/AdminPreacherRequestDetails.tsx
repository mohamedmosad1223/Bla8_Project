import { useState, useEffect } from 'react';
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
  FileText,
  Eye,
  Loader2
} from 'lucide-react';
import { preacherService } from '../../services/preacherService';
import './AdminPreacherRequestDetails.css';

const AdminPreacherRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [rejectSuccessModalOpen, setRejectSuccessModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await preacherService.getById(id);
      setRequestDetails(res.data);
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAccept = async () => {
    if (!id) return;
    try {
      await preacherService.update(id, { approval_status: 'approved' });
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectNote.trim()) return;
    try {
      await preacherService.update(id, { 
        approval_status: 'rejected',
        rejection_reason: rejectNote 
      });
      setRejectModalOpen(false);
      setRejectSuccessModalOpen(true);
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('حدث خطأ أثناء رفض الطلب، يرجى المحاولة مرة أخرى');
    }
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
          <button className="aprd-detail-btn aprd-detail-reject" onClick={() => setRejectModalOpen(true)}>
            <X size={18} />
            رفض الطلب
          </button>
        </div>
      </div>

      {/* ── Content Card ── */}
      {loading ? (
        <div className="aprd-loading-container">
           <Loader2 className="animate-spin" size={48} />
           <p>جاري تحميل البيانات...</p>
        </div>
      ) : requestDetails ? (
      <div className="aprd-detail-card">
        
        <div className="aprd-drow">
          {/* Row 1 */}
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><User size={16} /></span>
              <span>اسم الشخص</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.full_name}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Globe size={16} /></span>
              <span>الجنسية</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.nationality_name || "مصر"}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><MessageCircle size={16} /></span>
              <span>اللغات</span>
            </div>
            <div className="aprd-dfield-value">
              {requestDetails.languages_data?.map((l: any) => l.language_name).join(', ') || "اللغة العربية"}
            </div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Moon size={16} /></span>
              <span>الديانة</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.religion_name}</div>
          </div>

          {/* Row 2 */}
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Mail size={16} /></span>
              <span>البريد الإلكتروني</span>
            </div>
            <div className="aprd-dfield-value" dir="ltr">{requestDetails.preacher_email}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><PhoneCall size={16} /></span>
              <span>رقم الهاتف</span>
            </div>
            <div className="aprd-dfield-value" dir="ltr">{requestDetails.phone}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Users size={16} /></span>
              <span>النوع</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
          </div>
          
          <div className="aprd-dfield">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Calendar size={16} /></span>
              <span>المؤهل العلمي</span>
            </div>
            <div className="aprd-dfield-value">{requestDetails.scientific_qualification}</div>
          </div>

          {/* Row 3 */}
          <div className="aprd-dfield aprd-dfield-span2">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><Link2 size={16} /></span>
              <span>تاريخ الطلب</span>
            </div>
            <div className="aprd-contact-row">
               <div className="aprd-dfield-value">{new Date(requestDetails.created_at).toLocaleDateString('en-GB')}</div>
            </div>
          </div>

          {/* Row 4 - Document */}
          <div className="aprd-dfield aprd-dfield-span2">
            <div className="aprd-dfield-label">
              <span className="aprd-icon-gold"><FileText size={16} /></span>
              <span>المؤهلات / السيرة الذاتية</span>
            </div>
            <div className="aprd-document-wrapper">
              <button 
                className="aprd-document-link" 
                onClick={() => setIsPdfOpen(true)}
                title="اضغط لمعاينة ملف المؤهلات"
                style={{ cursor: 'pointer', background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px' }}
              >
                <FileText size={18} />
                <span>ملف المؤهلات العلمي.pdf</span>
                <Eye size={16} style={{ marginLeft: 'auto', marginRight: '8px', color: '#1a517e' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="aprd-error">لم يتم العثور على بيانات لهذا الداعية</div>
      )}

      {/* ── Success Modals ── */}
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
            <p className="aprd-modal-subtitle">تم تفعيل حساب الداعية بنجاح</p>
            <button className="aprd-modal-btn aprd-success-btn" onClick={() => {
              setSuccessModalOpen(false);
              navigate('/admin/requests');
            }}>
              تم
            </button>
          </div>
        </div>
      )}

      {rejectSuccessModalOpen && (
        <div className="aprd-modal-overlay">
          <div className="aprd-modal-content aprd-success-modal">
            <button className="aprd-modal-close" onClick={() => setRejectSuccessModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="aprd-modal-icon-wrapper reject">
              <X size={45} strokeWidth={3} className="aprd-modal-icon" />
            </div>
            <h2 className="aprd-modal-title">تم الرفض</h2>
            <p className="aprd-modal-subtitle">تم رفض طلب الداعية بنجاح</p>
            <button className="aprd-modal-btn aprd-success-btn" style={{ backgroundColor: '#ef4444' }} onClick={() => {
              setRejectSuccessModalOpen(false);
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
                onClick={handleReject}
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
      {/* ── PDF Viewer Modal ── */}
      {isPdfOpen && requestDetails?.qualification_file && (
        <div className="library-viewer-modal" onClick={() => setIsPdfOpen(false)}>
          <div className="library-viewer-content" onClick={e => e.stopPropagation()}>
            <button className="library-viewer-close" onClick={() => setIsPdfOpen(false)}>
               <X size={24} color="#374151" />
            </button>
            <h2 className="library-viewer-title">ملف المؤهلات: {requestDetails.full_name}</h2>
            <div className="library-viewer-body">
              <iframe 
                src={`/uploads/${requestDetails.qualification_file}`} 
                className="library-viewer-pdf" 
                title="الملف المرفق" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPreacherRequestDetails;
