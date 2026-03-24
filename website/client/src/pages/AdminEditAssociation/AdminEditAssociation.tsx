import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Calendar, Eye, Check, X } from 'lucide-react';
import '../AdminAddAssociation/AdminAddAssociation.css';

const AdminEditAssociation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showStatusModal, setShowStatusModal] = useState<'success' | 'error' | null>(null);

  const handleSave = () => {
    // Simulate save logic
    setShowStatusModal('success');
  };

  const handleCancel = () => {
    navigate(`/admin/associations/${id}`);
  };

  return (
    <div className="aadd-page">
      {/* ── Breadcrumb & Title ── */}
      <div className="aadd-header">
        <div className="aadd-breadcrumb">
          <span 
            className="aadd-crumb-link" 
            onClick={() => navigate('/admin/associations')}
          >الجمعيات</span>
          <span className="aadd-crumb-separator">{'<'}</span>
          <span className="aadd-crumb-current">تعديل بيانات الجمعية</span>
        </div>
        <h1 className="aadd-title">تعديل بيانات الجمعية</h1>
      </div>

      {/* ── Form Card ── */}
      <div className="aadd-card">
        <div className="aadd-grid">
          {/* Row 1 */}
          <div className="aadd-group">
            <label className="aadd-label">اسم الجمعية</label>
            <input type="text" className="aadd-input" defaultValue="جمعية رسالة الاسلام" />
          </div>
          <div className="aadd-group">
            <label className="aadd-label">اسم مشرف الجمعية</label>
            <input type="text" className="aadd-input" defaultValue="احمد عاطف" />
          </div>

          {/* Row 2 */}
          <div className="aadd-group">
            <label className="aadd-label">رقم السجل / الترخيص</label>
            <input type="text" className="aadd-input" defaultValue="56552631525263263" />
          </div>
          <div className="aadd-group">
            <label className="aadd-label">الدولة</label>
            <div className="aadd-select-wrapper">
              <select className="aadd-input aadd-select" defaultValue="kw">
                <option value="">الدولة</option>
                <option value="kw">الكويت</option>
                <option value="sa">السعودية</option>
              </select>
              <ChevronDown className="aadd-select-icon" size={18} />
            </div>
          </div>

          {/* Row 3 */}
          <div className="aadd-group">
            <label className="aadd-label">البريد الالكتروني</label>
            <input type="email" className="aadd-input" defaultValue="Ahmed@gmail.com" />
          </div>
          <div className="aadd-group">
            <label className="aadd-label">رقم الهاتف الخاص بالجمعية</label>
            <input type="text" className="aadd-input" defaultValue="+201155591759" style={{direction: 'ltr', textAlign: 'right'}} />
          </div>

          {/* Row 4 */}
          <div className="aadd-group">
            <label className="aadd-label">عنوان الجمعية</label>
            <input type="text" className="aadd-input" defaultValue="يكتب العنوان" />
          </div>
          <div className="aadd-group">
            <label className="aadd-label">تاريخ تأسيس الجمعية</label>
            <div className="aadd-input-with-icon left">
              <Calendar className="aadd-icon-left" size={18} />
              <input type="text" className="aadd-input" defaultValue="25/6/2025" />
            </div>
          </div>

          {/* Row 5 */}
          <div className="aadd-group">
            <label className="aadd-label">كلمة السر</label>
            <div className="aadd-input-with-icon left">
              <Eye className="aadd-icon-left" size={18} />
              <input type="password" className="aadd-input" defaultValue="123456" />
            </div>
          </div>
          <div className="aadd-group">
            <label className="aadd-label">تأكيد كلمة السر</label>
            <div className="aadd-input-with-icon left">
              <Eye className="aadd-icon-left" size={18} />
              <input type="password" className="aadd-input" defaultValue="123456" />
            </div>
          </div>
        </div>

        {/* ── Action ── */}
        <div className="aadd-actions" style={{gap: '16px'}}>
          <button 
            className="aadd-save-btn" 
            style={{background: '#F3F4F6', color: '#1A1A2E'}}
            onClick={handleCancel}
          >
            الغاء
          </button>
          <button className="aadd-save-btn" onClick={handleSave}>
            حفظ التعديل
          </button>
        </div>
      </div>

      {/* ── Status Modals ── */}
      {showStatusModal === 'success' && (
        <div className="aadd-modal-overlay">
          <div className="aadd-status-modal">
            <button className="aadd-modal-close" onClick={() => setShowStatusModal(null)}>
               <X size={20} />
            </button>
            <div className="aadd-status-icon success">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="aadd-status-title">تم بنجاح!</h2>
            <p className="aadd-status-desc">تم تعديل بيانات الجمعية بنجاح</p>
            <button className="aadd-status-btn success" onClick={() => navigate(`/admin/associations/${id}`)}>
              تم
            </button>
          </div>
        </div>
      )}

      {showStatusModal === 'error' && (
        <div className="aadd-modal-overlay">
          <div className="aadd-status-modal">
            <button className="aadd-modal-close" onClick={() => setShowStatusModal(null)}>
               <X size={20} />
            </button>
            <div className="aadd-status-icon error">
              <X size={40} strokeWidth={3} />
            </div>
            <h2 className="aadd-status-title">حدث خطأ!</h2>
            <p className="aadd-status-desc">لقد حدث خطأ اثناء حفظ التعديلات</p>
            <button className="aadd-status-btn error" onClick={() => setShowStatusModal(null)}>
              حاول مرة اخري
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminEditAssociation;
