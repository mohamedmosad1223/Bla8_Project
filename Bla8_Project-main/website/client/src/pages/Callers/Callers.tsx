import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter as FilterIcon, SortDesc, ChevronDown,
  X, Check, Trash2, Eye, Edit, MessageCircle, Loader2, AlertCircle
} from 'lucide-react';
import { preacherService } from '../../services/preacherService';
import './Callers.css';

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

// ─────────────────────────────────────────────────────────────────────────────
const Callers = () => {
  const navigate = useNavigate();

  // ── Data state ─────────────────────────────────────────────────────────
  const [allPreachers,  setAllPreachers]  = useState<PreacherAPI[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [togglingId,    setTogglingId]    = useState<number | null>(null); // ID الداعية اللي بيتبدل حاله

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
  useEffect(() => { fetchPreachers(); }, [fetchPreachers]);

  // ── Toggle active/suspended ────────────────────────────────────────────
  const toggleActive = async (preacher: PreacherAPI) => {
    const newStatus = preacher.status === 'active' ? 'suspended' : 'active';
    setTogglingId(preacher.preacher_id);
    try {
      await preacherService.update(preacher.preacher_id, { status: newStatus });
      // تحديث محلي فوري بدون إعادة تحميل كامل
      setAllPreachers(prev =>
        prev.map(p => p.preacher_id === preacher.preacher_id ? { ...p, status: newStatus } : p)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('تعذّر تغيير حالة الداعية، يرجى المحاولة مرة أخرى');
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
  const handleDelete = async (preacher: PreacherAPI) => {
    if (window.confirm(`هل أنت متأكد من حذف الداعية "${preacher.full_name}" تماماً من النظام؟`)) {
      try {
        await preacherService.delete(preacher.preacher_id);
        // تحديث محلي لحذف السطر من الجدول فوراً
        setAllPreachers(prev => prev.filter(p => p.preacher_id !== preacher.preacher_id));
      } catch (err) {
        console.error('Failed to delete preacher:', err);
        alert('حدث خطأ أثناء حذف الداعية، يرجى المحاولة مرة أخرى');
      }
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
      <div className="callers-header-area">
        <h1 className="page-title">دعاة الجمعية</h1>

        <div className="callers-actions">
          <button className="btn-primary" onClick={() => navigate('/callers/add')}>
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

          {/* Loading */}
          {loading && (
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
                            className="toggle-switch"
                            style={{ cursor: togglingId === preacher.preacher_id ? 'wait' : 'pointer' }}
                            title={preacher.status === 'active' ? 'إيقاف الداعية' : 'تفعيل الداعية'}
                          >
                            <input
                              type="checkbox"
                              checked={preacher.status === 'active'}
                              disabled={togglingId === preacher.preacher_id}
                              onChange={() => toggleActive(preacher)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button className="action-icon-btn chat-icon" title="محادثة" onClick={() => navigate(`/conversations?user_id=${preacher.user_id}&name=${preacher.full_name}`)}>
                              <MessageCircle size={16} />
                            </button>
                            <button className="action-icon-btn view-icon" title="عرض" onClick={() => navigate(`/awqaf/associations/current/preachers/${preacher.preacher_id}`)}>
                            <Eye size={16} />
                          </button>
                             <button className="action-icon-btn edit-icon" title="تعديل" onClick={() => navigate(`/callers/edit/${preacher.preacher_id}`)}>
                               <Edit size={16} />
                             </button>
                             <button className="action-icon-btn delete-icon" title="حذف" onClick={() => handleDelete(preacher)}>
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Callers;
