import os, re

file_path = "src/pages/CurrentRequests/CurrentRequests.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Importers
text = text.replace("import { useNavigate }", "import { useNavigate }\\nimport { dawahRequestService, PoolRequest } from '../../services/dawahRequestService';")

new_top = """
// ─── Helpers ───
const statusLabel = (st: string | null) => {
  const map: Record<string, string> = {
    in_progress: 'قيد الإقناع',
    under_persuasion: 'قيد الإقناع',
    converted: 'تم إسلامه',
    rejected: 'رفض الإسلام'
  };
  return st ? (map[st] ?? st) : '—';
};

const statusConfig: Record<string, { label: string; className: string }> = {
  'تم إسلامه':  { label: 'تم إسلامه',  className: 'creq-status-badge creq-status-green'  },
  'رفض الإسلام': { label: 'رفض الإسلام', className: 'creq-status-badge creq-status-red'    },
  'قيد الإقناع': { label: 'قيد الإقناع', className: 'creq-status-badge creq-status-yellow' },
};

const StatusBadge = ({ statusKey }: { statusKey: string }) => {
  const lbl = statusLabel(statusKey);
  const cfg = statusConfig[lbl] || { label: lbl, className: 'creq-status-badge creq-status-yellow' };
  return <span className={cfg.className}>{cfg.label}</span>;
};

const invitedName = (r: PoolRequest) =>
  [r.invited_first_name, r.invited_last_name].filter(Boolean).join(' ') || 'غير محدد';

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
    + '\\n' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};
"""

table_old = "const TableView = ({ requests, onView }: { requests: Request[]; onView: (r: Request) => void }) => ("
table_new = "const TableView = ({ requests, onView }: { requests: PoolRequest[]; onView: (r: PoolRequest) => void }) => ("
text = text.replace(table_old, new_top + "\\n" + table_new)

old_tr = "        {requests.map((req) => ("

text = re.sub(r'\{requests\.map\(\(req\) => \(\s*<tr key=\{req\.id\}>.*?<\/tr>\s*\)\)\}', """{requests.map((req) => (
          <tr key={req.request_id}>
            <td>#{req.request_id}</td>
            <td>{invitedName(req)}</td>
             <td>{req.invited_country_name || '—'}</td>
             <td>{req.invited_language_name || '—'}</td>
             <td>{req.invited_religion || '—'}</td>
             <td className="creq-date-cell" style={{ whiteSpace: 'pre-line' }}>{formatDate(req.submission_date)}</td>
            <td>
              <span className="creq-note-text">{req.notes || '—'}</span>
            </td>
            <td><StatusBadge statusKey={req.status} /></td>
            <td>
              <button className="creq-eye-btn" onClick={() => onView(req)} title="عرض التفاصيل">
                <Eye size={18} />
              </button>
            </td>
          </tr>
        ))}""", text, flags=re.DOTALL)

old_det = "const DetailView = ({ detail, onBack }: { detail: RequestDetail; onBack: () => void }) => {"
new_det = "const DetailView = ({ detail, onBack }: { detail: PoolRequest; onBack: () => void }) => {"
text = text.replace(old_det, new_det)

new_detail_fields = """      {/* ── Row 1: name / nationality / language / religion ── */}
      <div className="creq-drow">
        <DetailField label="اسم الشخص" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>}>
          {invitedName(detail)}
        </DetailField>
        <DetailField label="الجنسية" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}>
          {detail.invited_country_name || '—'}
        </DetailField>
        <DetailField label="لغة التواصل" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}>
          {detail.invited_language_name || '—'}
        </DetailField>
        <DetailField label="الديانة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></svg>}>
          {detail.invited_religion || '—'}
        </DetailField>
      </div>

      {/* ── Row 2: email / phone / gender / age ── */}
      <div className="creq-drow">
        <DetailField label="البريد الالكتروني" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
          {detail.invited_email || '—'}
        </DetailField>
        <DetailField label="رقم الهاتف" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.48-1.48a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}>
          <span dir="ltr">{detail.invited_phone || '—'}</span>
        </DetailField>
        <DetailField label="النوع" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
          {genderLabel(detail.invited_gender)}
        </DetailField>
        <DetailField label="تاريخ الإرسال" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}>
          {formatDate(detail.submission_date)}
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
              {channelLabel(detail.communication_channel)}
            </span>
            <div className="creq-contact-link-wrapper">
              <a href={detail.deep_link || '#'} target="_blank" rel="noreferrer" className="creq-contact-link">{detail.deep_link || 'لا يوجد رابط'}</a>
              <span className="creq-icon-gold creq-ml-2 cursor-pointer"><Copy size={14} /></span>
            </div>
          </div>
        </div>

        <div className="creq-dfield">
          <span className="creq-dfield-label">
            <span className="creq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
            الحالة
          </span>
          <span className="creq-dfield-value"><StatusBadge statusKey={detail.status} /></span>
        </div>
      </div>
"""
text = re.sub(r'\{\/\* ── Row 1.*?<\/div>\s*<\/div>', new_detail_fields, text, flags=re.DOTALL)
text = text.replace("{detail.personalComment}", "{detail.notes || 'لا يوجد ملاحظات'}")
text = text.replace("{detail.callerNote}", "{'ملاحظات الداعية غير متوفرة بعد'}")


main_comp_old = r"""const CurrentRequests = \(\) => \{.+?return \(""".replace(")", "\\)").replace("(", "\\(")
main_comp_new = """const CurrentRequests = () => {
  const [allRequests, setAllRequests] = useState<PoolRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'empty' | 'table' | 'detail'>('table');
  const [selectedRequest, setSelectedRequest] = useState<PoolRequest | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Filter drafts & applied
  const [draftNationality, setDraftNationality] = useState('');
  const [draftLanguage, setDraftLanguage] = useState('');
  const [draftReligion, setDraftReligion] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');

  const [appliedNationality, setAppliedNationality] = useState('');
  const [appliedLanguage, setAppliedLanguage] = useState('');
  const [appliedReligion, setAppliedReligion] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const [natSearch, setNatSearch] = useState('');
  const [langSearch, setLangSearch] = useState('');
  const [relSearch, setRelSearch] = useState('');

  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest'|'oldest'>('newest');

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await dawahRequestService.getMyRequests(0, 500);
      setAllRequests(res.data ?? []);
      if ((res.data ?? []).length === 0) setView('empty');
    } catch { 
      // ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData() }, []);
  

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setIsFilterOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortRef, filterRef]);

  const toggleAccordion = (name: string) => setOpenAccordion(openAccordion === name ? null : name);

  const baseNationalities = ['الكويت', 'مصر', 'السعودية', 'الفلبين', 'الهند', 'سريلانكا', 'نيبال', 'أمريكا', 'بريطانيا'];
  const baseLanguages     = ['العربية', 'الإنجليزية', 'التاغالوغية', 'الهندية', 'الفرنسية', 'الإسبانية'];
  const baseReligions     = ['مسيحي', 'هندوسي', 'بوذي', 'لاديني', 'يهودي'];

  const uniqueNationalities = [...new Set([...baseNationalities, ...allRequests.map(r => r.invited_country_name).filter(Boolean)])] as string[];
  const uniqueLanguages     = [...new Set([...baseLanguages, ...allRequests.map(r => r.invited_language_name).filter(Boolean)])] as string[];
  const uniqueReligions     = [...new Set([...baseReligions, ...allRequests.map(r => r.invited_religion).filter(Boolean)])] as string[];

  const filteredNats  = uniqueNationalities.filter(n => n.includes(natSearch));
  const filteredLangs = uniqueLanguages.filter(l => l.includes(langSearch));
  const filteredRels  = uniqueReligions.filter(r => r.includes(relSearch));

  const handleApplyFilter = () => {
    setAppliedNationality(draftNationality);
    setAppliedLanguage(draftLanguage);
    setAppliedReligion(draftReligion);
    setAppliedStatus(draftStatus);
    setAppliedDateFrom(draftDateFrom);
    setAppliedDateTo(draftDateTo);
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
     setDraftNationality(''); setAppliedNationality(''); setNatSearch('');
     setDraftLanguage(''); setAppliedLanguage(''); setLangSearch('');
     setDraftReligion(''); setAppliedReligion(''); setRelSearch('');
     setDraftStatus(''); setAppliedStatus('');
     setDraftDateFrom(''); setAppliedDateFrom('');
     setDraftDateTo(''); setAppliedDateTo('');
  };

  const handleView = (r: PoolRequest) => {
    setSelectedRequest(r);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedRequest(null);
    setView(allRequests.length > 0 ? 'table' : 'empty');
  };

  const displayed = allRequests.filter(r => {
      // search
      if (searchText) {
        const full = (r.invited_first_name + ' ' + (r.invited_last_name||'')).toLowerCase();
        const idstr = r.request_id.toString();
        if (!full.includes(searchText.toLowerCase()) && !idstr.includes(searchText)) return false;
      }
      // status
      if (appliedStatus) {
         if (statusLabel(r.status) !== appliedStatus) return false;
      }
      // nat, lang, rel
      if (appliedNationality && r.invited_country_name !== appliedNationality) return false;
      if (appliedLanguage && r.invited_language_name !== appliedLanguage) return false;
      if (appliedReligion && r.invited_religion !== appliedReligion) return false;
      // date
      if (appliedDateFrom && r.submission_date) {
         if (new Date(r.submission_date) < new Date(appliedDateFrom)) return false;
      }
      if (appliedDateTo && r.submission_date) {
         if (new Date(r.submission_date) > new Date(appliedDateTo)) return false;
      }
      return true;
  }).sort((a,b) => {
      if (sortOrder === 'newest') return new Date(b.submission_date || 0).getTime() - new Date(a.submission_date || 0).getTime();
      return new Date(a.submission_date || 0).getTime() - new Date(b.submission_date || 0).getTime();
  });

  useEffect(() => {
    if (view !== 'detail') setView(displayed.length > 0 ? 'table' : 'empty');
  }, [allRequests, appliedNationality, appliedLanguage, appliedReligion, appliedDateFrom, appliedDateTo, appliedStatus, searchText]);

  return ("""
text = re.sub(r'const CurrentRequests = \(\) => \{.+?return \(', main_comp_new, text, flags=re.DOTALL)

old_filter_body = r'<div className="creq-filter-panel-header">.*?</button>\s*</div>\s*</div>'
new_filter_body = """
                    <div className="creq-filter-panel-header">
                      <h2 className="creq-filter-title">الفلتر</h2>
                      <button className="btn-apply-filter" onClick={handleApplyFilter}>تطبيق الفلتر</button>
                    </div>
                    <div className="creq-filter-body">

                      {/* Date */}
                      <div className="creq-filter-accordion">
                        <div className="creq-filter-accordion-header" onClick={() => toggleAccordion('date')}>
                          <span>تاريخ الارسال</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'date' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'date' && (
                          <div className="creq-filter-accordion-content mt-2" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                             <input type="date" value={draftDateFrom} onChange={e => setDraftDateFrom(e.target.value)} className="custom-date-picker" />
                             <input type="date" value={draftDateTo} onChange={e => setDraftDateTo(e.target.value)} className="custom-date-picker" />
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
                             <div style={{ padding: '0 8px 8px' }}>
                               <input type="text" placeholder="بحث..." value={relSearch} onChange={e => setRelSearch(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                             </div>
                            <div className="creq-filter-submenu-list creq-bordered-list" style={{maxHeight:150, overflowY:'auto'}}>
                              <label className="creq-submenu-item" onClick={(e) => { e.preventDefault(); setDraftReligion(''); }}>
                                <div className={`creq-checkbox-custom creq-check-align-left ${draftReligion === '' ? 'checked-gold' : ''}`}>{draftReligion === '' && <Check size={12} strokeWidth={3} color="white"/>}</div>
                                <span>الكل</span>
                              </label>
                              {filteredRels.map(t => (
                                <label key={t} className="creq-submenu-item" onClick={(e) => { e.preventDefault(); setDraftReligion(t); }}>
                                  <div className={`creq-checkbox-custom creq-check-align-left ${draftReligion === t ? 'checked-gold' : ''}`}>
                                    {draftReligion === t && <Check size={12} strokeWidth={3} color="white" />}
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
                        {openAccordion === 'nationality' && (
                          <div className="creq-filter-accordion-content mt-2">
                             <div style={{ padding: '0 8px 8px' }}>
                               <input type="text" placeholder="بحث..." value={natSearch} onChange={e => setNatSearch(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                             </div>
                            <div className="creq-filter-submenu-list creq-bordered-list" style={{maxHeight:150, overflowY:'auto'}}>
                              <label className="creq-submenu-item" onClick={(e) => { e.preventDefault(); setDraftNationality(''); }}>
                                <div className={`creq-checkbox-custom creq-check-align-left ${draftNationality === '' ? 'checked-gold' : ''}`}>{draftNationality === '' && <Check size={12} strokeWidth={3} color="white"/>}</div>
                                <span>الكل</span>
                              </label>
                              {filteredNats.map(t => (
                                <label key={t} className="creq-submenu-item" onClick={(e) => { e.preventDefault(); setDraftNationality(t); }}>
                                  <div className={`creq-checkbox-custom creq-check-align-left ${draftNationality === t ? 'checked-gold' : ''}`}>
                                    {draftNationality === t && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>{t}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Language */}
                      <div className="creq-filter-accordion">
                        <div className="creq-filter-accordion-header" onClick={() => toggleAccordion('language')}>
                          <span>اللغة</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'language' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'language' && (
                          <div className="creq-filter-accordion-content mt-2">
                             <div style={{ padding: '0 8px 8px' }}>
                               <input type="text" placeholder="بحث..." value={langSearch} onChange={e => setLangSearch(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                             </div>
                            <div className="creq-filter-submenu-list creq-bordered-list" style={{maxHeight:150, overflowY:'auto'}}>
                              <label className="creq-submenu-item" onClick={(e) => { e.preventDefault(); setDraftLanguage(''); }}>
                                <div className={`creq-checkbox-custom creq-check-align-left ${draftLanguage === '' ? 'checked-gold' : ''}`}>{draftLanguage === '' && <Check size={12} strokeWidth={3} color="white"/>}</div>
                                <span>الكل</span>
                              </label>
                              {filteredLangs.map(t => (
                                <label key={t} className="creq-submenu-item" onClick={(e) => { e.preventDefault(); setDraftLanguage(t); }}>
                                  <div className={`creq-checkbox-custom creq-check-align-left ${draftLanguage === t ? 'checked-gold' : ''}`}>
                                    {draftLanguage === t && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>{t}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="creq-filter-accordion creq-no-border">
                        <div className="creq-filter-accordion-header creq-filter-status-header" onClick={() => toggleAccordion('status')}>
                          <span>الحالة</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'status' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'status' && (
                          <div className="creq-filter-accordion-content creq-status-content mt-2">
                             <label className="creq-status-option" onClick={(e) => { e.preventDefault(); setDraftStatus(''); }}>
                               <div className={`creq-checkbox-custom creq-check-align-left ${draftStatus === '' ? 'checked-gold' : ''}`}>{draftStatus === '' && <Check size={12} strokeWidth={3} color="white"/>}</div>
                               <span>الكل</span>
                             </label>
                            {[
                              { key: 'تم إسلامه', cls: 'status-green' }, 
                              { key: 'قيد الإقناع', cls: 'status-yellow' }, 
                              { key: 'رفض الإسلام', cls: 'status-red' }
                            ].map(({ key, cls }) => (
                              <label key={key} className={`creq-status-option ${draftStatus === key ? cls : ''}`} onClick={(e) => { e.preventDefault(); setDraftStatus(key); }}>
                                <div className={`creq-checkbox-custom creq-check-align-left ${draftStatus === key ? 'checked-gold' : ''}`}>
                                  {draftStatus === key && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>{key}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <button onClick={handleResetFilter} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                         <X size={14} /> إعادة ضبط الفلتر
                      </button>

                    </div>
                  </div>
"""
text = re.sub(old_filter_body, new_filter_body, text, flags=re.DOTALL)

text = text.replace("<TableView requests={MOCK_REQUESTS} onView={handleView} />", "<TableView requests={displayed} onView={handleView} />")
text = text.replace('value={searchText}\n                  onChange={e => setSearchText(e.target.value)}', 'value={searchText} onChange={e => setSearchText(e.target.value)}')
text = text.replace('<input type="text" placeholder="ابحث" className="search-input-outlined" />', '<input type="text" placeholder="ابحث" className="search-input-outlined" value={searchText} onChange={e => setSearchText(e.target.value)} />')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)
