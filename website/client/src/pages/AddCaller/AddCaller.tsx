import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, X, Eye, Check } from 'lucide-react';
import { muslimCallerService } from '../../services/muslimCallerService';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import './AddCaller.css';

const AddCaller = () => {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<string[]>(['العربية', 'الانجليزية']);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const availableLanguages = ['العربية', 'الانجليزية', 'الفرنسية', 'الاسبانية', 'البرتغالية', 'الهندية'];

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    scientificQualification: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const removeLanguage = (langToRemove: string) => {
    setLanguages(languages.filter(lang => lang !== langToRemove));
  };
  
  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      removeLanguage(lang);
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload = new FormData();
      payload.append('full_name', formData.fullName);
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('password_confirm', formData.confirmPassword);
      payload.append('phone', formData.phone);
      if (formData.scientificQualification) {
        payload.append('scientific_qualification', formData.scientificQualification);
      }
      
      // Send languages as JSON or map to IDs based on backend lookup. 
      // For now, joining them as a comma separated list or picking IDs (assuming IDs aren't mapped in UI)
      payload.append('languages', languages.join(', '));
      
      // Default to dummy nationalities if not provided in UI to satisfy Backend constraints temporarily
      payload.append('nationality_country_id', '1');
      payload.append('residence_country_id', '1');

      if (file) {
        payload.append('qualification_file', file);
      }
      
      await muslimCallerService.register(payload);
      setShowModal(true);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.response?.data?.detail || 'حدث خطأ أثناء الإضافة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="callers-page">
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
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
          
          <div className="form-grid">
            
            {/* Row 1 */}
            <div className="form-group">
              <label>اسم الداعية بالكامل</label>
              <input type="text" name="fullName" placeholder="اسم الداعية بالكامل" className="form-input" value={formData.fullName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input type="text" name="phone" placeholder="رقم الهاتف" className="form-input" value={formData.phone} onChange={handleInputChange} required />
            </div>

            {/* Row 2 */}
            <div className="form-group">
              <label>المؤهل العلمي</label>
              <input type="text" name="scientificQualification" placeholder="اكتب اسم ونوع المؤهل" className="form-input" value={formData.scientificQualification} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>رفع الشهادات العملية</label>
              <div className="file-upload-wrapper">
                <input type="file" id="certificate-upload" className="file-input-hidden" onChange={handleFileChange} />
                <label htmlFor="certificate-upload" className="file-upload-label form-input">
                  <span className="placeholder-text">{file ? file.name : 'ارفع شهاداتك'}</span>
                  <Upload size={18} className="upload-icon" />
                </label>
              </div>
            </div>

            {/* Row 3 */}
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
                  {languages.length === 0 && <span className="placeholder-text text-gray" style={{fontSize: '0.9rem', color: '#9CA3AF'}}>اختر اللغات...</span>}
                  {languages.map((lang, index) => (
                    <span key={index} className="tag" onClick={(e) => e.stopPropagation()}>
                      {lang}
                      <button type="button" className="tag-remove" onClick={(e) => {
                        e.stopPropagation();
                        removeLanguage(lang);
                      }}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <button type="button" className="tag-dropdown-btn">
                  <ChevronRight size={16} className={`transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-[-90deg]' : 'rotate-90deg'}`} style={{ transform: isLanguageDropdownOpen ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
                </button>
              </div>

              {/* Language Dropdown */}
              {isLanguageDropdownOpen && (
                <div className="language-dropdown-menu">
                  {availableLanguages.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <div 
                        key={lang} 
                        className="language-dropdown-item"
                        onClick={() => toggleLanguage(lang)}
                      >
                        <div className={`checkbox-custom check-align-left ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <Check size={12} strokeWidth={4} />}
                        </div>
                        <span>{lang}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Row 4 */}
            <div className="form-group">
              <label>كلمة السر</label>
              <div className="password-input-wrapper">
                <input type="password" name="password" placeholder="كلمة السر" className="form-input password-input" value={formData.password} onChange={handleInputChange} required />
                <button type="button" className="password-toggle-btn">
                  <Eye size={18} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>تأكيد كلمة السر</label>
              <div className="password-input-wrapper">
                <input type="password" name="confirmPassword" placeholder="تأكيد كلمة السر" className="form-input password-input" value={formData.confirmPassword} onChange={handleInputChange} required />
                <button type="button" className="password-toggle-btn">
                  <Eye size={18} />
                </button>
              </div>
            </div>

          </div>

          <div className="form-footer">
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ'}
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
        description="والآن يمكنه استلام طلبات"
      />
    </div>
  );
};

export default AddCaller;
