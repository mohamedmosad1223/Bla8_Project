import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter as SortIcon, SlidersHorizontal, Eye, Check, X, Loader2, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import './AdminRequests.css';

const AdminRequests = () => {
  const [activeTab, setActiveTab] = useState<'associations' | 'preachers'>('associations');
  const [assocRequests, setAssocRequests] = useState<any[]>([]);
  const [preacherRequests, setPreacherRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Search & Filter & Sort States
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Draft Filter States
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');
  const [draftNationality, setDraftNationality] = useState<number | null>(null);
  const [draftGovernorate, setDraftGovernorate] = useState<string>('');

  // Applied Filter States
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [appliedNationality, setAppliedNationality] = useState<number | null>(null);
  const [appliedGovernorate, setAppliedGovernorate] = useState<string>('');

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        skip: 0,
        limit: 100,
        search: appliedSearch || undefined,
        order_by: sortOrder,
      };

      if (activeTab === 'associations') {
        params.approval = 'pending';
        params.created_after = appliedDateFrom || undefined;
        params.created_before = appliedDateTo || undefined;
        params.governorate = appliedGovernorate || undefined;
        
        const res = await api.get('/organizations/', { params });
        setAssocRequests(res.data.data);
      } else {
        params.approval_status = 'pending';
        params.joined_after = appliedDateFrom || undefined;
        params.joined_before = appliedDateTo || undefined;
        params.nationality_country_id = appliedNationality || undefined;

        const res = await api.get('/preachers/', { params });
        setPreacherRequests(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, appliedSearch, appliedDateFrom, appliedDateTo, appliedNationality, appliedGovernorate, sortOrder]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Click outside close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleApplyFilter = () => {
    setAppliedDateFrom(draftDateFrom);
    setAppliedDateTo(draftDateTo);
    setAppliedNationality(draftNationality);
    setAppliedGovernorate(draftGovernorate);
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
    setDraftDateFrom('');
    setDraftDateTo('');
    setDraftNationality(null);
    setDraftGovernorate('');
  };

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
    setRejectNote('');
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

  // Reference Data
  const nationalities = [
    { id: 1, name: 'مصري' },
    { id: 2, name: 'سعودي' },
    { id: 3, name: 'سوري' },
    { id: 4, name: 'أردني' },
    { id: 5, name: 'كويتي' },
  ];

  const governorates = [
    { id: 'jahra', name: 'محافظة الجهراء' },
    { id: 'asima', name: 'محافظة العاصمة' },
    { id: 'farwaniya', name: 'محافظة الفروانية' },
    { id: 'hawalli', name: 'محافظة حولي' },
    { id: 'mubarak_al_kabeer', name: 'محافظة مبارك الكبير' },
    { id: 'ahmadi', name: 'محافظة الأحمدي' },
    { id: 'other', name: 'أخرى' },
  ];

  const getGovernorateName = (id: string) => {
    return governorates.find(g => g.id === id)?.name || id;
  };

  return (
    <div className="areq-page">
      {/* ── Header ── */}
      <div className="areq-header-area">
        <h1 className="areq-title">الطلبات</h1>

        <div className="admin-toolbar left-aligned">
          <div className="admin-toolbar-group">
            {/* Search */}
            <div className="admin-search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="ابحث بالاسم أو الرقم"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div className="admin-dropdown-container" ref={filterRef}>
              <button
                className={`admin-tool-btn ${isFilterOpen ? 'active' : ''}`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <SlidersHorizontal size={18} />
                فلتر
                {(appliedDateFrom || appliedDateTo || appliedNationality || appliedGovernorate) && (
                  <span className="filter-dot" style={{width: '6px', height: '6px', background: 'var(--primary-gold)', borderRadius: '50%', marginRight: '4px'}} />
                )}
              </button>

              {isFilterOpen && (
                <div className="filter-panel" style={{position: 'absolute', top: '100%', right: 0, zIndex: 100, background: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '280px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
                    <h2 style={{margin: 0, fontSize: '1.1rem'}}>الفلتر</h2>
                    <button className="admin-tool-btn active" onClick={handleApplyFilter} style={{padding: '4px 12px'}}>تطبيق</button>
                  </div>

                  <div className="filter-body">
                    {/* Date Range Accordion */}
                    <div style={{marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', cursor: 'pointer'}} onClick={() => setOpenAccordion(openAccordion === 'date' ? null : 'date')}>
                        <span>تاريخ الطلب</span>
                        <ChevronDown size={16} />
                      </div>
                      {openAccordion === 'date' && (
                        <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                             <span style={{fontSize: '0.8rem', minWidth: '25px'}}>من</span>
                             <input type="date" value={draftDateFrom} onChange={e => setDraftDateFrom(e.target.value)} style={{border: '1px solid #eee', borderRadius: '4px', padding: '4px'}} />
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                             <span style={{fontSize: '0.8rem', minWidth: '25px'}}>إلى</span>
                             <input type="date" value={draftDateTo} onChange={e => setDraftDateTo(e.target.value)} style={{border: '1px solid #eee', borderRadius: '4px', padding: '4px'}} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nationality Accordion (Preachers only) */}
                    {activeTab === 'preachers' && (
                      <div style={{marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', cursor: 'pointer'}} onClick={() => setOpenAccordion(openAccordion === 'nat' ? null : 'nat')}>
                          <span>الجنسية</span>
                          <ChevronDown size={16} />
                        </div>
                        {openAccordion === 'nat' && (
                          <div style={{marginTop: '8px'}}>
                             <div className="filter-submenu-list bordered-list">
                                <label className="submenu-item" onClick={() => setDraftNationality(null)}>
                                  <div className={`checkbox-custom check-align-left ${draftNationality === null ? 'checked-gold' : ''}`}>
                                    {draftNationality === null && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>الكل</span>
                                </label>
                                {nationalities.map(nat => (
                                  <label key={nat.id} className="submenu-item" onClick={() => setDraftNationality(nat.id)}>
                                    <div className={`checkbox-custom check-align-left ${draftNationality === nat.id ? 'checked-gold' : ''}`}>
                                      {draftNationality === nat.id && <Check size={12} strokeWidth={3} color="white" />}
                                    </div>
                                    <span>{nat.name}</span>
                                  </label>
                                ))}
                             </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Governorate Accordion (Associations only) */}
                    {activeTab === 'associations' && (
                      <div style={{marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', cursor: 'pointer'}} onClick={() => setOpenAccordion(openAccordion === 'gov' ? null : 'gov')}>
                          <span>المحافظة</span>
                          <ChevronDown size={16} />
                        </div>
                        {openAccordion === 'gov' && (
                          <div style={{marginTop: '8px'}}>
                             <div className="filter-submenu-list bordered-list">
                                <label className="submenu-item" onClick={() => setDraftGovernorate('')}>
                                  <div className={`checkbox-custom check-align-left ${draftGovernorate === '' ? 'checked-gold' : ''}`}>
                                    {draftGovernorate === '' && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>الكل</span>
                                </label>
                                {governorates.map(gov => (
                                  <label key={gov.id} className="submenu-item" onClick={() => setDraftGovernorate(gov.id)}>
                                    <div className={`checkbox-custom check-align-left ${draftGovernorate === gov.id ? 'checked-gold' : ''}`}>
                                      {draftGovernorate === gov.id && <Check size={12} strokeWidth={3} color="white" />}
                                    </div>
                                    <span>{gov.name}</span>
                                  </label>
                                ))}
                             </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reset */}
                    {(draftDateFrom || draftDateTo || draftNationality !== null || draftGovernorate) && (
                      <button className="btn-reset-filter" onClick={handleResetFilter} style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', marginTop: '12px'}}>
                        <X size={14} /> إعادة ضبط الفلتر
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="admin-dropdown-container" ref={sortRef}>
              <button className={`admin-tool-btn ${isSortOpen ? 'active' : ''}`} onClick={() => setIsSortOpen(!isSortOpen)}>
                <SortIcon size={18} />
                تصنيف
              </button>
              {isSortOpen && (
                <div className="admin-dropdown-menu">
                  <button className={`admin-dropdown-item ${sortOrder === 'latest' ? 'selected' : ''}`} onClick={() => { setSortOrder('latest'); setIsSortOpen(false); }}>
                    الأحدث
                  </button>
                  <button className={`admin-dropdown-item ${sortOrder === 'oldest' ? 'selected' : ''}`} onClick={() => { setSortOrder('oldest'); setIsSortOpen(false); }}>
                    الأقدم
                  </button>
                </div>
              )}
            </div>
          </div>
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
                        <th>رقم الطلب</th>
                        <th>اسم الجمعية</th>
                        <th>اسم المدير</th>
                        <th>المحافظة</th>
                        <th>رقم الهاتف</th>
                        <th>تاريخ الطلب</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assocRequests.map((req) => (
                        <tr key={req.org_id}>
                          <td>{req.org_id}</td>
                          <td>{req.organization_name}</td>
                          <td>{req.manager_name}</td>
                          <td>{getGovernorateName(req.governorate)}</td>
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
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>لا توجد طلبات جمعيات حالياً</td></tr>
                      )}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th>رقم الطلب</th>
                        <th>اسم الداعية</th>
                        <th>الجنسية</th>
                        <th>المؤهل</th>
                        <th>رقم الهاتف</th>
                        <th>تاريخ الطلب</th>
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
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>لا توجد طلبات دعاة حالياً</td></tr>
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

