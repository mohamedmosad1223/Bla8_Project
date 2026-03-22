import { useState } from 'react';
import { ClipboardList, Globe, Monitor, CheckCircle } from 'lucide-react';
import './PreacherReports.css';

// Mock data for preacher's current requests (replace with API call)
const mockRequests = [
  { id: 1, name: 'جون سميث — فرنسا' },
  { id: 2, name: 'أناليز مارتن — بلجيكا' },
  { id: 3, name: 'توماس ريتر — ألمانيا' },
];

const PreacherReports = () => {
  const [selectedRequest, setSelectedRequest] = useState<string>('');
  const [source, setSource] = useState<'platform' | 'external'>('platform');
  const [siteName, setSiteName] = useState('');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ request?: string; content?: string; siteName?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!selectedRequest) newErrors.request = 'يرجى اختيار طلب';
    if (!content.trim()) newErrors.content = 'يرجى كتابة ما تم تنفيذه';
    if (source === 'external' && !siteName.trim()) newErrors.siteName = 'يرجى كتابة اسم الموقع';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // API call: POST /api/dawah-reports/
      // const token = localStorage.getItem('token');
      // await fetch('/api/dawah-reports/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      //   body: JSON.stringify({
      //     request_id: parseInt(selectedRequest),
      //     communication_type: source === 'platform' ? 'Platform' : 'External',
      //     communication_details: source === 'external' ? siteName : null,
      //     content,
      //   }),
      // });
      await new Promise(r => setTimeout(r, 800)); // Simulate network delay
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedRequest('');
    setSource('platform');
    setSiteName('');
    setContent('');
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="preport-page" dir="rtl">
        <div className="preport-success-card">
          <div className="preport-success-icon">
            <CheckCircle size={64} strokeWidth={1.5} />
          </div>
          <h2 className="preport-success-title">تم حفظ التقرير بنجاح!</h2>
          <p className="preport-success-sub">تم تسجيل تقرير نشاطك وسيكون متاحاً لمشرف الجمعية.</p>
          <button className="preport-btn-primary" onClick={handleReset}>إضافة تقرير جديد</button>
        </div>
      </div>
    );
  }

  return (
    <div className="preport-page" dir="rtl">
      {/* Header */}
      <div className="preport-header">
        <div className="preport-header-icon">
          <ClipboardList size={22} />
        </div>
        <div>
          <h1 className="preport-title">تقارير النشاط</h1>
          <p className="preport-subtitle">سجّل تقريراً عن نشاطك الدعوي مع أحد طلباتك</p>
        </div>
      </div>

      <div className="preport-form-card">

        {/* Step 1: Select Request */}
        <div className="preport-field-group">
          <label className="preport-label">
            <span className="preport-label-num">١</span>
            اختر الطلب
          </label>
          <select
            className={`preport-select ${errors.request ? 'preport-input-error' : ''}`}
            value={selectedRequest}
            onChange={e => { setSelectedRequest(e.target.value); setErrors(p => ({ ...p, request: undefined })); }}
          >
            <option value="">— اختر طلباً من طلباتك الحالية —</option>
            {mockRequests.map(r => (
              <option key={r.id} value={String(r.id)}>{r.name}</option>
            ))}
          </select>
          {errors.request && <span className="preport-error-msg">{errors.request}</span>}
        </div>

        {/* Step 2: Source */}
        <div className="preport-field-group">
          <label className="preport-label">
            <span className="preport-label-num">٢</span>
            مصدر التواصل
          </label>
          <div className="preport-source-cards">
            <button
              type="button"
              className={`preport-source-card ${source === 'platform' ? 'active' : ''}`}
              onClick={() => { setSource('platform'); setSiteName(''); setErrors(p => ({ ...p, siteName: undefined })); }}
            >
              <Monitor size={28} className="preport-source-icon" />
              <span className="preport-source-label">داخل المنصة</span>
              <span className="preport-source-desc">التواصل تم عبر منصة البلاغ</span>
              <span className="preport-source-radio" />
            </button>
            <button
              type="button"
              className={`preport-source-card ${source === 'external' ? 'active' : ''}`}
              onClick={() => setSource('external')}
            >
              <Globe size={28} className="preport-source-icon" />
              <span className="preport-source-label">مواقع أخرى</span>
              <span className="preport-source-desc">التواصل تم عبر موقع أو تطبيق خارجي</span>
              <span className="preport-source-radio" />
            </button>
          </div>

          {/* Conditional: site name */}
          {source === 'external' && (
            <div className="preport-site-name-wrapper">
              <input
                type="text"
                className={`preport-input ${errors.siteName ? 'preport-input-error' : ''}`}
                placeholder="مثال: واتساب، فيسبوك، تويتر..."
                value={siteName}
                onChange={e => { setSiteName(e.target.value); setErrors(p => ({ ...p, siteName: undefined })); }}
              />
              {errors.siteName && <span className="preport-error-msg">{errors.siteName}</span>}
            </div>
          )}
        </div>

        {/* Step 3: Content */}
        <div className="preport-field-group">
          <label className="preport-label">
            <span className="preport-label-num">٣</span>
            ما الذي تم تنفيذه؟
          </label>
          <textarea
            className={`preport-textarea ${errors.content ? 'preport-input-error' : ''}`}
            placeholder="اكتب هنا ملخص ما تم تنفيذه مع الشخص في هذه الجلسة..."
            rows={5}
            value={content}
            onChange={e => { setContent(e.target.value); setErrors(p => ({ ...p, content: undefined })); }}
          />
          {errors.content && <span className="preport-error-msg">{errors.content}</span>}
          <span className="preport-char-count">{content.length} حرف</span>
        </div>

        {/* Submit */}
        <div className="preport-actions">
          <button
            className="preport-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التقرير'}
          </button>
          <button className="preport-btn-secondary" onClick={handleReset} disabled={loading}>
            مسح
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreacherReports;
