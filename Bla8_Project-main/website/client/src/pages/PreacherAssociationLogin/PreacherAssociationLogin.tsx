import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import './PreacherAssociationLogin.css';

// Import icons from assets
import preacherIcon from '../../assets/muslim 2.png';
import associationIcon from '../../assets/mosque 1.png';
import adminIcon from '../../assets/admin 1.png';
import awqafIcon from '../../assets/awqaf_manager.png';

const PreacherAssociationLogin: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    if (role === 'admin') {
      navigate('/login?role=admin');
    } else if (role === 'preacher') {
      navigate('/login?role=preacher');
    } else if (role === 'minister') {
      navigate('/login?role=minister');
    } else {
      // organization
      navigate('/login?role=organization');
    }
  };

  return (
    <AuthLayout showIntro>
      <div className="pa-selection-container">
        <div className="form-container">
          <div className="header-text pa-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>
              من فضلك اختر <span className="highlight-text">نوع التسجيل</span>
            </h2>
            <p className="pa-subtitle">
              اختر نوع التسجيل ومن ثم ستذهب لصفحة تسجيل الدخول وتتمكن من المواصلة داخل السيستم
            </p>
          </div>

          <div className="pa-options-container">
            <button 
              className={`pa-option-card ${selectedRole === 'preacher' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('preacher')}
            >
               <div className="pa-option-icon">
                 <img src={preacherIcon} alt="Preacher" />
               </div>
               <span>داعية اسلامي</span>
            </button>

            <button 
              className={`pa-option-card ${selectedRole === 'organization' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('organization')}
            >
               <div className="pa-option-icon">
                  <img src={associationIcon} alt="Islamic Association" />
               </div>
               <span>جمعية اسلامية</span>
            </button>
            
            <button 
              className={`pa-option-card ${selectedRole === 'admin' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('admin')}
            >
               <div className="pa-option-icon">
                  <img src={adminIcon} alt="Admin" />
               </div>
               <span>الأدمن</span>
            </button>

            <button 
              className={`pa-option-card ${selectedRole === 'minister' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('minister')}
            >
               <div className="pa-option-icon">
                  <img src={awqafIcon} alt="Awqaf Manager" />
               </div>
               <span>مدير الأوقاف</span>
            </button>
          </div>

        </div>
      </div>
    </AuthLayout>
  );
};

export default PreacherAssociationLogin;
