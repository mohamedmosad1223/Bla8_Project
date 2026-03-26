import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Plus, MessageCircle, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import './AdminAssociations.css';

interface AssociationData {
  org_id: number;
  user_id: number;
  organization_name: string;
  manager_name: string;
  preachers_count: number;
  cases_count: number;
  converted_count: number;
  pending_count: number;
  rejected_count: number;
  created_at: string;
  approval_status: string;
  account_status: string;
}

const AdminAssociations = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<AssociationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const navigate = useNavigate();

  const fetchAssociations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizations/', {
        params: {
          search: search || undefined,
          approval: 'approved'
        }
      });
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching associations:', err);
      setError('تعذر تحميل بيانات الجمعيات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssociations();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchAssociations]);

  const toggleActive = async (id: number, currentAccountStatus: string) => {
    try {
      const isActive = currentAccountStatus === 'active';
      await api.patch(`/organizations/${id}`, { is_active: !isActive });
      fetchAssociations(); // Refresh data
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('تعذر تحديث حالة الجمعية');
    }
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await api.delete(`/organizations/${itemToDelete}`);
        fetchAssociations();
      } catch (err) {
        console.error('Error deleting association:', err);
        alert('تعذر حذف الجمعية');
      }
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  if (loading && data.length === 0) {
    return (
      <div className="aadmin-loading-state">
        <Loader2 className="animate-spin" size={48} color="#DBA841" />
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="aadmin-page">
      {/* ── Page Header ── */}
      <div className="aadmin-header">
        <h1 className="aadmin-title">الجمعيات</h1>
        <button 
          className="aadmin-add-btn"
          onClick={() => navigate('/admin/associations/add')}
        >
          <Plus size={16} />
          اضافة جمعية
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="aadmin-toolbar">
        <div className="aadmin-toolbar-left">
          
          {/* Search */}
          <div className="aadmin-search-wrapper">
            <svg className="aadmin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="ابحث"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="aadmin-search-input"
            />
          </div>

          {/* Filter Dropdown (UI Mockup maintained for design) */}
          <div className="aadmin-dropdown-container">
            <button
              className="aadmin-tool-btn"
              onClick={() => {
                setShowFilter(!showFilter);
                setShowSort(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              فلتر
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="aadmin-dropdown-container">
            <button
              className="aadmin-tool-btn"
              onClick={() => {
                setShowSort(!showSort);
                setShowFilter(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
              تصنيف
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="aadmin-error-panel">
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="aadmin-table-wrapper">
        <table className="aadmin-table">
          <thead>
              <tr>
              <th>رقم</th>
              <th>اسم الجمعية</th>
              <th>المشرف</th>
              <th>عدد الدعاة</th>
              <th>الحالات</th>
              <th>أسلم</th>
              <th>قيد الاقناع</th>
              <th>رفض</th>
              <th>تاريخ الانشاء</th>
              <th>مفعل / غير مفعل</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.org_id}>
                <td>{row.org_id}</td>
                <td style={{fontWeight: 'bold'}}>{row.organization_name}</td>
                <td>{row.manager_name}</td>
                <td>{row.preachers_count}</td>
                <td>{row.cases_count}</td>
                <td style={{color: '#10b981', fontWeight: 'bold'}}>{row.converted_count}</td>
                <td>{row.pending_count}</td>
                <td style={{color: '#ef4444'}}>{row.rejected_count}</td>
                <td className="aadmin-date">
                  {new Date(row.created_at).toLocaleDateString('ar-EG')}
                  <br/>
                  {new Date(row.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td>
                  <label className="aadmin-toggle">
                    <input
                      type="checkbox"
                      checked={row.account_status === 'active'}
                      onChange={() => toggleActive(row.org_id, row.account_status)}
                    />
                    <span className="aadmin-toggle-slider" />
                  </label>
                </td>
                <td>
                  <div className="aadmin-row-actions">
                    <button
                      className="aadmin-icon-btn aadmin-view-btn"
                      title="عرض"
                      onClick={() => navigate(`/admin/associations/${row.org_id}`)}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="aadmin-icon-btn aadmin-chat-btn"
                      title="محادثة"
                      onClick={() => navigate(`/admin/chat/${row.user_id}`)}
                      style={{ color: '#dba841' }}
                    >
                      <MessageCircle size={15} />
                    </button>
                    <button
                      className="aadmin-icon-btn aadmin-delete-btn"
                      title="حذف"
                      onClick={() => handleDeleteClick(row.org_id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={11} style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                  لا توجد جمعيات مسجلة حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="aadmin-modal-overlay">
          <div className="aadmin-delete-modal">
            <button 
              className="aadmin-modal-close" 
              onClick={() => setShowDeleteModal(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="aadmin-delete-icon">
              <Trash2 size={32} color="#fff" />
            </div>
            <h2 className="aadmin-delete-title">حذف الجمعية</h2>
            <p className="aadmin-delete-text">هل تود ان تتخذ هذا الاجراء ؟ سيتم حذف جميع بيانات الجمعية بشكل نهائي.</p>
            <div className="aadmin-delete-actions">
              <button 
                className="aadmin-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >الالغاء</button>
              <button 
                className="aadmin-btn-confirm"
                onClick={confirmDelete}
              >تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssociations;
