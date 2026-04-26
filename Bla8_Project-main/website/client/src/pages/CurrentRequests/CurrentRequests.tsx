import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter as FilterIcon, SortDesc, Eye,
  ChevronRight, ChevronDown, X, Check, Copy, ClipboardList, Globe, Monitor, AlertCircle,
} from 'lucide-react';
import './CurrentRequests.css';
import { dawahRequestService, PoolRequest } from '../../services/dawahRequestService';
import ErrorModal from '../../components/common/Modal/ErrorModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusLabel = (st: string | null) => {
  const map: Record<string, string> = {
    in_progress: 'قيد الإقناع',
    under_persuasion: 'قيد الإقناع',
    converted: 'تم إسلامه',
    rejected: 'رفض الإسلام',
    pending: 'قيد الإقناع'
  };
  return st ? (map[st] ?? st) : '—';
};

const StatusBadge = ({ status }: { status: string | null }) => {
  const label = statusLabel(status);
  let cls = 'creq-status-badge ';
  if (label === 'تم إسلامه') cls += 'creq-status-green';
  else if (label === 'رفض الإسلام') cls += 'creq-status-red';
  else cls += 'creq-status-yellow';
  
  return <span className={cls}>{label}</span>;
};

const genderLabel = (g: string | null) => {
  if (!g) return '—';
  if (g === 'male'   || g === 'ذكر')  return 'ذكر';
  if (g === 'female' || g === 'أنثى') return 'أنثى';
  return g;
};

const channelLabel = (ch: string | null) => {
  const map: Record<string, string> = {
    whatsapp: 'واتساب', phone: 'هاتف', messenger: 'ماسنجر', telegram: 'تيليجرام', email: 'بريد إلكتروني', other: 'أخرى',
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

// ─── Table View ───────────────────────────────────────────────────────────────
const TableView = ({
  requests, onView,
}: {
  requests: PoolRequest[];
  onView: (r: PoolRequest) => void;
}) => (
  <div className="creq-table-wrapper">
    <table className="creq-table">
      <thead>
        <tr>
          <th>رقم <span className="creq-sort-arrow">↕</span></th>
          <th>اسم الداعي <span className="creq-sort-arrow">↕</span></th>
          <th>اسم المدعو <span className="creq-sort-arrow">↕</span></th>
          <th>اسم الداعية <span className="creq-sort-arrow">↕</span></th>
          <th>تاريخ الدعوة <span className="creq-sort-arrow">↕</span></th>
          <th>حالة الطلب <span className="creq-sort-arrow">↕</span></th>
          <th>ملاحظة <span className="creq-sort-arrow">↕</span></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {(requests || []).map((req) => (
          <tr key={req.request_id}>
            <td>{req.request_id}</td>
            <td>{req.submitted_by_name || 'لا يوجد'}</td>
            <td>{invitedName(req)}</td>
            <td>{req.preacher_name || 'غير محدد'}</td>
            <td className="creq-date-cell">{formatDate(req.submission_date)}</td>
            <td><StatusBadge status={req.status} /></td>
            <td><span className="creq-note-text">{req.notes || '—'}</span></td>
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

// ─── Card View (Mobile Only) ─────────────────────────────────────────────────
const CardView = ({
  requests, onView,
}: {
  requests: PoolRequest[];
  onView: (r: PoolRequest) => void;
}) => (
  <div className="creq-card-list">
    {(requests || []).map((req) => (
      <div key={req.request_id} className="creq-mobile-card" onClick={() => onView(req)}>
        {/* Top row: Name (right) + ID (left) */}
        <div className="creq-mobile-card-top">
          <h3 className="creq-mobile-card-name">{invitedName(req)}</h3>
          <span className="creq-mobile-card-id">#{req.request_id}</span>
        </div>

        {/* 2×2 Field Grid */}
        <div className="creq-mobile-card-fields">
          <div className="creq-mobile-field">
            <span className="creq-mobile-field-label">اسم الداعي</span>
            <span className="creq-mobile-field-value">{req.submitted_by_name || 'لا يوجد'}</span>
          </div>
          <div className="creq-mobile-field">
            <span className="creq-mobile-field-label">اسم الداعية</span>
            <span className="creq-mobile-field-value">{req.preacher_name || 'غير محدد'}</span>
          </div>
          <div className="creq-mobile-field">
            <span className="creq-mobile-field-label">حالة الطلب</span>
            <span className="creq-mobile-field-value">
              <StatusBadge status={req.status} />
            </span>
          </div>
        </div>

        {/* Footer: note & date (right) + icon buttons (left) */}
        <div className="creq-mobile-card-footer">
          <div className="creq-mobile-card-meta-right">
            {req.notes && <span className="creq-mobile-card-note">{req.notes}</span>}
            <span className="creq-mobile-card-date">{formatDate(req.submission_date).replace('\n', ' — ')}</span>
          </div>
          <div className="creq-mobile-card-actions">
            <button
              className="creq-icon-btn"
              onClick={(e) => { e.stopPropagation(); onView(req); }}
              title="عرض"
            >
              <Eye size={16} />
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Field Component ──────────────────────────────────────────────────────────
const DetailField = ({
  label, icon, children,
}: {
  label: string; icon: React.ReactNode; children: React.ReactNode;
}) => (
  <div className="creq-dfield">
    <span className="creq-dfield-label"><span className="creq-icon-gold">{icon}</span>{label}</span>
    <span className="creq-dfield-value">{children}</span>
  </div>
);

// ─── Update Status Modal ──────────────────────────────────────────────────────
const UpdateStatusModal = ({
  requestId, onClose, onSaved,
}: {
  requestId: number; onClose: () => void; onSaved?: () => void;
}) => {
  const [selected, setSelected] = useState<'Islam' | 'Reject'>('Islam');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        new_status: selected === 'Islam' ? 'converted' : 'rejected',
        preacher_feedback: note.trim() || undefined,
      };
      if (selected === 'Islam') {
        payload.conversion_date = new Date().toISOString().split('T')[0]; // Required by backend
      }
      await dawahRequestService.updateStatus(requestId, payload);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء تحديث الحالة');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
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
          <button className="umodal-btn-done" onClick={() => { onSaved?.(); onClose(); }}>تم</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="umodal-backdrop" onClick={onClose}>
      <div className="umodal-box" onClick={e => e.stopPropagation()} dir="rtl">
        <button className="umodal-close" onClick={onClose}><X size={20} strokeWidth={2} /></button>
        <h2 className="umodal-title">تحديث الحالة</h2>
        <div className="umodal-toggle-container">
          <button
            className={`umodal-tab-btn ${selected === 'Islam' ? 'active-green' : 'inactive-gray'}`}
            onClick={() => setSelected('Islam')}
          >تم اسلامه</button>
          <button
            className={`umodal-tab-btn ${selected === 'Reject' ? 'active-green' : 'inactive-gray'}`}
            onClick={() => setSelected('Reject')}
          >رفض الاسلام</button>
        </div>
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
        {error && <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <div className="umodal-actions">
          <button className="umodal-btn-save" onClick={handleSave} disabled={loading}>
            {loading ? '...' : 'حفظ'}
          </button>
          <button className="umodal-btn-cancel" onClick={onClose} disabled={loading}>الغاء</button>
        </div>
      </div>
    </div>
  );
};

// ─── Detail View ──────────────────────────────────────────────────────────────
const DetailView = ({
  detail: initialDetail, onBack,
}: {
  detail: PoolRequest; onBack: () => void;
}) => {
  const [detail, setDetail] = useState<PoolRequest>(initialDetail);
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showReportReminder, setShowReportReminder] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 1. Refresh the request data to get the most up-to-date info (e.g. feedback)
    dawahRequestService.getById(initialDetail.request_id)
      .then(res => {
        if (res.data) setDetail(res.data);
      })
      .catch(err => console.error("Error refreshing request:", err));

    // 2. Fetch real reports
    setReportsLoading(true);
    dawahRequestService.getReports(initialDetail.request_id)
      .then(res => {
        setReports(res.data || []);
      })
      .catch(err => {
        console.error("Error fetching reports:", err);
      })
      .finally(() => setReportsLoading(false));
  }, [initialDetail.request_id]);

  return (
    <div className="creq-detail-page" dir="rtl">
      {/* Header */}
      <div className="creq-detail-header-row">
        <div>
          <div className="creq-breadcrumb">
            <button className="creq-breadcrumb-link" onClick={onBack}>الطلبات الحالية</button>
            <ChevronRight size={14} className="creq-breadcrumb-chevron" />
          </div>
          <h1 className="creq-detail-title">عرض الطلب #{detail.request_id}</h1>
        </div>
        <div className="creq-detail-actions">
          {userRole === 'preacher' && (<>
            {detail.status !== 'converted' && detail.status !== 'rejected' && (<>
              <button className="creq-dtl-btn creq-btn-refresh" onClick={() => setShowUpdateModal(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-5.23l.11-.14"/></svg>
                تحديث الحالة
              </button>
              <button 
                className="creq-dtl-btn creq-btn-chat" 
                onClick={() => {
                  if (detail.submitted_by_person_id) {
                    // Internal chat for Interested Persons
                    navigate(`/conversations?request_id=${detail.request_id}&name=${encodeURIComponent(invitedName(detail))}`);
                  } else if (detail.deep_link) {
                    // Direct link provided by caller
                    window.open(detail.deep_link, '_blank');
                  } else if (detail.communication_channel === 'email' && detail.invited_email) {
                    // Optimized for Gmail as requested
                    const invitedNameStr = `${detail.invited_first_name || ''} ${detail.invited_last_name || ''}`.trim() || 'Friend';
                    const subject = encodeURIComponent(`Hello ${invitedNameStr}!`);
                    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${detail.invited_email}&su=${subject}`, '_blank');
                  } else if (detail.communication_channel === 'whatsapp' && detail.invited_phone) {
                    // Fallback for WhatsApp
                    const cleanPhone = detail.invited_phone.replace(/\+/g, '');
                    window.open(`https://wa.me/${cleanPhone}`, '_blank');
                  } else {
                    setErrorMessage('لا يوجد رابط تواصل مباشر متاح لهذا الطلب. يرجى استخدام بيانات التواصل الموضحة.');
                    setIsErrorModalOpen(true);
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {detail.submitted_by_caller_id || (detail.communication_channel && detail.communication_channel !== 'internal') ? (
                  detail.communication_channel === 'email' ? 'المراسلة عبر الإيميل' :
                  detail.communication_channel === 'whatsapp' ? 'المحادثة (واتساب)' :
                  'المحادثة (رابط خارجي)'
                ) : 'المحادثة'}
              </button>
            </>)}
          </>)}
        </div>
      </div>

      {/* Report Reminder */}
      {showReportReminder && userRole === 'preacher' && (
        <div className="creq-report-reminder">
          <AlertCircle size={18} className="creq-reminder-icon" />
          <span>تم تحديث الحالة! يرجى تعبئة <button className="creq-reminder-link" onClick={() => navigate('/reports')}>تقرير النشاط</button> الخاص بهذا الطلب.</span>
          <button className="creq-reminder-close" onClick={() => setShowReportReminder(false)}><X size={16} /></button>
        </div>
      )}

      <div className="creq-detail-card">
        {/* Row 1: name / nationality / language / religion */}
        <div className="creq-drow">
          <DetailField label="اسم الشخص" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}>
            {invitedName(detail)}
          </DetailField>
          <DetailField label="الجنس" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
            {genderLabel(detail.invited_gender)}
          </DetailField>
          <DetailField label="الجنسية" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}>
            {detail.invited_country_name || '—'}
          </DetailField>
          <DetailField label="الديانة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}>
            {detail.invited_religion || '—'}
          </DetailField>
        </div>

        {/* Row 2: phone / email / language / channel */}
        <div className="creq-drow">
          <DetailField label="لغة التواصل" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="M12 4c2.8 0 5 2.2 5 5v5"/><path d="M12 20c-2.8 0-5-2.2-5-5V9"/></svg>}>
            {detail.invited_language_name || '—'}
          </DetailField>
          <DetailField label="رقم الهاتف" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.48-1.48a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}>
            <span dir="ltr">{detail.invited_phone || '—'}</span>
          </DetailField>
          <DetailField label="البريد الإلكتروني" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
            {detail.invited_email || '—'}
          </DetailField>
          <DetailField label="قناة التواصل" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}>
            {channelLabel(detail.communication_channel)}
          </DetailField>
          {(userRole === 'organization' || userRole === 'admin') && (
            <DetailField label="الداعية المسؤول" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="2"/></svg>}>
              {detail.preacher_name || 'غير محدد'}
            </DetailField>
          )}
        </div>

        {/* Row 3: contact link / status */}
        <div className="creq-drow">
          <div className="creq-dfield creq-dfield-span2">
            <span className="creq-dfield-label">
              <span className="creq-icon-gold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
              رابط التواصل
            </span>
            <div className="creq-dfield-value creq-contact-row">
              <a href={detail.deep_link || '#'} target="_blank" rel="noreferrer" className="creq-contact-link">
                {detail.deep_link || 'لا يوجد رابط'}
              </a>
              {detail.deep_link && (
                <span className="creq-icon-gold creq-ml-2" style={{ cursor: 'pointer' }}>
                  <Copy size={14} onClick={() => navigator.clipboard.writeText(detail.deep_link!)} />
                </span>
              )}
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

        {/* Notes */}
        {detail.notes && (
          <>
            <div className="creq-text-section-divider" />
            <div className="creq-text-section">
              <span className="creq-text-label">
                <span className="creq-icon-gold">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </span>
                الملاحظات
              </span>
              <p className="creq-text-body">{detail.notes}</p>
            </div>
          </>
        )}

        {/* Reports Section (org/admin) */}
        {(userRole === 'organization' || userRole === 'admin') && (
          <>
            <div className="creq-text-section-divider" />
            <div className="creq-reports-section">
              <div className="creq-reports-header">
                <ClipboardList size={18} className="creq-icon-gold" />
                <span className="creq-reports-title">تقارير النشاط</span>
                <span className="creq-reports-count">{reports.length} تقارير</span>
              </div>
              {reportsLoading ? (
                <p className="creq-reports-empty">جارٍ تحميل التقارير...</p>
              ) : reports.length === 0 ? (
                <p className="creq-reports-empty">لا توجد تقارير مسجلة حتى الآن.</p>
              ) : (
                <div className="creq-reports-list">
                  {reports.map(r => (
                    <div key={r.report_id} className="creq-report-card">
                      <div className="creq-report-card-header">
                        <span className="creq-report-source">
                          {r.communication_type === 'Platform'
                            ? <><Monitor size={14} /> داخل المنصة</>
                            : <><Globe size={14} /> {r.communication_details || 'تواصل خارجي'}</>}
                        </span>
                        <span className="creq-report-date">
                          {new Date(r.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="creq-report-content">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showUpdateModal && (
        <UpdateStatusModal
          requestId={detail.request_id}
          onClose={() => setShowUpdateModal(false)}
          onSaved={() => { setShowUpdateModal(false); setShowReportReminder(true); }}
        />
      )}

      <ErrorModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)} 
        message={errorMessage} 
      />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CurrentRequests = () => {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [allRequests, setAllRequests] = useState<PoolRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [isPending, setIsPending]     = useState(false);
  const userRole = localStorage.getItem('userRole');

  // ── View state ──────────────────────────────────────────────────────────────
  const [view, setView]                   = useState<'list' | 'detail'>('list');
  const [selectedRequest, setSelectedRequest] = useState<PoolRequest | null>(null);

  // ── Filter & Sort state ─────────────────────────────────────────────────────
  const [searchText, setSearchText]   = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen]   = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const [draftGender, setDraftGender]         = useState('');
  const [draftDateFrom, setDraftDateFrom]     = useState('');
  const [draftDateTo, setDraftDateTo]         = useState('');
  const [draftNationality, setDraftNationality] = useState('');
  const [draftLanguage, setDraftLanguage]     = useState('');
  const [draftReligion, setDraftReligion]     = useState('');
  const [draftStatus, setDraftStatus]         = useState('');

  const [natSearch, setNatSearch]   = useState('');
  const [langSearch, setLangSearch] = useState('');
  const [relSearch, setRelSearch]   = useState('');

  const [appliedGender, setAppliedGender]         = useState('');
  const [appliedDateFrom, setAppliedDateFrom]     = useState('');
  const [appliedDateTo, setAppliedDateTo]         = useState('');
  const [appliedNationality, setAppliedNationality] = useState('');
  const [appliedLanguage, setAppliedLanguage]     = useState('');
  const [appliedReligion, setAppliedReligion]     = useState('');
  const [appliedStatus, setAppliedStatus]         = useState('');

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const sortRef   = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchRequests = useCallback(() => {
    setLoading(true);
    setError(null);
    const role = localStorage.getItem('userRole');
    
    if (!role) {
      setError('يرجى تسجيل الدخول لعرض الطلبات.');
      setLoading(false);
      return;
    }

    // Choose the right fetch method based on the role
    const requestPromise = role === 'organization' 
      ? dawahRequestService.getOrganizationRequests(0, 200)
      : dawahRequestService.getMyRequests(0, 200);

    requestPromise
      .then((res: { data: PoolRequest[] }) => {
        setAllRequests(res.data || []);
      })
      .catch((err: any) => {
        const msg = err.response?.data?.detail || 'تعذّر تحميل الطلبات. تأكد من تشغيل الخادم وصحة تسجيل دخولك.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { 
    // Check approval status
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const status = userData?.extra_data?.approval_status;
    if (status === 'pending' || status === 'rejected') {
      setIsPending(true);
    }
    fetchRequests(); 
  }, [fetchRequests]);

  // ── Click outside close ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current   && !sortRef.current.contains(e.target as Node))   setIsSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Dynamic filter options ────────────────────────────────────────────────────
  const uniqueNationalities = [...new Set(allRequests.map(r => r.invited_country_name).filter(Boolean))] as string[];
  const uniqueLanguages     = [...new Set(allRequests.map(r => r.invited_language_name).filter(Boolean))] as string[];
  const uniqueReligions     = [...new Set(allRequests.map(r => r.invited_religion).filter(Boolean))]     as string[];
  const statusOptions       = ['تم إسلامه', 'قيد الإقناع', 'رفض الإسلام'];

  const filteredNats  = uniqueNationalities.filter(n => n.includes(natSearch));
  const filteredLangs = uniqueLanguages.filter(l => l.includes(langSearch));
  const filteredRels  = uniqueReligions.filter(r => r.includes(relSearch));

  // ── Filtered & Sorted list ────────────────────────────────────────────────────
  const displayed = allRequests
    .filter(r => {
      if (searchText) {
        const s    = searchText.toLowerCase();
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
      if (appliedStatus      && statusLabel(r.status) !== appliedStatus)       return false;
      if (appliedDateFrom && new Date(r.submission_date) < new Date(appliedDateFrom)) return false;
      if (appliedDateTo   && new Date(r.submission_date) > new Date(appliedDateTo + 'T23:59:59')) return false;
      return true;
    })
    .sort((a, b) => {
      const at = new Date(a.submission_date).getTime();
      const bt = new Date(b.submission_date).getTime();
      return sortOrder === 'newest' ? bt - at : at - bt;
    });

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleApplyFilter = () => {
    setAppliedGender(draftGender);
    setAppliedDateFrom(draftDateFrom);
    setAppliedDateTo(draftDateTo);
    setAppliedNationality(draftNationality);
    setAppliedLanguage(draftLanguage);
    setAppliedReligion(draftReligion);
    setAppliedStatus(draftStatus);
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
    setDraftGender('');      setDraftDateFrom(''); setDraftDateTo('');
    setDraftNationality(''); setDraftLanguage(''); setDraftReligion(''); setDraftStatus('');
    setNatSearch('');        setLangSearch('');    setRelSearch('');
    setAppliedGender('');    setAppliedDateFrom(''); setAppliedDateTo('');
    setAppliedNationality(''); setAppliedLanguage(''); setAppliedReligion(''); setAppliedStatus('');
  };

  const handleView = (r: PoolRequest) => { setSelectedRequest(r); setView('detail'); };
  const handleBack = ()               => { setSelectedRequest(null); setView('list'); };

  const hasFilter = !!(appliedGender || appliedDateFrom || appliedDateTo || appliedNationality || appliedLanguage || appliedReligion || appliedStatus);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="creq-page">
      {isPending ? (
        <div className="creq-body-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center', color: '#e53e3e', background: '#fff5f5', padding: '2.5rem', borderRadius: '15px', border: '1px solid #fed7d7', maxWidth: '600px', width: '90%' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.2rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', fontWeight: 700, color: '#c53030' }}>
              {JSON.parse(localStorage.getItem('userData') || '{}')?.extra_data?.approval_status === 'rejected' 
                ? 'تم رفض الحساب' 
                : (userRole === 'preacher' ? 'لا يمكنك رؤية الطلبات الحالية حتى تتم الموافقة على حسابك' : 'حسابك قيد المراجعة')}
            </h2>
            <p style={{ color: '#9b2c2c', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {JSON.parse(localStorage.getItem('userData') || '{}')?.extra_data?.approval_status === 'rejected'
                ? 'نعتذر، لقد تم رفض طلب انضمامكم للنظام. يرجى مراجعة أسباب الرفض من الصفحة الرئيسية وتعديل البيانات المطلوبة.'
                : (userRole === 'preacher' 
                    ? 'نعتذر، ولكن حسابك كداعية لا يزال تحت المراجعة من قبل الإدارة. ستتمكن من رؤية طلباتك الحالية فور تفعيل حسابك.' 
                    : 'نعتذر، ولكن حساب الجمعية لا يزال تحت المراجعة. ستتمكن من إدارة الطلبات والدعاة فور تفعيل الحساب من قبل الإدارة.')}
            </p>
          </div>
        </div>
      ) : view === 'detail' && selectedRequest ? (
        <DetailView detail={selectedRequest} onBack={handleBack} />
      ) : (
        <>
          {/* Header */}
          <div className="creq-header-area">
            <h1 className="page-title">طلبات الدعوة الحالية</h1>

            <div className="creq-actions">
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
              <div className="creq-filter-container" ref={filterRef}>
                <button
                  className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <FilterIcon size={18} />
                  فلتر
                  {hasFilter && (
                    <span style={{ background: '#dba841', color: '#fff', borderRadius: '50%', width: 8, height: 8, display: 'inline-block', marginRight: 4 }} />
                  )}
                </button>

                {isFilterOpen && (
                  <div className="creq-filter-panel" dir="rtl">
                    <div className="creq-filter-panel-header">
                      <h2 className="creq-filter-title">الفلتر</h2>
                      <button className="btn-apply-filter" onClick={handleApplyFilter}>تطبيق الفلتر</button>
                    </div>

                    <div className="creq-filter-body">

                      {/* Gender */}
                      <div className="creq-filter-accordion">
                        <div className="creq-filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'gender' ? null : 'gender')}>
                          <span>الجنس</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'gender' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'gender' && (
                          <div className="creq-filter-accordion-content mt-2">
                            <div className="creq-filter-submenu-list creq-bordered-list">
                              {[{ val: '', label: 'الكل' }, { val: 'male', label: 'ذكر' }, { val: 'female', label: 'أنثى' }].map(opt => (
                                <label key={opt.val} className="creq-submenu-item" onClick={e => { e.preventDefault(); setDraftGender(opt.val); }}>
                                  <div className={`creq-checkbox-custom creq-check-align-left ${draftGender === opt.val ? 'checked-gold' : ''}`}>
                                    {draftGender === opt.val && <Check size={12} strokeWidth={3} color="white" />}
                                  </div>
                                  <span>{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Date range */}
                      <div className="creq-filter-accordion">
                        <div className="creq-filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'date' ? null : 'date')}>
                          <span>تاريخ الإرسال</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'date' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'date' && (
                          <div className="creq-filter-accordion-content mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="creq-filter-date-input creq-active-outline creq-relative-date-input">
                              <label style={{ fontSize: '0.78rem', color: '#718096', marginBottom: 2, display: 'block' }}>من</label>
                              <input type="date" className="custom-date-picker" value={draftDateFrom} onChange={e => setDraftDateFrom(e.target.value)} />
                            </div>
                            <div className="creq-filter-date-input creq-active-outline creq-relative-date-input">
                              <label style={{ fontSize: '0.78rem', color: '#718096', marginBottom: 2, display: 'block' }}>إلى</label>
                              <input type="date" className="custom-date-picker" value={draftDateTo} onChange={e => setDraftDateTo(e.target.value)} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Nationality */}
                      <div className="creq-filter-accordion">
                        <div className="creq-filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'nationality' ? null : 'nationality')}>
                          <span>الجنسية</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'nationality' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'nationality' && (
                          <div className="creq-filter-accordion-content mt-2">
                            <div style={{ padding: '0 8px 8px' }}>
                              <input type="text" placeholder="بحث عن جنسية..." value={natSearch} onChange={e => setNatSearch(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }} />
                            </div>
                            <div className="creq-filter-submenu-list creq-bordered-list" style={{ maxHeight: 180, overflowY: 'auto' }}>
                              <label className="creq-submenu-item" onClick={e => { e.preventDefault(); setDraftNationality(''); }}>
                                <div className={`creq-checkbox-custom creq-check-align-left ${draftNationality === '' ? 'checked-gold' : ''}`}>
                                  {draftNationality === '' && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>الكل</span>
                              </label>
                              {filteredNats.map(nat => (
                                <label key={nat} className="creq-submenu-item" onClick={e => { e.preventDefault(); setDraftNationality(nat); }}>
                                  <div className={`creq-checkbox-custom creq-check-align-left ${draftNationality === nat ? 'checked-gold' : ''}`}>
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

                      {/* Language */}
                      <div className="creq-filter-accordion">
                        <div className="creq-filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'language' ? null : 'language')}>
                          <span>اللغة</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'language' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'language' && (
                          <div className="creq-filter-accordion-content mt-2">
                            <div style={{ padding: '0 8px 8px' }}>
                              <input type="text" placeholder="بحث عن لغة..." value={langSearch} onChange={e => setLangSearch(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }} />
                            </div>
                            <div className="creq-filter-submenu-list creq-bordered-list" style={{ maxHeight: 180, overflowY: 'auto' }}>
                              <label className="creq-submenu-item" onClick={e => { e.preventDefault(); setDraftLanguage(''); }}>
                                <div className={`creq-checkbox-custom creq-check-align-left ${draftLanguage === '' ? 'checked-gold' : ''}`}>
                                  {draftLanguage === '' && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>الكل</span>
                              </label>
                              {filteredLangs.map(lang => (
                                <label key={lang} className="creq-submenu-item" onClick={e => { e.preventDefault(); setDraftLanguage(lang); }}>
                                  <div className={`creq-checkbox-custom creq-check-align-left ${draftLanguage === lang ? 'checked-gold' : ''}`}>
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

                      {/* Religion */}
                      <div className="creq-filter-accordion">
                        <div className="creq-filter-accordion-header" onClick={() => setOpenAccordion(openAccordion === 'religion' ? null : 'religion')}>
                          <span>الديانة</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'religion' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'religion' && (
                          <div className="creq-filter-accordion-content mt-2">
                            <div style={{ padding: '0 8px 8px' }}>
                              <input type="text" placeholder="بحث عن ديانة..." value={relSearch} onChange={e => setRelSearch(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }} />
                            </div>
                            <div className="creq-filter-submenu-list creq-bordered-list" style={{ maxHeight: 180, overflowY: 'auto' }}>
                              <label className="creq-submenu-item" onClick={e => { e.preventDefault(); setDraftReligion(''); }}>
                                <div className={`creq-checkbox-custom creq-check-align-left ${draftReligion === '' ? 'checked-gold' : ''}`}>
                                  {draftReligion === '' && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>الكل</span>
                              </label>
                              {filteredRels.map(rel => (
                                <label key={rel} className="creq-submenu-item" onClick={e => { e.preventDefault(); setDraftReligion(rel); }}>
                                  <div className={`creq-checkbox-custom creq-check-align-left ${draftReligion === rel ? 'checked-gold' : ''}`}>
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

                      {/* Status */}
                      <div className="creq-filter-accordion creq-no-border">
                        <div className="creq-filter-accordion-header creq-filter-status-header" onClick={() => setOpenAccordion(openAccordion === 'status' ? null : 'status')}>
                          <span>الحالة</span>
                          <ChevronDown size={16} className={`text-gray ${openAccordion === 'status' ? 'rotate-180' : ''}`} />
                        </div>
                        {openAccordion === 'status' && (
                          <div className="creq-filter-accordion-content creq-status-content mt-2">
                            <label className="creq-submenu-item" onClick={e => { e.preventDefault(); setDraftStatus(''); }}>
                              <div className={`creq-checkbox-custom creq-check-align-left ${draftStatus === '' ? 'checked-gold' : ''}`}>
                                {draftStatus === '' && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>الكل</span>
                            </label>
                            {statusOptions.map(s => (
                              <label key={s} className="creq-submenu-item" onClick={e => { e.preventDefault(); setDraftStatus(s); }}>
                                <div className={`creq-checkbox-custom creq-check-align-left ${draftStatus === s ? 'checked-gold' : ''}`}>
                                  {draftStatus === s && <Check size={12} strokeWidth={3} color="white" />}
                                </div>
                                <span>{s}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reset */}
                      {(draftGender || draftDateFrom || draftDateTo || draftNationality || draftLanguage || draftReligion || draftStatus) && (
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
                  <div className="sort-dropdown" dir="rtl">
                    <button className={`sort-option ${sortOrder === 'newest' ? 'active' : ''}`} onClick={() => { setSortOrder('newest'); setIsSortOpen(false); }}>الأحدث</button>
                    <button className={`sort-option ${sortOrder === 'oldest' ? 'active' : ''}`} onClick={() => { setSortOrder('oldest'); setIsSortOpen(false); }}>الأقدم</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="creq-body-wrapper">
            <div className="creq-content">
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
                <>
                  <TableView requests={displayed} onView={handleView} />
                  <CardView requests={displayed} onView={handleView} />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentRequests;
