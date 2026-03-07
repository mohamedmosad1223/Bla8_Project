import React from 'react';
import { ChevronRight, ChevronDown, Phone, Mail, Lock, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import './PreacherRegister.css';

const PreacherRegister: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <AuthLayout>
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        عودة <ChevronRight size={18} />
      </button>

      <div className="preacher-register-container">
        <div className="form-container preacher-form-container">
          <div className="header-text preacher-header">
            <div className="top-logo">
              <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
              <p className="top-logo-text">للتعريف بالإسلام</p>
            </div>
            <h2>طلب تسجيل داعية</h2>
            <p>من فضلك قم بملأ البيانات التالية</p>
          </div>

          <form className="preacher-form" onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="text" placeholder="الاسم بالكامل" required />
                <span className="preg-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
              </div>
            </div>

            {/* Nationality */}
            <div className="preg-group full-width">
              <div className="preg-input-icon preg-select-wrap">
                <select required defaultValue="">
                  <option value="" disabled>الجنسية</option>
                  <option value="eg">مصري</option>
                  <option value="sa">سعودي</option>
                  <option value="sy">سوري</option>
                  <option value="jo">أردني</option>
                </select>
                <span className="preg-icon"><ChevronDown size={18} /></span>
              </div>
            </div>

            {/* Qualification Name + Upload */}
            <div className="preg-group half-width">
              <div className="preg-input-icon">
                <input type="text" placeholder="اكتب اسم ونوع المؤهل" required />
              </div>
            </div>
            <div className="preg-group half-width">
              <div className="preg-input-icon preg-file-wrap">
                <input type="file" id="cert-upload" className="preg-file-input" />
                <label htmlFor="cert-upload" className="preg-file-label">ارفع شهاداتك</label>
                <span className="preg-icon"><Upload size={18} /></span>
              </div>
            </div>

            {/* Phone */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="tel" placeholder="رقم الهاتف" required />
                <span className="preg-icon"><Phone size={18} /></span>
              </div>
            </div>

            {/* Email */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="email" placeholder="البريد الالكتروني" required />
                <span className="preg-icon"><Mail size={18} /></span>
              </div>
            </div>

            {/* Password */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="password" placeholder="الباسورد" required />
                <span className="preg-icon"><Lock size={18} /></span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="password" placeholder="تأكيد الباسورد" required />
                <span className="preg-icon"><Lock size={18} /></span>
              </div>
            </div>

            <button type="submit" className="auth-btn primary-btn full-width">
              ارسال الطلب
            </button>
          </form>

          <p className="bottom-link">
            تمتلك حساب بالفعل ؟ <a href="/login">تسجيل الدخول</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PreacherRegister;
