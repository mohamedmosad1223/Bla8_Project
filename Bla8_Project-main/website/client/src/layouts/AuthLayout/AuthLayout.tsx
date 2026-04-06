import React, { useState, useEffect } from 'react';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  showIntro?: boolean; // تشغيل الانيميشن فقط في الصفحات المحددة
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, showIntro = false }) => {
  const [phase, setPhase] = useState<'intro' | 'moving' | 'reveal' | 'done'>(
    showIntro ? 'intro' : 'done'
  );

  useEffect(() => {
    if (!showIntro) return;
    const t1 = setTimeout(() => setPhase('moving'), 1600);
    const t2 = setTimeout(() => setPhase('reveal'), 2300);
    const t3 = setTimeout(() => setPhase('done'), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [showIntro]);

  return (
    <div className="split-layout" dir="rtl">

      {/* ── الأوفرلي الأبيض مع اللوجو في المنتصف ── */}
      {showIntro && phase !== 'done' && (
        <div className={`auth-overlay ${phase}`}>
          <img
            src="/bla8_logo.png"
            alt="Balagh Logo"
            className={`overlay-logo ${phase}`}
          />
        </div>
      )}

      {/* ── RIGHT: Blue panel ── */}
      <div className={`side-panel ${phase === 'reveal' || phase === 'done' ? 'panel-visible' : 'panel-hidden'}`}>
        <div className="wave-bg"></div>
        <div className={`side-content ${phase === 'done' ? 'content-visible' : 'content-hidden'}`}>
          <h1 className="welcome-text">أهلا بك في</h1>
          <div className="logo-container-white">
            <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-white" />
          </div>
        </div>
      </div>

      {/* ── LEFT: White form panel ── */}
      <div className={`main-panel ${phase === 'reveal' || phase === 'done' ? 'main-visible' : 'main-hidden'}`}>
        {children}
      </div>

    </div>
  );
};

export default AuthLayout;
