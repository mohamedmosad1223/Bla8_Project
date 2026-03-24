import { useState, useEffect } from 'react';
import { ClipboardList, Globe, Monitor, CheckCircle, AlertCircle } from 'lucide-react';
import './PreacherReports.css';
import { dawahRequestService, PoolRequest } from '../../services/dawahRequestService';

const PreacherReports = () => {
  const [requests, setRequests] = useState<PoolRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<string>('');
  const [source, setSource] = useState<'platform' | 'external'>('platform');
  const [siteName, setSiteName] = useState('');
  const [content, setContent] = useState('');
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ request?: string; content?: string; siteName?: string; submit?: string }>({});

  useEffect(() => {
    dawahRequestService.getMyRequests(0, 100)
      .then(res => setRequests(res.data || []))
      .catch(() => setFetchError('تعذّر تحميل قائمة الطلبات الحالية'))
      .finally(() => setLoadingRequests(false));
  }, []);

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
    setErrors(p => ({ ...p, submit: undefined }));
    try {
      await dawahRequestService.submitReport({
        request_id: parseInt(selectedRequest),
        communication_type: source === 'platform' ? 'Platform' : 'External',
        communication_details: source === 'external' ? siteName : undefined,
        content: content.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      setErrors(p => ({ ...p, submit: err.response?.data?.detail || 'حدث خطأ أثناء حفظ التقرير' }));
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
          <p className="preport-success-sub">تم تسجيل تقرير نشاطك بنجاح، مما يسمح لك بمواصلة إدارة طلباتك بلا قيود.</p>
          <button className="preport-btn-primary" onClick={handleReset}>إضافة تقرير أخر</button>
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
          <p className="preport-subtitle">سجّل تقريراً عن نشاطك الدعوي مع أحد طلباتك الجارية</p>
        </div>
      </div>

      <div className="preport-form-card">
        {fetchError && (
          <div className="preport-error-banner">
            <AlertCircle size={18} />
            {fetchError}
          </div>
        )}

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
            disabled={loadingRequests || requests.length === 0}
          >
            <option value="">
              {loadingRequests ? 'جارٍ التحميل...' : requests.filter(r => r.needs_report).length === 0 ? 'لا توجد طلبات تحتاج لتقرير' : '— اختر طلباً من طلباتك الحالية —'}
            </option>
            {requests.filter(r => r.needs_report).map(r => (
              <option key={r.request_id} value={String(r.request_id)}>
                #{r.request_id} — {[r.invited_first_name, r.invited_last_name].filter(Boolean).join(' ')} ({r.invited_country_name || 'غير محدد'})
              </option>
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
              <span className="preport-source-desc">التواصل تم عبر محادثات المنصة</span>
              <span className="preport-source-radio" />
            </button>
            <button
              type="button"
              className={`preport-source-card ${source === 'external' ? 'active' : ''}`}
              onClick={() => setSource('external')}
            >
              <Globe size={28} className="preport-source-icon" />
              <span className="preport-source-label">تواصل خارجي</span>
              <span className="preport-source-desc">واتساب، هاتف، أو تطبيقات أخرى</span>
              <span className="preport-source-radio" />
            </button>
          </div>

          {/* Conditional: site name */}
          {source === 'external' && (
            <div className="preport-site-name-wrapper">
              <input
                type="text"
                className={`preport-input ${errors.siteName ? 'preport-input-error' : ''}`}
                placeholder="تحديداً (مثال: اتصال هاتفي، واتساب، زوم ...)"
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
            placeholder="لخّص مجريات النقاش أو الرسائل التي تمت مع المستفيد بوضوح..."
            rows={5}
            value={content}
            onChange={e => { setContent(e.target.value); setErrors(p => ({ ...p, content: undefined })); }}
          />
          {errors.content && <span className="preport-error-msg">{errors.content}</span>}
          <span className="preport-char-count">{content.length} حرف</span>
        </div>

        {errors.submit && (
          <div className="preport-error-banner" style={{ marginBottom: 16 }}>
            <AlertCircle size={18} />
            {errors.submit}
          </div>
        )}

        {/* Submit */}
        <div className="preport-actions">
          <button
            className="preport-btn-primary"
            onClick={handleSubmit}
            disabled={loading || loadingRequests || requests.length === 0}
          >
            {loading ? 'جارٍ الحفظ...' : 'حفظ التقرير'}
          </button>
          <button className="preport-btn-secondary" onClick={handleReset} disabled={loading}>
            مسح البيانات
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreacherReports;
