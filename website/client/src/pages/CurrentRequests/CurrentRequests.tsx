import { useState, useRef, useEffect } from 'react';
import { Search, Filter as FilterIcon, SortDesc, Eye, ChevronRight, ChevronDown, Calendar, X, Check } from 'lucide-react';
import './CurrentRequests.css';

// -------------------------
// Types
// -------------------------
type RequestStatus = 'تم إسلامه' | 'رفض الإسلام' | 'غير الإقناع';

interface Request {
  id: number;
  serial: string;
  donorName: string;    // اسم الداعي
  callerName: string;   // اسم المدعو
  daiName: string;      // اسم الداعية
  sendDate: string;
  status: RequestStatus;
  note: string;
  nationality: string;
  language: string;
  religion: string;
}

interface RequestDetail extends Request {
  age: number;
  gender: string;
  phone: string;
  email: string;
  contactMethod: string;
  contactLink: string;
  personalComment: string;
  callerNote: string;    // ملاحظات الداعية
}

// -------------------------
// Mock data
// -------------------------
const MOCK_REQUESTS: Request[] = [
  { id: 1,  serial: '123456', donorName: 'جون سميث', callerName: 'احمد عاطف',       daiName: 'الداعية محمد',    nationality: 'فرنسا',          language: 'اللغة الفرنسية', religion: 'مسيحي', sendDate: '22/02/2023\n7:00 AM', status: 'تم إسلامه',  note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
  { id: 2,  serial: '123456', donorName: 'جون سميث', callerName: 'محمد علي',        daiName: 'الداعية علي',     nationality: 'انجلترا',        language: 'الانجليزية',     religion: 'بهودي', sendDate: '22/02/2023\n7:00 AM', status: 'تم إسلامه',  note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
  { id: 3,  serial: '123456', donorName: 'جون سميث', callerName: 'سيد صابر',        daiName: 'الداعية صابر',    nationality: 'البرتغال',       language: 'البرتغالية',     religion: 'بودي',  sendDate: '22/02/2023\n7:00 AM', status: 'رفض الإسلام', note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
  { id: 4,  serial: '123456', donorName: 'جون سميث', callerName: 'احمد خالد',       daiName: 'احمد خالد',       nationality: 'المانيا',        language: 'الالمانية',      religion: 'ملحد',  sendDate: '22/02/2023\n7:00 AM', status: 'غير الإقناع', note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
  { id: 5,  serial: '123456', donorName: 'جون سميث', callerName: 'ابراهيم علي',     daiName: 'ابراهيم علي',     nationality: 'بلجيكا',         language: 'البلجيكية',      religion: 'بهودي', sendDate: '22/02/2023\n7:00 AM', status: 'تم إسلامه',  note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
  { id: 6,  serial: '123456', donorName: 'جون سميث', callerName: 'حمدي المير غني',  daiName: 'حمدي المير غني',  nationality: 'الاتحاد الروسي', language: 'الروسية',        religion: 'مسيحي', sendDate: '22/02/2023\n7:00 AM', status: 'تم إسلامه',  note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
  { id: 7,  serial: '123456', donorName: 'جون سميث', callerName: 'سمير غانم',       daiName: 'سمير غانم',       nationality: 'الاتحاد الروسي', language: 'الروسية',        religion: 'مسيحي', sendDate: '22/02/2023\n7:00 AM', status: 'تم إسلامه',  note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
  { id: 8,  serial: '123456', donorName: 'جون سميث', callerName: 'سمير غانم',       daiName: 'سمير غانم',       nationality: 'الاتحاد الروسي', language: 'الروسية',        religion: 'مسيحي', sendDate: '22/02/2023\n7:00 AM', status: 'رفض الإسلام', note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
  { id: 9,  serial: '123456', donorName: 'جون سميث', callerName: 'سمير غانم',       daiName: 'سمير غانم',       nationality: 'الاتحاد الروسي', language: 'الروسية',        religion: 'مسيحي', sendDate: '22/02/2023\n7:00 AM', status: 'تم إسلامه',  note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
  { id: 10, serial: '123456', donorName: 'جون سميث', callerName: 'سمير غانم',       daiName: 'سمير غانم',       nationality: 'الاتحاد الروسي', language: 'الروسية',        religion: 'مسيحي', sendDate: '22/02/2023\n7:00 AM', status: 'غير الإقناع', note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية' },
];

const MOCK_DETAIL: RequestDetail = {
  id: 1,
  serial: '123456',
  donorName: 'جون سميث',
  callerName: 'احمد عاطف',
  daiName: 'احمد عاطف',
  nationality: 'فرنسا',
  language: 'اللغة الفرنسية',
  religion: 'مسيحي',
  sendDate: '22/02/2023\n7:00 AM',
  status: 'تم إسلامه',
  note: 'يكتب هنا في هذا السطر ملاحظة خاصة بالداعية',
  age: 33,
  gender: 'ذكر',
  phone: '+2001155591759',
  email: 'John2025@gmail.com',
  contactMethod: 'فيس بوك',
  contactLink: 'https://www.facebook.com/',
  personalComment: 'هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربي، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التي يتولدها التطبيق.\nإذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربي زيادة عدد الفقرات كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربي مفيد لمصممي المواقع على وجه الخصوص، حيث يحتاج العميل في كثير من الأحيان أن يطلع على صورة حقيقية لتصميم الموقع.',
  callerNote: 'هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربي، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التي يتولدها التطبيق.\nإذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربي زيادة عدد الفقرات كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية، مولد النص العربي مفيد لمصممي المواقع على وجه الخصوص.',
};

// -------------------------
// Status Badge Helper
// -------------------------
const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  'تم إسلامه':  { label: 'تم إسلامه',  className: 'creq-status-badge creq-status-green'  },
  'رفض الإسلام': { label: 'رفض الإسلام', className: 'creq-status-badge creq-status-red'    },
  'غير الإقناع': { label: 'غير الإقناع', className: 'creq-status-badge creq-status-yellow' },
};

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const cfg = statusConfig[status];
  return <span className={cfg.className}>{cfg.label}</span>;
};

// -------------------------
// Empty State Component
// -------------------------
const EmptyState = () => (
  <div className="creq-empty-state">
    <div className="creq-empty-icon">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="5" width="48" height="60" rx="6" stroke="#DBA841" strokeWidth="3" fill="none"/>
        <circle cx="32" cy="25" r="8" stroke="#DBA841" strokeWidth="3" fill="none"/>
        <line x1="16" y1="45" x2="52" y2="45" stroke="#DBA841" strokeWidth="3" strokeLinecap="round"/>
        <line x1="16" y1="53" x2="42" y2="53" stroke="#DBA841" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="32" cy="25" r="4" fill="#DBA841"/>
      </svg>
    </div>
    <h2 className="creq-empty-title">لا يوجد طلبات حالية في الوقت الحالي</h2>
    <p className="creq-empty-desc">تابعونا! لا توجد طلبات حالية حتى الآن. سنُعلمكم فور توفر شيء مهم لمشاركته.</p>
  </div>
);

// -------------------------
// Table View Component
// -------------------------
const TableView = ({ requests, onView }: { requests: Request[]; onView: (r: Request) => void }) => (
  <div className="creq-table-wrapper">
    <table className="creq-table">
      <thead>
        <tr>
          <th>رقم <span className="creq-sort-arrow">↕</span></th>
          <th>اسم المدعو <span className="creq-sort-arrow">↕</span></th>
          <th>اسم الداعي <span className="creq-sort-arrow">↕</span></th>
          <th>اسم الداعية <span className="creq-sort-arrow">↕</span></th>
          <th>تاريخ الدعوة <span className="creq-sort-arrow">↕</span></th>
          <th>حالة الطلب <span className="creq-sort-arrow">↕</span></th>
          <th>ملاحظة <span className="creq-sort-arrow">↕</span></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {requests.map((req) => (
          <tr key={req.id}>
            <td>{req.serial}</td>
            <td>{req.donorName}</td>
            <td>{req.callerName}</td>
            <td>{req.daiName}</td>
            <td className="creq-date-cell">{req.sendDate}</td>
            <td><StatusBadge status={req.status} /></td>
            <td>
              <span className="creq-note-text">{req.note}</span>
            </td>
            <td>
              <button className="creq-eye-btn" onClick={() => onView(req)} title="عرض التفاصيل">
                <Eye size={18} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


// A single labeled field cell
const DetailField = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="creq-dfield">
    <span className="creq-dfield-label"><span className="creq-icon-gold">{icon}</span>{label}</span>
    <span className="creq-dfield-value">{children}</span>
  </div>
);

// -------------------------
// Detail View Component
// -------------------------
const DetailView = ({ detail, onBack }: { detail: RequestDetail; onBack: () => void }) => (
  <div className="creq-detail-page" dir="rtl">
    {/* Breadcrumb */}
    <div className="creq-breadcrumb">
      <button className="creq-breadcrumb-link" onClick={onBack}>طلبات الدعوة الحالية</button>
      <ChevronRight size={14} />
    </div>
    <h1 className="creq-detail-title">عرض الطلب الحالي</h1>

    <div className="creq-detail-card">

      {/* ── Row 1: name / nationality / language / religion ── */}
      <div className="creq-drow">
        <DetailField label="اسم الشخص" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}>
          {detail.donorName}
        </DetailField>
        <DetailField label="الجنسية" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}>
          {detail.nationality}
        </DetailField>
        <DetailField label="اللغة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}>
          {detail.language}
        </DetailField>
        <DetailField label="الديانة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}>
          {detail.religion}
        </DetailField>
      </div>

      {/* ── Row 2: email / phone / gender / age ── */}
      <div className="creq-drow">
        <DetailField label="البريد الالكتروني" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
          {detail.email}
        </DetailField>
        <DetailField label="رقم الهاتف" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.48-1.48a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}>
          <span dir="ltr">{detail.phone}</span>
        </DetailField>
        <DetailField label="النوع" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
          {detail.gender}
        </DetailField>
        <DetailField label="السن" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
          {detail.age} عام
        </DetailField>
      </div>

      {/* ── Row 3: contact / status / preacher ── */}
      <div className="creq-drow">
        <div className="creq-dfield">
          <span className="creq-dfield-label">
            <span className="creq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
            طرق التواصل
          </span>
          <div className="creq-dfield-value creq-contact-row">
            <span className="creq-fb-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              {detail.contactMethod}
            </span>
            <a href={detail.contactLink} target="_blank" rel="noreferrer" className="creq-contact-link">{detail.contactLink}</a>
          </div>
        </div>

        <div className="creq-dfield">
          <span className="creq-dfield-label">
            <span className="creq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg></span>
            الحاله
          </span>
          <span className="creq-dfield-value"><StatusBadge status={detail.status} /></span>
        </div>

        <div className="creq-dfield creq-dfield-span2">
          <span className="creq-dfield-label">
            <span className="creq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            الداعية
          </span>
          <div className="creq-dfield-value creq-caller-row">
            <div className="creq-caller-avatar">{detail.callerName.charAt(0)}</div>
            <span>{detail.callerName}</span>
          </div>
        </div>
      </div>

      {/* ── Text sections ── */}
      <div className="creq-text-section">
        <span className="creq-text-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          التعليق الخاص بالشخص
        </span>
        <p className="creq-text-body">{detail.personalComment}</p>
      </div>

      <div className="creq-text-section">
        <span className="creq-text-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          متطلبات الداعية
        </span>
        <p className="creq-text-body">{detail.callerNote}</p>
      </div>

    </div>
  </div>
);


// -------------------------
// Main Component
// -------------------------
const CurrentRequests = () => {
  const [view, setView] = useState<'empty' | 'table' | 'detail'>(MOCK_REQUESTS.length > 0 ? 'table' : 'empty');
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);

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

  const handleView = () => {
    setSelectedRequest(MOCK_DETAIL);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedRequest(null);
    setView(MOCK_REQUESTS.length > 0 ? 'table' : 'empty');
  };

  return (
    <div className="creq-page">
      {view === 'detail' && selectedRequest ? (
        <DetailView detail={selectedRequest} onBack={handleBack} />
      ) : (
        <>
          <div className="creq-header-area">
            <h1 className="page-title">طلبات الدعوة الحالية</h1>
            <div className="creq-actions">
              <div className="search-input-wrapper-outlined">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="ابحث" className="search-input-outlined" />
              </div>
              <button className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                <FilterIcon size={18} />فلتر
              </button>
              <div className="sort-container" ref={sortRef}>
                <button className={`btn-icon-text ${isSortOpen ? 'active' : ''}`} onClick={() => setIsSortOpen(!isSortOpen)}>
                  <SortDesc size={18} />تصنيف
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

          <div className="creq-body-wrapper">
            <div className="creq-content">
              {view === 'empty' ? <EmptyState /> : <TableView requests={MOCK_REQUESTS} onView={handleView} />}
            </div>

            {isFilterOpen && (
              <div className="creq-filter-panel">
                <div className="creq-filter-panel-header">
                  <h2 className="creq-filter-title">الفلتر</h2>
                  <button className="btn-apply-filter" onClick={() => setIsFilterOpen(false)}>تطبيق الفلتر</button>
                </div>
                <div className="creq-filter-body">
                  <div className="creq-filter-search">
                    <Search size={16} className="creq-filter-search-icon" />
                    <input type="text" placeholder="ابحث ....." className="creq-filter-search-input" />
                  </div>

                  <div className="creq-filter-accordion">
                    <div className="creq-filter-accordion-header" onClick={() => toggleAccordion('date')}>
                      <span>تاريخ الانضمام</span>
                      <ChevronDown size={16} className={`text-gray ${openAccordion === 'date' ? 'rotate-180' : ''}`} />
                    </div>
                    {openAccordion === 'date' && (
                      <div className="creq-filter-accordion-content mt-2">
                        <div className="creq-filter-date-input creq-active-outline creq-relative-date-input">
                          <Calendar size={16} className="text-gray" />
                          <input type="date" className="custom-date-picker" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="creq-filter-accordion">
                    <div className="creq-filter-accordion-header" onClick={() => toggleAccordion('type')}>
                      <span>النوع</span>
                      <ChevronDown size={16} className={`text-gray ${openAccordion === 'type' ? 'rotate-180' : ''}`} />
                    </div>
                    {openAccordion === 'type' && (
                      <div className="creq-filter-accordion-content mt-2">
                        <div className="creq-filter-submenu-list creq-bordered-list">
                          {['داعية', 'غير ذلك'].map(t => (
                            <label key={t} className="creq-submenu-item" onClick={(e) => { e.preventDefault(); setSelectedType(t); }}>
                              <div className={`creq-checkbox-custom creq-check-align-left ${selectedType === t ? 'checked' : ''}`}>
                                {selectedType === t && <Check size={12} strokeWidth={4} />}
                              </div>
                              <span>{t}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="creq-filter-accordion">
                    <div className="creq-filter-accordion-header" onClick={() => toggleAccordion('language')}>
                      <span>اللغة</span>
                      <ChevronDown size={16} className={`text-gray ${openAccordion === 'language' ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="creq-filter-accordion-content">
                      <div className="creq-filter-tags-wrapper">
                        {filterLanguages.map((lang, i) => (
                          <span key={i} className="creq-filter-tag">
                            <span>{lang}</span>
                            <button type="button" onClick={() => removeLanguage(lang)}><X size={12} /></button>
                          </span>
                        ))}
                      </div>
                      {openAccordion === 'language' && (
                        <div className="creq-filter-submenu-list creq-bordered-list mt-3">
                          {availableLanguages.map(lang => {
                            const sel = filterLanguages.includes(lang);
                            return (
                              <label key={lang} className="creq-submenu-item" onClick={(e) => { e.preventDefault(); if (sel) { removeLanguage(lang); } else { addLanguage(lang); } }}>
                                <div className={`creq-checkbox-custom creq-check-align-left ${sel ? 'checked' : ''}`}>
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

                  <div className="creq-filter-accordion creq-no-border">
                    <div className="creq-filter-accordion-header creq-filter-status-header">
                      <span>الحالة</span>
                    </div>
                    <div className="creq-filter-accordion-content creq-status-content mt-2">
                      {[{ key: 'مفعل', cls: 'active-status' }, { key: 'غير مفعل', cls: 'inactive-status' }].map(({ key, cls }) => (
                        <label key={key} className={`creq-status-option ${selectedStatus === key ? cls : ''}`} onClick={() => setSelectedStatus(key)}>
                          <div className={`creq-checkbox-custom creq-check-align-left ${selectedStatus === key ? (key === 'مفعل' ? 'checked' : 'checked-red') : ''}`}>
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

export default CurrentRequests;
