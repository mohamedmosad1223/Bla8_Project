import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter as FilterIcon, SortDesc, ChevronDown, X, Check, Trash2, Eye, MessageCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import './AdminCallers.css';

interface Preacher {
  preacher_id: number;
  user_id: number;
  code: string;
  full_name: string;
  nationality_name: string;
  created_at: string;
  language_names: string[];
  status: string;
}

const AdminCallers = () => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [preachers, setPreachers] = useState<Preacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeletePreacherModal, setShowDeletePreacherModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  
  // Reference data
  const [allCountries, setAllCountries] = useState<any[]>([]);
  const [allLanguages, setAllLanguages] = useState<any[]>([]);

  // Filter states
  const [appliedFilters, setAppliedFilters] = useState({
    nationality_country_id: '' as string | number,
    languages: [] as number[],
    joined_after: '',
    status: '' as string
  });

  const [filterDraft, setFilterDraft] = useState({
    nationality_country_id: '' as string | number,
    languages: [] as number[],
    joined_after: '',
    status: '' as string
  });

  const fetchPreachers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        search: search || undefined,
        approval_status: 'approved',
        order_by: sortBy
      };

      if (appliedFilters.nationality_country_id) params.nationality_country_id = appliedFilters.nationality_country_id;
      if (appliedFilters.languages.length > 0) params.languages = appliedFilters.languages;
      if (appliedFilters.joined_after) params.joined_after = appliedFilters.joined_after;
      if (appliedFilters.status) params.status = appliedFilters.status;

      const response = await api.get('/preachers/', { params });
      setPreachers(response.data.data);
    } catch (err: any) {
      console.error('Error fetching preachers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, appliedFilters]);

  // Fetch reference data (countries & languages)
  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const [countriesRes, langsRes] = await Promise.all([
          api.get('/preachers/countries'),
          api.get('/preachers/languages')
        ]);
        setAllCountries(countriesRes.data.data);
        setAllLanguages(langsRes.data.data);
      } catch (err) {
        console.error('Error fetching reference data:', err);
      }
    };
    fetchRefs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreachers();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPreachers]);

  const toggleActive = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      const formData = new FormData();
      formData.append('status', newStatus);
      await api.patch(`/preachers/${id}`, formData);
      fetchPreachers();
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('تعذر تحديث حالة الداعية');
    }
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setShowDeletePreacherModal(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await api.delete(`/preachers/${itemToDelete}`);
        fetchPreachers();
      } catch (err) {
        console.error('Error deleting preacher:', err);
        alert('تعذر حذف الداعية');
      }
    }
    setShowDeletePreacherModal(false);
    setItemToDelete(null);
  };
  
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close sort & filter menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortRef, filterRef]);

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filterDraft });
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    const empty = {
      nationality_country_id: '',
      languages: [],
      joined_after: '',
      status: ''
    };
    setFilterDraft(empty);
    setAppliedFilters(empty);
    setIsFilterOpen(false);
  };

  if (loading && preachers.length === 0) {
    return (
      <div className="aadmin-loading-state">
        <Loader2 className="animate-spin" size={48} color="#DBA841" />
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="callers-page">
      <div className="callers-header-area">
        <h1 className="page-title">دعاة الجمعية</h1>
        
        <div className="callers-actions">
          <div className="search-filter-group">
            <div className="search-input-wrapper-outlined">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="ابحث باسم الداعية..." 
                className="search-input-outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="filter-popup-container" ref={filterRef}>
              <button 
                className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <FilterIcon size={18} />
                فلتر
              </button>

              {/* Filter Side Panel / Modal */}
              {isFilterOpen && (
                <div className="filter-panel" dir="rtl">
                  <div className="filter-panel-header">
                    <div className="flex items-center gap-4">
                      <h2 className="filter-title">الفلتر</h2>
                      <button className="text-sm text-gray-400 hover:text-gray-600" onClick={resetFilters}>إعادة ضبط</button>
                    </div>
                    <button className="btn-apply-filter" onClick={applyFilters}>
                      تطبيق الفلتر
                    </button>
                  </div>

                  <div className="filter-body">
                    {/* Join Date Accordion */}
                    <div className="filter-accordion">
                      <div 
                        className="filter-accordion-header"
                        onClick={() => toggleAccordion('date')}
                      >
                        <span>تاريخ الانضمام (بعد)</span>
                        <ChevronDown 
                          size={16} 
                          className={`text-gray transition-transform ${openAccordion === 'date' ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      {openAccordion === 'date' && (
                        <div className="filter-accordion-content mt-2">
                          <div className="filter-date-input active-outline relative-date-input">
                            <input 
                              type="date"
                              className="custom-date-picker"
                              value={filterDraft.joined_after}
                              onChange={(e) => setFilterDraft({...filterDraft, joined_after: e.target.value})}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nationality Accordion */}
                    <div className="filter-accordion">
                      <div 
                        className="filter-accordion-header"
                        onClick={() => toggleAccordion('nationality')}
                      >
                        <span>الجنسية</span>
                        <ChevronDown 
                          size={16} 
                          className={`text-gray transition-transform ${openAccordion === 'nationality' ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      {openAccordion === 'nationality' && (
                        <div className="filter-accordion-content mt-2">
                          <div className="filter-submenu-list bordered-list">
                            <label 
                              className="submenu-item"
                              onClick={() => setFilterDraft({...filterDraft, nationality_country_id: ''})}
                            >
                              <div className={`checkbox-custom check-align-left ${filterDraft.nationality_country_id === '' ? 'checked-gold' : ''}`}>
                                  {filterDraft.nationality_country_id === '' && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>الكل</span>
                            </label>
                            {allCountries.map((country) => (
                              <label 
                                key={country.id}
                                className="submenu-item"
                                onClick={() => setFilterDraft({...filterDraft, nationality_country_id: country.id})}
                              >
                                <div className={`checkbox-custom check-align-left ${filterDraft.nationality_country_id === country.id ? 'checked-gold' : ''}`}>
                                    {filterDraft.nationality_country_id === country.id && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>{country.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Language Accordion */}
                    <div className="filter-accordion">
                      <div 
                        className="filter-accordion-header"
                        onClick={() => toggleAccordion('language')}
                      >
                        <span>اللغة</span>
                        <ChevronDown 
                          size={16} 
                          className={`text-gray transition-transform ${openAccordion === 'language' ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      
                      <div className="filter-accordion-content mt-2">
                        <div className="filter-tags-wrapper">
                          {filterDraft.languages.map((langId) => {
                            const langName = allLanguages.find(l => l.id === langId)?.name || langId;
                            return (
                              <span key={langId} className="filter-tag">
                                <span>{langName}</span>
                                <button type="button" onClick={() => setFilterDraft({
                                  ...filterDraft, 
                                  languages: filterDraft.languages.filter(id => id !== langId)
                                })}>
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>

                        {openAccordion === 'language' && (
                           <div className="filter-submenu-list bordered-list mt-3">
                             {allLanguages.map((lang) => {
                               const isSelected = filterDraft.languages.includes(lang.id);
                               return (
                                  <label key={lang.id} className="submenu-item" onClick={(e) => {
                                    e.preventDefault();
                                    if (isSelected) {
                                      setFilterDraft({
                                        ...filterDraft,
                                        languages: filterDraft.languages.filter(id => id !== lang.id)
                                      });
                                    } else {
                                      setFilterDraft({
                                        ...filterDraft,
                                        languages: [...filterDraft.languages, lang.id]
                                      });
                                    }
                                  }}>
                                    <div className={`checkbox-custom check-align-left ${isSelected ? 'checked-gold' : ''}`}>
                                      {isSelected && <Check size={12} strokeWidth={3} color="white" />}
                                    </div>
                                    <span>{lang.name}</span>
                                  </label>
                               );
                             })}
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Status Accordion */}
                    <div className="filter-accordion no-border">
                      <div className="filter-accordion-header filter-status-header" onClick={() => toggleAccordion('status')}>
                        <span>الحالة</span>
                        <ChevronDown 
                          size={16} 
                          className={`text-gray transition-transform ${openAccordion === 'status' ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      {openAccordion === 'status' && (
                        <div className="filter-accordion-content status-content mt-2">
                          {['active', 'suspended'].map((status) => (
                            <label 
                              key={status}
                              className={`status-option ${filterDraft.status === status ? 'active-status' : ''}`}
                              onClick={() => setFilterDraft({...filterDraft, status})}
                            >
                              <div className={`checkbox-custom check-align-left ${filterDraft.status === status ? 'checked-gold' : ''}`}>
                                  {filterDraft.status === status && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>{status === 'active' ? 'مفعل' : 'غير مفعل'}</span>
                            </label>
                          ))}
                          <button 
                            className="text-xs text-gray-400 mt-2 hover:underline text-right w-full"
                            onClick={() => setFilterDraft({...filterDraft, status: ''})}
                          >
                            الكل
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
            
            <div className="sort-container" ref={sortRef}>
              <button 
                className={`btn-icon-text ${isSortOpen ? 'active' : ''}`}
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <SortDesc size={18} />
                تصنيف: {sortBy === 'latest' ? 'الأحدث' : 'الأقدم'}
              </button>
              
              {isSortOpen && (
                <div className="sort-dropdown">
                  <div className="sort-dropdown-title">تصنيف</div>
                  <button 
                    className={`sort-option ${sortBy === 'latest' ? 'selected' : ''}`}
                    onClick={() => { setSortBy('latest'); setIsSortOpen(false); }}
                  >
                    الأحدث
                  </button>
                  <button 
                    className={`sort-option ${sortBy === 'oldest' ? 'selected' : ''}`}
                    onClick={() => { setSortBy('oldest'); setIsSortOpen(false); }}
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
              {preachers.map((preacher) => (
                <tr key={preacher.preacher_id}>
                  <td>{preacher.preacher_id}</td>
                  <td>{preacher.full_name}</td>
                  <td>{preacher.nationality_name}</td>
                  <td className="aadmin-date">
                    {new Date(preacher.created_at).toLocaleDateString('ar-EG')}
                    <br/>
                    {new Date(preacher.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td>{preacher.language_names.join(', ')}</td>
                  <td>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={preacher.status === 'active'} 
                        onChange={() => toggleActive(preacher.preacher_id, preacher.status)} 
                      />
                    <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="action-icon-btn view-icon" title="عرض" onClick={() => navigate(`/admin/callers/${preacher.preacher_id}`)}>
                        <Eye size={16} />
                      </button>
                      <button 
                        className="action-icon-btn chat-icon" 
                        title="محادثة" 
                        onClick={() => navigate(`/admin/chat/${preacher.user_id}`)}
                        style={{ color: '#dba841' }}
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button className="action-icon-btn delete-icon" title="حذف" onClick={() => handleDeleteClick(preacher.preacher_id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && preachers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                    لا يوجد دعاة مسجلين حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeletePreacherModal && (
        <div className="aadmin-modal-overlay">
          <div className="new-delete-modal-card">
            <button 
              className="new-close-btn" 
              onClick={() => setShowDeletePreacherModal(false)}
            >
              <X size={20} />
            </button>
            <div className="new-danger-circle">
              <X size={40} className="new-danger-x-icon" />
            </div>
            
            <h3 className="new-delete-title">حذف الداعية</h3>
            <p className="new-delete-desc">هل تود ان تتخذ هذا الاجراء ؟ سيتم حذف جميع بيانات الداعية بشكل نهائي.</p>
            
            <div className="new-modal-actions">
              <button 
                className="new-btn-cancel"
                onClick={() => setShowDeletePreacherModal(false)}
              >
                الالغاء
              </button>
              <button 
                className="new-btn-confirm"
                onClick={confirmDelete}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCallers;
