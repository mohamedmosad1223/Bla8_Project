import { useState, useRef, useEffect } from 'react';
import { Search, Filter as FilterIcon, SortDesc, Eye, ChevronRight, ChevronDown, X, Check } from 'lucide-react';
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
// Modals
// -------------------------
const AcceptModal = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => (
  <div className="nreq-modal-overlay">
    <div className="nreq-modal nreq-accept-modal" dir="rtl">
      <button className="nreq-modal-close" onClick={onClose}><X size={20} /></button>
      
      <div className="nreq-modal-content">
        <div className="nreq-modal-icon-success">
          <Check size={40} strokeWidth={3} />
        </div>
        <h2 className="nreq-modal-title">تم بنجاح!</h2>
        <p className="nreq-modal-desc">تم استلام الطلب بنجاح</p>
        
        <button className="nreq-modal-btn-full nreq-btn-success" onClick={onConfirm}>
          تم
        </button>
      </div>
    </div>
  </div>
);

const RejectModal = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => (
  <div className="nreq-modal-overlay">
    <div className="nreq-modal nreq-reject-modal" dir="rtl">
      <button className="nreq-modal-close" onClick={onClose}><X size={20} /></button>
      
      <div className="nreq-modal-content">
        <div className="nreq-modal-icon-danger">
          <X size={40} strokeWidth={3} />
        </div>
        <h2 className="nreq-modal-title">رفض الطلب</h2>
        <p className="nreq-modal-desc mx-auto">هل تود ان تتخذ هذا الاجراء ؟</p>
        
        <div className="nreq-modal-textarea-wrapper">
          <textarea 
            className="nreq-modal-textarea" 
            placeholder="ملاحظة&#10;مثال ملاحظة"
            rows={4}
          />
        </div>
        
        <div className="nreq-modal-actions">
          <button className="nreq-modal-btn nreq-btn-cancel" onClick={onClose}>
            الغاء
          </button>
          <button className="nreq-modal-btn nreq-btn-danger" onClick={onConfirm}>
            تأكيد
          </button>
        </div>
      </div>
    </div>
  </div>
);

// -------------------------
// Table View Component
// -------------------------
const TableView = ({ requests, onView, isPreacher, onAccept, onReject }: { requests: Request[]; onView: (r: Request) => void; isPreacher: boolean; onAccept: (r: Request) => void; onReject: (r: Request) => void }) => (
  <div className="nreq-table-wrapper">
    <table className="nreq-table">
      <thead>
        <tr>
          <th>رقم <span className="sort-arrow">↕</span></th>
          <th>اسم الشخص <span className="sort-arrow">↕</span></th>
          <th>الجنسية <span className="sort-arrow">↕</span></th>
          <th>اسم الداعي <span className="sort-arrow">↕</span></th>
          <th>لغة التواصل <span className="sort-arrow">↕</span></th>
          <th>الديانة <span className="sort-arrow">↕</span></th>
          <th>تاريخ الارسال <span className="sort-arrow">↕</span></th>
          <th>التعليق <span className="sort-arrow">↕</span></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {requests.map((req) => (
          <tr key={req.id}>
            <td>{req.serial}</td>
            <td>{req.donorName}</td>
            <td>{req.nationality}</td>
            <td>{req.callerName}</td>
            <td>{req.language}</td>
            <td>{req.religion}</td>
            <td className="nreq-date-cell">{req.sendDate}</td>
            <td><span className="nreq-comment-text">{req.comment}</span></td>
            <td>
              <div className="nreq-actions-cell">
                {isPreacher && (
                  <>
                    <button className="nreq-action-btn nreq-accept-btn" title="قبول" onClick={() => onAccept(req)}>
                      <Check size={18} />
                    </button>
                    <button className="nreq-action-btn nreq-reject-btn" title="إلغاء" onClick={() => onReject(req)}>
                      <X size={18} />
                    </button>
                  </>
                )}
                <button className="nreq-action-btn nreq-eye-btn" onClick={() => onView(req)} title="عرض التفاصيل">
                  <Eye size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Helper: labeled field cell with gold icon
const NField = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="nreq-dfield">
    <span className="nreq-dfield-label"><span className="nreq-icon-gold">{icon}</span>{label}</span>
    <span className="nreq-dfield-value">{children}</span>
  </div>
);

// -------------------------
// Detail View Component
// -------------------------
const DetailView = ({ detail, onBack, isPreacher, onAccept, onReject }: { detail: RequestDetail; onBack: () => void; isPreacher: boolean; onAccept: () => void; onReject: () => void }) => (
  <div className="nreq-detail-page" dir="rtl">
    <div className="nreq-detail-header-wrapper">
      <div className="nreq-detail-header-titles">
        {/* Breadcrumb */}
        <div className="nreq-breadcrumb">
          <button className="nreq-breadcrumb-link" onClick={onBack}>طلبات الدعوة الجديدة</button>
          <ChevronRight size={14} />
        </div>
        <h1 className="nreq-detail-title">عرض الطلب الجديد</h1>
      </div>

      {isPreacher && (
        <div className="nreq-detail-actions">
          <button className="nreq-detail-btn nreq-detail-accept" onClick={onAccept}>
            استلام الطلب
            <Check size={18} />
          </button>
          <button className="nreq-detail-btn nreq-detail-reject" onClick={onReject}>
            رفض الطلب
            <X size={18} />
          </button>
        </div>
      )}
    </div>

    <div className="nreq-detail-card">

      {/* ── Row 1: name / nationality / language / religion ── */}
      <div className="nreq-drow">
        <NField label="اسم الشخص" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}>
          {detail.donorName}
        </NField>
        <NField label="الجنسية" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}>
          {detail.nationality}
        </NField>
        <NField label="اللغة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}>
          {detail.language}
        </NField>
        <NField label="الديانة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}>
          {detail.religion}
        </NField>
      </div>

      {/* ── Row 2: email / phone / gender / age ── */}
      <div className="nreq-drow">
        <NField label="البريد الالكتروني" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
          {detail.email}
        </NField>
        <NField label="رقم الهاتف" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.48-1.48a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}>
          <span dir="ltr">{detail.phone}</span>
        </NField>
        <NField label="النوع" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
          {detail.gender}
        </NField>
        <NField label="السن" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
          {detail.age} عام
        </NField>
      </div>

      {/* ── Row 3: contact (span 2) / preacher (span 2) ── */}
      <div className="nreq-drow">
        <div className="nreq-dfield nreq-dfield-span2">
          <span className="nreq-dfield-label">
            <span className="nreq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
            طرق التواصل
          </span>
          <div className="nreq-dfield-value nreq-contact-row">
            <span className="nreq-fb-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              {detail.contactMethod}
            </span>
            <a href={detail.contactLink} target="_blank" rel="noreferrer" className="nreq-contact-link">{detail.contactLink}</a>
          </div>
        </div>

        <div className="nreq-dfield nreq-dfield-span2">
          <span className="nreq-dfield-label">
            <span className="nreq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            الداعية
          </span>
          <div className="nreq-dfield-value nreq-caller-row">
            <div className="nreq-caller-avatar">{detail.callerName.charAt(0)}</div>
            <span>{detail.callerName}</span>
          </div>
        </div>
      </div>

      {/* ── Text section ── */}
      <div className="nreq-text-section">
        <span className="nreq-text-label">
          <span className="nreq-icon-gold"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
          التعليق الخاص بالشخص
        </span>
        <p className="nreq-text-body">{detail.personalComment}</p>
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
  
  // Modals state
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  // Optional: const [selectedActionRequest, setSelectedActionRequest] = useState<Request | null>(null);
  
  const userRole = localStorage.getItem('userRole') || 'association';
  const isPreacher = userRole === 'preacher';

  // Filter + Sort state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filterLanguages, setFilterLanguages] = useState<string[]>(['العربية', 'الانجليزية']);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('داعية');
  const [selectedStatus, setSelectedStatus] = useState<string>('مفعل');
  const availableLanguages = ['العربية', 'الانجليزية', 'الفرنسية', 'الاسبانية', 'البرتغالية', 'الهندية'];
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortRef, filterRef]);

  const removeLanguage = (lang: string) => setFilterLanguages(filterLanguages.filter(l => l !== lang));
  const addLanguage = (lang: string) => { if (!filterLanguages.includes(lang)) setFilterLanguages([...filterLanguages, lang]); };
  const toggleAccordion = (name: string) => setOpenAccordion(openAccordion === name ? null : name);

  const handleView = () => {
    setSelectedRequest(MOCK_DETAIL);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedRequest(null);
    setView(MOCK_REQUESTS.length > 0 ? 'table' : 'empty');
  };

  const handleOpenAcceptModal = () => {
    // setSelectedActionRequest(req || null);
    setIsAcceptModalOpen(true);
  };

  const handleOpenRejectModal = () => {
    // setSelectedActionRequest(req || null);
    setIsRejectModalOpen(true);
  };

  const closeModals = () => {
    setIsAcceptModalOpen(false);
    setIsRejectModalOpen(false);
    // setSelectedActionRequest(null);
  };

  const handleConfirmAccept = () => {
    // Handle Accept Logic Here
    closeModals();
  };

  const handleConfirmReject = () => {
    // Handle Reject Logic Here
    closeModals();
  };

  return (
    <div className="nreq-page">
      {/* Modals */}
      {isAcceptModalOpen && <AcceptModal onClose={closeModals} onConfirm={handleConfirmAccept} />}
      {isRejectModalOpen && <RejectModal onClose={closeModals} onConfirm={handleConfirmReject} />}

      {view === 'detail' && selectedRequest ? (
        <DetailView 
          detail={selectedRequest} 
          onBack={handleBack} 
          isPreacher={isPreacher}
          onAccept={() => handleOpenAcceptModal()}
          onReject={() => handleOpenRejectModal()}
        />
      ) : (
        <>
          <div className="nreq-header-area">
            <h1 className="page-title">طلبات الدعوة الجديدة</h1>

            <div className="nreq-actions">
              <div className="search-input-wrapper-outlined">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="ابحث" className="search-input-outlined" />
              </div>

              <div className="filter-popup-container" ref={filterRef}>
                <button
                  className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <FilterIcon size={18} />
                  فلتر
                </button>

                {/* Filter Side Panel Popup */}
                {isFilterOpen && (
                  <div className="filter-panel" dir="rtl">
                    <div className="filter-panel-header">
                      <h2 className="filter-title">الفلتر</h2>
                      <button className="btn-apply-filter" onClick={() => setIsFilterOpen(false)}>تطبيق الفلتر</button>
                    </div>

                    <div className="filter-body">
                      {/* Search */}
                      <div className="filter-search">
                        <Search size={16} className="filter-search-icon" />
                        <input type="text" placeholder="ابحث ..." className="filter-search-input" />
                      </div>

                      {/* Date */}
                      <div className="filter-accordion">
                        <div className="filter-accordion-header" onClick={() => toggleAccordion('date')}>
                          <span>تاريخ الارسال</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'date' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'date' && (
                          <div className="filter-accordion-content mt-2">
                            <div className="filter-date-input active-outline relative-date-input">
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
                              <label className="submenu-item" onClick={(e) => { e.preventDefault(); setSelectedType('داعية'); }}>
                                <div className={`checkbox-custom check-align-left ${selectedType === 'داعية' ? 'checked-gold' : ''}`}>
                                  {selectedType === 'داعية' && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>داعية</span>
                              </label>
                              <label className="submenu-item" onClick={(e) => { e.preventDefault(); setSelectedType('غير ذلك'); }}>
                                <div className={`checkbox-custom check-align-left ${selectedType === 'غير ذلك' ? 'checked-gold' : ''}`}>
                                  {selectedType === 'غير ذلك' && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>غير ذلك</span>
                              </label>
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
                        <div className="filter-accordion-content mt-2">
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
                                  <label key={lang} className="submenu-item" onClick={(e) => { e.preventDefault(); if (sel) { removeLanguage(lang); } else { addLanguage(lang); } }}>
                                    <div className={`checkbox-custom check-align-left ${sel ? 'checked-gold' : ''}`}>
                                      {sel && <Check size={12} strokeWidth={3} color="white" />}
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
                              <div className={`checkbox-custom check-align-left ${selectedStatus === key ? 'checked-gold' : ''}`}>
                                {selectedStatus === key && <Check size={12} strokeWidth={3} color="white" />}
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
              {view === 'empty' ? <EmptyState /> : <TableView requests={MOCK_REQUESTS} onView={handleView} isPreacher={isPreacher} onAccept={handleOpenAcceptModal} onReject={handleOpenRejectModal} />}
            </div>


          </div>
        </>
      )}
    </div>
  );
};

export default NewRequests;
