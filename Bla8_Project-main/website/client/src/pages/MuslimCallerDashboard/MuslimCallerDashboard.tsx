import React, { useState } from 'react';
import {
  User, BookOpen, Flag, Languages, Phone,
  Calendar, Users, ClipboardList, ChevronDown, MessageSquare
} from 'lucide-react';
import Input from '../../components/common/Input/Input';
import Checkbox from '../../components/common/Checkbox/Checkbox';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import { dawahRequestService } from '../../services/dawahRequestService';
import './MuslimCallerDashboard.css';

/* ── Reusable Select Field ──────────────────────────────────────── */
const SelectField: React.FC<{
  name: string;
  placeholder: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}> = ({ name, placeholder, icon, options, value, onChange, error }) => (
  <div className="mc-field-wrap">
    <div className={`mc-select-wrapper ${error ? 'mc-error-border' : ''}`}>
      <span className="mc-sel-icon">{icon}</span>
      <select name={name} className="mc-select" value={value} onChange={onChange}>
        <option value="" disabled hidden>{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="mc-sel-chevron"><ChevronDown size={15} /></span>
    </div>
    {error && <span className="mc-error-msg">{error}</span>}
  </div>
);

/* ── Field labels for validation ── */
const fieldLabels: Record<string, string> = {
  fullName: 'الاسم بالكامل',
  religion: 'الديانة',
  nationality: 'الجنسية',
  language: 'اللغة',
  phone: 'رقم الهاتف',
  gender: 'الجنس',
  age: 'العمر',
  communicationMethod: 'وسيلة تواصل',
};

/* ── Main Component ─────────────────────────────────────────────── */
const MuslimCallerDashboard: React.FC = () => {
  const [form, setForm] = useState({
    fullName: '', religion: '', nationality: '', language: '',
    phone: '', gender: '', age: '', communicationMethod: '',
    comment: '', acceptedTerms: false,
  });
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    // Clear error for this field when user starts typing
    if (submitted && errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ['fullName', 'religion', 'nationality', 'language', 'phone', 'gender', 'age', 'communicationMethod'];

    for (const field of requiredFields) {
      const val = form[field as keyof typeof form];
      if (typeof val === 'string' && val.trim() === '') {
        newErrors[field] = `من فضلك أدخل ${fieldLabels[field]}`;
      }
    }

    if (!form.acceptedTerms) {
      newErrors['acceptedTerms'] = 'يجب الموافقة على إدخال البيانات الشخصية';
    }

    return newErrors;
  };

  // Channel enum mapping
  const channelMap: Record<string, string> = {
    whatsapp: 'whatsapp',
    phone: 'phone',
    telegram: 'telegram',
    messenger: 'messenger',
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setApiError(null);
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length !== 0) return;

    try {
      setLoading(true);
      // Map form to backend schema
      const [firstName, ...rest] = form.fullName.trim().split(' ');
      const lastName = rest.join(' ') || '';

      const payload = {
        request_type: 'invited',
        invited_first_name: firstName,
        invited_last_name: lastName || undefined,
        invited_gender: form.gender || undefined,
        invited_phone: form.phone || undefined,
        communication_channel: channelMap[form.communicationMethod] || form.communicationMethod,
        notes: form.comment || undefined,
      };

      await dawahRequestService.create(payload);
      setShowModal(true);

      // Reset form
      setForm({ fullName: '', religion: '', nationality: '', language: '', phone: '', gender: '', age: '', communicationMethod: '', comment: '', acceptedTerms: false });
      setSubmitted(false);
      setErrors({});
    } catch (err: any) {
      console.error('Dawah request error:', err.response?.data || err);
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        setApiError(typeof detail === 'string' ? detail : JSON.stringify(detail));
      } else {
        setApiError('حدث خطأ أثناء إرسال الطلب');
      }
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => submitted ? errors[field] : undefined;

  return (
    <div className="mc-page" dir="rtl">
      <div className="mc-card">

        {/* Logo */}
        <div className="mc-logo-area">
          <img src="/bla8_logo.png" alt="Balagh Logo" className="mc-logo" />
        </div>

        <h2 className="mc-title">من فضلك قم بملئ البيانات المدعو</h2>

        <form className="mc-form" onSubmit={submit} noValidate>

          {/* Full Name */}
          <div className="mc-field-wrap">
            <Input
              type="text" name="fullName" placeholder="الاسم بالكامل"
              icon={<User size={18} />} value={form.fullName} onChange={handle}
              className={getError('fullName') ? 'mc-error-border' : ''}
            />
            {getError('fullName') && <span className="mc-error-msg">{getError('fullName')}</span>}
          </div>

          {/* Row: Religion + Nationality */}
          <div className="mc-row">
            <SelectField name="nationality" placeholder="الجنسية" icon={<Flag size={18} />}
              value={form.nationality} onChange={handle} error={getError('nationality')}
              options={[{ value: 'kw', label: 'كويتي' }, { value: 'eg', label: 'مصري' },
                        { value: 'sa', label: 'سعودي' }, { value: 'other', label: 'أخرى' }]}
            />
            <SelectField name="religion" placeholder="الديانة" icon={<BookOpen size={18} />}
              value={form.religion} onChange={handle} error={getError('religion')}
              options={[{ value: 'muslim', label: 'مسلم' }, { value: 'christian', label: 'مسيحي' },
                        { value: 'jewish', label: 'يهودي' }, { value: 'other', label: 'أخرى' }]}
            />
          </div>

          {/* Language */}
          <SelectField name="language" placeholder="اللغة" icon={<Languages size={18} />}
            value={form.language} onChange={handle} error={getError('language')}
            options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'الإنجليزية' },
                      { value: 'fr', label: 'الفرنسية' }, { value: 'ur', label: 'الأردية' }]}
          />

          {/* Phone */}
          <div className="mc-field-wrap">
            <Input
              type="tel" name="phone" placeholder="رقم الهاتف"
              icon={<Phone size={18} />} value={form.phone} onChange={handle}
              className={getError('phone') ? 'mc-error-border' : ''}
            />
            {getError('phone') && <span className="mc-error-msg">{getError('phone')}</span>}
          </div>

          {/* Row: Age + Gender */}
          <div className="mc-row">
            <div className="mc-field-wrap">
              <Input
                type="text" name="age" placeholder="العمر"
                icon={<Calendar size={18} />} value={form.age} onChange={handle}
                className={getError('age') ? 'mc-error-border' : ''}
              />
              {getError('age') && <span className="mc-error-msg">{getError('age')}</span>}
            </div>
            <SelectField name="gender" placeholder="الجنس" icon={<Users size={18} />}
              value={form.gender} onChange={handle} error={getError('gender')}
              options={[{ value: 'male', label: 'ذكر' }, { value: 'female', label: 'أنثى' }]}
            />
          </div>

          {/* Communication Method */}
          <SelectField name="communicationMethod" placeholder="وسيلة تواصل" icon={<ClipboardList size={18} />}
            value={form.communicationMethod} onChange={handle} error={getError('communicationMethod')}
            options={[{ value: 'whatsapp', label: 'واتساب' }, { value: 'phone', label: 'مكالمة هاتفية' },
                      { value: 'telegram', label: 'تيليغرام' }, { value: 'messenger', label: 'ماسنجر' }]}
          />

          {/* Comment */}
          <div className="mc-textarea-wrapper">
            <MessageSquare size={16} className="mc-ta-icon" />
            <textarea
              name="comment" placeholder="أضف تعليق"
              className="mc-textarea" value={form.comment} onChange={handle}
            />
          </div>

          {/* Checkbox */}
          <div className="mc-check-row">
            <Checkbox
              label="الشخص يعلم بادخال بياناته الشخصية"
              checked={form.acceptedTerms}
              onChange={e => {
                setForm(p => ({ ...p, acceptedTerms: e.target.checked }));
                if (submitted && errors['acceptedTerms']) {
                  setErrors(prev => {
                    const next = { ...prev };
                    delete next['acceptedTerms'];
                    return next;
                  });
                }
              }}
            />
          </div>
          {getError('acceptedTerms') && <span className="mc-error-msg mc-error-center">{getError('acceptedTerms')}</span>}

          {apiError && (
            <div style={{ color: 'red', margin: '8px 0', textAlign: 'center', fontSize: '0.9rem' }}>
              {apiError}
            </div>
          )}

          <button type="submit" className="mc-btn-submit" disabled={loading}>
            {loading ? 'جاري الإرسال...' : 'إرسال'}
          </button>
        </form>
      </div>

      <SuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="لقد تم إرسال رسالتك بنجاح!"
        description="سيتم التواصل مع المدعو قريباً"
        actionLabel="تم"
      />
    </div>
  );
};

export default MuslimCallerDashboard;
