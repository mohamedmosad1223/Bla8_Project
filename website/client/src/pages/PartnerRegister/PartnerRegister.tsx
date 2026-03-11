import React, { useState } from 'react';
import { Upload, Calendar, ChevronDown, Phone, Mail, Building2, FileText, ChevronRight } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import './PartnerRegister.css';

const PartnerRegister: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const roleType = searchParams.get('type') || 'association'; 
  
  // Decide titles based on role
  const isPreacher = roleType === 'preacher';
  const pageTitle = isPreacher ? 'طلب تسجيل بمنصة بلاغ كداعية' : 'طلب تسجيل بمنصة بلاغ كجمعية';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  return (
    <AuthLayout>
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        عودة <ChevronRight size={18} />
      </button>

      <div className="partner-register-container">
        <div className="form-container partner-form-container">
          <div className="header-text partner-header">
            <div className="top-logo">
              <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
              <p className="top-logo-text">للتعريف بالإسلام</p>
            </div>
            <h2>{pageTitle}</h2>
            <p>من فضلك قم بملأ البيانات التالية</p>
          </div>

          <form className="partner-form" onSubmit={handleSubmit}>
            
            {/* Row 1 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="text" placeholder={isPreacher ? 'اسم الجمعية' : 'اسم الجمعية'} required />
                <span className="icon-wrapper"><Building2 size={18} /></span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="form-group half-width">
              <div className="input-with-icon">
                <input type="text" placeholder="رقم الترخيص" required />
                <span className="icon-wrapper"><FileText size={18} /></span>
              </div>
            </div>
            <div className="form-group half-width">
              <div className="input-with-icon file-upload-wrapper">
                <input type="file" id="license-upload" className="file-input" />
                <label htmlFor="license-upload" className="file-label">إرفاق رخصة الجمعية</label>
                <span className="icon-wrapper"><Upload size={18} /></span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="text" placeholder="تاريخ انشاء الجمعية" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => {if(!e.target.value) e.target.type = 'text'}} required />
                <span className="icon-wrapper"><Calendar size={18} /></span>
              </div>
            </div>

            {/* Row 4 */}
            <div className="form-group half-width">
              <div className="input-with-icon select-wrapper">
                <select required defaultValue="">
                  <option value="" disabled>الدولة</option>
                  <option value="eg">مصر</option>
                  <option value="sa">السعودية</option>
                </select>
                <span className="icon-wrapper"><ChevronDown size={18} /></span>
              </div>
            </div>
            <div className="form-group half-width">
              <div className="input-with-icon select-wrapper">
                <select required defaultValue="">
                  <option value="" disabled>المحافظة</option>
                  <option value="cairo">القاهرة</option>
                  <option value="giza">الجيزة</option>
                </select>
                <span className="icon-wrapper"><ChevronDown size={18} /></span>
              </div>
            </div>

            {/* Row 5 */}
            <div className="form-group half-width">
              <input type="text" className="input-default" placeholder="اسم مدير الجمعية" required />
            </div>
            <div className="form-group half-width">
              <input type="tel" className="input-default" placeholder="رقم الجوال" required />
            </div>

            {/* Row 6 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="tel" placeholder="رقم الهاتف" required />
                <span className="icon-wrapper"><Phone size={18} /></span>
              </div>
            </div>

            {/* Row 7 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="email" placeholder="البريد الالكتروني" required />
                <span className="icon-wrapper"><Mail size={18} /></span>
              </div>
            </div>

            <button type="submit" className="auth-btn primary-btn submit-partner-btn full-width">
              ارسال الطلب
            </button>
          </form>

          <p className="bottom-link">
            تمتلك حساب بالفعل ؟ <a href="/login?role=association">تسجيل الدخول</a>
          </p>
        </div>
      </div>
      <SuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="تم ارسال الطلب بنجاح"
        description="سيتم الرد عليك قريبا"
      />
    </AuthLayout>
  );
};

export default PartnerRegister;
