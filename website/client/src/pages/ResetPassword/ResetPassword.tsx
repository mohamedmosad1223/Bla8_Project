import React, { useState } from 'react';
import { KeyRound, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful password reset
    setShowSuccess(true);
  };

  const handleModalClose = () => {
    setShowSuccess(false);
    navigate('/'); // Go back to the main route or login after success
  };

  return (
    <>
      <AuthLayout>
        {/* Back Button positioned at top right */}
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          عودة <ChevronRight size={18} />
        </button>

        <div className="reset-password-container">
          <div className="form-container">
            <div className="header-text reset-password-header">
              <div className="top-logo">
                 <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
              </div>
              <h2>انشاء كلمة سر جديدة</h2>
              <p>قم بانشا كلمة سر جديدة وقم بتأكيدها</p>
            </div>

            <form className="reset-password-form" onSubmit={handleSubmit}>
              <Input 
                type="password" 
                placeholder="كلمة سر جديدة" 
                icon={<KeyRound size={18} />}
                required
              />

              <Input 
                type="password" 
                placeholder="تأكيد كلمة سر جديدة" 
                icon={<KeyRound size={18} />}
                required
              />

              <button type="submit" className="auth-btn primary-btn reset-btn">
                تأكيد
              </button>
            </form>
          </div>
        </div>
      </AuthLayout>

      {/* Render the Success Modal overlaid on top of the whole page if successful */}
      <SuccessModal 
        isOpen={showSuccess} 
        onClose={handleModalClose} 
      />
    </>
  );
};

export default ResetPassword;
