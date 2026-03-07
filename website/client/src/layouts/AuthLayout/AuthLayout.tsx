import React from 'react';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="split-layout" dir="rtl">
      {/* Right Panel (Blue Side in Design) */}
      <div className="side-panel">
        <div className="wave-bg"></div>
        <div className="side-content">
          <h1 className="welcome-text">أهلا بك في</h1>
          
          <div className="logo-container-white">
            <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-white" />
          </div>
          
        </div>
      </div>

      {/* Left Panel (White Side in Design) */}
      <div className="main-panel">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
