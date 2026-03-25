import React, { useState, useEffect } from 'react';
import { User, Users, Mail, KeyRound, ChevronRight, Phone, Flag, Languages, BookOpen, Globe } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import { interestedPersonService } from '../../services/interestedPersonService';
import { muslimCallerService } from '../../services/muslimCallerService';
import { preacherService } from '../../services/preacherService';
import './Register.css';

/* ── Reusable Select Field ──────────────────────────────────────── */
const FormSelect: React.FC<{
  name: string;
  placeholder: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
}> = ({ name, placeholder, icon, options, value, onChange, required }) => (
  <div className="form-input-wrapper">
    <div className="input-group">
      <span className="input-icon-left">{icon}</span>
      <select 
        name={name} 
        value={value} 
        onChange={onChange} 
        className="form-select-input"
        required={required}
        style={{ paddingRight: '45px' }} // إزاحة للكلمة عشان السهم
      >
        <option value="" disabled hidden>{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  </div>
);

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || sessionStorage.getItem('registerRole');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    nationality_country_id: '',
    current_country_id: '',
    communication_lang_id: '',
    religion_id: '',
    gender: 'male',
  });

  // Dynamic Options with Initial Fallbacks to prevent empty menus
  const [options, setOptions] = useState({
    countries: [
        {id: 1, name: 'مصر'}, {id: 2, name: 'الكويت'}, {id: 3, name: 'السعودية'}, {id: 4, name: 'الإمارات'}
    ],
    languages: [
        {id: 1, name: 'العربية'}, {id: 2, name: 'الإنجليزية'}, {id: 3, name: 'الأردية'}, {id: 4, name: 'الفرنسية'}
    ],
    religions: [
        {id: 1, name: 'مسيحية'}, {id: 2, name: 'ملحد'}, {id: 3, name: 'بوذي'}, {id: 4, name: 'هندوسي'}, {id: 5, name: 'أخرى'}
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [cRes, lRes, rRes] = await Promise.all([
          preacherService.getAllCountries(),
          preacherService.getAllLanguages(),
          preacherService.getAllReligions()
        ]);
        setOptions({
          countries: cRes.data?.length ? cRes.data : options.countries,
          languages: lRes.data?.length ? lRes.data : options.languages,
          religions: rRes.data?.length ? rRes.data : options.religions,
        });
      } catch (err) {
        console.error("Failed to fetch registration options:", err);
      }
    };
    fetchOptions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { value, name } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (role === 'muslim_caller') {
        const muslimPayload = {
          email: formData.email, password: formData.password,
          password_confirm: formData.confirmPassword, full_name: formData.fullName,
          phone: formData.phone || null, gender: 'male'
        };
        await muslimCallerService.register(muslimPayload);
      } else {
        const names = formData.fullName.trim().split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ') || ' ';

        const payload = {
          email: formData.email, password: formData.password,
          password_confirm: formData.confirmPassword,
          first_name: firstName,
          last_name: lastName,
          gender: formData.gender,
          nationality_country_id: Number(formData.nationality_country_id) || undefined,
          current_country_id: Number(formData.current_country_id) || undefined,
          communication_lang_id: Number(formData.communication_lang_id) || undefined,
          religion_id: Number(formData.religion_id) || undefined,
          person_email: formData.email, phone: formData.phone || null,
        };
        await interestedPersonService.register(payload);
      }

      navigate(role ? `/login?role=${role}` : '/login');
    } catch (err: any) {
      console.error('Registration Error:', err.response?.data || err);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Extract field-specific error messages
        const errorMsgs = detail.map((d: any) => `${d.loc[d.loc.length-1]}: ${d.msg}`).join('\n');
        setError(errorMsgs);
      } else {
        setError(detail || 'حدث خطأ أثناء التسجيل. تفقد الحقول وحاول مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <button className="back-btn" onClick={() => navigate(-1)}>
        عودة <ChevronRight size={18} />
      </button>

      <div className="register-container">
        <div className="form-container">
          <div className="header-text register-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>إنشاء حساب {role === 'muslim_caller' ? '(مسلم داعي)' : ''}</h2>
            <p>من فضلك قم بملأ البيانات التالية لإنشاء حساب جديد</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <Input
              name="fullName" type="text" placeholder="الاسم كامل"
              icon={<User size={18} />} value={formData.fullName}
              onChange={handleInputChange} required
            />

            <Input
              name="email" type="email" placeholder="البريد الالكتروني"
              icon={<Mail size={18} />} value={formData.email}
              onChange={handleInputChange} required autoComplete="none"
            />

            <Input
              name="phone" type="tel" placeholder="رقم الهاتف (اختياري)"
              icon={<Phone size={18} />} value={formData.phone}
              onChange={handleInputChange} autoComplete="none"
            />

            {role !== 'muslim_caller' && (
              <>
                <div className="register-row">
                  <FormSelect 
                    name="nationality_country_id" placeholder="الجنسية" icon={<Flag size={18} />}
                    options={options.countries.map(c => ({ value: String(c.id), label: c.name }))}
                    value={formData.nationality_country_id} onChange={handleInputChange} required
                  />
                  <FormSelect 
                    name="current_country_id" placeholder="بلد الإقامة" icon={<Globe size={18} />}
                    options={options.countries.map(c => ({ value: String(c.id), label: c.name }))}
                    value={formData.current_country_id} onChange={handleInputChange} required
                  />
                </div>

                <div className="register-row">
                  <FormSelect 
                    name="religion_id" placeholder="الديانة الحالية" icon={<BookOpen size={18} />}
                    options={options.religions.map(r => ({ value: String(r.id), label: r.name }))}
                    value={formData.religion_id} onChange={handleInputChange} required
                  />
                  <FormSelect 
                    name="communication_lang_id" placeholder="لغة التواصل" icon={<Languages size={18} />}
                    options={options.languages.map(l => ({ value: String(l.id), label: l.name }))}
                    value={formData.communication_lang_id} onChange={handleInputChange} required
                  />
                </div>

                <FormSelect 
                  name="gender" placeholder="الجنس" icon={<Users size={18} />}
                  options={[{ value: 'male', label: 'ذكر' }, { value: 'female', label: 'أنثى' }]}
                  value={formData.gender} onChange={handleInputChange} required
                />
              </>
            )}

            <Input
              name="password" type="password" placeholder="الباسورد (حرف كبير + رقم)"
              icon={<KeyRound size={18} />} value={formData.password}
              onChange={handleInputChange} required autoComplete="new-password"
            />

            <Input
              name="confirmPassword" type="password" placeholder="تأكيد الباسورد"
              icon={<KeyRound size={18} />} value={formData.confirmPassword}
              onChange={handleInputChange} required autoComplete="new-password"
            />

            <button type="submit" className="auth-btn primary-btn register-btn" disabled={loading}>
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
            </button>
          </form>

          <p className="bottom-link">
            لديك حساب بالفعل؟ <Link to={role ? `/login?role=${role}` : '/login'}>تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
