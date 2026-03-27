import React, { useState } from 'react';
import { Upload, Calendar, ChevronDown, Phone, Mail, Building2, FileText, ChevronRight, Lock, Eye, EyeOff } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import { orgService } from '../../services/orgService';
import './PartnerRegister.css';

const PartnerRegister: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const roleType = searchParams.get('type') || 'association'; 
  
  // Decide titles based on role
  const isPreacher = roleType === 'preacher';
  const pageTitle = isPreacher ? 'طلب تسجيل بمنصة بلاغ كداعية' : 'طلب تسجيل بمنصة بلاغ كجمعية';

  // Form State
  const [formData, setFormData] = useState({
    organizationName: '',
    licenseNumber: '',
    establishmentDate: '',
    countryId: '',
    governorate: '',
    managerName: '',
    phone: '', // Will map from input
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [file, setFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    if (!file) {
      setError('يرجى إرفاق رخصة الجمعية');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload = new FormData();
      payload.append('organization_name', formData.organizationName);
      payload.append('license_number', formData.licenseNumber);
      payload.append('establishment_date', formData.establishmentDate);
      payload.append('country_id', formData.countryId);
      payload.append('governorate', formData.governorate);
      payload.append('manager_name', formData.managerName);
      payload.append('phone', formData.phone);
      payload.append('email', formData.email);
      payload.append('org_email', formData.email);
      payload.append('password', formData.password);
      payload.append('password_confirm', formData.confirmPassword);
      payload.append('license_file', file);
      
      await orgService.register(payload);
      setShowModal(true);
    } catch (err: any) {
      console.error('Registration Error:', err.response?.data || err);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Extract messages from Pydantic validation errors
        const errorMsgs = detail.map((d: any) => d.msg).join(' - ');
        setError(errorMsgs);
      } else {
        setError(detail || 'حدث خطأ أثناء إرسال الطلب');
      }
    } finally {
      setLoading(false);
    }
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
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {/* Row 1 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="text" name="organizationName" placeholder={isPreacher ? 'اسم الجمعية' : 'اسم الجمعية'} value={formData.organizationName} onChange={handleInputChange} required />
                <span className="icon-wrapper"><Building2 size={18} /></span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="form-group half-width">
              <div className="input-with-icon">
                <input type="text" name="licenseNumber" placeholder="رقم الترخيص" value={formData.licenseNumber} onChange={handleInputChange} required />
                <span className="icon-wrapper"><FileText size={18} /></span>
              </div>
            </div>
            <div className="form-group half-width">
              <div className="input-with-icon file-upload-wrapper">
                <input type="file" id="license-upload" className="file-input" onChange={handleFileChange} required />
                <label htmlFor="license-upload" className="file-label">
                  {file ? file.name : 'إرفاق رخصة الجمعية'}
                </label>
                <span className="icon-wrapper"><Upload size={18} /></span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="text" name="establishmentDate" placeholder="تاريخ انشاء الجمعية" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => {if(!e.target.value) e.target.type = 'text'}} value={formData.establishmentDate} onChange={handleInputChange} required />
                <span className="icon-wrapper"><Calendar size={18} /></span>
              </div>
            </div>

            {/* Row 4 */}
            <div className="form-group half-width">
              <div className="input-with-icon select-wrapper">
                <select name="countryId" value={formData.countryId} onChange={handleInputChange} required>
                  <option value="" disabled>الدولة</option>
                  <option value="1">مصر</option>
                  <option value="2">السعودية</option>
                </select>
                <span className="icon-wrapper"><ChevronDown size={18} /></span>
              </div>
            </div>
            <div className="form-group half-width">
              <div className="input-with-icon select-wrapper">
                <select name="governorate" value={formData.governorate} onChange={handleInputChange} required>
                  <option value="" disabled>المحافظة</option>
                  <option value="cairo">القاهرة</option>
                  <option value="giza">الجيزة</option>
                  <option value="alexandria">الاسكندرية</option>
                </select>
                <span className="icon-wrapper"><ChevronDown size={18} /></span>
              </div>
            </div>

            {/* Row 5 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="text" className="input-default" name="managerName" placeholder="اسم مدير الجمعية" value={formData.managerName} onChange={handleInputChange} required />
                <span className="icon-wrapper"><FileText size={18} /></span>
              </div>
            </div>

            {/* Row 6 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="tel" name="phone" placeholder="رقم الهاتف أو الجوال" value={formData.phone} onChange={handleInputChange} required />
                <span className="icon-wrapper"><Phone size={18} /></span>
              </div>
            </div>

            {/* Row 7 */}
            <div className="form-group full-width">
              <div className="input-with-icon">
                <input type="email" name="email" placeholder="البريد الالكتروني" value={formData.email} onChange={handleInputChange} required />
                <span className="icon-wrapper"><Mail size={18} /></span>
              </div>
            </div>

            {/* Row 8 Password */}
             <div className="form-group half-width">
              <div className="input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="الباسورد (حرف كبير + رقم)"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="has-toggle"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <span className="icon-wrapper"><Lock size={18} /></span>
              </div>
            </div>
            <div className="form-group half-width">
              <div className="input-with-icon">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="تأكيد الباسورد"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="has-toggle"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <span className="icon-wrapper"><Lock size={18} /></span>
              </div>
            </div>

            <button type="submit" className="auth-btn primary-btn submit-partner-btn full-width" disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'ارسال الطلب'}
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
