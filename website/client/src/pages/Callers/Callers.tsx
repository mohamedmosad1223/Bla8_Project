import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter as FilterIcon, SortDesc, ChevronDown, X, Check, Eye, Trash2 } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal';
import './Callers.css';

interface Preacher {
  id: string;
  name: string;
  nationality: string;
  orgName: string;
  cases: number;
  joinDate: string;
  status: boolean;
  languages: string[];
}

const mockPreachers: Preacher[] = [
  {
    id: '123456',
    name: 'جون سميث',
    nationality: 'فرنسا',
    orgName: 'جمعية رسالة الاسلام',
    cases: 300,
    joinDate: '22/02/2023\n7:00 AM',
    status: true,
    languages: ['الانجليزية', 'الفرنسية']
  },
  {
    id: '123456',
    name: 'جون سميث',
    nationality: 'انجلترا',
    orgName: 'جمعية الحضارة القديمة',
    cases: 500,
    joinDate: '22/02/2023\n7:00 AM',
    status: false,
    languages: ['الانجليزية', 'الفرنسية']
  },
  {
    id: '123456',
    name: 'جون سميث',
    nationality: 'البرتغال',
    orgName: 'جمعية دعاة الدين',
    cases: 225,
    joinDate: '22/02/2023\n7:00 AM',
    status: true,
    languages: ['الانجليزية', 'الفرنسية']
  },
  {
    id: '123456',
    name: 'جون سميث',
    nationality: 'المانيا',
    orgName: 'جمعية أسلمني',
    cases: 365,
    joinDate: '22/02/2023\n7:00 AM',
    status: true,
    languages: ['الانجليزية', 'الفرنسية']
  },
  {
    id: '123456',
    name: 'جون سميث',
    nationality: 'بلجيكا',
    orgName: 'جمعية معرفة الاسلام',
    cases: 123,
    joinDate: '22/02/2023\n7:00 AM',
    status: false,
    languages: ['الانجليزية', 'الفرنسية']
  },
  {
    id: '123456',
    name: 'جون سميث',
    nationality: 'الاتحاد الروسي',
    orgName: 'جمعية الاسلام الحقيقي',
    cases: 258,
    joinDate: '22/02/2023\n7:00 AM',
    status: true,
    languages: ['الانجليزية', 'الفرنسية']
  },
  {
    id: '123456',
    name: 'جون سميث',
    nationality: 'الاتحاد الروسي',
    orgName: 'جمعية مسلمون لله',
    cases: 369,
    joinDate: '22/02/2023\n7:00 AM',
    status: false,
    languages: ['الانجليزية', 'الفرنسية']
  }
];

const Callers = () => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Filter states
  const [filterLanguages, setFilterLanguages] = useState<string[]>(['الانجليزية', 'الفرنسية', 'الاسبانية', 'البرتغالية']);
  const [preachers, setPreachers] = useState<Preacher[]>(mockPreachers);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [preacherToDelete, setPreacherToDelete] = useState<number | null>(null);
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  
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

  const toggleStatus = (index: number) => {
    const newPreachers = [...preachers];
    newPreachers[index].status = !newPreachers[index].status;
    setPreachers(newPreachers);
  };

  const handleDeleteClick = (index: number) => {
    setPreacherToDelete(index);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (preacherToDelete !== null) {
      const newPreachers = [...preachers];
      newPreachers.splice(preacherToDelete, 1);
      setPreachers(newPreachers);
      setIsDeleteModalOpen(false);
      setPreacherToDelete(null);
    }
  };

  return (
    <div className="callers-page" dir="rtl">
      <div className="callers-header-area">
        <h1 className="page-title">{isAdmin ? 'دعاة الجمعيات' : 'دعاة الجمعية'}</h1>
        
        <div className="callers-actions">
          <div className="search-filter-group">
            <div className="search-input-wrapper-outlined">
              <input 
                type="text" 
                placeholder="بحث" 
                className="search-input-outlined"
              />
              <Search size={18} className="search-icon" />
            </div>
            
            <div className="filters-and-sort-left">
              <div className="filter-popup-container" ref={filterRef}>
                <button 
                  className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <FilterIcon size={18} />
                  فلتر
                </button>
                
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
      </div>

      <div className="callers-content-table">
        <div className="table-responsive">
          <table className="org-table">
            <thead>
              <tr>
                <th>رقم <span className="sort-arrow">↕</span></th>
                <th>اسم الداعية <span className="sort-arrow">↕</span></th>
                <th>الجنسية <span className="sort-arrow">↕</span></th>
                <th>اسم الجمعية <span className="sort-arrow">↕</span></th>
                <th>الحالات <span className="sort-arrow">↕</span></th>
                <th>تاريخ الانضمام <span className="sort-arrow">↕</span></th>
                <th>مفعل / غير مفعل <span className="sort-arrow">↕</span></th>
                <th>اللغة <span className="sort-arrow">↕</span></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {preachers.map((preacher, idx) => (
                <tr key={idx}>
                  <td>{preacher.id}</td>
                  <td className="org-name-cell">{preacher.name}</td>
                  <td>{preacher.nationality}</td>
                  <td>{preacher.orgName}</td>
                  <td>{preacher.cases}</td>
                  <td className="date-cell">{preacher.joinDate}</td>
                  <td>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={preacher.status} 
                        onChange={() => toggleStatus(idx)} 
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                  <td>{preacher.languages.join('، ')}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-icon-btn delete"
                      onClick={() => handleDeleteClick(idx)}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      className="action-icon-btn view"
                      onClick={() => navigate(`/preachers/${preacher.id}`)}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="حذف الداعية"
        message="هل تود أن تتخذ هذا الاجراء ؟"
        confirmLabel="تأكيد"
        cancelLabel="الغاء"
      />

      <div className="pixel-perfect-footer">v4.1.4 Pixel Perfect</div>
    </div>
  );
};

export default Callers;
