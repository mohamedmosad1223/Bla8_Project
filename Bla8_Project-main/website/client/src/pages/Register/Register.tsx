import React, { useState, useEffect, useRef } from 'react';
import { User, Users, Mail, KeyRound, ChevronRight, Phone, Flag, Languages, BookOpen, Globe, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import { interestedPersonService } from '../../services/interestedPersonService';
import { muslimCallerService } from '../../services/muslimCallerService';
import { preacherService } from '../../services/preacherService';
import './Register.css';

/* ── Reusable Autocomplete Field ─────────────────────────────────── */
const FormAutocomplete: React.FC<{
  name: string;
  placeholder: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
}> = ({ name, placeholder, icon, options, value, onChange, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(name, optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="autocomplete-container" ref={containerRef}>
      <Input
        name={name}
        placeholder={placeholder}
        icon={icon}
        value={isOpen ? searchTerm : displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setSearchTerm('');
        }}
        autoComplete="off"
        required={required && !value}
        className={!value && !isOpen ? 'placeholder-active' : ''}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul className="custom-autocomplete-dropdown">
          {filteredOptions.map(o => (
            <li 
              key={o.value} 
              className={`autocomplete-item ${o.value === value ? 'active' : ''}`}
              onClick={() => handleSelect(o.value)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ── Reusable Select Field (Optional - kept for Gender if needed) ─── */
const FormSelect: React.FC<{
  name: string;
  placeholder: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  value: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
}> = ({ name, placeholder, icon, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="autocomplete-container" ref={containerRef}>
      <div className="input-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <span className="input-icon">{icon}</span>
        <button type="button" className={`custom-input with-icon ${!value ? 'placeholder-active' : ''}`} style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronRight size={16} style={{ transform: isOpen ? 'rotate(-90deg)' : 'rotate(90deg)', color: '#A0AEC0', transition: 'transform 0.2s' }} />
        </button>
      </div>
      {isOpen && (
        <ul className="custom-autocomplete-dropdown">
          {options.map(o => (
            <li 
              key={o.value} 
              className={`autocomplete-item ${o.value === value ? 'active' : ''}`}
              onClick={() => {
                onChange(name, o.value);
                setIsOpen(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValueChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
        const errorMsgs = detail.map((d: { loc: (string | number)[], msg: string }) => `${d.loc[d.loc.length-1]}: ${d.msg}`).join('\n');
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
                  <FormAutocomplete 
                    name="nationality_country_id" placeholder="الجنسية" icon={<Flag size={18} />}
                    options={options.countries.map(c => ({ value: String(c.id), label: c.name }))}
                    value={formData.nationality_country_id} onChange={handleValueChange} required
                  />
                  <FormAutocomplete 
                    name="current_country_id" placeholder="بلد الإقامة" icon={<Globe size={18} />}
                    options={options.countries.map(c => ({ value: String(c.id), label: c.name }))}
                    value={formData.current_country_id} onChange={handleValueChange} required
                  />
                </div>

                <div className="register-row">
                  <FormAutocomplete 
                    name="religion_id" placeholder="الديانة الحالية" icon={<BookOpen size={18} />}
                    options={options.religions.map(r => ({ value: String(r.id), label: r.name }))}
                    value={formData.religion_id} onChange={handleValueChange} required
                  />
                  <FormAutocomplete 
                    name="communication_lang_id" placeholder="لغة التواصل" icon={<Languages size={18} />}
                    options={options.languages.map(l => ({ value: String(l.id), label: l.name }))}
                    value={formData.communication_lang_id} onChange={handleValueChange} required
                  />
                </div>

                <FormSelect 
                  name="gender" placeholder="الجنس" icon={<Users size={18} />}
                  options={[{ value: 'male', label: 'ذكر' }, { value: 'female', label: 'أنثى' }]}
                  value={formData.gender} onChange={handleValueChange} required
                />
              </>
            )}

            <Input
              name="password" type={showPassword ? 'text' : 'password'} placeholder="الباسورد (حرف كبير + رقم)"
              icon={<KeyRound size={18} />} value={formData.password}
              onChange={handleInputChange} required autoComplete="new-password"
              rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              onRightIconClick={() => setShowPassword((p) => !p)}
              rightIconLabel={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            />

            <Input
              name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="تأكيد الباسورد"
              icon={<KeyRound size={18} />} value={formData.confirmPassword}
              onChange={handleInputChange} required autoComplete="new-password"
              rightIcon={showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              onRightIconClick={() => setShowConfirmPassword((p) => !p)}
              rightIconLabel={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
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
