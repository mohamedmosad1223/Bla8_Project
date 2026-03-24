import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter as FilterIcon, SortDesc, Eye, ChevronRight, ChevronDown, X, Check } from 'lucide-react';
import './NewRequests.css';
import { dawahRequestService, PoolRequest } from '../../services/dawahRequestService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const genderLabel = (g: string | null) => {
  if (!g) return '—';
  if (g === 'male' || g === 'ذكر') return 'ذكر';
  if (g === 'female' || g === 'أنثى') return 'أنثى';
  return g;
};

const channelLabel = (ch: string | null) => {
  const map: Record<string, string> = {
    whatsapp: 'واتساب', phone: 'هاتف', messenger: 'ماسنجر', telegram: 'تيليجرام', other: 'أخرى',
  };
  return ch ? (map[ch] ?? ch) : '—';
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })
    + '\n' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};

const invitedName = (r: PoolRequest) =>
  [r.invited_first_name, r.invited_last_name].filter(Boolean).join(' ') || 'غير محدد';

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="nreq-empty-state">
    <div className="nreq-empty-icon">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
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

// ─── Modals ───────────────────────────────────────────────────────────────────
const AcceptModal = ({ onClose, onConfirm, loading }: { onClose: () => void; onConfirm: () => void; loading: boolean }) => (
  <div className="nreq-modal-overlay">
    <div className="nreq-modal nreq-accept-modal" dir="rtl">
      <button className="nreq-modal-close" onClick={onClose}><X size={20} /></button>
      <div className="nreq-modal-content">
        <div className="nreq-modal-icon-success"><Check size={40} strokeWidth={3} /></div>
        <h2 className="nreq-modal-title">تأكيد الاستلام</h2>
        <p className="nreq-modal-desc">هل تريد قبول هذا الطلب والبدء في الدعوة؟</p>
        <button className="nreq-modal-btn-full nreq-btn-success" onClick={onConfirm} disabled={loading}>
          {loading ? 'جارٍ الحفظ...' : 'تأكيد الاستلام'}
        </button>
      </div>
    </div>
  </div>
);

const RejectModal = ({ onClose }: { onClose: () => void }) => (
  <div className="nreq-modal-overlay">
    <div className="nreq-modal nreq-reject-modal" dir="rtl">
      <button className="nreq-modal-close" onClick={onClose}><X size={20} /></button>
      <div className="nreq-modal-content">
        <div className="nreq-modal-icon-danger"><X size={40} strokeWidth={3} /></div>
        <h2 className="nreq-modal-title">تخطي الطلب</h2>
        <p className="nreq-modal-desc">يمكنك تخطي هذا الطلب ليتوفر لداعية آخر.</p>
        <div className="nreq-modal-actions">
          <button className="nreq-modal-btn nreq-btn-cancel" onClick={onClose}>إلغاء</button>
          <button className="nreq-modal-btn nreq-btn-danger" onClick={onClose}>موافق</button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Table View ───────────────────────────────────────────────────────────────
const TableView = ({
  requests, onView, onAccept, onSkip,
}: {
  requests: PoolRequest[];
  onView: (r: PoolRequest) => void;
  onAccept: (r: PoolRequest) => void;
  onSkip: (r: PoolRequest) => void;
}) => (
  <div className="nreq-table-wrapper">
    <table className="nreq-table">
      <thead>
        <tr>
          <th>رقم <span className="sort-arrow">↕</span></th>
          <th>اسم الشخص <span className="sort-arrow">↕</span></th>
          <th>الجنس <span className="sort-arrow">↕</span></th>
          <th>الجنسية <span className="sort-arrow">↕</span></th>
          <th>لغة التواصل <span className="sort-arrow">↕</span></th>
          <th>قناة التواصل <span className="sort-arrow">↕</span></th>
          <th>الديانة <span className="sort-arrow">↕</span></th>
          <th>تاريخ الإرسال <span className="sort-arrow">↕</span></th>
          <th>ملاحظات</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {requests.map((req) => (
          <tr key={req.request_id}>
            <td>#{req.request_id}</td>
            <td>{invitedName(req)}</td>
            <td>{genderLabel(req.invited_gender)}</td>
            <td>{req.invited_country_name || '—'}</td>
            <td>{req.invited_language_name || '—'}</td>
            <td>{channelLabel(req.communication_channel)}</td>
            <td>{req.invited_religion || '—'}</td>
            <td className="nreq-date-cell" style={{ whiteSpace: 'pre-line' }}>{formatDate(req.submission_date)}</td>
            <td><span className="nreq-comment-text">{req.notes || '—'}</span></td>
            <td>
              <div className="nreq-actions-cell">
                <button className="nreq-action-btn nreq-accept-btn" title="قبول" onClick={() => onAccept(req)}>
                  <Check size={18} />
                </button>
                <button className="nreq-action-btn nreq-reject-btn" title="تخطي" onClick={() => onSkip(req)}>
                  <X size={18} />
                </button>
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

// ─── Field Component ──────────────────────────────────────────────────────────
const NField = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="nreq-dfield">
    <span className="nreq-dfield-label"><span className="nreq-icon-gold">{icon}</span>{label}</span>
    <span className="nreq-dfield-value">{children}</span>
  </div>
);

// ─── Detail View ──────────────────────────────────────────────────────────────
const DetailView = ({
  detail, onBack, onAccept, onSkip,
}: {
  detail: PoolRequest;
  onBack: () => void;
  onAccept: () => void;
  onSkip: () => void;
}) => (
  <div className="nreq-detail-page" dir="rtl">
    <div className="nreq-detail-header-wrapper">
      <div className="nreq-detail-header-titles">
        <div className="nreq-breadcrumb">
          <button className="nreq-breadcrumb-link" onClick={onBack}>طلبات الدعوة الجديدة</button>
          <ChevronRight size={14} />
        </div>
        <h1 className="nreq-detail-title">عرض الطلب #{detail.request_id}</h1>
      </div>
      <div className="nreq-detail-actions">
        <button className="nreq-detail-btn nreq-detail-accept" onClick={onAccept}>
          استلام الطلب <Check size={18} />
        </button>
        <button className="nreq-detail-btn nreq-detail-reject" onClick={onSkip}>
          تخطي <X size={18} />
        </button>
      </div>
    </div>

    <div className="nreq-detail-card">
      {/* Row 1 */}
      <div className="nreq-drow">
        <NField label="اسم الشخص" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}>
          {invitedName(detail)}
        </NField>
        <NField label="الجنس" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
          {genderLabel(detail.invited_gender)}
        </NField>
        <NField label="الجنسية" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}>
          {detail.invited_country_name || '—'}
        </NField>
        <NField label="الديانة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}>
          {detail.invited_religion || '—'}
        </NField>
      </div>

      {/* Row 2 */}
      <div className="nreq-drow">
        <NField label="لغة التواصل" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="M12 4c2.8 0 5 2.2 5 5v5"/><path d="M12 20c-2.8 0-5-2.2-5-5V9"/></svg>}>
          {detail.invited_language_name || '—'}
        </NField>
        <NField label="رقم الهاتف" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.48-1.48a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}>
          <span dir="ltr">{detail.invited_phone || '—'}</span>
        </NField>
        <NField label="البريد الإلكتروني" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
          {detail.invited_email || '—'}
        </NField>
        <NField label="قناة التواصل" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}>
          {channelLabel(detail.communication_channel)}
        </NField>
      </div>

      {/* Row 3 */}
      <div className="nreq-drow">
        <NField label="نوع الطلب" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}>
          {detail.request_type || '—'}
        </NField>
        <NField label="تاريخ الإرسال" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
          {new Date(detail.submission_date).toLocaleString('ar-EG')}
        </NField>
        <div className="nreq-dfield"></div>
        <div className="nreq-dfield"></div>
      </div>

      {/* Contact link row */}
      {detail.deep_link && (
        <div className="nreq-drow">
          <div className="nreq-dfield nreq-dfield-span2">
            <span className="nreq-dfield-label">
              <span className="nreq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
              رابط التواصل
            </span>
            <a href={detail.deep_link} target="_blank" rel="noreferrer" className="nreq-contact-link">{detail.deep_link}</a>
          </div>
        </div>
      )}

      {/* Notes */}
      {detail.notes && (
        <div className="nreq-text-section">
          <span className="nreq-text-label">
            <span className="nreq-icon-gold"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
            الملاحظات
          </span>
          <p className="nreq-text-body">{detail.notes}</p>
        </div>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const NewRequests = () => {
  const navigate = useNavigate();

  // ── Data state ───────────────────────────────────────────────────────────
  const [allRequests, setAllRequests] = useState<PoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── View state ────────────────────────────────────────────────────────────
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedRequest, setSelectedRequest] = useState<PoolRequest | null>(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [pendingActionRequest, setPendingActionRequest] = useState<PoolRequest | null>(null);

  // ── Filter & Sort state ───────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Filter values (applied only on "تطبيق الفلتر")
  const [draftGender, setDraftGender] = useState<string>('');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');
  const [draftNationality, setDraftNationality] = useState<string>('');
  const [draftLanguage, setDraftLanguage] = useState<string>('');
  const [draftReligion, setDraftReligion] = useState<string>('');

  const [natSearch, setNatSearch] = useState('');
  const [langSearch, setLangSearch] = useState('');
  const [relSearch, setRelSearch] = useState('');

  const [appliedGender, setAppliedGender] = useState<string>('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [appliedNationality, setAppliedNationality] = useState<string>('');
  const [appliedLanguage, setAppliedLanguage] = useState<string>('');
  const [appliedReligion, setAppliedReligion] = useState<string>('');

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchPool = useCallback(() => {
    setLoading(true);
    setError(null);
    dawahRequestService.getPool(0, 200)
      .then(res => setAllRequests(res.data ?? []))
      .catch((err: any) => {
        const msg = err.response?.data?.detail || 'تعذّر تحميل الطلبات. تأكد من تشغيل الخادم وصحة تسجيل دخولك.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPool(); }, [fetchPool]);

  // ── Click outside close ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Dynamic filter options from loaded data + Common Fallbacks ───────────
  const baseNationalities = ['الكويت', 'مصر', 'السعودية', 'الفلبين', 'الهند', 'سريلانكا', 'نيبال', 'أوغندا', 'أمريكا', 'بريطانيا'];
  const baseLanguages     = ['العربية', 'الإنجليزية', 'التاغالوغية', 'الهندية', 'السنهالية', 'الأمهرية', 'الفرنسية', 'الإسبانية'];
  const baseReligions     = ['مسيحي', 'هندوسي', 'بوذي', 'لاديني', 'يهودي'];

  const uniqueNationalities = [...new Set([...baseNationalities, ...allRequests.map(r => r.invited_country_name).filter(Boolean)])] as string[];
  const uniqueLanguages     = [...new Set([...baseLanguages, ...allRequests.map(r => r.invited_language_name).filter(Boolean)])] as string[];
  const uniqueReligions     = [...new Set([...baseReligions, ...allRequests.map(r => r.invited_religion).filter(Boolean)])] as string[];

  const filteredNats  = uniqueNationalities.filter(n => n.includes(natSearch));
  const filteredLangs = uniqueLanguages.filter(l => l.includes(langSearch));
  const filteredRels  = uniqueReligions.filter(r => r.includes(relSearch));

  // ── Filtered & Sorted list ────────────────────────────────────────────────
  const displayed = allRequests
    .filter(r => {
      if (searchText) {
        const s = searchText.toLowerCase();
        const name = invitedName(r).toLowerCase();
        if (!name.includes(s) && !String(r.request_id).includes(s)) return false;
      }
      if (appliedGender) {
        const g = (r.invited_gender ?? '').toLowerCase();
        if (appliedGender === 'male'   && g !== 'male')   return false;
        if (appliedGender === 'female' && g !== 'female') return false;
      }
      if (appliedNationality && r.invited_country_name !== appliedNationality) return false;
      if (appliedLanguage    && r.invited_language_name !== appliedLanguage)   return false;
      if (appliedReligion    && r.invited_religion !== appliedReligion)        return false;
      if (appliedDateFrom) {
        if (new Date(r.submission_date) < new Date(appliedDateFrom)) return false;
      }
      if (appliedDateTo) {
        if (new Date(r.submission_date) > new Date(appliedDateTo + 'T23:59:59')) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.submission_date).getTime();
      const bTime = new Date(b.submission_date).getTime();
      return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApplyFilter = () => {
    setAppliedGender(draftGender);
    setAppliedDateFrom(draftDateFrom);
    setAppliedDateTo(draftDateTo);
    setAppliedNationality(draftNationality);
    setAppliedLanguage(draftLanguage);
    setAppliedReligion(draftReligion);
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
    setDraftGender(''); 
    setDraftDateFrom(''); 
    setDraftDateTo(''); 
    setDraftNationality(''); 
    setDraftLanguage(''); 
    setDraftReligion('');
    setNatSearch('');
    setLangSearch('');
    setRelSearch('');
  };

  const handleView = (r: PoolRequest) => {
    setSelectedRequest(r);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedRequest(null);
    setView('list');
  };

  const openAccept = (r: PoolRequest) => {
    setPendingActionRequest(r);
    setIsAcceptModalOpen(true);
  };

  const openSkip = (r: PoolRequest) => {
    setPendingActionRequest(r);
    setIsSkipModalOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!pendingActionRequest) return;
    setActionLoading(true);
    try {
      await dawahRequestService.acceptRequest(pendingActionRequest.request_id);
      setIsAcceptModalOpen(false);
      setPendingActionRequest(null);
      // Automatically redirect to Current Requests after accepting
      navigate('/requests/current');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(msg || 'حدث خطأ أثناء قبول الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModals = () => {
    setIsAcceptModalOpen(false);
    setIsSkipModalOpen(false);
    setPendingActionRequest(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="nreq-page">
      {/* Modals */}
      {isAcceptModalOpen && (
        <AcceptModal onClose={closeModals} onConfirm={handleConfirmAccept} loading={actionLoading} />
      )}
      {isSkipModalOpen && (
        <RejectModal onClose={closeModals} />
      )}

      {view === 'detail' && selectedRequest ? (
        <DetailView
          detail={selectedRequest}
          onBack={handleBack}
          onAccept={() => openAccept(selectedRequest)}
          onSkip={() => openSkip(selectedRequest)}
        />
      ) : (
        <>
          {/* Header */}
          <div className="nreq-header-area">
            <h1 className="page-title">طلبات الدعوة الجديدة</h1>

            <div className="nreq-actions">
              {/* Search */}
              <div className="search-input-wrapper-outlined">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الرقم"
                  className="search-input-outlined"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
              </div>

              {/* Filter */}
              <div className="filter-popup-container" ref={filterRef}>
                <button
                  className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <FilterIcon size={18} />
                  فلتر
                  {(appliedGender || appliedDateFrom || appliedDateTo || appliedNationality || appliedLanguage || appliedReligion) && (
                    <span style={{ background: '#dba841', color: '#fff', borderRadius: '50%', width: 8, height: 8, display: 'inline-block', marginRight: 4 }} />
                  )}
                </button>

                {isFilterOpen && (
                  <div className="filter-panel" dir="rtl">
                    <div className="filter-panel-header">
                      <h2 className="filter-title">الفلتر</h2>
                      <button className="btn-apply-filter" onClick={handleApplyFilter}>تطبيق الفلتر</button>
                    </div>

                    <div className="filter-body">
                      {/* Gender accordion */}
                      <div className="filter-accordion">
                        <div className="filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'gender' ? null : 'gender')}>
                          <span>الجنس</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'gender' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'gender' && (
                          <div className="filter-accordion-content mt-2">
                            <div className="filter-submenu-list bordered-list">
                              {[{ val: '', label: 'الكل' }, { val: 'male', label: 'ذكر' }, { val: 'female', label: 'أنثى' }].map(opt => (
                                <label key={opt.val} className="submenu-item" onClick={(e) => { e.preventDefault(); setDraftGender(opt.val); }}>
                                  <div className={`checkbox-custom check-align-left ${draftGender === opt.val ? 'checked-gold' : ''}`}>
                                    {draftGender === opt.val && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Date range accordion */}
                      <div className="filter-accordion">
                        <div className="filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'date' ? null : 'date')}>
                          <span>تاريخ الإرسال</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'date' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'date' && (
                          <div className="filter-accordion-content mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="filter-date-input active-outline relative-date-input">
                              <label style={{ fontSize: '0.78rem', color: '#718096', marginBottom: 2, display: 'block' }}>من</label>
                              <input type="date" className="custom-date-picker" value={draftDateFrom} onChange={e => setDraftDateFrom(e.target.value)} />
                            </div>
                            <div className="filter-date-input active-outline relative-date-input">
                              <label style={{ fontSize: '0.78rem', color: '#718096', marginBottom: 2, display: 'block' }}>إلى</label>
                              <input type="date" className="custom-date-picker" value={draftDateTo} onChange={e => setDraftDateTo(e.target.value)} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Nationality accordion */}
                      <div className="filter-accordion">
                          <div className="filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'nationality' ? null : 'nationality')}>
                            <span>الجنسية</span>
                            <ChevronDown size={16} className={`text-gray ${openAccordion === 'nationality' ? 'rotate-180' : ''}`} />
                          </div>
                          {openAccordion === 'nationality' && (
                            <div className="filter-accordion-content mt-2">
                              <div style={{ padding: '0 8px 8px' }}>
                                <input type="text" placeholder="بحث عن جنسية..." value={natSearch} onChange={e => setNatSearch(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }} />
                              </div>
                              <div className="filter-submenu-list bordered-list" style={{ maxHeight: 180, overflowY: 'auto' }}>
                                <label className="submenu-item" onClick={(e) => { e.preventDefault(); setDraftNationality(''); }}>
                                  <div className={`checkbox-custom check-align-left ${draftNationality === '' ? 'checked-gold' : ''}`}>
                                    {draftNationality === '' && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>الكل</span>
                                </label>
                                {filteredNats.map(nat => (
                                  <label key={nat} className="submenu-item" onClick={(e) => { e.preventDefault(); setDraftNationality(nat); }}>
                                    <div className={`checkbox-custom check-align-left ${draftNationality === nat ? 'checked-gold' : ''}`}>
                                      {draftNationality === nat && <Check size={12} strokeWidth={3} color="white" />}
                                    </div>
                                    <span>{nat}</span>
                                  </label>
                                ))}
                                {filteredNats.length === 0 && <div style={{ padding: '8px', fontSize: '0.8rem', color: '#a0aec0', textAlign: 'center' }}>لا توجد خيارات</div>}
                              </div>
                            </div>
                          )}
                        </div>

                      {/* Language accordion */}
                      <div className="filter-accordion">
                          <div className="filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'language' ? null : 'language')}>
                            <span>اللغة</span>
                            <ChevronDown size={16} className={`text-gray ${openAccordion === 'language' ? 'rotate-180' : ''}`} />
                          </div>
                          {openAccordion === 'language' && (
                            <div className="filter-accordion-content mt-2">
                              <div style={{ padding: '0 8px 8px' }}>
                                <input type="text" placeholder="بحث عن لغة..." value={langSearch} onChange={e => setLangSearch(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }} />
                              </div>
                              <div className="filter-submenu-list bordered-list" style={{ maxHeight: 180, overflowY: 'auto' }}>
                                <label className="submenu-item" onClick={(e) => { e.preventDefault(); setDraftLanguage(''); }}>
                                  <div className={`checkbox-custom check-align-left ${draftLanguage === '' ? 'checked-gold' : ''}`}>
                                    {draftLanguage === '' && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>الكل</span>
                                </label>
                                {filteredLangs.map(lang => (
                                  <label key={lang} className="submenu-item" onClick={(e) => { e.preventDefault(); setDraftLanguage(lang); }}>
                                    <div className={`checkbox-custom check-align-left ${draftLanguage === lang ? 'checked-gold' : ''}`}>
                                      {draftLanguage === lang && <Check size={12} strokeWidth={3} color="white" />}
                                    </div>
                                    <span>{lang}</span>
                                  </label>
                                ))}
                                {filteredLangs.length === 0 && <div style={{ padding: '8px', fontSize: '0.8rem', color: '#a0aec0', textAlign: 'center' }}>لا توجد خيارات</div>}
                              </div>
                            </div>
                          )}
                        </div>

                      {/* Religion accordion */}
                      <div className="filter-accordion">
                          <div className="filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'religion' ? null : 'religion')}>
                            <span>الديانة</span>
                            <ChevronDown size={16} className={`text-gray ${openAccordion === 'religion' ? 'rotate-180' : ''}`} />
                          </div>
                          {openAccordion === 'religion' && (
                            <div className="filter-accordion-content mt-2">
                              <div style={{ padding: '0 8px 8px' }}>
                                <input type="text" placeholder="بحث عن ديانة..." value={relSearch} onChange={e => setRelSearch(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }} />
                              </div>
                              <div className="filter-submenu-list bordered-list" style={{ maxHeight: 180, overflowY: 'auto' }}>
                                <label className="submenu-item" onClick={(e) => { e.preventDefault(); setDraftReligion(''); }}>
                                  <div className={`checkbox-custom check-align-left ${draftReligion === '' ? 'checked-gold' : ''}`}>
                                    {draftReligion === '' && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>الكل</span>
                                </label>
                                {filteredRels.map(rel => (
                                  <label key={rel} className="submenu-item" onClick={(e) => { e.preventDefault(); setDraftReligion(rel); }}>
                                    <div className={`checkbox-custom check-align-left ${draftReligion === rel ? 'checked-gold' : ''}`}>
                                      {draftReligion === rel && <Check size={12} strokeWidth={3} color="white" />}
                                    </div>
                                    <span>{rel}</span>
                                  </label>
                                ))}
                                {filteredRels.length === 0 && <div style={{ padding: '8px', fontSize: '0.8rem', color: '#a0aec0', textAlign: 'center' }}>لا توجد خيارات</div>}
                              </div>
                            </div>
                          )}
                        </div>

                      {/* Reset */}
                      {(draftGender || draftDateFrom || draftDateTo || draftNationality || draftLanguage || draftReligion) && (
                        <button
                          style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={handleResetFilter}
                        >
                          <X size={14} /> إعادة ضبط الفلتر
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="sort-container" ref={sortRef}>
                <button className={`btn-icon-text ${isSortOpen ? 'active' : ''}`} onClick={() => setIsSortOpen(!isSortOpen)}>
                  <SortDesc size={18} />
                  تصنيف
                </button>
                {isSortOpen && (
                  <div className="sort-dropdown">
                    <button className={`sort-option ${sortOrder === 'newest' ? 'active' : ''}`} onClick={() => { setSortOrder('newest'); setIsSortOpen(false); }}>
                      الأحدث
                    </button>
                    <button className={`sort-option ${sortOrder === 'oldest' ? 'active' : ''}`} onClick={() => { setSortOrder('oldest'); setIsSortOpen(false); }}>
                      الأقدم
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="nreq-body-wrapper">
            <div className="nreq-content">
              {loading && (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#a0aec0' }}>جارٍ تحميل الطلبات...</div>
              )}
              {error && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#ff6b6b', background: '#fff5f5', borderRadius: 12, margin: '1rem' }}>
                  ⚠️ {error}
                </div>
              )}
              {!loading && !error && displayed.length === 0 && <EmptyState />}
              {!loading && !error && displayed.length > 0 && (
                <TableView
                  requests={displayed}
                  onView={handleView}
                  onAccept={openAccept}
                  onSkip={openSkip}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NewRequests;
