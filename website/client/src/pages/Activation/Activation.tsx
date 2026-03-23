import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import OTPInput from '../../components/common/OTPInput/OTPInput';
import './Activation.css';

const Activation: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = (code: string) => {
    console.log("OTP Entered:", code);
    // Submit code here
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit the current OTP state
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

      <div className="activation-container">
        <div className="form-container">
          <div className="header-text activation-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>تأكيد البريد الالكتروني</h2>
            <p>لقد قمنا بإرسال كود تأكيد إلي بريدك الالكتروني الخاص بك</p>
          </div>

          <form className="activation-form" onSubmit={handleSubmit}>
            <div className="otp-wrapper">
              <OTPInput length={4} onComplete={handleComplete} />
            </div>

            <button type="submit" className="auth-btn primary-btn activation-btn">
              تأكيد التحقق
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

export default Activation;
