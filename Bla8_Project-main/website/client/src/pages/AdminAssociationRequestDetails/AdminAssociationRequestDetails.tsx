import { useState, useEffect } from 'react';
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
  FileText,
  Eye,
  Loader2
} from 'lucide-react';
import { orgService } from '../../services/orgService';
import './AdminAssociationRequestDetails.css';

const AdminAssociationRequestDetails = () => {
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
      const res = await orgService.getById(id);
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
      await orgService.update(id, { approval_status: 'approved' });
      setSuccessModalOpen(true);
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectNote.trim()) return;
    try {
      await orgService.update(id, { 
        approval_status: 'rejected',
        rejection_reason: rejectNote 
      });
      setRejectModalOpen(false);
      setRejectSuccessModalOpen(true);
    } catch (err) {
      console.error('Error rejecting request:', err);
      // Fallback to alert for errors to be sure it's seen, but better to use a Toast if available
      alert('حدث خطأ أثناء رفض الطلب، يرجى المحاولة مرة أخرى');
    }
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
          <button className="aard-detail-btn aard-detail-reject" onClick={() => setRejectModalOpen(true)}>
            <X size={18} />
            رفض الطلب
          </button>
        </div>
      </div>

      {/* ── Content Card ── */}
      {loading ? (
        <div className="aard-loading-container">
           <Loader2 className="animate-spin" size={48} />
           <p>جاري تحميل البيانات...</p>
        </div>
      ) : requestDetails ? (
      <div className="aard-detail-card">
        
        <div className="aard-drow">
          {/* Row 1 */}
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><Building size={16} /></span>
              <span>اسم الجمعية</span>
            </div>
            <div className="aard-dfield-value">{requestDetails.organization_name}</div>
          </div>
          
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><User size={16} /></span>
              <span>مدير الجمعية</span>
            </div>
            <div className="aard-dfield-value">{requestDetails.manager_name}</div>
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
            <div className="aard-dfield-value">{requestDetails.address || "مدينة نصر"}</div>
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
            <div className="aard-dfield-value">{new Date(requestDetails.created_at).toLocaleDateString('en-GB')}</div>
          </div>
          
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><FileBadge size={16} /></span>
              <span>رقم الترخيص</span>
            </div>
            <div className="aard-dfield-value" dir="ltr">{requestDetails.license_number}</div>
          </div>

          {/* Row 3 */}
          <div className="aard-dfield">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><Users size={16} /></span>
              <span>عدد الدعاة التابعين</span>
            </div>
            <div className="aard-dfield-value">{requestDetails.preachers_count} داعية</div>
          </div>

          {/* Row - Document */}
          <div className="aard-dfield aard-dfield-span2">
            <div className="aard-dfield-label">
              <span className="aard-icon-gold"><FileText size={16} /></span>
              <span>الملف المرفق</span>
            </div>
            <div className="aard-document-wrapper">
              <button 
                className="aard-document-link" 
                onClick={() => setIsPdfOpen(true)}
                title="اضغط لمعاينة ملف الترخيص"
                style={{ cursor: 'pointer', background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px' }}
              >
                <FileText size={18} />
                <span>ملف الترخيص الرسمي.pdf</span>
                <Eye size={16} style={{ marginLeft: 'auto', marginRight: '8px', color: '#1a517e' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="aard-error">لم يتم العثور على بيانات لهذا الطلب</div>
      )}

      {/* ── Success Modals ── */}
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

      {rejectSuccessModalOpen && (
        <div className="aard-modal-overlay">
          <div className="aard-modal-content aard-success-modal">
            <button className="aard-modal-close" onClick={() => setRejectSuccessModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="aard-modal-icon-wrapper reject">
              <X size={45} strokeWidth={3} className="aard-modal-icon" />
            </div>
            <h2 className="aard-modal-title">تم الرفض</h2>
            <p className="aard-modal-subtitle">تم رفض طلب الجمعية بنجاح</p>
            <button className="aard-modal-btn aard-success-btn" style={{ backgroundColor: '#ef4444' }} onClick={() => {
              setRejectSuccessModalOpen(false);
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
                onClick={handleReject}
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
      {/* ── PDF Viewer Modal ── */}
      {isPdfOpen && requestDetails?.license_file && (
        <div className="library-viewer-modal" onClick={() => setIsPdfOpen(false)}>
          <div className="library-viewer-content" onClick={e => e.stopPropagation()}>
            <button className="library-viewer-close" onClick={() => setIsPdfOpen(false)}>
               <X size={24} color="#374151" />
            </button>
            <h2 className="library-viewer-title">ملف الترخيص: {requestDetails.organization_name}</h2>
            <div className="library-viewer-body">
              <iframe 
                src={`/uploads/${requestDetails.license_file}`} 
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

export default AdminAssociationRequestDetails;
