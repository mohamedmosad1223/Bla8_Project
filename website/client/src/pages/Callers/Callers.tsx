import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter as FilterIcon, SortDesc, ChevronDown, X, Check } from 'lucide-react';
import './Callers.css';

const Callers = () => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
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
          <button 
            className="btn-primary" 
            onClick={() => navigate('/callers/add')}
          >
            <Plus size={18} />
            اضافة داعية
          </button>
          
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
          <div className="empty-state">
            <div className="empty-state-icon">
              {/* Custom Users Group Icon matching design */}
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Central figure (blue) */}
                <circle cx="50" cy="35" r="14" stroke="#166088" strokeWidth="4" />
                <path d="M30 65C30 55 38 48 50 48C62 48 70 55 70 65V70H30V65Z" stroke="#166088" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                {/* Left figure (gold) */}
                <circle cx="25" cy="45" r="9" stroke="#DBA841" strokeWidth="4" />
                <path d="M12 68C12 60 17 55 25 55H30V65H15V68H12Z" fill="#DBA841" />
                <path d="M10 68C12 55 18 53 28 53" stroke="#DBA841" strokeWidth="4" strokeLinecap="round" fill="none"/>
                <path d="M10 68V70H12V68Z" fill="#166088"/> 
                <path d="M25 55C18 55 12 59 12 66V70" stroke="#DBA841" strokeWidth="4" strokeLinecap="round" fill="none"/>
                {/* Right figure (gold) */}
                <circle cx="75" cy="45" r="9" stroke="#DBA841" strokeWidth="4" />
                <path d="M75 55C82 55 88 59 88 66V70" stroke="#DBA841" strokeWidth="4" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <h2 className="empty-state-title">لا يوجد دعاة في الوقت الحالي</h2>
            <p className="empty-state-description">
              تابعونا! لا توجد دعاة حتى الآن. سنُعلمكم فور توفر شيء مهم لمشاركته.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Callers;
