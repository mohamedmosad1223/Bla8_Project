import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { preacherService } from '../../services/preacherService';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import './AddCaller.css';


const AddCaller = () => {
  const navigate = useNavigate();
  const [availableLangs, setAvailableLangs] = useState<{id: number, name: string}[]>([]);
  const [availableCountries, setAvailableCountries] = useState<{id: number, name: string}[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<number[]>([]); 
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] = useState(false);
  const nationalityDropdownRef = useRef<HTMLDivElement>(null);

  // Check if organization is suspended
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isSuspended = userData.status === 'suspended';

  // جلب البيانات من السيرفر
  useEffect(() => {
    const fetchData = async () => {
      try {
        // اللغات
        const langRes = await preacherService.getAllLanguages();
        const langs = langRes.data || langRes;
        if (Array.isArray(langs)) {
           setAvailableLangs(langs);
           const defaultIds = langs
             .filter((l: any) => l.name.includes('العربية') || l.name.includes('الانجليزية'))
             .map((l: any) => l.id);
           setSelectedLangs(defaultIds);
        }

        // البلاد
        const countryRes = await api.get('/preachers/countries');
        const countries = countryRes.data?.data || countryRes.data || [];
        setAvailableCountries(countries);
        // تعيين أول بلد كجنسية افتراضية إذا لم يوجد اختيار
        if (countries.length > 0) {
            setFormData(prev => ({ ...prev, nationalityCountryId: countries[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setIsGenderDropdownOpen(false);
      }
      if (nationalityDropdownRef.current && !nationalityDropdownRef.current.contains(event.target as Node)) {
        setIsNationalityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    scientificQualification: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    nationalityCountryId: 1, // سنحدثها عند جلب البلاد
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (isSuspended) return;

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    if (!file) {
        setError('يرجى رفع ملف المؤهلات العلمية');
        return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload = new FormData();
      payload.append('full_name', formData.fullName);
      payload.append('email', formData.email); // سيتم استخدامه كـ username
      payload.append('password', formData.password);
      payload.append('password_confirm', formData.confirmPassword);
      payload.append('phone', formData.phone);
      payload.append('preacher_email', formData.email); // البريد الخاص بالتواصل
      payload.append('scientific_qualification', formData.scientificQualification);
      payload.append('gender', formData.gender);
      payload.append('nationality_country_id', formData.nationalityCountryId.toString());
      
      // إرسال اللغات كـ IDs (Backend expects a list of IDs)
      selectedLangs.forEach(id => payload.append('languages', id.toString()));
      
      // الملف
      payload.append('qualification_file', file);
      
      await preacherService.register(payload);
      setShowModal(true);
    } catch (err: any) {
      console.error('Full Error Object:', err);
      const responseData = err.response?.data;
      const detail = responseData?.detail;
      
      let errorMessage = 'حدث خطأ أثناء إضافة الداعية. تأكد من أن البيانات صحيحة.';
      
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        // التعامل مع أخطاء Pydantic (422)
        errorMessage = detail[0]?.msg || errorMessage;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-caller-page"> {/* تم تغيير الكلاس لضمان استقلالية التصميم */}
      <div className="notifications-header-area">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/callers')}>
            دعاة الجمعية
          </button>
          <ChevronRight size={16} className="breadcrumb-separator" />
          <span className="breadcrumb-current">إضافة داعية جديد</span>
        </div>
        <h1 className="page-title">إضافة داعية جديد</h1>
      </div>

      <div className="form-container">
        <form className="add-caller-form" onSubmit={handleSubmit}>
          {isSuspended && (
            <div className="error-alert" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <span>لا يمكنك إضافة دعاة جدد لأن حساب الجمعية موقوف حالياً.</span>
            </div>
          )}

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-grid">
            {/* الاسم الكامل ورقم الهاتف */}
            <div className="form-group">
              <label>اسم الداعية بالكامل</label>
              <input type="text" name="fullName" placeholder="اسم الداعية بالكامل" className="form-input" value={formData.fullName} onChange={handleInputChange} required disabled={isSuspended} />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input type="text" name="phone" placeholder="رقم الهاتف" className="form-input" value={formData.phone} onChange={handleInputChange} required disabled={isSuspended} />
            </div>

            {/* النوع - Gender */}
            <div className="form-group relative" ref={genderDropdownRef}>
              <label>النوع</label>
              <div 
                className={`tags-input-container form-input ${isSuspended ? 'disabled' : ''}`} 
                onClick={() => !isSuspended && setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                style={{ cursor: isSuspended ? 'not-allowed' : 'pointer', minHeight: '48px', height: 'auto' }}
              >
                <div className="tags-wrapper">
                  <span className="tag" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                    {formData.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </span>
                </div>
                {!isSuspended && (
                  <button type="button" className="tag-dropdown-btn" style={{ marginLeft: '4px' }}>
                    <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isGenderDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>
                )}
              </div>

              {isGenderDropdownOpen && !isSuspended && (
                <div className="language-dropdown-menu">
                  <div className="language-dropdown-item" onClick={() => { setFormData(prev => ({...prev, gender: 'male'})); setIsGenderDropdownOpen(false); }}>
                    <div className={`checkbox-custom check-align-left ${formData.gender === 'male' ? 'checked' : ''}`}>
                      {formData.gender === 'male' && <Check size={12} strokeWidth={4} color="white" />}
                    </div>
                    <span>ذكر</span>
                  </div>
                  <div className="language-dropdown-item" onClick={() => { setFormData(prev => ({...prev, gender: 'female'})); setIsGenderDropdownOpen(false); }}>
                    <div className={`checkbox-custom check-align-left ${formData.gender === 'female' ? 'checked' : ''}`}>
                      {formData.gender === 'female' && <Check size={12} strokeWidth={4} color="white" />}
                    </div>
                    <span>أنثى</span>
                  </div>
                </div>
              )}
            </div>

            {/* الجنسية */}
            <div className="form-group relative" ref={nationalityDropdownRef}>
              <label>الجنسية</label>
              <div 
                className={`tags-input-container form-input ${isSuspended ? 'disabled' : ''}`} 
                onClick={() => !isSuspended && setIsNationalityDropdownOpen(!isNationalityDropdownOpen)}
                style={{ cursor: isSuspended ? 'not-allowed' : 'pointer', minHeight: '48px', height: 'auto' }}
              >
                <div className="tags-wrapper">
                  {formData.nationalityCountryId ? (
                    <span className="tag" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                      {availableCountries.find(c => c.id === formData.nationalityCountryId)?.name || 'اختر الجنسية'}
                    </span>
                  ) : (
                    <span className="placeholder-text">اختر الجنسية</span>
                  )}
                </div>
                {!isSuspended && (
                  <button type="button" className="tag-dropdown-btn" style={{ marginLeft: '4px' }}>
                    <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isNationalityDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>
                )}
              </div>

              {isNationalityDropdownOpen && !isSuspended && (
                <div className="language-dropdown-menu">
                  {availableCountries.map((c) => {
                    const isSelected = formData.nationalityCountryId === c.id;
                    return (
                      <div key={c.id} className="language-dropdown-item" onClick={() => { setFormData(prev => ({...prev, nationalityCountryId: c.id})); setIsNationalityDropdownOpen(false); }}>
                        <div className={`checkbox-custom check-align-left ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <Check size={12} strokeWidth={4} color="white" />}
                        </div>
                        <span>{c.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* المؤهل العلمي والملف */}
            <div className="form-group">
              <label>المؤهل العلمي</label>
              <input type="text" name="scientificQualification" placeholder="اكتب اسم ونوع المؤهل" className="form-input" value={formData.scientificQualification} onChange={handleInputChange} required disabled={isSuspended} />
            </div>
            <div className="form-group">
              <label>رفع الشهادات العملية</label>
              <div className="file-upload-wrapper">
                <input type="file" id="certificate-upload" className="file-input-hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" disabled={isSuspended} />
                <label htmlFor="certificate-upload" className={`file-upload-label form-input ${isSuspended ? 'disabled' : ''}`}>
                  <span className="placeholder-text">{file ? file.name : 'ارفع شهادات الداعية (PDF/JPG)'}</span>
                  <Upload size={18} className="upload-icon" />
                </label>
              </div>
            </div>

            {/* البريد واللغات */}
            <div className="form-group">
              <label>البريد الالكتروني</label>
              <input type="email" name="email" placeholder="البريد الالكتروني" className="form-input" value={formData.email} onChange={handleInputChange} required disabled={isSuspended} />
            </div>
            <div className="form-group relative" ref={dropdownRef}>
              <label>اللغة</label>
              <div 
                className={`tags-input-container form-input ${isSuspended ? 'disabled' : ''}`} 
                onClick={() => !isSuspended && setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                style={{ cursor: isSuspended ? 'not-allowed' : 'pointer', minHeight: '48px', height: 'auto' }}
              >
                <div className="tags-wrapper">
                  {selectedLangs.length === 0 && <span className="placeholder-text">اختر اللغات...</span>}
                  {selectedLangs.map((langId) => {
                    const lang = availableLangs.find(l => l.id === langId);
                    return (
                      <span key={langId} className="tag" onClick={(e) => e.stopPropagation()}>
                        {lang?.name}
                        {!isSuspended && (
                          <button type="button" className="tag-remove" onClick={(e) => {
                            e.stopPropagation();
                            toggleLanguage(langId);
                          }}>
                            <X size={14} />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                {!isSuspended && (
                  <button type="button" className="tag-dropdown-btn" style={{ marginLeft: '4px' }}>
                    <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isLanguageDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>
                )}
              </div>

              {isLanguageDropdownOpen && !isSuspended && (
                <div className="language-dropdown-menu">
                  {availableLangs.map((lang) => {
                    const isSelected = selectedLangs.includes(lang.id);
                    return (
                      <div key={lang.id} className="language-dropdown-item" onClick={() => toggleLanguage(lang.id)}>
                        <div className={`checkbox-custom check-align-left ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <Check size={12} strokeWidth={4} color="white" />}
                        </div>
                        <span>{lang.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* كلمة السر */}
            <div className="form-group">
              <label>كلمة السر</label>
              <div className="password-input-wrapper">
                <input type="password" name="password" placeholder="كلمة السر" className="form-input password-input" value={formData.password} onChange={handleInputChange} required disabled={isSuspended} />
              </div>
            </div>
            <div className="form-group">
              <label>تأكيد كلمة السر</label>
              <div className="password-input-wrapper">
                <input type="password" name="confirmPassword" placeholder="تأكيد كلمة السر" className="form-input password-input" value={formData.confirmPassword} onChange={handleInputChange} required disabled={isSuspended} />
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className={`btn-save ${isSuspended ? 'disabled-btn' : ''}`} disabled={loading || isSuspended}>
              {loading ? <Loader2 size={18} className="spin-icon" /> : 'حفظ البيانات'}
            </button>
          </div>
        </form>
      </div>

      <SuccessModal
        isOpen={showModal}
        onClose={() => {
            setShowModal(false);
            navigate('/callers');
        }}
        title="تم إضافة الداعية بنجاح"
        description="تم تسجيل البيانات وإرسال إشعار للداعية"
      />
    </div>
  );
};

export default AddCaller;
