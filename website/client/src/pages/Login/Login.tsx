import React from 'react';
import { Mail, KeyRound, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import Checkbox from '../../components/common/Checkbox/Checkbox';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="login-container">
        {/* Back Button positioned at top right */}
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          عودة <ChevronRight size={18} />
        </button>

        <div className="form-container">
          <div className="header-text login-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>تسجيل الدخول</h2>
            <p>من فضلك قم بملأ البيانات التالية</p>
          </div>

          <form className="login-form" onSubmit={(e) => e.preventDefault()}>
            <Input 
              type="email" 
              placeholder="البريد الالكتروني" 
              icon={<Mail size={18} />}
            />
            
            <Input 
              type="password" 
              placeholder="الباسورد" 
              icon={<KeyRound size={18} />}
            />

            <div className="form-options">
              <a href="#" className="forgot-password">نسيت الرقم السري ؟</a>
              <Checkbox label="تذكرني" />
            </div>

            <button type="submit" className="auth-btn primary-btn login-btn">
              تسجيل الدخول
            </button>
          </form>

          <p className="bottom-link">
            لا تمتلك حساب؟ <a href="#">ارسل طلب انشاء حساب</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
