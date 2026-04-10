import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Plus, MessageCircle, Loader2, AlertTriangle, Search, ChevronDown, Check } from 'lucide-react';
import api from '../../services/api';
import ErrorModal from '../../components/common/Modal/ErrorModal';
import SuccessModal from '../../components/common/Modal/SuccessModal';
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
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  
  // Filter states (matching AdminCallers pattern)
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all' as 'all' | 'active' | 'suspended'
  });

  const [filterDraft, setFilterDraft] = useState({
    startDate: '',
    endDate: '',
    status: 'all' as 'all' | 'active' | 'suspended'
  });


  
  const [data, setData] = useState<AssociationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  
  // Refs for click outside
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // ... (modals state kept)
  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Error Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  // Handle Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAssociations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizations/', {
        params: {
          search: search || undefined,
          approval: 'approved',
          order_by: sortBy,
          created_after: appliedFilters.startDate || undefined,
          created_before: appliedFilters.endDate || undefined,
          status: appliedFilters.status !== 'all' ? appliedFilters.status : undefined
        }
      });
      setData(response.data.data);
      setError(null);
    } catch (err: unknown) {
      const error = err as any; 
      console.error('Error fetching associations:', error);
      setError('تعذر تحميل بيانات الجمعيات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, appliedFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssociations();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchAssociations]);



  const handleApplyFilters = () => {
    setAppliedFilters({ ...filterDraft });
    setShowFilter(false);
  };

  const handleResetFilters = () => {
    const empty = {
      startDate: '',
      endDate: '',
      status: 'all' as const
    };
    setFilterDraft(empty);
    setAppliedFilters(empty);
    setShowFilter(false);
  };

  const toggleActive = async (id: number, currentAccountStatus: string) => {
    try {
      const isActive = currentAccountStatus === 'active';
      const newStatus = isActive ? 'suspended' : 'active';
      
      const response = await api.patch(`/admins/management/organizations/${id}/status`, { 
        status: newStatus 
      });
      
      setSuccessMessage(response.data.message || 'تم تحديث حالة الجمعية بنجاح');
      setIsSuccessModalOpen(true);
      fetchAssociations(); // Refresh data
    } catch (err: unknown) {
      const error = err as any; 
      console.error('Error toggling status:', error);
      setErrorMessage(error.response?.data?.detail || 'تعذر تحديث حالة الجمعية');
      setIsErrorModalOpen(true);
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
      } catch (err: any) {
        console.error('Error deleting association:', err);
        setErrorMessage(err.response?.data?.detail || 'تعذر حذف الجمعية');
        setIsErrorModalOpen(true);
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
      <div className="admin-toolbar left-aligned">
        <div className="admin-toolbar-group">
          
          {/* Search */}
          <div className="admin-search-box">
             <Search size={18} />
             <input
               type="text"
               placeholder="ابحث باسم الجمعية او المشرف..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>

          {/* Filter Dropdown */}
          <div className="aadmin-dropdown-container" ref={filterRef}>
            <button
              className={`admin-tool-btn ${showFilter ? 'active' : ''}`}
              onClick={() => { setShowFilter(!showFilter); setShowSort(false); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
              فلتر
            </button>

            {showFilter && (
              <div className="aadmin-filter-panel" dir="rtl">
                <div className="aadmin-filter-panel-header">
                  <h2 className="aadmin-filter-title">الفلتر</h2>
                  <button className="aadmin-btn-apply-filter" onClick={handleApplyFilters}>تطبيق الفلتر</button>
                </div>

                <div className="aadmin-filter-body">
                  {/* Account Status Accordion */}
                  <div className="aadmin-filter-accordion">
                    <div 
                      className="aadmin-filter-accordion-header" 
                      onClick={() => setOpenAccordion(openAccordion === 'status' ? null : 'status')}
                    >
                      <span>حالة الحساب</span>
                      <ChevronDown size={16} className={`text-gray ${openAccordion === 'status' ? 'rotate-180' : ''}`} />
                    </div>
                    {openAccordion === 'status' && (
                      <div className="aadmin-filter-accordion-content mt-2">
                         <div className="aadmin-filter-submenu-list">
                            {['all', 'active', 'suspended'].map((s) => (
                              <label key={s} className="aadmin-submenu-item" onClick={() => setFilterDraft({...filterDraft, status: s as any})}>
                                <div className={`aadmin-checkbox-custom ${filterDraft.status === s ? 'checked-gold' : ''}`}>
                                  {filterDraft.status === s && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>{s === 'all' ? 'الكل' : s === 'active' ? 'مفعل' : 'غير مفعل'}</span>
                              </label>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Date Range Accordion */}
                  <div className="aadmin-filter-accordion">
                    <div 
                      className="aadmin-filter-accordion-header" 
                      onClick={() => setOpenAccordion(openAccordion === 'date' ? null : 'date')}
                    >
                      <span>تاريخ الإنشاء</span>
                      <ChevronDown size={16} className={`text-gray ${openAccordion === 'date' ? 'rotate-180' : ''}`} />
                    </div>
                    {openAccordion === 'date' && (
                      <div className="aadmin-filter-accordion-content mt-2">
                        <div className="aadmin-filter-date-row">
                          <div className="aadmin-date-field">
                            <label>من</label>
                            <input 
                              type="date" 
                              value={filterDraft.startDate}
                              onChange={(e) => setFilterDraft({...filterDraft, startDate: e.target.value})}
                            />
                          </div>
                          <div className="aadmin-date-field">
                            <label>إلى</label>
                            <input 
                              type="date" 
                              value={filterDraft.endDate}
                              onChange={(e) => setFilterDraft({...filterDraft, endDate: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button className="aadmin-filter-reset-btn" onClick={handleResetFilters}>إعادة ضبط الفلتر</button>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="aadmin-dropdown-container" ref={sortRef}>
            <button
              className={`admin-tool-btn ${showSort ? 'active' : ''}`}
              onClick={() => { setShowSort(!showSort); setShowFilter(false); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
              تصنيف: {sortBy === 'latest' ? 'الأحدث' : 'الأقدم'}
            </button>

            {showSort && (
              <div className="aadmin-dropdown-menu">
                <button 
                  className={`admin-dropdown-item ${sortBy === 'latest' ? 'selected' : ''}`}
                  onClick={() => { setSortBy('latest'); setShowSort(false); }}
                >
                  الأحدث
                </button>
                <button 
                  className={`admin-dropdown-item ${sortBy === 'oldest' ? 'selected' : ''}`}
                  onClick={() => { setSortBy('oldest'); setShowSort(false); }}
                >
                  الأقدم
                </button>
              </div>
            )}
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
              <th>الإجراءات</th>
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
                      className="aadmin-icon-btn-circle view-btn"
                      title="عرض"
                      onClick={() => navigate(`/admin/associations/${row.org_id}`)}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="aadmin-icon-btn-circle chat-btn"
                      title="محادثة"
                      onClick={() => navigate(`/admin/chat/${row.user_id}`)}
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button
                      className="aadmin-icon-btn-circle delete-btn"
                      title="حذف"
                      onClick={() => handleDeleteClick(row.org_id)}
                    >
                      <Trash2 size={18} />
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

      {/* ── Mobile Cards (Visible on mobile only via CSS) ── */}
      <div className="aadmin-mobile-cards">
        {data.map((row) => (
          <div key={row.org_id} className="aadmin-card">
            <div className="aadmin-card-header">
              <div className="aadmin-card-id">#{row.org_id}</div>
              <div className="aadmin-card-title">{row.organization_name}</div>
              <label className="aadmin-toggle card-toggle">
                <input
                  type="checkbox"
                  checked={row.account_status === 'active'}
                  onChange={() => toggleActive(row.org_id, row.account_status)}
                />
                <span className="aadmin-toggle-slider" />
              </label>
            </div>
            
            <div className="aadmin-card-info">
              <div className="aadmin-card-row">
                <span className="aadmin-card-label">المشرف:</span>
                <span className="aadmin-card-value">{row.manager_name}</span>
              </div>
              <div className="aadmin-card-row">
                <span className="aadmin-card-label">تاريخ الانشاء:</span>
                <span className="aadmin-card-value">
                   {new Date(row.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>

            <div className="aadmin-card-stats">
              <div className="aadmin-stat-item">
                <span className="aadmin-stat-label">الدعاة</span>
                <span className="aadmin-stat-value">{row.preachers_count}</span>
              </div>
              <div className="aadmin-stat-item">
                <span className="aadmin-stat-label">الحالات</span>
                <span className="aadmin-stat-value">{row.cases_count}</span>
              </div>
              <div className="aadmin-stat-item">
                <span className="aadmin-stat-label">أسلم</span>
                <span className="aadmin-stat-value success">{row.converted_count}</span>
              </div>
              <div className="aadmin-stat-item">
                <span className="aadmin-stat-label">قيد الإقناع</span>
                <span className="aadmin-stat-value warning">{row.pending_count}</span>
              </div>
              <div className="aadmin-stat-item">
                <span className="aadmin-stat-label">رفض</span>
                <span className="aadmin-stat-value danger">{row.rejected_count}</span>
              </div>
            </div>

            <div className="aadmin-card-actions">
              <button
                className="aadmin-card-btn view"
                onClick={() => navigate(`/admin/associations/${row.org_id}`)}
              >
                <Eye size={18} />
                عرض التفاصيل
              </button>
              <div className="aadmin-card-secondary-actions">
                <button
                  className="aadmin-icon-btn-circle chat-btn"
                  onClick={() => navigate(`/admin/chat/${row.user_id}`)}
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  className="aadmin-icon-btn-circle delete-btn"
                  onClick={() => handleDeleteClick(row.org_id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && data.length === 0 && (
          <div className="aadmin-empty-state-mobile">
            لا توجد جمعيات مسجلة حالياً
          </div>
        )}
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

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="تم بنجاح"
        description={successMessage}
      />
    </div>
  );
};

export default AdminAssociations;
