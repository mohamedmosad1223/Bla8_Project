import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter as FilterIcon, Eye, ChevronLeft, ChevronDown, X, Check, Copy } from 'lucide-react';
import './CurrentRequests.css';

// -------------------------
// Types
// -------------------------
type RequestStatus = 'تم إسلامه' | 'رفض الإسلام' | 'قيد الإقناع';

interface Request {
  id: number;
  serial: string;
  donorName: string;    // اسم الشخص
  nationality: string;
  language: string;
  religion: string;
  sendDate: string;
  note: string;
  status: RequestStatus;
  
  // These are optional / detail only now
  callerName?: string;   
  daiName?: string;      
}

interface RequestDetail extends Request {
  age: number;
  gender: string;
  phone: string;
  email: string;
  contactMethod: string;
  contactLink: string;
  personalComment: string;
  callerNote: string;
}

// -------------------------
// Mock data
// -------------------------
const MOCK_REQUESTS: Request[] = [
  { 
    id: 1,  
    serial: '123456', 
    donorName: 'جون سميث', 
    nationality: 'فرنسا',          
    language: 'اللغة الفرنسية', 
    religion: 'مسيحي', 
    sendDate: '22/02/2023\n7:00 AM', 
    note: 'يكتب هنا تعليق في تلك المساحة',
    status: 'تم إسلامه',
    callerName: 'احمد عاطف',
    daiName: 'الداعية محمد'
  }
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
  'قيد الإقناع': { label: 'قيد الإقناع', className: 'creq-status-badge creq-status-yellow' },
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
          <th>اسم الشخص <span className="creq-sort-arrow">↕</span></th>
          <th>الجنسية <span className="creq-sort-arrow">↕</span></th>
          <th>لغة التواصل <span className="creq-sort-arrow">↕</span></th>
          <th>الديانة <span className="creq-sort-arrow">↕</span></th>
          <th>تاريخ الارسال <span className="creq-sort-arrow">↕</span></th>
          <th>التعليق <span className="creq-sort-arrow">↕</span></th>
          <th>حالة الطلب <span className="creq-sort-arrow">↕</span></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {requests.map((req) => (
          <tr key={req.id}>
            <td>{req.serial}</td>
            <td>{req.donorName}</td>
            <td>{req.nationality}</td>
            <td>{req.language}</td>
            <td>{req.religion}</td>
            <td className="creq-date-cell">{req.sendDate}</td>
            <td>
              <span className="creq-note-text">{req.note}</span>
            </td>
            <td><StatusBadge status={req.status} /></td>
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
const DetailView = ({ detail, onBack }: { detail: RequestDetail; onBack: () => void }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="creq-detail-page" dir="rtl">
      {/* Header with Breadcrumb and Action Buttons */}
      <div className="creq-detail-header-row">
        <div>
          <div className="creq-breadcrumb">
            <button className="creq-breadcrumb-link" onClick={onBack}>الطلبات الحالية</button>
            <ChevronLeft size={14} className="creq-breadcrumb-chevron" />
          </div>
          <h1 className="creq-detail-title">عرض الطلب الحالي</h1>
        </div>
        
        <div className="creq-detail-actions">
          {localStorage.getItem('userRole') === 'preacher' && (<>
            <button className="creq-dtl-btn creq-btn-refresh" onClick={() => setShowUpdateModal(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-5.23l.11-.14"/></svg>
              تحديث الحالة
            </button>
            <button className="creq-dtl-btn creq-btn-chat" onClick={() => navigate('/conversations')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              المحادثة
            </button>
          </>)}
        </div>
      </div>

    <div className="creq-detail-card">

      {/* ── Row 1: name / nationality / language / religion ── */}
      <div className="creq-drow">
        <DetailField label="اسم الشخص" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>}>
          {detail.donorName}
        </DetailField>
        <DetailField label="الجنسية" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}>
          {detail.nationality}
        </DetailField>
        <DetailField label="اللغة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}>
          {detail.language}
        </DetailField>
        <DetailField label="الديانة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></svg>}>
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

      {/* ── Row 3: contact / status  ── */}
      <div className="creq-drow">
        <div className="creq-dfield creq-dfield-span2">
          <span className="creq-dfield-label">
            <span className="creq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
            طرق التواصل
          </span>
          <div className="creq-dfield-value creq-contact-row">
            <span className="creq-fb-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              {detail.contactMethod}
            </span>
            <div className="creq-contact-link-wrapper">
              <a href={detail.contactLink} target="_blank" rel="noreferrer" className="creq-contact-link">{detail.contactLink}</a>
              <span className="creq-icon-gold creq-ml-2 cursor-pointer"><Copy size={14} /></span>
            </div>
          </div>
        </div>

        <div className="creq-dfield">
          <span className="creq-dfield-label">
            <span className="creq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
            الحالة
          </span>
          <span className="creq-dfield-value"><StatusBadge status={detail.status} /></span>
        </div>
      </div>

      {/* ── Text sections ── */}
      <div className="creq-text-section-divider"></div>

      <div className="creq-text-section">
        <span className="creq-text-label">
          <span className="creq-icon-gold">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </span>
          التعليق الخاص بالشخص
        </span>
        <p className="creq-text-body">{detail.personalComment}</p>
      </div>

      <div className="creq-text-section mt-6">
        <span className="creq-text-label">
          <span className="creq-icon-gold">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </span>
          ملاحظات الداعية
        </span>
        <p className="creq-text-body">{detail.callerNote}</p>
      </div>

    </div>
    
    {showUpdateModal && <UpdateStatusModal onClose={() => setShowUpdateModal(false)} />}
  </div>
);
}


// -------------------------
// Update Status Modal
// -------------------------
const UpdateStatusModal = ({ onClose }: { onClose: () => void }) => {
  const [selected, setSelected] = useState<'Islam' | 'Reject'>('Islam');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = () => setSuccess(true);

  if (success) {
    return (
      <div className="umodal-backdrop" onClick={onClose}>
        <div className="umodal-box umodal-box-sm" onClick={e => e.stopPropagation()} dir="rtl">
          <button className="umodal-close" onClick={onClose}><X size={20} strokeWidth={2} /></button>
          
          <div className="umodal-success">
            <div className="umodal-success-icon-wrap">
               <svg viewBox="0 0 24 24" fill="#0CBC6F" width="100%" height="100%">
                 <circle cx="12" cy="12" r="12" fill="#0CBC6F" />
                 <path d="M7 12l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
               </svg>
            </div>
            <h2 className="umodal-success-title">تم تحديث الحالة!</h2>
            <p className="umodal-success-sub">تم تحديث الحالة بنجاح</p>
            <button className="umodal-btn-done" onClick={onClose}>تم</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="umodal-backdrop" onClick={onClose}>
      <div className="umodal-box" onClick={e => e.stopPropagation()} dir="rtl">
        <button className="umodal-close" onClick={onClose}><X size={20} strokeWidth={2} /></button>
        <h2 className="umodal-title">تحديث الحالة</h2>

        {/* Toggle row */}
        <div className="umodal-toggle-container">
          <button
            className={`umodal-tab-btn ${selected === 'Islam' ? 'active-green' : 'inactive-gray'}`}
            onClick={() => setSelected('Islam')}
          >
            تم اسلامه
          </button>
          <button
            className={`umodal-tab-btn ${selected === 'Reject' ? 'active-green' : 'inactive-gray'}`}
            onClick={() => setSelected('Reject')}
          >
            رفض الاسلام
          </button>
        </div>

        {/* Note textarea */}
        <div className="umodal-field">
          <textarea
            className="umodal-textarea"
            placeholder="مثال ملاحظة"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
          />
          <span className="umodal-label-float">ملاحظة</span>
        </div>

        {/* Actions */}
        <div className="umodal-actions">
          <button className="umodal-btn-save" onClick={handleSave}>حفظ</button>
          <button className="umodal-btn-cancel" onClick={onClose}>الغاء</button>
        </div>
      </div>
    </div>
  );
};

// -------------------------
// Main Component
// -------------------------
const CurrentRequests = () => {
  const [view, setView] = useState<'empty' | 'table' | 'detail'>(MOCK_REQUESTS.length > 0 ? 'table' : 'empty');
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filterLanguages, setFilterLanguages] = useState<string[]>(['العربية', 'الانجليزية']);
  const [filterNationalities, setFilterNationalities] = useState<string[]>(['البرازيل', 'الولايات المتحدة الامريكية']);
  const [selectedReligion, setSelectedReligion] = useState<string>('مسيحي');
  const availableNationalities = [
    'مصر', 'السعودية', 'الإمارات', 'الكويت', 'قطر', 'البحرين', 'عمان', 'الأردن', 'سوريا', 'لبنان', 'فلسطين', 'العراق', 'اليمن',
    'المغرب', 'الجزائر', 'تونس', 'ليبيا', 'السودان', 'الصومال', 'جيبوتي', 'موريتانيا',
    'البرازيل', 'الولايات المتحدة الامريكية', 'كندا', 'المملكة المتحدة', 'فرنسا', 'ألمانيا', 'إيطاليا', 'إسبانيا', 'روسيا', 'الصين', 'اليابان', 'الهند', 'باكستان', 'إندونيسيا', 'ماليزيا', 'تركيا', 'إيران', 'جنوب أفريقيا', 'السنغال', 'نيجيريا', 'الفلبين'
  ];

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('تم إسلامه');
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
  
  const removeNationality = (nat: string) => setFilterNationalities(filterNationalities.filter(l => l !== nat));
  const addNationality = (nat: string) => { if (!filterNationalities.includes(nat)) setFilterNationalities([...filterNationalities, nat]); };

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
                <input type="text" placeholder="ابحث" className="search-input-outlined" />
                <Search size={18} className="search-icon" />
              </div>

              <div className="filters-and-sort-left">
                {/* Filter Button & Popup Container */}
                <div className="creq-filter-container" ref={filterRef}>
                  <button className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                    <FilterIcon size={18} />الفلتر
                  </button>
                  
                  {isFilterOpen && (
                    <div className="creq-filter-panel" dir="rtl">
                      <div className="creq-filter-panel-header">
                        <h2 className="creq-filter-title">الفلتر</h2>
                        <button className="btn-apply-filter" onClick={() => setIsFilterOpen(false)}>تطبيق الفلتر</button>
                      </div>
                      <div className="creq-filter-body">
                        <div className="creq-filter-search">
                          <Search size={16} className="creq-filter-search-icon" />
                          <input type="text" placeholder="ابحث ..." className="creq-filter-search-input" />
                        </div>

                        {/* Date */}
                        <div className="creq-filter-accordion">
                          <div className="creq-filter-accordion-header" onClick={() => toggleAccordion('date')}>
                            <span>تاريخ الارسال</span>
                            <ChevronDown size={16} className={`text-gray ${openAccordion === 'date' ? 'rotate-180' : ''}`} />
                          </div>
                          {openAccordion === 'date' && (
                            <div className="creq-filter-accordion-content mt-2">
                              <div className="creq-filter-date-input creq-active-outline creq-relative-date-input">
                                <input type="datetime-local" className="custom-date-picker" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Religion */}
                        <div className="creq-filter-accordion">
                          <div className="creq-filter-accordion-header" onClick={() => toggleAccordion('religion')}>
                            <span>الديانة</span>
                            <ChevronDown size={16} className={`text-gray ${openAccordion === 'religion' ? 'rotate-180' : ''}`} />
                          </div>
                          {openAccordion === 'religion' && (
                            <div className="creq-filter-accordion-content mt-2">
                              <div className="creq-filter-submenu-list creq-bordered-list">
                                {['مسلم', 'مسيحي', 'يهودي'].map(t => (
                                  <label key={t} className="creq-submenu-item" onClick={(e) => { e.preventDefault(); setSelectedReligion(t); }}>
                                    <div className={`creq-checkbox-custom creq-check-align-left ${selectedReligion === t ? 'checked' : ''}`}>
                                      {selectedReligion === t && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <span>{t}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Nationality */}
                        <div className="creq-filter-accordion">
                          <div className="creq-filter-accordion-header" onClick={() => toggleAccordion('nationality')}>
                            <span>الجنسية</span>
                            <ChevronDown size={16} className={`text-gray ${openAccordion === 'nationality' ? 'rotate-180' : ''}`} />
                          </div>
                          <div className="creq-filter-accordion-content mt-2">
                            <div className="creq-filter-tags-wrapper">
                              {filterNationalities.map((nat, i) => (
                                <span key={i} className="creq-filter-tag">
                                  <span>{nat}</span>
                                  <button type="button" onClick={() => removeNationality(nat)}><X size={12} /></button>
                                </span>
                              ))}
                            </div>
                            {openAccordion === 'nationality' && (
                              <div className="creq-filter-submenu-list creq-bordered-list mt-3">
                                {availableNationalities.map(nat => {
                                  const sel = filterNationalities.includes(nat);
                                  return (
                                    <label key={nat} className="creq-submenu-item" onClick={(e) => { e.preventDefault(); if (sel) { removeNationality(nat); } else { addNationality(nat); } }}>
                                      <div className={`creq-checkbox-custom creq-check-align-left ${sel ? 'checked-gold' : ''}`}>
                                        {sel && <Check size={12} strokeWidth={3} color="white" />}
                                      </div>
                                      <span>{nat}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Language */}
                        <div className="creq-filter-accordion">
                          <div className="creq-filter-accordion-header" onClick={() => toggleAccordion('language')}>
                            <span>اللغة</span>
                            <ChevronDown size={16} className={`text-gray ${openAccordion === 'language' ? 'rotate-180' : ''}`} />
                          </div>
                          <div className="creq-filter-accordion-content mt-2">
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
                                      <div className={`creq-checkbox-custom creq-check-align-left ${sel ? 'checked-gold' : ''}`}>
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
                        <div className="creq-filter-accordion creq-no-border">
                          <div className="creq-filter-accordion-header creq-filter-status-header" onClick={() => toggleAccordion('status')}>
                            <span>الحالة</span>
                            <ChevronDown size={16} className={`text-gray ${openAccordion === 'status' ? 'rotate-180' : ''}`} />
                          </div>
                          {openAccordion === 'status' && (
                            <div className="creq-filter-accordion-content creq-status-content mt-2">
                              {[
                                { key: 'تم إسلامه', cls: 'status-green' }, 
                                { key: 'قيد الإقناع', cls: 'status-yellow' }, 
                                { key: 'رفض الإسلام', cls: 'status-red' }
                              ].map(({ key, cls }) => (
                                <label key={key} className={`creq-status-option ${selectedStatus === key ? cls : ''}`} onClick={() => setSelectedStatus(key)}>
                                  <div className={`creq-checkbox-custom creq-check-align-left ${selectedStatus === key ? 'checked-gold' : ''}`}>
                                    {selectedStatus === key && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>{key}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sort-container" ref={sortRef}>
                  <button className={`btn-icon-text ${isSortOpen ? 'active' : ''}`} onClick={() => setIsSortOpen(!isSortOpen)}>
                    تصنيف <ChevronDown size={14} className="mr-1" />
                  </button>
                  {isSortOpen && (
                    <div className="sort-dropdown" dir="rtl">
                      <button className="sort-option">الاحدث</button>
                      <button className="sort-option">الأقدم</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="creq-body-wrapper">
            <div className="creq-content">
              {view === 'empty' ? <EmptyState /> : <TableView requests={MOCK_REQUESTS} onView={handleView} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentRequests;
