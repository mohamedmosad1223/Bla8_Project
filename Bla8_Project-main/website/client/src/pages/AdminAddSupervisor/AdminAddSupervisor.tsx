import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './AdminAddSupervisor.css';

const AdminAddSupervisor = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [inlineError, setInlineError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedName, setSavedName] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setInlineError('');
  };

  const translateError = (msg: string): string => {
    if (msg.includes('at least 8')) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (msg.includes('already registered') || msg.includes('EMAIL_REGISTERED') || msg.includes('مسجل')) return 'البريد الإلكتروني مسجل مسبقاً';
    if (msg.includes('uppercase') || msg.includes('حرف كبير')) return 'كلمة المرور يجب أن تحتوي على حرف كبير';
    if (msg.includes('digit') || msg.includes('رقم')) return 'كلمة المرور يجب أن تحتوي على رقم';
    if (msg.includes('match') || msg.includes('متطابق')) return 'كلمتا المرور غير متطابقتين';
    if (msg.includes('value is not a valid email')) return 'البريد الإلكتروني غير صحيح';
    return msg; // fallback: return as-is if already Arabic or unknown
  };

  const handleSave = async () => {
    setInlineError('');
    if (!formData.full_name || !formData.email || !formData.password || !formData.password_confirm) {
      setInlineError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (formData.password.length < 8) {
      setInlineError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (formData.password !== formData.password_confirm) {
      setInlineError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setInlineError('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setInlineError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admins/register', {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        password_confirm: formData.password_confirm,
        role: 'admin',
      });
      setSavedName(formData.full_name);
      setShowModal('success');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let msg: string;
      if (Array.isArray(detail)) {
        msg = detail.map((d: any) => translateError(d.msg || d)).join('، ');
      } else {
        msg = translateError(detail || 'حدث خطأ أثناء إضافة الأدمن');
      }
      setErrorMsg(msg);
      setShowModal('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aadd-page">
      {/* ── Breadcrumb & Title ── */}
      <div className="aadd-header">
        <div className="aadd-breadcrumb">
          <span className="aadd-crumb-link" onClick={() => navigate('/dashboard')}>الرئيسية</span>
          <span className="aadd-crumb-separator">{'<'}</span>
          <span className="aadd-crumb-current">إضافة أدمن جديد</span>
        </div>
        <h1 className="aadd-title">إضافة أدمن جديد</h1>
      </div>

      {/* ── Form Card ── */}
      <div className="aadd-card">

        {/* Inline error banner */}
        {inlineError && (
          <div className="aadd-inline-error">
            <AlertCircle size={18} />
            <span>{inlineError}</span>
          </div>
        )}

        <div className="aadd-grid">
          <div className="aadd-group">
            <label className="aadd-label">الاسم الكامل <span style={{color:'red'}}>*</span></label>
            <input type="text" name="full_name" className="aadd-input" placeholder="الاسم الكامل" value={formData.full_name} onChange={handleChange} />
          </div>
          <div className="aadd-group">
            <label className="aadd-label">البريد الإلكتروني <span style={{color:'red'}}>*</span></label>
            <input type="email" name="email" className="aadd-input" placeholder="admin@example.com" value={formData.email} onChange={handleChange} />
          </div>
          <div className="aadd-group">
            <label className="aadd-label">رقم الهاتف</label>
            <input type="tel" name="phone" className="aadd-input" placeholder="+966500000000" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="aadd-group" />
          <div className="aadd-group">
            <label className="aadd-label">كلمة المرور <span style={{color:'red'}}>*</span></label>
            <div className="aadd-input-with-icon left">
              <button type="button" className="aadd-icon-left-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <input type={showPass ? 'text' : 'password'} name="password" className="aadd-input" placeholder="مثال: Admin123" value={formData.password} onChange={handleChange} />
            </div>
            <small style={{color:'#9CA3AF', fontSize:'0.75rem'}}>يجب أن تحتوي على حرف كبير ورقم</small>
          </div>
          <div className="aadd-group">
            <label className="aadd-label">تأكيد كلمة المرور <span style={{color:'red'}}>*</span></label>
            <div className="aadd-input-with-icon left">
              <button type="button" className="aadd-icon-left-btn" onClick={() => setShowPassConfirm(!showPassConfirm)}>
                {showPassConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <input type={showPassConfirm ? 'text' : 'password'} name="password_confirm" className="aadd-input" placeholder="تأكيد كلمة المرور" value={formData.password_confirm} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="aadd-actions">
          <button className="aadd-save-btn" onClick={handleSave} disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>

      {/* ── Success Modal ── */}
      {showModal === 'success' && (
        <div className="areq-modal-overlay">
          <div className="areq-modal-content areq-success-modal">
            <button className="areq-modal-close" onClick={() => { setShowModal(null); navigate('/dashboard'); }}>
              <X size={20} />
            </button>
            <div className="areq-modal-icon-wrapper success">
              <Check size={40} className="areq-modal-icon" />
            </div>
            <h2 className="areq-modal-title">تم بنجاح!</h2>
            <p className="areq-modal-subtitle">تم تعيين <strong>{savedName}</strong> كأدمن</p>
            <button className="areq-modal-btn areq-success-btn" onClick={() => { setShowModal(null); navigate('/dashboard'); }}>
              تم
            </button>
          </div>
        </div>
      )}

      {/* ── Error Modal ── */}
      {showModal === 'error' && (
        <div className="areq-modal-overlay">
          <div className="areq-modal-content">
            <button className="areq-modal-close" onClick={() => setShowModal(null)}>
              <X size={20} />
            </button>
            <div className="areq-modal-icon-wrapper reject">
              <X size={40} strokeWidth={3} className="areq-modal-icon" />
            </div>
            <h2 className="areq-modal-title">حدث خطأ!</h2>
            <p className="areq-modal-subtitle">{errorMsg}</p>
            <button className="areq-modal-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={() => setShowModal(null)}>
              حاول مرة أخرى
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAddSupervisor;
