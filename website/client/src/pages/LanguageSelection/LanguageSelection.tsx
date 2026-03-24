import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { profileService } from '../../services/profileService';
import './LanguageSelection.css';

// Featured languages always shown at the top
const FEATURED_CODES = ['ar', 'en', 'fr'];

// Fallback list in case API is unreachable
const FALLBACK_LANGUAGES = [
  { id: null, code: 'ar', name: 'العربية', subtitle: 'ابدأ الآن' },
  { id: null, code: 'en', name: 'English', subtitle: 'Start Now' },
  { id: null, code: 'fr', name: 'Français', subtitle: 'Commencer' },
  { id: null, code: 'de', name: 'Deutsch', subtitle: 'Jetzt starten' },
  { id: null, code: 'es', name: 'Español', subtitle: 'Empezar ahora' },
  { id: null, code: 'ur', name: 'اردو', subtitle: 'شروع کریں' },
];

interface Language {
  id: number | null;
  code: string;
  name: string;
  subtitle?: string;
}

const LanguageSelection = () => {
  const [allLanguages, setAllLanguages] = useState<Language[]>(FALLBACK_LANGUAGES);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [extraFeaturedCodes, setExtraFeaturedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const data = await profileService.getLanguages();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Language[] = data
            .filter((lang: { is_active?: boolean }) => lang.is_active !== false)
            .map((lang: { language_id: number; language_name: string; language_code: string }) => ({
              id: lang.language_id,
              code: lang.language_code,
              name: lang.language_name,
            }));
          setAllLanguages(mapped);
        }
      } catch (err) {
        console.warn('Failed to fetch languages from API, using fallback.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  // Featured = default 3 + any language the user picked from search
  const allFeaturedCodes = [...FEATURED_CODES, ...extraFeaturedCodes];
  const featuredLanguages = allLanguages.filter((l) => allFeaturedCodes.includes(l.code));

  // Search results = rest of languages (excluding already-featured) filtered by query
  const searchResults = searchQuery.trim()
    ? allLanguages.filter(
        (l) =>
          !allFeaturedCodes.includes(l.code) &&
          l.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelect = (code: string, fromSearch = false) => {
    setSelectedCode(code);
    if (fromSearch && !allFeaturedCodes.includes(code)) {
      setExtraFeaturedCodes((prev) => [...prev, code]);
    }
    setSearchQuery('');
  };

  const handleSave = () => {
    if (selectedCode) {
      const selected = allLanguages.find((l) => l.code === selectedCode);
      localStorage.setItem('appLanguage', selectedCode);
      if (selected?.id) {
        localStorage.setItem('appLanguageId', String(selected.id));
      }
      navigate('/how-to-start');
    }
  };

  const handleSkip = () => navigate('/how-to-start');

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

        {loading ? (
          <div className="language-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="language-card skeleton-card" />
            ))}
          </div>
        ) : (
          <>
            {/* Featured Languages */}
            <div className="language-list">
              {featuredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  className={`language-card ${selectedCode === lang.code ? 'selected' : ''}`}
                  onClick={() => handleSelect(lang.code)}
                >
                  <span className="lang-code">{lang.code.toUpperCase().slice(0, 2)}</span>
                  <div className="lang-info">
                    <span className="lang-name">{lang.name}</span>
                    {lang.subtitle && <span className="lang-subtitle">{lang.subtitle}</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="lang-search-wrapper">
              <svg className="lang-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="lang-search-input"
                placeholder="Search other languages... / ابحث عن لغة أخرى"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedCode(null); }}
                dir="auto"
              />
              {searchQuery && (
                <button className="lang-search-clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="language-list search-results-list">
                {searchResults.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-card ${selectedCode === lang.code ? 'selected' : ''}`}
                    onClick={() => handleSelect(lang.code, true)}
                  >
                    <span className="lang-code">{lang.code.toUpperCase().slice(0, 2)}</span>
                    <div className="lang-info">
                      <span className="lang-name">{lang.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <p className="lang-no-results">لا توجد نتائج / No results found</p>
            )}
          </>
        )}

        <div className="action-buttons">
          <button
            className="auth-btn primary-btn save-btn"
            onClick={handleSave}
            disabled={!selectedCode || loading}
          >
            حفظ/ Save
          </button>
          <button className="skip-btn" onClick={handleSkip}>
            تخطي/ Skip
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LanguageSelection;
