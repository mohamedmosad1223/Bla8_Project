import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, X, Eye, Check } from 'lucide-react';
import './AddCaller.css';

const AddCaller = () => {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<string[]>(['العربية', 'الانجليزية']);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const availableLanguages = ['العربية', 'الانجليزية', 'الفرنسية', 'الاسبانية', 'البرتغالية', 'الهندية'];

  const dropdownRef = useRef<HTMLDivElement>(null);

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
        <form className="add-caller-form">
          <div className="form-grid">
            
            {/* Row 1 */}
            <div className="form-group">
              <label>اسم الداعية بالكامل</label>
              <input type="text" placeholder="اسم الداعية بالكامل" className="form-input" />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input type="text" placeholder="رقم الهاتف" className="form-input" />
            </div>

            {/* Row 2 */}
            <div className="form-group">
              <label>المؤهل العلمي</label>
              <input type="text" placeholder="اكتب اسم ونوع المؤهل" className="form-input" />
            </div>
            <div className="form-group">
              <label>رفع الشهادات العملية</label>
              <div className="file-upload-wrapper">
                <input type="file" id="certificate-upload" className="file-input-hidden" />
                <label htmlFor="certificate-upload" className="file-upload-label form-input">
                  <span className="placeholder-text">ارفع شهاداتك</span>
                  <Upload size={18} className="upload-icon" />
                </label>
              </div>
            </div>

            {/* Row 3 */}
            <div className="form-group">
              <label>البريد الالكتروني</label>
              <input type="email" placeholder="البريد الالكتروني" className="form-input" />
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
                <input type="password" placeholder="كلمة السر" className="form-input password-input" />
                <button type="button" className="password-toggle-btn">
                  <Eye size={18} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>تأكيد كلمة السر</label>
              <div className="password-input-wrapper">
                <input type="password" placeholder="تأكيد كلمة السر" className="form-input password-input" />
                <button type="button" className="password-toggle-btn">
                  <Eye size={18} />
                </button>
              </div>
            </div>

          </div>

          <div className="form-footer">
            <button type="button" className="btn-save">
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCaller;
