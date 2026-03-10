import React from 'react';
import { User, Mail, KeyRound, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import './Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      {/* Back Button positioned at top right */}
      <button 
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        عودة <ChevronRight size={18} />
      </button>

      <div className="register-container">
        <div className="form-container">
          <div className="header-text register-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>إنشاء حساب</h2>
            <p>من فضلك قم بملأ البيانات التالية لإنشاء حساب جديد</p>
          </div>

          <form className="register-form" onSubmit={(e) => {
            e.preventDefault();
            navigate('/activate');
          }}>
            <Input 
              type="text" 
              placeholder="الاسم كامل" 
              icon={<User size={18} />}
            />

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

            <Input 
              type="password" 
              placeholder="تأكيد الباسورد" 
              icon={<KeyRound size={18} />}
            />

            <button type="submit" className="auth-btn primary-btn register-btn">
              إنشاء حساب
            </button>
          </form>

          <p className="bottom-link">
            لديك حساب بالفعل؟ <a href="/login">تسجيل الدخول</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
