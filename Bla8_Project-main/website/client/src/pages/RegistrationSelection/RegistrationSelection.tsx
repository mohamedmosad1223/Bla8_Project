import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import './RegistrationSelection.css';

const RegistrationSelection = () => {
  const [selectedRole, setSelectedRole] = useState<'muslim' | 'non-muslim' | null>(null);
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (selectedRole === 'muslim') {
      sessionStorage.setItem('registerRole', 'muslim_caller');
      navigate('/register?role=muslim_caller');
    } else if (selectedRole === 'non-muslim') {
      sessionStorage.setItem('registerRole', 'non_muslim');
      navigate('/language-selection');
    } else {
      navigate('/register');
    }
  };

  return (
    <AuthLayout>
      <div className="form-container">
        <div className="top-logo">
          <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
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
            غير مسلم يريد<br />التعرف علي الاسلام
          </button>

          <button
            className={`option-card ${selectedRole === 'muslim' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('muslim')}
          >
            مسلم يدعو الناس<br />الي الاسلام
          </button>
        </div>

        <button className="auth-btn primary-btn" onClick={handleConfirm}>
          تأكيد
        </button>

        {/* <div className="bottom-link" style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            <a href="/preacher-association-login" style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>الذهاب لصفحة تسجيل الدخول الدعاة و الجمعيات</a>
          </p>
        </div> */}
      </div>
    </AuthLayout>
  );
};

export default RegistrationSelection;
