import React from 'react';
import { Mail, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/reset-activation');
  };

  return (
    <AuthLayout>
      {/* Back Button positioned at top right */}
      <button 
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        عودة <ChevronRight size={18} />
      </button>

      <div className="forgot-container">
        <div className="form-container">
          <div className="header-text forgot-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>استرجاع الرقم السري</h2>
            <p>من فضلك ادخل البريد الخاص بك لتتمكن من استرجاع كلمة السر</p>
          </div>

          <form className="forgot-form" onSubmit={handleSubmit}>
            <Input 
              type="email" 
              placeholder="البريد الالكتروني" 
              icon={<Mail size={18} />}
              required
            />
            
            <button type="submit" className="auth-btn primary-btn submit-btn">
              تأكيد
            </button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
