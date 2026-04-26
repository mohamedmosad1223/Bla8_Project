import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter as FilterIcon, SortDesc, ChevronDown,
  X, Check, Trash2, Eye, Edit, MessageCircle, Loader2, AlertCircle
} from 'lucide-react';
import { preacherService } from '../../services/preacherService';
import './Callers.css';
import ErrorModal from '../../components/common/Modal/ErrorModal';

// ── Types ──────────────────────────────────────────────────────────────────
interface PreacherAPI {
  preacher_id:              number;
  user_id:                  number;
  full_name:                string;
  type:                     string;
  status:                   string;   // 'active' | 'suspended'
  approval_status:          string;
  phone:                    string | null;
  email:                    string | null;
  gender:                   string | null;
  nationality_country_id:   number | null;
  nationality_name:         string;
  language_names:           string[];
  org_id:                   number | null;
  scientific_qualification: string;
  created_at:               string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const parseList = (res: unknown): PreacherAPI[] => {
  if (Array.isArray(res)) return res as PreacherAPI[];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.data))      return r.data as PreacherAPI[];
  if (Array.isArray(r.items))     return r.items as PreacherAPI[];
  if (Array.isArray(r.preachers)) return r.preachers as PreacherAPI[];
  return [];
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  } catch { return iso; }
};

// ── Constants ──────────────────────────────────────────────────────────────


// نوع الداعيه: official = داعية رسمي (تابع لجمعية) / volunteer = منفرد
const TYPE_MAP: Record<string, string> = { official: 'داعية', volunteer: 'منفرد' };

const DeleteModal = ({ onClose, onConfirm, preacherName, loading }: { 
  onClose: () => void; 
  onConfirm: () => void;
  preacherName: string;
  loading: boolean;
}) => (
  <div className="callers-modal-overlay">
    <div className="callers-modal" dir="rtl">
      <button className="callers-modal-close" onClick={onClose}><X size={20} /></button>
      <div className="callers-modal-content">
        <div className="callers-modal-icon-danger">
          <Trash2 size={40} strokeWidth={2.5} />
        </div>
        <h2 className="callers-modal-title">تأكيد الحذف</h2>
        <p className="callers-modal-desc">
          هل أنت متأكد من حذف الداعية <strong>"{preacherName}"</strong> تماماً من النظام؟
        </p>
        <div className="callers-modal-actions">
          <button className="callers-modal-btn callers-btn-cancel" onClick={onClose} disabled={loading}>
            إلغاء
          </button>
          <button className="callers-modal-btn callers-btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={18} className="spin-icon" /> : 'تأكيد الحذف'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const Callers = () => {
  const navigate = useNavigate();

  // ── Data state ─────────────────────────────────────────────────────────
  const [allPreachers,  setAllPreachers]  = useState<PreacherAPI[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [togglingId,    setTogglingId]    = useState<number | null>(null); 
  const [isPending,     setIsPending]     = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [preacherToDelete, setPreacherToDelete] = useState<PreacherAPI | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Error Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ── Search & Sort state ────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [sortOrder,  setSortOrder]  = useState<'latest' | 'oldest'>('latest');

  // ── Filter panel state ─────────────────────────────────────────────────
  const [isFilterOpen,    setIsFilterOpen]    = useState(false);
  const [isSortOpen,      setIsSortOpen]      = useState(false);
  const [openAccordion,   setOpenAccordion]   = useState<string | null>(null);
  const [filterDateAfter, setFilterDateAfter] = useState('');       // joined_after
  const [filterGender,    setFilterGender]    = useState<string>(''); // '' | 'male' | 'female'
  const [filterStatus,    setFilterStatus]    = useState<string>(''); // '' | 'active' | 'suspended'
  const [filterLanguages, setFilterLanguages] = useState<string[]>([]); // Arabic names – local filter
  const [systemLangs,     setSystemLangs]     = useState<{id: number, name: string}[]>([]); 

  // Check if organization is suspended
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isSuspended = userData.status === 'suspended';

  const sortRef   = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Close dropdowns on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current   && !sortRef.current.contains(e.target as Node))   setIsSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch from API ─────────────────────────────────────────────────────
  const fetchPreachers = useCallback(async (order: 'latest' | 'oldest' = sortOrder) => {
    try {
      setLoading(true);
      setError(null);

      const filters: Record<string, unknown> = { order_by: order };
      if (filterDateAfter) filters.joined_after = filterDateAfter;
      if (filterGender)    filters.gender       = filterGender;
      if (filterStatus)    filters.status       = filterStatus;

      const res = await preacherService.getAll(0, 200, filters);
      setAllPreachers(parseList(res));

      // جلب لغات النظام للفلتر (لو مش موجودة)
      if (systemLangs.length === 0) {
        try {
            const langRes = await preacherService.getAllLanguages();
            const langs = langRes.data || langRes;
            if (Array.isArray(langs)) setSystemLangs(langs);
        } catch (e) {
            console.error("Failed to load langs for filter", e);
        }
      }
    } catch (err) {
      console.error('Failed to fetch preachers:', err);
      setError('تعذّر تحميل قائمة الدعاة، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder, filterDateAfter, filterGender, filterStatus]);

  // Initial fetch
  useEffect(() => { 
    // Check approval status
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const status = userData?.extra_data?.approval_status;
    if (status === 'pending' || status === 'rejected') {
      setIsPending(true);
    }
    fetchPreachers(); 
  }, [fetchPreachers]);

  // ── Toggle active/suspended ────────────────────────────────────────────
  const toggleActive = async (preacher: PreacherAPI) => {
    if (isSuspended) return; // Prevent action if suspended
    const newStatus = preacher.status === 'active' ? 'suspended' : 'active';
    setTogglingId(preacher.preacher_id);
    try {
      await preacherService.update(preacher.preacher_id, { status: newStatus });
      // تحديث محلي فوري بدون إعادة تحميل كامل
      setAllPreachers(prev =>
        prev.map(p => p.preacher_id === preacher.preacher_id ? { ...p, status: newStatus } : p)
      );
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setErrorMessage(err.response?.data?.detail || 'تعذّر تغيير حالة الداعية، يرجى المحاولة مرة أخرى');
      setIsErrorModalOpen(true);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Apply filter panel ─────────────────────────────────────────────────
  const applyFilter = () => {
    setIsFilterOpen(false);
    fetchPreachers();
  };

  // ── Apply sort ─────────────────────────────────────────────────────────
  const applySort = (order: 'latest' | 'oldest') => {
    setSortOrder(order);
    setIsSortOpen(false);
    fetchPreachers(order);
  };

  // ── DELETE PREACHER ────────────────────────────────────────────────────
  const handleDelete = (preacher: PreacherAPI) => {
    if (isSuspended) return;
    setPreacherToDelete(preacher);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!preacherToDelete) return;
    setDeleteLoading(true);
    try {
      await preacherService.delete(preacherToDelete.preacher_id);
      setAllPreachers(prev => prev.filter(p => p.preacher_id !== preacherToDelete.preacher_id));
      setIsDeleteModalOpen(false);
      setPreacherToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete preacher:', err);
      setErrorMessage(err.response?.data?.detail || 'حدث خطأ أثناء حذف الداعية، يرجى المحاولة مرة أخرى');
      setIsErrorModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Local filters: search + language ──────────────────────────────────
  const displayedPreachers = allPreachers.filter(p => {
    const matchSearch = !searchText.trim() ||
      p.full_name.toLowerCase().includes(searchText.toLowerCase().trim());

    const matchLang = filterLanguages.length === 0 ||
      filterLanguages.some(lang => p.language_names.includes(lang));

    return matchSearch && matchLang;
  });

  // ── Language helpers ───────────────────────────────────────────────────
  const addLang    = (lang: string) => { if (!filterLanguages.includes(lang)) setFilterLanguages([...filterLanguages, lang]); };
  const removeLang = (lang: string) => setFilterLanguages(filterLanguages.filter(l => l !== lang));

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="callers-page">
      {isDeleteModalOpen && preacherToDelete && (
        <DeleteModal 
          preacherName={preacherToDelete.full_name}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          loading={deleteLoading}
        />
      )}

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />
      {isPending ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px', width: '100%' }}>
          <div style={{ textAlign: 'center', color: '#e53e3e', background: '#fff5f5', padding: '3rem', borderRadius: '15px', border: '1px solid #fed7d7', maxWidth: '600px', width: '90%' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 700, color: '#c53030' }}>
               {JSON.parse(localStorage.getItem('userData') || '{}')?.extra_data?.approval_status === 'rejected' ? 'تم رفض حساب الجمعية' : 'حساب الجمعية قيد المراجعة'}
            </h2>
            <p style={{ color: '#9b2c2c', lineHeight: 1.8, fontSize: '1rem' }}>
              {JSON.parse(localStorage.getItem('userData') || '{}')?.extra_data?.approval_status === 'rejected'
                ? 'نعتذر، لقد تم رفض طلب انضمام الجمعية للنظام. يرجى مراجعة أسباب الرفض من الصفحة الرئيسية.'
                : 'نعتذر، ولكن حساب الجمعية لا يزال تحت المراجعة من قبل الإدارة. ستتمكن من إضافة وإدارة دعاة الجمعية فور تفعيل الحساب.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="callers-header-area">
            <h1 className="page-title">دعاة الجمعية</h1>

            {isSuspended && (
              <div className="error-alert" style={{ marginBottom: '20px', width: '100%', maxWidth: 'none' }}>
                <AlertCircle size={20} />
                <div style={{ marginRight: '10px' }}>
                  <strong>تنبيه: حساب الجمعية موقوف حالياً.</strong>
                  <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>لا يمكنك إضافة دعاة جدد، أو تعديل حالاتهم، أو حذفهم حتى يتم تفعيل الحساب من قبل الإدارة.</p>
                </div>
              </div>
            )}

        <div className="callers-actions">
          <button 
            className={`btn-primary ${isSuspended ? 'disabled-btn' : ''}`} 
            onClick={() => !isSuspended && navigate('/callers/add')}
            disabled={isSuspended}
            title={isSuspended ? 'لا يمكنك إضافة داعية لأن الحساب موقوف' : ''}
          >
            <Plus size={18} />
            اضافة داعية
          </button>

          <div className="search-filter-group">
            {/* ── Search ── */}
            <div className="search-input-wrapper-outlined">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="بحث باسم الداعية"
                className="search-input-outlined"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0 4px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* ── Filter Panel ── */}
            <div className="filter-popup-container" ref={filterRef}>
              <button className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                <FilterIcon size={18} />
                فلتر
              </button>

              {isFilterOpen && (
                <div className="filter-panel" dir="rtl">
                  <div className="filter-panel-header">
                    <h2 className="filter-title">الفلتر</h2>
                    <button className="btn-apply-filter" onClick={applyFilter}>تطبيق الفلتر</button>
                  </div>

                  <div className="filter-body">
                    {/* Search inside filter */}
                    <div className="filter-search">
                      <Search size={16} className="filter-search-icon" />
                      <input
                        type="text"
                        placeholder="ابحث ....."
                        className="filter-search-input"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                      />
                    </div>

                    {/* Join Date */}
                    <div className="filter-accordion">
                      <div className="filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'date' ? null : 'date')}>
                        <span>تاريخ الانضمام (من)</span>
                        <ChevronDown size={16} className={`text-gray transition-transform ${openAccordion === 'date' ? 'rotate-180' : ''}`} />
                      </div>
                      {openAccordion === 'date' && (
                        <div className="filter-accordion-content mt-2">
                          <div className="filter-date-input active-outline relative-date-input">
                            <input
                              type="date"
                              className="custom-date-picker"
                              value={filterDateAfter}
                              onChange={e => setFilterDateAfter(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>


                    {/* Gender Filter */}
                    <div className="filter-accordion">
                      <div className="filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'gender' ? null : 'gender')}>
                        <span>النوع</span>
                        <ChevronDown size={16} className={`text-gray transition-transform ${openAccordion === 'gender' ? 'rotate-180' : ''}`} />
                      </div>
                      {openAccordion === 'gender' && (
                        <div className="filter-accordion-content mt-2">
                          <div className="filter-submenu-list bordered-list">
                            {[{ label: 'الكل', val: '' }, { label: 'ذكر', val: 'male' }, { label: 'أنثى', val: 'female' }].map(opt => (
                              <label key={opt.val} className="submenu-item" onClick={e => { e.preventDefault(); setFilterGender(opt.val); }}>
                                <div className={`checkbox-custom check-align-left ${filterGender === opt.val ? 'checked-gold' : ''}`}>
                                  {filterGender === opt.val && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Language (local filter) */}
                    <div className="filter-accordion">
                      <div className="filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'language' ? null : 'language')}>
                        <span>اللغة</span>
                        <ChevronDown size={16} className={`text-gray transition-transform ${openAccordion === 'language' ? 'rotate-180' : ''}`} />
                      </div>
                      <div className="filter-accordion-content mt-2">
                        <div className="filter-tags-wrapper">
                          {filterLanguages.map((lang, i) => (
                            <span key={i} className="filter-tag">
                              <span>{lang}</span>
                              <button type="button" onClick={() => removeLang(lang)}><X size={12} /></button>
                            </span>
                          ))}
                        </div>
                        {openAccordion === 'language' && (
                          <div className="filter-submenu-list bordered-list mt-3">
                            {systemLangs.map(lang => {
                              const isSel = filterLanguages.includes(lang.name);
                              return (
                                <label key={lang.id} className="submenu-item" onClick={e => { e.preventDefault(); isSel ? removeLang(lang.name) : addLang(lang.name); }}>
                                  <div className={`checkbox-custom check-align-left ${isSel ? 'checked-gold' : ''}`}>
                                    {isSel && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>{lang.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="filter-accordion no-border">
                      <div className="filter-accordion-header filter-status-header" onClick={() => setOpenAccordion(openAccordion === 'status' ? null : 'status')}>
                        <span>الحالة</span>
                        <ChevronDown size={16} className={`text-gray transition-transform ${openAccordion === 'status' ? 'rotate-180' : ''}`} />
                      </div>
                      {openAccordion === 'status' && (
                        <div className="filter-accordion-content status-content mt-2">
                          {[{ label: 'الكل', val: '' }, { label: 'مفعل', val: 'active' }, { label: 'موقوف', val: 'suspended' }].map(opt => (
                            <label
                              key={opt.val}
                              className={`status-option ${filterStatus === opt.val ? (opt.val === 'active' ? 'active-status' : opt.val === 'suspended' ? 'inactive-status' : 'active-status') : ''}`}
                              onClick={() => setFilterStatus(opt.val)}
                            >
                              <div className={`checkbox-custom check-align-left ${filterStatus === opt.val ? 'checked-gold' : ''}`}>
                                {filterStatus === opt.val && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sort ── */}
            <div className="sort-container" ref={sortRef}>
              <button className={`btn-icon-text ${isSortOpen ? 'active' : ''}`} onClick={() => setIsSortOpen(!isSortOpen)}>
                <SortDesc size={18} />
                تصنيف
              </button>
              {isSortOpen && (
                <div className="sort-dropdown">
                  <div className="sort-dropdown-title">تصنيف</div>
                  <button
                    className={`sort-option ${sortOrder === 'latest' ? 'active' : ''}`}
                    onClick={() => applySort('latest')}
                  >
                    الأحدث
                  </button>
                  <button
                    className={`sort-option ${sortOrder === 'oldest' ? 'active' : ''}`}
                    onClick={() => applySort('oldest')}
                  >
                    الأقدم
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="callers-content-wrapper">
        <div className="callers-content">

          {/* Pending Approval warning */}
          {isPending && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', width: '100%' }}>
              <div style={{ textAlign: 'center', color: '#e53e3e', background: '#fff5f5', padding: '2.5rem', borderRadius: '15px', border: '1px solid #fed7d7', maxWidth: '600px', width: '90%' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1.2rem' }}>⏳</div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', fontWeight: 700, color: '#c53030' }}>حساب الجمعية قيد المراجعة</h2>
                <p style={{ color: '#9b2c2c', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  نعتذر، ولكن حساب الجمعية لا يزال تحت المراجعة من قبل الإدارة. ستتمكن من إضافة وإدارة دعاة الجمعية فور تفعيل الحساب.
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {!isPending && loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px', color: '#6B7280' }}>
              <Loader2 size={28} className="spin-icon" />
              <span>جاري تحميل قائمة الدعاة...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '12px', color: '#EF4444' }}>
              <AlertCircle size={36} />
              <p>{error}</p>
              <button onClick={() => fetchPreachers()} className="retry-btn">إعادة المحاولة</button>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <>
              {/* نتائج البحث */}
              {searchText && (
                <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '12px' }}>
                  {displayedPreachers.length} نتيجة للبحث عن "{searchText}"
                </p>
              )}

              <div className="callers-table-container">
              <table className="callers-table">
                <thead>
                  <tr>
                    <th>رقم</th>
                    <th>اسم الداعية</th>
                    <th>الجنسية</th>
                    <th>تاريخ الانضمام</th>
                    <th>اللغة</th>
                    <th>مفعل / غير مفعل</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPreachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                        {searchText ? `لا يوجد دعاة بهذا الاسم` : 'لا يوجد دعاة مسجلون في الجمعية حالياً'}
                      </td>
                    </tr>
                  ) : (
                    displayedPreachers.map((preacher) => (
                      <tr key={preacher.preacher_id}>
                        <td>{preacher.preacher_id}</td>
                        <td>
                          <div>
                            <div>{preacher.full_name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                              {TYPE_MAP[preacher.type] ?? preacher.type}
                            </div>
                          </div>
                        </td>
                        <td>{preacher.nationality_name || '—'}</td>
                        <td>{formatDate(preacher.created_at)}</td>
                        <td>
                          {preacher.language_names?.length > 0
                            ? preacher.language_names.join('، ')
                            : '—'}
                        </td>
                        <td>
                          <label
                            className={`toggle-switch ${isSuspended ? 'disabled-toggle' : ''}`}
                            style={{ cursor: (togglingId === preacher.preacher_id || isSuspended) ? 'not-allowed' : 'pointer' }}
                            title={isSuspended ? 'الحساب موقوف' : (preacher.status === 'active' ? 'إيقاف الداعية' : 'تفعيل الداعية')}
                          >
                            <input
                              type="checkbox"
                              checked={preacher.status === 'active'}
                              disabled={togglingId === preacher.preacher_id || isSuspended}
                              onChange={() => !isSuspended && toggleActive(preacher)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button className="action-icon-btn chat-icon" title="محادثة" onClick={() => navigate(`/conversations?user_id=${preacher.user_id}&name=${preacher.full_name}`)}>
                              <MessageCircle size={16} />
                            </button>
                            <button className="action-icon-btn view-icon" title="عرض" onClick={() => navigate(`/callers/view/${preacher.preacher_id}`)}>
                             <Eye size={16} />
                           </button>
                            <button 
                               className={`action-icon-btn edit-icon ${isSuspended ? 'disabled' : ''}`} 
                               title={isSuspended ? 'الحساب موقوف' : 'تعديل'} 
                               onClick={() => !isSuspended && navigate(`/callers/edit/${preacher.preacher_id}`)}
                               disabled={isSuspended}
                             >
                               <Edit size={16} />
                             </button>
                             <button 
                               className={`action-icon-btn delete-icon ${isSuspended ? 'disabled' : ''}`} 
                               title={isSuspended ? 'الحساب موقوف' : "حذف"} 
                               onClick={() => !isSuspended && handleDelete(preacher)}
                               disabled={isSuspended}
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>

              {/* Mobile Card View */}
              <div className="callers-mobile-card-list">
                {displayedPreachers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                    {searchText ? `لا يوجد دعاة بهذا الاسم` : 'لا يوجد دعاة مسجلون في الجمعية حالياً'}
                  </div>
                ) : (
                  displayedPreachers.map((preacher) => (
                    <div key={preacher.preacher_id} className="callers-mobile-card">
                      <div className="callers-mobile-card-top">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span className="callers-mobile-card-id">#{preacher.preacher_id}</span>
                          <div className="callers-mobile-card-name">
                            {preacher.full_name}
                            <span className="callers-mobile-card-type">{TYPE_MAP[preacher.type] ?? preacher.type}</span>
                          </div>
                        </div>
                        
                        <div className="callers-mobile-card-top-left">
                          <label
                            className={`toggle-switch ${isSuspended ? 'disabled-toggle' : ''}`}
                            style={{ cursor: (togglingId === preacher.preacher_id || isSuspended) ? 'not-allowed' : 'pointer', transform: 'scale(0.85)', margin: '0', display: 'flex' }}
                            title={isSuspended ? 'الحساب موقوف' : (preacher.status === 'active' ? 'إيقاف الداعية' : 'تفعيل الداعية')}
                          >
                            <input
                              type="checkbox"
                              checked={preacher.status === 'active'}
                              disabled={togglingId === preacher.preacher_id || isSuspended}
                              onChange={() => !isSuspended && toggleActive(preacher)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="callers-mobile-card-fields">
                        <div className="callers-mobile-field">
                          <span className="callers-mobile-field-label">الجنسية</span>
                          <span className="callers-mobile-field-value">{preacher.nationality_name || '—'}</span>
                        </div>
                        <div className="callers-mobile-field">
                          <span className="callers-mobile-field-label">اللغة</span>
                          <span className="callers-mobile-field-value">
                            {preacher.language_names?.length > 0 ? preacher.language_names.join('، ') : '—'}
                          </span>
                        </div>
                        <div className="callers-mobile-field">
                          <span className="callers-mobile-field-label">تاريخ الانضمام</span>
                          <span className="callers-mobile-field-value" style={{ fontSize: '0.8rem' }}>{formatDate(preacher.created_at)}</span>
                        </div>
                      </div>

                      <div className="callers-mobile-card-footer">
                        <div className="callers-mobile-card-actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
                          <button className="action-icon-btn chat-icon" title="محادثة" onClick={() => navigate(`/conversations?user_id=${preacher.user_id}&name=${preacher.full_name}`)}>
                            <MessageCircle size={16} />
                          </button>
                          <button className="action-icon-btn view-icon" title="عرض" onClick={() => navigate(`/callers/view/${preacher.preacher_id}`)}>
                            <Eye size={16} />
                          </button>
                          <button 
                            className={`action-icon-btn edit-icon ${isSuspended ? 'disabled' : ''}`} 
                            title={isSuspended ? 'الحساب موقوف' : 'تعديل'} 
                            onClick={() => !isSuspended && navigate(`/callers/edit/${preacher.preacher_id}`)}
                            disabled={isSuspended}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className={`action-icon-btn delete-icon ${isSuspended ? 'disabled' : ''}`} 
                            title={isSuspended ? 'الحساب موقوف' : "حذف"} 
                            onClick={() => !isSuspended && handleDelete(preacher)}
                            disabled={isSuspended}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default Callers;
