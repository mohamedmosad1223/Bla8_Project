import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, X, Eye, Check, AlertCircle, Loader2 } from 'lucide-react';
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
    }
    if (isLanguageDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLanguageDropdownOpen]);

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
              <input type="text" name="fullName" placeholder="اسم الداعية بالكامل" className="form-input" value={formData.fullName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input type="text" name="phone" placeholder="رقم الهاتف" className="form-input" value={formData.phone} onChange={handleInputChange} required />
            </div>

            {/* النوع - Gender */}
            <div className="form-group">
              <label>النوع</label>
              <select 
                name="gender" 
                className="form-input" 
                value={formData.gender} 
                onChange={(e) => setFormData(prev => ({...prev, gender: e.target.value}))}
                required
                style={{ appearance: 'auto', paddingRight: '10px' }}
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

            {/* الجنسية */}
            <div className="form-group">
              <label>الجنسية</label>
              <select 
                name="nationalityCountryId"
                className="form-input" 
                value={formData.nationalityCountryId} 
                onChange={(e) => setFormData(prev => ({...prev, nationalityCountryId: parseInt(e.target.value)}))}
                required 
                style={{ appearance: 'auto', paddingRight: '10px' }}
              >
                {availableCountries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* المؤهل العلمي والملف */}
            <div className="form-group">
              <label>المؤهل العلمي</label>
              <input type="text" name="scientificQualification" placeholder="اكتب اسم ونوع المؤهل" className="form-input" value={formData.scientificQualification} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>رفع الشهادات العملية</label>
              <div className="file-upload-wrapper">
                <input type="file" id="certificate-upload" className="file-input-hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                <label htmlFor="certificate-upload" className="file-upload-label form-input">
                  <span className="placeholder-text">{file ? file.name : 'ارفع شهادات الداعية (PDF/JPG)'}</span>
                  <Upload size={18} className="upload-icon" />
                </label>
              </div>
            </div>

            {/* البريد واللغات */}
            <div className="form-group">
              <label>البريد الالكتروني</label>
              <input type="email" name="email" placeholder="البريد الالكتروني" className="form-input" value={formData.email} onChange={handleInputChange} required />
            </div>
            <div className="form-group relative" ref={dropdownRef}>
              <label>اللغة</label>
              <div 
                className="tags-input-container form-input" 
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                style={{ cursor: 'pointer', minHeight: '42px', height: 'auto' }}
              >
                <div className="tags-wrapper">
                  {selectedLangs.length === 0 && <span className="placeholder-text">اختر اللغات...</span>}
                  {selectedLangs.map((langId) => {
                    const lang = availableLangs.find(l => l.id === langId);
                    return (
                      <span key={langId} className="tag" onClick={(e) => e.stopPropagation()}>
                        {lang?.name}
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
                <button type="button" className="tag-dropdown-btn">
                  <ChevronRight size={16} className={`transition-transform ${isLanguageDropdownOpen ? 'rotate-[-90deg]' : 'rotate-90deg'}`} />
                </button>
              </div>

              {isLanguageDropdownOpen && (
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
                <input type="password" name="password" placeholder="كلمة السر" className="form-input password-input" value={formData.password} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>تأكيد كلمة السر</label>
              <div className="password-input-wrapper">
                <input type="password" name="confirmPassword" placeholder="تأكيد كلمة السر" className="form-input password-input" value={formData.confirmPassword} onChange={handleInputChange} required />
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className="btn-save" disabled={loading}>
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
