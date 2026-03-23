import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import './LanguageSelection.css';

const languages = [
  { code: 'SA', name: 'العربية', subtitle: 'ابدأ الآن' },
  { code: 'US', name: 'English', subtitle: 'Start Now' },
  { code: 'FR', name: 'Français', subtitle: 'Commencer' },
  { code: 'DE', name: 'Deutsch', subtitle: 'Jetzt starten' },
  { code: 'ES', name: 'Español', subtitle: 'Empezar ahora' },
  { code: 'PK', name: 'اردو', subtitle: 'شروع کریں' },
];

const LanguageSelection = () => {
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSave = () => {
    if (selectedLang) {
      // In a real app we might save this to localStorage or context
      localStorage.setItem('appLanguage', selectedLang);
      navigate('/how-to-start');
    }
  };

  const handleSkip = () => {
    navigate('/how-to-start');
  };

  return (
    <AuthLayout>
      <div className="language-container">
        <div className="top-logo">
           <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
        </div>

        <div className="header-text text-center">
          <h2>اختر <span className="highlight-gold">لغة التطبيق</span></h2>
          <p className="subtitle-english">Select your language to use the app.</p>
        </div>

        <div className="language-list">
          {languages.map((lang) => (
            <button 
              key={lang.code}
              className={`language-card ${selectedLang === lang.code ? 'selected' : ''}`}
              onClick={() => setSelectedLang(lang.code)}
            >
              <span className="lang-code">{lang.code}</span>
              <div className="lang-info">
                <span className="lang-name">{lang.name}</span>
                <span className="lang-subtitle">{lang.subtitle}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="action-buttons">
          <button 
            className="auth-btn primary-btn save-btn" 
            onClick={handleSave}
            disabled={!selectedLang}
          >
            حفظ/ Save
          </button>
          
          <button 
            className="skip-btn" 
            onClick={handleSkip}
          >
            تخطي/ Skip
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LanguageSelection;
