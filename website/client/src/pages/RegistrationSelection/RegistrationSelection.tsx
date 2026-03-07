import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import './RegistrationSelection.css';

const RegistrationSelection = () => {
  const [selectedRole, setSelectedRole] = useState<'muslim' | 'non-muslim' | null>(null);
  const navigate = useNavigate();

  const handleConfirm = () => {
    // Navigate to login regardless of role for now, as per standard flow
    navigate('/login');
  };

  return (
    <AuthLayout>
      <div className="form-container">
        <div className="top-logo">
           <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
           <p className="top-logo-text">للتعريف بالإسلام</p>
        </div>

        <div className="header-text">
          <h2>من فضلك اختر <span className="highlight-gold">نوع التسجيل</span></h2>
          <p>اختر نوع التسجيل ومن ثم سنذهب لصفحة تسجيل الدخول</p>
        </div>

        <div className="options-container">
          <button 
            className={`option-card ${selectedRole === 'non-muslim' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('non-muslim')}
          >
            غير مسلم يريد<br/>التعرف علي الاسلام
          </button>
          
          <button 
            className={`option-card ${selectedRole === 'muslim' ? 'selected' : selectedRole === null ? 'default-selected' : ''}`}
            onClick={() => setSelectedRole('muslim')}
          >
            مسلم يدعو الناس<br/>الي الاسلام
          </button>
        </div>

        <button className="auth-btn primary-btn" onClick={handleConfirm}>
          تأكيد
        </button>

        <p className="bottom-link">
          الذهاب لصفحة تسجيل الدخول الدعاة و الجمعيات؟ <a href="/login">تسجيل الدخول</a>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegistrationSelection;
