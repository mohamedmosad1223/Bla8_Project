import React, { useState, useEffect } from 'react';
import { User, Mail, KeyRound, ChevronRight, Phone, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import { interestedPersonService } from '../../services/interestedPersonService';
import { muslimCallerService } from '../../services/muslimCallerService';
import './Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || sessionStorage.getItem('registerRole');

  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [showReligionDropdown, setShowReligionDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const religionsList = [
    "مسيحية / Christianity", "يهودية / Judaism", "هندوسية / Hinduism", 
    "بوذية / Buddhism", "إلحاد / Atheism", "أخرى / Other"
  ];

  const languagesList = [
    "الإنجليزية / English", "الفرنسية / French", "الإسبانية / Spanish", 
    "الروسية / Russian", "أخرى / Other"
  ];

  const nationalitiesList = [
    "مصر / Egypt", "السعودية / Saudi Arabia", "الإمارات / UAE", "الكويت / Kuwait", 
    "قطر / Qatar", "عمان / Oman", "البحرين / Bahrain", "المغرب / Morocco", 
    "الجزائر / Algeria", "تونس / Tunisia", "الولايات المتحدة / USA", 
    "المملكة المتحدة / UK", "كندا / Canada", "أستراليا / Australia", 
    "ألمانيا / Germany", "فرنسا / France", "إيطاليا / Italy", 
    "إسبانيا / Spain", "تركيا / Turkey", "ماليزيا / Malaysia", 
    "إندونيسيا / Indonesia", "باكستان / Pakistan", "الهند / India"
  ];

  useEffect(() => {
    console.log("Register Page loaded with role:", role, "| URL param:", searchParams.get('role'), "| storage:", sessionStorage.getItem('registerRole'));
  }, [role, searchParams]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    religion: '',
    nationality: '',
    language: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Client-side password validation
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
          email: formData.email,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone || null,
          gender: 'male'
        };
        await muslimCallerService.register(muslimPayload);
      } else {
        // Non-Muslim (InterestedPerson) registration
        const langId = localStorage.getItem('appLanguageId');
        const payload: Record<string, unknown> = {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone || null,
          communication_lang_id: langId ? Number(langId) : null,
        };
        await interestedPersonService.register(payload);
      }

      // On success, redirect to login
      navigate(role ? `/login?role=${role}` : '/login');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: unknown } }; code?: string };
      console.error('Registration Error:', axiosErr.response?.data || err);
      if (axiosErr.response?.data?.detail) {
        const detail = axiosErr.response.data.detail;
        if (Array.isArray(detail)) {
          setError(detail.map((d: { msg?: string }) => d.msg?.replace('Value error, ', '') || d.msg).join('\n'));
        } else {
          setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
        }
      } else if (axiosErr.code === 'ERR_NETWORK') {
        setError('تعذر الاتصال بالسيرفر. تأكد من تشغيل الـ Backend على Port 8000');
      } else {
        setError('حدث خطأ أثناء التسجيل');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Back Button positioned at top right */}
      <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        عودة <ChevronRight size={18} />
      </button>

      <div className="register-container">
        <div className="form-container">
          <div className="header-text register-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>إنشاء حساب</h2>
            <p>من فضلك قم بملأ البيانات التالية لإنشاء حساب جديد</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px', whiteSpace: 'pre-line' }}>
                {error}
              </div>
            )}

            <Input
              name="firstName"
              type="text"
              placeholder="الاسم الأول / First Name"
              icon={<User size={18} />}
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />

            <Input
              name="lastName"
              type="text"
              placeholder="اسم العائلة / Last Name"
              icon={<User size={18} />}
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />

            <Input
              name="email"
              type="email"
              placeholder="البريد الالكتروني"
              icon={<Mail size={18} />}
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            <Input
              name="phone"
              type="tel"
              placeholder="رقم الهاتف"
              icon={<Phone size={18} />}
              value={formData.phone}
              onChange={handleInputChange}
              style={{ textAlign: 'right' }}
            />

            {role !== 'muslim_caller' && (
              <>
                <div className="autocomplete-container">
                  <Input
                    name="religion"
                    type="text"
                    placeholder="الديانة / Religion"
                    icon={<User size={18} />}
                    value={formData.religion}
                    onChange={(e) => {
                      handleInputChange(e);
                      setShowReligionDropdown(true);
                    }}
                    onFocus={() => setShowReligionDropdown(true)}
                    onBlur={() => setTimeout(() => setShowReligionDropdown(false), 200)}
                    autoComplete="off"
                  />
                  {showReligionDropdown && (
                    <ul className="custom-autocomplete-dropdown">
                      {religionsList.filter(r => r.toLowerCase().includes(formData.religion.toLowerCase())).length > 0 ? (
                        religionsList
                          .filter(r => r.toLowerCase().includes(formData.religion.toLowerCase()))
                          .map((rel) => (
                            <li 
                              key={rel} 
                              className="autocomplete-item"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, religion: rel }));
                                setShowReligionDropdown(false);
                              }}
                            >
                              {rel}
                            </li>
                          ))
                      ) : (
                        <li className="autocomplete-item" style={{ color: '#94a3b8', cursor: 'default' }}>لا توجد نتائج مطابقة</li>
                      )}
                    </ul>
                  )}
                </div>

                <div className="autocomplete-container">
                  <Input
                    name="nationality"
                    type="text"
                    placeholder="الجنسية / Nationality"
                    icon={<User size={18} />}
                    value={formData.nationality}
                    onChange={(e) => {
                      handleInputChange(e);
                      setShowNationalityDropdown(true);
                    }}
                    onFocus={() => setShowNationalityDropdown(true)}
                    onBlur={() => setTimeout(() => setShowNationalityDropdown(false), 200)}
                    autoComplete="off"
                  />
                  {showNationalityDropdown && (
                    <ul className="custom-autocomplete-dropdown">
                      {nationalitiesList.filter(n => n.toLowerCase().includes(formData.nationality.toLowerCase())).length > 0 ? (
                        nationalitiesList
                          .filter(n => n.toLowerCase().includes(formData.nationality.toLowerCase()))
                          .map((nat) => (
                            <li 
                              key={nat} 
                              className="autocomplete-item"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, nationality: nat }));
                                setShowNationalityDropdown(false);
                              }}
                            >
                              {nat}
                            </li>
                          ))
                      ) : (
                        <li className="autocomplete-item" style={{ color: '#94a3b8', cursor: 'default' }}>لا توجد نتائج مطابقة</li>
                      )}
                    </ul>
                  )}
                </div>

                <div className="autocomplete-container">
                  <Input
                    name="language"
                    type="text"
                    placeholder=" لغة التحدث / Speaking Language"
                    icon={<User size={18} />}
                    value={formData.language}
                    onChange={(e) => {
                      handleInputChange(e);
                      setShowLanguageDropdown(true);
                    }}
                    onFocus={() => setShowLanguageDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLanguageDropdown(false), 200)}
                    autoComplete="off"
                  />
                  {showLanguageDropdown && (
                    <ul className="custom-autocomplete-dropdown">
                      {languagesList.filter(l => l.toLowerCase().includes(formData.language.toLowerCase())).length > 0 ? (
                        languagesList
                          .filter(l => l.toLowerCase().includes(formData.language.toLowerCase()))
                          .map((lan) => (
                            <li 
                              key={lan} 
                              className="autocomplete-item"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, language: lan }));
                                setShowLanguageDropdown(false);
                              }}
                            >
                              {lan}
                            </li>
                          ))
                      ) : (
                        <li className="autocomplete-item" style={{ color: '#94a3b8', cursor: 'default' }}>لا توجد نتائج مطابقة</li>
                      )}
                    </ul>
                  )}
                </div>
              </>
            )}

            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="الباسورد (حرف كبير + رقم)"
              icon={<KeyRound size={18} />}
              iconRight={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              onIconRightClick={() => setShowPassword(!showPassword)}
              value={formData.password}
              onChange={handleInputChange}
              required
            />

            <Input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="تأكيد الباسورد"
              icon={<KeyRound size={18} />}
              iconRight={showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              onIconRightClick={() => setShowConfirmPassword(!showConfirmPassword)}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
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
