import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter as FilterIcon, SortDesc, ChevronDown, X, Check, Trash2, Eye, MessageCircle } from 'lucide-react';
import './AdminCallers.css';

interface Preacher {
  id: number;
  code: string;
  name: string;
  nationality: string;
  joinDate: string;
  language: string;
  active: boolean;
}

const mockPreachers: Preacher[] = [
  { id: 1, code: '123456', name: 'جون سميث',   nationality: 'فرنسا',          joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: true },
  { id: 2, code: '123456', name: 'جون سميث',   nationality: 'انجلترا',        joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: false },
  { id: 3, code: '123456', name: 'جون سميث',   nationality: 'البرتغال',       joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: true },
  { id: 4, code: '123456', name: 'جون سميث',   nationality: 'المانيا',         joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: true },
  { id: 5, code: '123456', name: 'جون سميث',   nationality: 'بلجيكا',         joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: false },
  { id: 6, code: '123456', name: 'جون سميث',   nationality: 'الاتحاد الروسي', joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: true },
  { id: 7, code: '123456', name: 'جون سميث',   nationality: 'الاتحاد الروسي', joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: false },
  { id: 8, code: '123456', name: 'جون سميث',   nationality: 'الاتحاد الروسي', joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: true },
  { id: 9, code: '123456', name: 'جون سميث',   nationality: 'الاتحاد الروسي', joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: true },
  { id: 10, code: '123456', name: 'جون سميث',  nationality: 'الاتحاد الروسي', joinDate: '22/02/2023 7:00 AM', language: 'الانجليزية, الفرنسية', active: false },
];

const AdminCallers = () => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [preachers, setPreachers] = useState(mockPreachers);
  const [showDeletePreacherModal, setShowDeletePreacherModal] = useState(false);

  const toggleActive = (id: number) => {
    setPreachers(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };
  
  // Filter states
  const [filterLanguages, setFilterLanguages] = useState<string[]>(['الانجليزية', 'الفرنسية', 'الاسبانية', 'البرتغالية']);
  
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

  const removeLanguage = (langToRemove: string) => {
    setFilterLanguages(filterLanguages.filter(lang => lang !== langToRemove));
  };

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const availableLanguages = ['العربية', 'الانجليزية', 'الفرنسية', 'الاسبانية', 'البرتغالية', 'الهندية'];
  const [selectedType, setSelectedType] = useState<string>('داعية');
  const [selectedStatus, setSelectedStatus] = useState<string>('مفعل');

  const addLanguage = (lang: string) => {
    if (!filterLanguages.includes(lang)) {
      setFilterLanguages([...filterLanguages, lang]);
    }
  };

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
                placeholder="بحث" 
                className="search-input-outlined"
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
                    <h2 className="filter-title">الفلتر</h2>
                    <button className="btn-apply-filter" onClick={() => setIsFilterOpen(false)}>
                      تطبيق الفلتر
                    </button>
                  </div>

                  <div className="filter-body">
                    {/* Search */}
                    <div className="filter-search">
                      <Search size={16} className="filter-search-icon" />
                      <input type="text" placeholder="ابحث ....." className="filter-search-input" />
                    </div>

                    {/* Join Date Accordion */}
                    <div className="filter-accordion">
                      <div 
                        className="filter-accordion-header"
                        onClick={() => toggleAccordion('date')}
                      >
                        <span>تاريخ الانضمام</span>
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
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Type Accordion */}
                    <div className="filter-accordion">
                      <div 
                        className="filter-accordion-header"
                        onClick={() => toggleAccordion('type')}
                      >
                        <span>النوع</span>
                        <ChevronDown 
                          size={16} 
                          className={`text-gray transition-transform ${openAccordion === 'type' ? 'rotate-180' : ''}`} 
                        />
                      </div>
                      {openAccordion === 'type' && (
                        <div className="filter-accordion-content mt-2">
                          <div className="filter-submenu-list bordered-list">
                            <label 
                              className="submenu-item"
                              onClick={(e) => { e.preventDefault(); setSelectedType('داعية'); }}
                            >
                              <div className={`checkbox-custom check-align-left ${selectedType === 'داعية' ? 'checked-gold' : ''}`}>
                                  {selectedType === 'داعية' && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>داعية</span>
                            </label>
                            <label 
                              className="submenu-item"
                              onClick={(e) => { e.preventDefault(); setSelectedType('غير ذلك'); }}
                            >
                               <div className={`checkbox-custom check-align-left ${selectedType === 'غير ذلك' ? 'checked-gold' : ''}`}>
                                  {selectedType === 'غير ذلك' && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>غير ذلك</span>
                            </label>
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
                          {filterLanguages.map((lang, index) => (
                            <span key={index} className="filter-tag">
                              <span>{lang}</span>
                              <button type="button" onClick={() => removeLanguage(lang)}>
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>

                        {openAccordion === 'language' && (
                           <div className="filter-submenu-list bordered-list mt-3">
                             {availableLanguages.map((lang) => {
                               const isSelected = filterLanguages.includes(lang);
                               return (
                                  <label key={lang} className="submenu-item" onClick={(e) => {
                                    e.preventDefault();
                                    if (isSelected) {
                                      removeLanguage(lang);
                                    } else {
                                      addLanguage(lang);
                                    }
                                  }}>
                                    <div className={`checkbox-custom check-align-left ${isSelected ? 'checked-gold' : ''}`}>
                                      {isSelected && <Check size={12} strokeWidth={3} color="white" />}
                                    </div>
                                    <span>{lang}</span>
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
                          <label 
                            className={`status-option ${selectedStatus === 'مفعل' ? 'active-status' : ''}`}
                            onClick={() => setSelectedStatus('مفعل')}
                          >
                            <div className={`checkbox-custom check-align-left ${selectedStatus === 'مفعل' ? 'checked-gold' : ''}`}>
                                {selectedStatus === 'مفعل' && <Check size={12} strokeWidth={3} color="white" />}
                            </div>
                            <span>مفعل</span>
                          </label>
                          <label 
                            className={`status-option ${selectedStatus === 'غير مفعل' ? 'inactive-status' : ''}`}
                            onClick={() => setSelectedStatus('غير مفعل')}
                          >
                            <div className={`checkbox-custom check-align-left ${selectedStatus === 'غير مفعل' ? 'checked-gold' : ''}`}>
                                 {selectedStatus === 'غير مفعل' && <Check size={12} strokeWidth={3} color="white" />}
                            </div>
                            <span>غيرمفعل</span>
                          </label>
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
                تصنيف
              </button>
              
              {isSortOpen && (
                <div className="sort-dropdown">
                  <div className="sort-dropdown-title">تصنيف</div>
                  <button className="sort-option">الاحدث</button>
                  <button className="sort-option">الأقدم</button>
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
                <tr key={preacher.id}>
                  <td>{preacher.code}</td>
                  <td>{preacher.name}</td>
                  <td>{preacher.nationality}</td>
                  <td>{preacher.joinDate}</td>
                  <td>{preacher.language}</td>
                  <td>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={preacher.active} onChange={() => toggleActive(preacher.id)} />
                    <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="action-icon-btn view-icon" title="عرض" onClick={() => navigate(`/admin/callers/${preacher.id}`)}>
                        <Eye size={16} />
                      </button>
                      <button 
                        className="action-icon-btn chat-icon" 
                        title="محادثة" 
                        onClick={() => navigate(`/admin/chat/${preacher.id}`)}
                        style={{ color: '#dba841' }}
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button className="action-icon-btn delete-icon" title="حذف" onClick={() => setShowDeletePreacherModal(true)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            <p className="new-delete-desc">هل تود ان تتخذ هذا الاجراء ؟</p>
            
            <div className="new-modal-actions">
              <button 
                className="new-btn-confirm"
                onClick={() => setShowDeletePreacherModal(false)}
              >
                تأكيد
              </button>
              <button 
                className="new-btn-cancel"
                onClick={() => setShowDeletePreacherModal(false)}
              >
                الغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCallers;
