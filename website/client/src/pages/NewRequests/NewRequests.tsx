import { useState, useRef, useEffect } from 'react';
import { Search, Filter as FilterIcon, SortDesc, Eye, ChevronRight, ChevronDown, Calendar, X, Check } from 'lucide-react';
import './NewRequests.css';

// -------------------------
// Types
// -------------------------
interface Request {
  id: number;
  serial: string;
  donorName: string;
  callerName: string;
  nationality: string;
  language: string;
  religion: string;
  sendDate: string;
  comment: string;
  callerAvatar?: string;
}

interface RequestDetail extends Request {
  age: number;
  gender: string;
  phone: string;
  email: string;
  contactMethod: string;
  contactLink: string;
  personalComment: string;
}

// -------------------------
// Mock data
// -------------------------
const MOCK_REQUESTS: Request[] = [
  { id: 1, serial: '123456', donorName: 'جون سميث', callerName: 'احمد عاطف', nationality: 'فرنسا', language: 'اللغة الفرنسية', religion: 'مسيحي', sendDate: '22/02/2023\n7:00 AM', comment: 'يكتب هنا تعليق.....' },
];

const MOCK_DETAIL: RequestDetail = {
  id: 1,
  serial: '123456',
  donorName: 'جون سميث',
  callerName: 'احمد عاطف',
  nationality: 'فرنسا',
  language: 'اللغة الفرنسية',
  religion: 'مسيحي',
  sendDate: '22/02/2023\n7:00 AM',
  comment: 'يكتب هنا تعليق.....',
  age: 33,
  gender: 'ذكر',
  phone: '+2001155591759',
  email: 'John2025@gmail.com',
  contactMethod: 'فيس بوك',
  contactLink: 'https://www.facebook.com/',
  personalComment: 'هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربي، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التي يتولدها التطبيق.\nإذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربي زيادة عدد الفقرات كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربي مفيد لمصممي المواقع على وجه الخصوص، حيث يحتاج العميل في كثير من الأحيان أن يطلع على صورة حقيقية لتصميم الموقع.',
};

// -------------------------
// Empty State Component
// -------------------------
const EmptyState = () => (
  <div className="nreq-empty-state">
    <div className="nreq-empty-icon">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="5" width="48" height="60" rx="6" stroke="#DBA841" strokeWidth="3" fill="none"/>
        <circle cx="32" cy="25" r="8" stroke="#DBA841" strokeWidth="3" fill="none"/>
        <line x1="16" y1="45" x2="52" y2="45" stroke="#DBA841" strokeWidth="3" strokeLinecap="round"/>
        <line x1="16" y1="53" x2="42" y2="53" stroke="#DBA841" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="32" cy="25" r="4" fill="#DBA841"/>
      </svg>
    </div>
    <h2 className="nreq-empty-title">لا يوجد طلبات جديدة في الوقت الحالي</h2>
    <p className="nreq-empty-desc">تابعونا! لا توجد طلبات جديدة حتى الآن. سنُعلمكم فور توفر شيء مهم لمشاركته.</p>
  </div>
);

// -------------------------
// Table View Component
// -------------------------
const TableView = ({ requests, onView }: { requests: Request[]; onView: (r: Request) => void }) => (
  <div className="nreq-table-wrapper">
    <table className="nreq-table">
      <thead>
        <tr>
          <th>رقم <span className="sort-arrow">↕</span></th>
          <th>اسم المدعو <span className="sort-arrow">↕</span></th>
          <th>اسم الداعي <span className="sort-arrow">↕</span></th>
          <th>اسم الداعية <span className="sort-arrow">↕</span></th>
          <th>الجنسية <span className="sort-arrow">↕</span></th>
          <th>لغة التواصل <span className="sort-arrow">↕</span></th>
          <th>الديانة <span className="sort-arrow">↕</span></th>
          <th>تاريخ الارسال <span className="sort-arrow">↕</span></th>
          <th>التعليق <span className="sort-arrow">↕</span></th>
        </tr>
      </thead>
      <tbody>
        {requests.map((req) => (
          <tr key={req.id}>
            <td>{req.serial}</td>
            <td>{req.donorName}</td>
            <td>{req.donorName}</td>
            <td>{req.callerName}</td>
            <td>{req.nationality}</td>
            <td>{req.language}</td>
            <td>{req.religion}</td>
            <td className="nreq-date-cell">{req.sendDate}</td>
            <td>
              <div className="nreq-comment-cell">
                <button className="nreq-eye-btn" onClick={() => onView(req)} title="عرض التفاصيل">
                  <Eye size={18} />
                </button>
                <span className="nreq-comment-text">{req.comment}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// -------------------------
// Detail View Component
// -------------------------
const DetailView = ({ detail, onBack }: { detail: RequestDetail; onBack: () => void }) => (
  <div className="nreq-detail-page">
    {/* Breadcrumb */}
    <div className="breadcrumb nreq-breadcrumb">
      <button className="breadcrumb-link" onClick={onBack}>طلبات الدعوة الجديدة</button>
      <ChevronRight size={14} className="breadcrumb-separator" />
      <span className="breadcrumb-current">عرض الطلب الجديد</span>
    </div>
    <h1 className="page-title">عرض الطلب الجديد</h1>

    <div className="nreq-detail-card">
      {/* Row 1 */}
      <div className="nreq-detail-grid">
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            اسم الشخص
          </span>
          <span className="nreq-field-value">{detail.donorName}</span>
        </div>
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8 2 4 5.5 4 10c0 6 8 12 8 12s8-6 8-12c0-4.5-4-8-8-8z"/></svg>
            الجنسية
          </span>
          <span className="nreq-field-value">{detail.nationality}</span>
        </div>
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            اللغة
          </span>
          <span className="nreq-field-value">{detail.language}</span>
        </div>
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            الديانة
          </span>
          <span className="nreq-field-value">{detail.religion}</span>
        </div>
      </div>

      {/* Row 2 */}
      <div className="nreq-detail-grid nreq-detail-grid-3">
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            السن
          </span>
          <span className="nreq-field-value">{detail.age} عام</span>
        </div>
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            النوع
          </span>
          <span className="nreq-field-value">{detail.gender}</span>
        </div>
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.48-1.48a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            رقم الهاتف
          </span>
          <span className="nreq-field-value" dir="ltr">{detail.phone}</span>
        </div>
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            البريد الإلكتروني
          </span>
          <span className="nreq-field-value">{detail.email}</span>
        </div>
      </div>

      {/* Contact + Caller Row */}
      <div className="nreq-detail-grid nreq-detail-grid-2">
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            طرق التواصل
          </span>
          <div className="nreq-contact-value">
            <span className="nreq-contact-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              {detail.contactMethod}
            </span>
            <a href={detail.contactLink} target="_blank" rel="noreferrer" className="nreq-contact-link">{detail.contactLink}</a>
          </div>
        </div>

        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            الداعية
          </span>
          <div className="nreq-caller-value">
            <div className="nreq-caller-avatar">
              {detail.callerName.charAt(0)}
            </div>
            <span>{detail.callerName}</span>
          </div>
        </div>
      </div>

      {/* Personal Comment */}
      <div className="nreq-personal-comment-section">
        <div className="nreq-detail-field">
          <span className="nreq-field-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            التعليق الخاص بالشخص
          </span>
          <p className="nreq-personal-comment-text">{detail.personalComment}</p>
        </div>
      </div>
    </div>
  </div>
);

// -------------------------
// Main Component
// -------------------------
const NewRequests = () => {
  const [view, setView] = useState<'empty' | 'table' | 'detail'>(MOCK_REQUESTS.length > 0 ? 'table' : 'empty');
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);

  // Filter + Sort state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filterLanguages, setFilterLanguages] = useState<string[]>(['العربية', 'الانجليزية']);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('داعية');
  const [selectedStatus, setSelectedStatus] = useState<string>('مفعل');
  const availableLanguages = ['العربية', 'الانجليزية', 'الفرنسية', 'الاسبانية', 'البرتغالية', 'الهندية'];
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortRef]);

  const removeLanguage = (lang: string) => setFilterLanguages(filterLanguages.filter(l => l !== lang));
  const addLanguage = (lang: string) => { if (!filterLanguages.includes(lang)) setFilterLanguages([...filterLanguages, lang]); };
  const toggleAccordion = (name: string) => setOpenAccordion(openAccordion === name ? null : name);

  const handleView = (_req: Request) => {
    setSelectedRequest(MOCK_DETAIL);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedRequest(null);
    setView(MOCK_REQUESTS.length > 0 ? 'table' : 'empty');
  };

  return (
    <div className="nreq-page">
      {view === 'detail' && selectedRequest ? (
        <DetailView detail={selectedRequest} onBack={handleBack} />
      ) : (
        <>
          <div className="nreq-header-area">
            <h1 className="page-title">طلبات الدعوة الجديدة</h1>

            <div className="nreq-actions">
              <div className="search-input-wrapper-outlined">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="ابحث" className="search-input-outlined" />
              </div>

              <button
                className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <FilterIcon size={18} />
                فلتر
              </button>

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
                    <button className="sort-option">الاحدث</button>
                    <button className="sort-option">الأقدم</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="nreq-body-wrapper">
            <div className="nreq-content">
              {view === 'empty' ? <EmptyState /> : <TableView requests={MOCK_REQUESTS} onView={handleView} />}
            </div>

            {/* Filter Side Panel */}
            {isFilterOpen && (
              <div className="filter-panel">
                <div className="filter-panel-header">
                  <h2 className="filter-title">الفلتر</h2>
                  <button className="btn-apply-filter" onClick={() => setIsFilterOpen(false)}>تطبيق الفلتر</button>
                </div>

                <div className="filter-body">
                  {/* Search */}
                  <div className="filter-search">
                    <Search size={16} className="filter-search-icon" />
                    <input type="text" placeholder="ابحث ....." className="filter-search-input" />
                  </div>

                  {/* Join Date */}
                  <div className="filter-accordion">
                    <div className="filter-accordion-header" onClick={() => toggleAccordion('date')}>
                      <span>تاريخ الانضمام</span>
                      <ChevronDown size={16} className={`text-gray ${openAccordion === 'date' ? 'rotate-180' : ''}`} />
                    </div>
                    {openAccordion === 'date' && (
                      <div className="filter-accordion-content mt-2">
                        <div className="filter-date-input active-outline relative-date-input">
                          <Calendar size={16} className="text-gray" />
                          <input type="date" className="custom-date-picker" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Type */}
                  <div className="filter-accordion">
                    <div className="filter-accordion-header" onClick={() => toggleAccordion('type')}>
                      <span>النوع</span>
                      <ChevronDown size={16} className={`text-gray ${openAccordion === 'type' ? 'rotate-180' : ''}`} />
                    </div>
                    {openAccordion === 'type' && (
                      <div className="filter-accordion-content mt-2">
                        <div className="filter-submenu-list bordered-list">
                          {['داعية', 'غير ذلك'].map(t => (
                            <label key={t} className="submenu-item" onClick={(e) => { e.preventDefault(); setSelectedType(t); }}>
                              <div className={`checkbox-custom check-align-left ${selectedType === t ? 'checked' : ''}`}>
                                {selectedType === t && <Check size={12} strokeWidth={4} />}
                              </div>
                              <span>{t}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Language */}
                  <div className="filter-accordion">
                    <div className="filter-accordion-header" onClick={() => toggleAccordion('language')}>
                      <span>اللغة</span>
                      <ChevronDown size={16} className={`text-gray ${openAccordion === 'language' ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="filter-accordion-content">
                      <div className="filter-tags-wrapper">
                        {filterLanguages.map((lang, i) => (
                          <span key={i} className="filter-tag">
                            <span>{lang}</span>
                            <button type="button" onClick={() => removeLanguage(lang)}><X size={12} /></button>
                          </span>
                        ))}
                      </div>
                      {openAccordion === 'language' && (
                        <div className="filter-submenu-list bordered-list mt-3">
                          {availableLanguages.map(lang => {
                            const sel = filterLanguages.includes(lang);
                            return (
                              <label key={lang} className="submenu-item" onClick={(e) => { e.preventDefault(); sel ? removeLanguage(lang) : addLanguage(lang); }}>
                                <div className={`checkbox-custom check-align-left ${sel ? 'checked' : ''}`}>
                                  {sel && <Check size={12} strokeWidth={4} />}
                                </div>
                                <span>{lang}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="filter-accordion no-border">
                    <div className="filter-accordion-header filter-status-header">
                      <span>الحالة</span>
                    </div>
                    <div className="filter-accordion-content status-content mt-2">
                      {[{ key: 'مفعل', cls: 'active-status' }, { key: 'غير مفعل', cls: 'inactive-status' }].map(({ key, cls }) => (
                        <label key={key} className={`status-option ${selectedStatus === key ? cls : ''}`} onClick={() => setSelectedStatus(key)}>
                          <div className={`checkbox-custom check-align-left ${selectedStatus === key ? (key === 'مفعل' ? 'checked' : 'checked-red') : ''}`}>
                            {selectedStatus === key && <Check size={12} strokeWidth={4} />}
                          </div>
                          <span>{key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NewRequests;
