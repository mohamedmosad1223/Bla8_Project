import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Phone, Mail, Lock, Upload, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import { preacherService } from '../../services/preacherService';
import './PreacherRegister.css';

const PreacherRegister: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    nationalityId: '',
    qualificationName: '',
    phone: '',
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
      setError('يرجى إرفاق شهادة المؤهل');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = new FormData();
      payload.append('full_name', formData.fullName);
      payload.append('email', formData.email);
      payload.append('preacher_email', formData.email);
      payload.append('password', formData.password);
      payload.append('password_confirm', formData.confirmPassword);
      payload.append('phone', formData.phone);
      payload.append('scientific_qualification', formData.qualificationName);
      payload.append('nationality_country_id', formData.nationalityId);
      payload.append('qualification_file', file);

      // Default to volunteer preacher for now if not specified
      payload.append('type', 'volunteer');
      payload.append('gender', 'male');

      await preacherService.register(payload);
      setShowModal(true);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const errDetail = err.response?.data?.detail;
      if (Array.isArray(errDetail)) {
        // FastAPI validation errors
        setError(errDetail.map((e: any) => e.msg).join(' - '));
      } else if (typeof errDetail === 'string') {
        setError(errDetail);
      } else {
        setError('حدث خطأ أثناء إرسال الطلب');
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

      <div className="preacher-register-container">
        <div className="form-container preacher-form-container">
          <div className="header-text preacher-header">
            <Link to="/" className="top-logo">
              <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
              <p className="top-logo-text">للتعريف بالإسلام</p>
            </Link>
            <h2>طلب تسجيل داعية</h2>
            <p>من فضلك قم بملأ البيانات التالية</p>
          </div>

          <form className="preacher-form" onSubmit={handleSubmit}>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {/* Full Name */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="text" name="fullName" placeholder="الاسم بالكامل" value={formData.fullName} onChange={handleInputChange} required />
                <span className="preg-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span>
              </div>
            </div>

            {/* Nationality */}
            <div className="preg-group full-width">
              <div className="preg-input-icon preg-select-wrap">
                <select name="nationalityId" value={formData.nationalityId} onChange={handleInputChange} required>
                  <option value="" disabled>الجنسية</option>
                  <option value="1">مصري</option>
                  <option value="2">سعودي</option>
                  <option value="3">سوري</option>
                  <option value="4">أردني</option>
                </select>
                <span className="preg-icon"><ChevronDown size={18} /></span>
              </div>
            </div>

            {/* Qualification Name + Upload */}
            <div className="preg-group half-width">
              <div className="preg-input-icon">
                <input type="text" name="qualificationName" placeholder="اكتب اسم ونوع المؤهل" value={formData.qualificationName} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="preg-group half-width">
              <div className="preg-input-icon preg-file-wrap">
                <input type="file" id="cert-upload" className="preg-file-input" onChange={handleFileChange} required />
                <label htmlFor="cert-upload" className="preg-file-label">
                  {file ? file.name : 'ارفع شهاداتك'}
                </label>
                <span className="preg-icon"><Upload size={18} /></span>
              </div>
            </div>

            {/* Phone */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="tel" name="phone" placeholder="رقم الهاتف" value={formData.phone} onChange={handleInputChange} required />
                <span className="preg-icon"><Phone size={18} /></span>
              </div>
            </div>

            {/* Email */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input type="email" name="email" placeholder="البريد الالكتروني" value={formData.email} onChange={handleInputChange} required />
                <span className="preg-icon"><Mail size={18} /></span>
              </div>
            </div>

            {/* Password */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="الباسورد"
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
                <span className="preg-icon"><Lock size={18} /></span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="preg-group full-width">
              <div className="preg-input-icon">
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
                <span className="preg-icon"><Lock size={18} /></span>
              </div>
            </div>

            <button type="submit" className="auth-btn primary-btn full-width" disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'ارسال الطلب'}
            </button>
          </form>

          <p className="bottom-link">
            تمتلك حساب بالفعل ؟ <a href="/login?role=preacher">تسجيل الدخول</a>
          </p>
        </div>
      </div>
      <SuccessModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          navigate('/login?role=preacher');
        }}
        title="تم ارسال الطلب بنجاح"
        description="سيتم الرد عليك قريبا. يمكنك الآن تسجيل الدخول لمتابعة حالة طلبك."
      />
    </AuthLayout>
  );
};

export default PreacherRegister;
