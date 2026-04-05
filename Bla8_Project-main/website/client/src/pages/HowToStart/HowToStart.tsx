import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { useLanguage } from '../../i18n';
import './HowToStart.css';

const HowToStart = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  return (
    <AuthLayout>
      <div className="how-to-start-container" dir={dir}>
        
        <div className="top-logo">
           <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
        </div>

        <div className="header-text text-center">
          <h2>{t('howToStart.title')} <span className="highlight-gold">{t('howToStart.titleHighlight')}</span></h2>
          <p className="subtitle-arabic">{t('howToStart.subtitle')}</p>
        </div>

        <div className="options-list">
          
          <button 
            className="option-card-start primary-card"
            onClick={() => {
              localStorage.setItem('userRole', 'non_muslim');
              navigate('/guest/chat');
            }}
          >
            <div className="card-right">
              <div className="icon-wrapper gold-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                  <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
                </svg>
              </div>
              <div className="card-info">
                <span className="card-title">{t('howToStart.startChat')}</span>
                <span className="card-subtitle">{t('howToStart.startChatSub')}</span>
              </div>
            </div>
            <div className="card-left">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'ltr' ? 'rotate(180deg)' : 'none' }}>
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
          </button>
          
          <button 
            className="option-card-start secondary-card"
            onClick={() => navigate('/register?role=non_muslim')}
          >
            <div className="card-right">
              <div className="icon-wrapper light-gold-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="card-info">
                <span className="card-title">{t('howToStart.createAccount')}</span>
                <span className="card-subtitle">{t('howToStart.createAccountSub')}</span>
              </div>
            </div>
            <div className="card-left">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'ltr' ? 'rotate(180deg)' : 'none' }}>
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
          </button>

          <button 
            className="option-card-start secondary-card"
            onClick={() => {
              localStorage.setItem('userRole', 'non_muslim');
              navigate('/guest/library');
            }}
          >
            <div className="card-right">
              <div className="icon-wrapper light-blue-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
                </svg>
              </div>
              <div className="card-info">
                <span className="card-title">{t('howToStart.library')}</span>
                <span className="card-subtitle">{t('howToStart.librarySub')}</span>
              </div>
            </div>
            <div className="card-left">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'ltr' ? 'rotate(180deg)' : 'none' }}>
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
          </button>

        </div>
      </div>
    </AuthLayout>
  );
};

export default HowToStart;
