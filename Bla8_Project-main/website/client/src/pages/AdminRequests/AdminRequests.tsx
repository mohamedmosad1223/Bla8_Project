import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Eye, Check, X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import './AdminRequests.css';

const AdminRequests = () => {
  const [activeTab, setActiveTab] = useState<'associations' | 'preachers'>('associations');
  const [assocRequests, setAssocRequests] = useState<any[]>([]);
  const [preacherRequests, setPreacherRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (activeTab === 'associations') {
        const res = await api.get('/organizations/', { params: { approval: 'pending' } });
        setAssocRequests(res.data.data);
      } else {
        const res = await api.get('/preachers/', { params: { approval_status: 'pending' } });
        setPreacherRequests(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const onAccept = async (id: string) => {
    try {
      if (activeTab === 'associations') {
        await api.patch(`/organizations/${id}`, { approval_status: 'approved' });
      } else {
        await api.patch(`/preachers/${id}`, { approval_status: 'approved' });
      }
      setSuccessModalOpen(true);
      fetchRequests();
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  const onRejectInitiate = (id: string) => {
    setSelectedId(id);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedId) return;
    try {
      if (activeTab === 'associations') {
        await api.patch(`/organizations/${selectedId}`, { 
          approval_status: 'rejected',
          rejection_reason: rejectNote 
        });
      } else {
        await api.patch(`/preachers/${selectedId}`, { 
          approval_status: 'rejected',
          rejection_reason: rejectNote 
        });
      }
      setRejectModalOpen(false);
      setRejectNote('');
      fetchRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
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
            {loading ? (
              <div className="areq-loading">
                <Loader2 className="animate-spin" size={40} />
              </div>
            ) : (
              <table className="areq-table">
                {activeTab === 'associations' ? (
                  <>
                    <thead>
                      <tr>
                        <th>رقم الطلب </th>
                        <th>اسم الجمعية </th>
                        <th>اسم المدير </th>
                        <th>المحافظة </th>
                        <th>رقم الهاتف </th>
                        <th>تاريخ الطلب </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assocRequests.map((req) => (
                        <tr key={req.org_id}>
                          <td>{req.org_id}</td>
                          <td>{req.organization_name}</td>
                          <td>{req.manager_name}</td>
                          <td>{req.governorate}</td>
                          <td dir="ltr">{req.phone}</td>
                          <td className="areq-date-cell">{new Date(req.created_at).toLocaleDateString('en-GB')}</td>
                          <td>
                            <div className="areq-actions-cell">
                              <button className="areq-action-btn areq-accept-btn" title="قبول" onClick={() => onAccept(req.org_id)}>
                                <Check size={18} />
                              </button>
                              <button className="areq-action-btn areq-reject-btn" title="رفض" onClick={() => onRejectInitiate(req.org_id)}>
                                <X size={18} />
                              </button>
                              <button className="areq-action-btn areq-eye-btn" onClick={() => onView(req.org_id, 'association')} title="عرض التفاصيل">
                                <Eye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {assocRequests.length === 0 && (
                        <tr><td colSpan={7} style={{textAlign: 'center', padding: '40px'}}>لا توجد طلبات جمعيات حالياً</td></tr>
                      )}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th>رقم الطلب </th>
                        <th>اسم الداعية </th>
                        <th>الجنسية </th>
                        <th>المؤهل </th>
                        <th>رقم الهاتف </th>
                        <th>تاريخ الطلب </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {preacherRequests.map((req) => (
                        <tr key={req.preacher_id}>
                          <td>{req.preacher_id}</td>
                          <td>{req.full_name}</td>
                          <td>{req.nationality_name}</td>
                          <td>{req.scientific_qualification}</td>
                          <td dir="ltr">{req.phone}</td>
                          <td className="areq-date-cell">{new Date(req.created_at).toLocaleDateString('en-GB')}</td>
                          <td>
                            <div className="areq-actions-cell">
                              <button className="areq-action-btn areq-accept-btn" title="قبول" onClick={() => onAccept(req.preacher_id)}>
                                <Check size={18} />
                              </button>
                              <button className="areq-action-btn areq-reject-btn" title="رفض" onClick={() => onRejectInitiate(req.preacher_id)}>
                                <X size={18} />
                              </button>
                              <button className="areq-action-btn areq-eye-btn" onClick={() => onView(req.preacher_id, 'preacher')} title="عرض التفاصيل">
                                <Eye size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {preacherRequests.length === 0 && (
                        <tr><td colSpan={7} style={{textAlign: 'center', padding: '40px'}}>لا توجد طلبات دعاة حالياً</td></tr>
                      )}
                    </tbody>
                  </>
                )}
              </table>
            )}
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
            <p className="areq-modal-subtitle">تم الموافقة على الطلب بنجاح</p>
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
                onClick={handleRejectConfirm}
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
