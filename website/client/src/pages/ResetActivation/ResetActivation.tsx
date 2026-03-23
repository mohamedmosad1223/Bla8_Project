import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import OTPInput from '../../components/common/OTPInput/OTPInput';
import './ResetActivation.css';

const ResetActivation: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = (code: string) => {
    console.log("Reset OTP Entered:", code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/reset-password');
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

      <div className="reset-activation-container">
        <div className="form-container">
          <div className="header-text reset-activation-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>استرجاع الرقم السري</h2>
            <p>من فضلك ادخل كود التأكيد المرسل إلي بريدك الالكتروني لتحويلك لصفحة استرجاع كلمة السر</p>
          </div>

          <form className="reset-activation-form" onSubmit={handleSubmit}>
            <div className="otp-wrapper">
              <OTPInput length={4} onComplete={handleComplete} />
            </div>

            <button type="submit" className="auth-btn primary-btn activation-btn">
              تأكيد
            </button>
          </form>

          <p className="bottom-link">
            لم يصلك الكود؟ <a href="#">إعادة إرسال الكود</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetActivation;
