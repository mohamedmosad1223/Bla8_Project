import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Eye, Check, X } from 'lucide-react';
import './AdminRequests.css';

const MOCK_ASSOC_REQUESTS = [
  { 
    id: '101', 
    name: 'جمعية النور', 
    licenseNumber: '1234567',
    managerName: 'أحمد محمود',
    country: 'الكويت',
    governorate: 'محافظة العاصمة',
    phone: '+965 12345678',
    email: 'noor@test.com',
    date: '22/02/2023' 
  },
  { 
    id: '102', 
    name: 'جمعية الهدى', 
    licenseNumber: '7654321',
    managerName: 'سيد علي',
    country: 'الكويت',
    governorate: 'محافظة حولي',
    phone: '+965 87654321',
    email: 'hoda@test.com',
    date: '23/02/2023' 
  },
];

const MOCK_PREACHER_REQUESTS = [
  { 
    id: '201', 
    fullName: 'أحمد محمود', 
    nationality: 'مصري',
    qualification: 'ليسانس أصول الدين',
    phone: '+20 1099887766',
    email: 'ahmed@test.com',
    date: '24/02/2023' 
  },
  { 
    id: '202', 
    fullName: 'سيد علي', 
    nationality: 'سعودي',
    qualification: 'بكالوريوس شريعة',
    phone: '+966 501234567',
    email: 'sayed@test.com',
    date: '25/02/2023' 
  },
];

const AdminRequests = () => {
  const [activeTab, setActiveTab] = useState<'associations' | 'preachers'>('associations');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  
  const navigate = useNavigate();

  const onAccept = (id: string) => {
    console.log('Selected for accept:', id);
    setSuccessModalOpen(true);
  };
  const onReject = (id: string) => {
    console.log('Selected for reject:', id);
    setRejectModalOpen(true);
  };
  const onView = (id: string, type: 'association' | 'preacher') => {
    if (type === 'preacher') {
      navigate(`/admin/requests/preachers/${id}`);
    } else {
      navigate(`/admin/requests/associations/${id}`);
    }
  };

  return (
    <div className="areq-page">
      {/* ── Header ── */}
      <div className="areq-header-area">
        <div>
          <h1 className="areq-title">الطلبات</h1>
        </div>
        
        <div className="areq-actions">
          <div className="areq-search-wrapper">
            <input type="text" placeholder="ابحث" className="areq-search-input" />
            <Search size={20} className="areq-search-icon" />
          </div>
          <button className="areq-filter-btn">
            فلتر
            <SlidersHorizontal size={18} />
          </button>
          <button className="areq-filter-btn">
            تصنيف
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="areq-tabs">
        <button 
          className={`areq-tab-btn ${activeTab === 'associations' ? 'active' : ''}`}
          onClick={() => setActiveTab('associations')}
        >
          طلبات الجمعيات
        </button>
        <button 
          className={`areq-tab-btn ${activeTab === 'preachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('preachers')}
        >
          طلبات الدعاة
        </button>
      </div>

      {/* ── Table Content ── */}
      <div className="areq-body-wrapper">
        <div className="areq-content">
          <div className="areq-table-wrapper">
            <table className="areq-table">
              {activeTab === 'associations' ? (
                <>
                  <thead>
                    <tr>
                      <th>رقم الطلب <span className="sort-arrow">↕</span></th>
                      <th>اسم الجمعية <span className="sort-arrow">↕</span></th>
                      <th>اسم المدير <span className="sort-arrow">↕</span></th>
                      <th>المحافظة <span className="sort-arrow">↕</span></th>
                      <th>رقم الهاتف <span className="sort-arrow">↕</span></th>
                      <th>تاريخ الطلب <span className="sort-arrow">↕</span></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ASSOC_REQUESTS.map((req) => (
                      <tr key={req.id}>
                        <td>{req.id}</td>
                        <td>{req.name}</td>
                        <td>{req.managerName}</td>
                        <td>{req.governorate}</td>
                        <td dir="ltr">{req.phone}</td>
                        <td className="areq-date-cell">{req.date}</td>
                        <td>
                          <div className="areq-actions-cell">
                            <button className="areq-action-btn areq-accept-btn" title="قبول" onClick={() => onAccept(req.id)}>
                              <Check size={18} />
                            </button>
                            <button className="areq-action-btn areq-reject-btn" title="رفض" onClick={() => onReject(req.id)}>
                              <X size={18} />
                            </button>
                            <button className="areq-action-btn areq-eye-btn" onClick={() => onView(req.id, 'association')} title="عرض التفاصيل">
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr>
                      <th>رقم الطلب <span className="sort-arrow">↕</span></th>
                      <th>اسم الداعية <span className="sort-arrow">↕</span></th>
                      <th>الجنسية <span className="sort-arrow">↕</span></th>
                      <th>المؤهل <span className="sort-arrow">↕</span></th>
                      <th>رقم الهاتف <span className="sort-arrow">↕</span></th>
                      <th>تاريخ الطلب <span className="sort-arrow">↕</span></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PREACHER_REQUESTS.map((req) => (
                      <tr key={req.id}>
                        <td>{req.id}</td>
                        <td>{req.fullName}</td>
                        <td>{req.nationality}</td>
                        <td>{req.qualification}</td>
                        <td dir="ltr">{req.phone}</td>
                        <td className="areq-date-cell">{req.date}</td>
                        <td>
                          <div className="areq-actions-cell">
                            <button className="areq-action-btn areq-accept-btn" title="قبول" onClick={() => onAccept(req.id)}>
                              <Check size={18} />
                            </button>
                            <button className="areq-action-btn areq-reject-btn" title="رفض" onClick={() => onReject(req.id)}>
                              <X size={18} />
                            </button>
                            <button className="areq-action-btn areq-eye-btn" onClick={() => onView(req.id, 'preacher')} title="عرض التفاصيل">
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {successModalOpen && (
        <div className="areq-modal-overlay">
          <div className="areq-modal-content areq-success-modal">
            <button className="areq-modal-close" onClick={() => setSuccessModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="areq-modal-icon-wrapper success">
              <Check size={40} className="areq-modal-icon" />
            </div>
            <h2 className="areq-modal-title">تم بنجاح!</h2>
            <p className="areq-modal-subtitle">تم استلام الطلب بنجاح</p>
            <button className="areq-modal-btn areq-success-btn" onClick={() => setSuccessModalOpen(false)}>
              تم
            </button>
          </div>
        </div>
      )}

    {rejectModalOpen && (
        <div className="areq-modal-overlay">
          <div className="areq-modal-content areq-reject-modal" dir="rtl">
            <button className="areq-modal-close" onClick={() => setRejectModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="areq-modal-icon-wrapper reject">
              <X size={45} strokeWidth={3} className="areq-modal-icon" />
            </div>
            <h2 className="areq-modal-title">رفض الطلب</h2>
            <p className="areq-modal-subtitle">هل تود ان تتخذ هذا الاجراء ؟</p>
            
            <div className="areq-reject-note-container">
              <label className="areq-reject-label">ملاحظة</label>
              <textarea 
                className="areq-reject-textarea" 
                placeholder="مثال ملاحظة"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              ></textarea>
            </div>

            <div className="areq-modal-actions" dir="ltr">
              <button 
                className="areq-modal-btn areq-confirm-btn" 
                disabled={!rejectNote.trim()}
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectNote('');
                }}
              >
                تأكيد
              </button>
              <button className="areq-modal-btn areq-cancel-btn" onClick={() => setRejectModalOpen(false)}>
                الغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminRequests;
