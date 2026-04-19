import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Phone, Mail, Lock, Upload, Eye, EyeOff, X, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import { preacherService } from '../../services/preacherService';
import { useLanguage } from '../../i18n';
import { OPTION_TRANSLATIONS, NATIVE_LANGUAGE_NAMES } from '../../constants/translations';
import './PreacherRegister.css';

const PreacherRegister: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const currentLang = lang === 'SA' ? 'ar' : lang === 'US' ? 'en' : lang === 'PK' ? 'ur' : lang.toLowerCase();
  const translations = OPTION_TRANSLATIONS[currentLang] || OPTION_TRANSLATIONS['en'];
  const englishTranslations = OPTION_TRANSLATIONS['en'];

  // Helper for language display
  const getLanguageLabel = (name: string) => {
    const trimmed = name.trim();
    // For Preachers, Hindi/Tamil/Telugu must be in English
    if (trimmed === 'التاغالوغية' || trimmed === 'التاملية' || trimmed === 'التلغو') {
       return englishTranslations[trimmed] || trimmed;
    }
    return translations[trimmed] || trimmed;
  };
  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Dynamic Data State
  const [availableLangs, setAvailableLangs] = useState<{id: number, name: string}[]>([]);
  const [availableCountries, setAvailableCountries] = useState<{id: number, name: string}[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<number[]>([]); 
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isNationalityOpen, setIsNationalityOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const natDropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    nationalityId: '',
    qualificationName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [file, setFile] = useState<File | null>(null);

  // Fetch languages and countries on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [langRes, countryRes] = await Promise.all([
          preacherService.getAllLanguages(),
          preacherService.getAllCountries()
        ]);

        const languages = langRes.data || langRes;
        if (Array.isArray(languages)) {
          setAvailableLangs(languages);
        }

        const countries = countryRes.data || countryRes;
        if (Array.isArray(countries)) {
          setAvailableCountries(countries);
        }
      } catch (err) {
        console.error('Failed to fetch registration metadata:', err);
      }
    };
    fetchData();
  }, []);

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      if (natDropdownRef.current && !natDropdownRef.current.contains(event.target as Node)) {
        setIsNationalityOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const toggleLanguage = (langId: number) => {
    if (selectedLangs.includes(langId)) {
      setSelectedLangs(selectedLangs.filter(id => id !== langId));
    } else {
      setSelectedLangs([...selectedLangs, langId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    if (!file) {
      setError('يرجى إرفاق شهادة المؤهل');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = new FormData();
      payload.append('full_name', formData.fullName);
      payload.append('email', formData.email);
      payload.append('preacher_email', formData.email);
      payload.append('password', formData.password);
      payload.append('password_confirm', formData.confirmPassword);
      payload.append('phone', formData.phone);
      payload.append('scientific_qualification', formData.qualificationName);
      payload.append('nationality_country_id', formData.nationalityId);
      payload.append('qualification_file', file);

      // Add selected languages
      selectedLangs.forEach(id => payload.append('languages', id.toString()));

      // Default to volunteer preacher for now if not specified
      payload.append('type', 'volunteer');
      payload.append('gender', 'male');

      await preacherService.register(payload);
      setShowModal(true);
    } catch (err: unknown) {
      const errDetail = (err as any).response?.data?.detail;
      if (Array.isArray(errDetail)) {
        // FastAPI validation errors
        setError(errDetail.map((e: any) => e.msg).join(' - '));
      } else if (typeof errDetail === 'string') {
        setError(errDetail);
      } else {
        setError('حدث خطأ أثناء إرسال الطلب');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        عودة <ChevronRight size={18} />
      </button>

      <div className="preacher-register-container">
        <div className="form-container preacher-form-container">
          <div className="header-text preacher-header">
            <Link to="/" className="top-logo">
              <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
              <p className="top-logo-text">للتعريف بالإسلام</p>
            </Link>
            <h2>طلب تسجيل داعية</h2>
            <p>من فضلك قم بملأ البيانات التالية</p>
          </div>

          <form className="preacher-form" onSubmit={handleSubmit}>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {/* Full Name */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="text" name="fullName" placeholder="الاسم بالكامل" value={formData.fullName} onChange={handleInputChange} required />
                <span className="preg-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span>
              </div>
            </div>

            {/* Nationality (Custom Dropdown) */}
            <div className="preg-group full-width relative" ref={natDropdownRef}>
              <div 
                className={`preg-input-icon tags-input-container ${formData.nationalityId ? 'has-value' : ''}`}
                onClick={() => setIsNationalityOpen(!isNationalityOpen)}
                style={{ cursor: 'pointer', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem 0 3.5rem' }}
              >
                <div style={{ color: formData.nationalityId ? 'var(--text-dark)' : '#a0aec0' }}>
                  {formData.nationalityId ? (translations[availableCountries.find(c => String(c.id) === String(formData.nationalityId))?.name.trim() || ''] || availableCountries.find(c => String(c.id) === String(formData.nationalityId))?.name) : 'الجنسية'}
                </div>
                <span className="preg-icon" style={{ left: '1.25rem' }}>
                  <ChevronDown size={18} className={`transition-transform ${isNationalityOpen ? 'rotate-180' : ''}`} />
                </span>
              </div>

              {isNationalityOpen && (
                <div className="language-dropdown-menu custom-scrollbar">
                  {availableCountries.map((country) => (
                    <div 
                      key={country.id} 
                      className={`language-dropdown-item nationality-item ${String(formData.nationalityId) === String(country.id) ? 'active' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, nationalityId: String(country.id) }));
                        setIsNationalityOpen(false);
                      }}
                      style={{ flexDirection: 'row', justifyContent: 'flex-start' }}
                    >
                      <span className="nat-text">
                        {translations[country.name.trim()] || country.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Languages (Multi-select style like AddCaller) */}
            <div className="preg-group full-width relative" ref={dropdownRef}>
              <div 
                className={`preg-input-icon tags-input-container ${isLanguageDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                style={{ cursor: 'pointer', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem 0 3.5rem' }}
              >
                <div className="tags-wrapper" style={{ flex: 1 }}>
                  {selectedLangs.length === 0 && <span className="placeholder-text">اختر اللغات...</span>}
                  {selectedLangs.map((langId) => {
                    const lang = availableLangs.find(l => l.id === langId);
                    return (
                      <span key={langId} className="preg-tag" onClick={(e) => e.stopPropagation()}>
                        {getLanguageLabel(lang?.name || '')}
                        <button type="button" className="tag-remove" onClick={(e) => {
                          e.stopPropagation();
                          toggleLanguage(langId);
                        }}>
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <span className="preg-icon" style={{ left: '1.25rem' }}><ChevronDown size={18} className={`transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} /></span>
              </div>

              {isLanguageDropdownOpen && (
                <div className="language-dropdown-menu">
                  {availableLangs.map((lang) => {
                    const isSelected = selectedLangs.includes(lang.id);
                    return (
                      <div key={lang.id} className="language-dropdown-item" onClick={() => toggleLanguage(lang.id)}>
                        <div className={`checkbox-custom check-align-right ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <Check size={12} strokeWidth={4} color="white" />}
                        </div>
                        <span>{getLanguageLabel(lang.name)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Qualification Name + Upload */}
            <div className="preg-group half-width">
              <div className="preg-input-icon">
                <input type="text" name="qualificationName" placeholder="اكتب اسم ونوع المؤهل" value={formData.qualificationName} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="preg-group half-width">
              <div className="preg-input-icon preg-file-wrap">
                <input type="file" id="cert-upload" className="preg-file-input" onChange={handleFileChange} required />
                <label htmlFor="cert-upload" className="preg-file-label">
                  {file ? file.name : 'ارفع شهاداتك'}
                </label>
                <span className="preg-icon"><Upload size={18} /></span>
              </div>
            </div>

            {/* Phone */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="tel" name="phone" placeholder="رقم الهاتف" value={formData.phone} onChange={handleInputChange} required />
                <span className="preg-icon"><Phone size={18} /></span>
              </div>
            </div>

            {/* Email */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="email" name="email" placeholder="البريد الالكتروني" value={formData.email} onChange={handleInputChange} required />
                <span className="preg-icon"><Mail size={18} /></span>
              </div>
            </div>

            {/* Password */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="الباسورد"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="has-toggle"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <span className="preg-icon"><Lock size={18} /></span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="تأكيد الباسورد"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="has-toggle"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <span className="preg-icon"><Lock size={18} /></span>
              </div>
            </div>

            <button type="submit" className="auth-btn primary-btn full-width" disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'ارسال الطلب'}
            </button>
          </form>

          <p className="bottom-link">
            تمتلك حساب بالفعل ؟ <a href="/login?role=preacher">تسجيل الدخول</a>
          </p>
        </div>
      </div>
      <SuccessModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          navigate('/login?role=preacher');
        }}
        title="تم ارسال الطلب بنجاح"
        description="سيتم الرد عليك قريبا. يمكنك الآن تسجيل الدخول لمتابعة حالة طلبك."
      />
    </AuthLayout>
  );
};

export default PreacherRegister;
