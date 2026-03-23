import React, { useState } from 'react';
import { User, Mail, KeyRound, ChevronRight, Phone } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import { interestedPersonService } from '../../services/interestedPersonService';
import './Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = new URLSearchParams(location.search).get('role');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    // We map by passing name through standard HTML attributes.
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload = {
         full_name: formData.fullName,
         email: formData.email,
         phone: formData.phone,
         password: formData.password,
         password_confirm: formData.confirmPassword,
         // Default fields to satisfy backend if required
         nationality_country_id: 1,
         residence_country_id: 1,
         current_religion: 'Other',
         contact_method: 'phone'
      };

      await interestedPersonService.register(payload);
      
      // On success, redirect to login so they can login and open chat/requests
      navigate(role ? `/login?role=${role}` : '/login');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.response?.data?.detail || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
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

      <div className="register-container">
        <div className="form-container">
          <div className="header-text register-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>إنشاء حساب</h2>
            <p>من فضلك قم بملأ البيانات التالية لإنشاء حساب جديد</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            
            <Input 
              name="fullName"
              type="text" 
              placeholder="الاسم كامل" 
              icon={<User size={18} />}
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />

            <Input 
              name="email"
              type="email" 
              placeholder="البريد الالكتروني" 
              icon={<Mail size={18} />}
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            
            <Input 
              name="phone"
              type="tel" 
              placeholder="رقم الهاتف" 
              icon={<Phone size={18} />}
              value={formData.phone}
              onChange={handleInputChange}
              required
            />

            <Input 
              name="password"
              type="password" 
              placeholder="الباسورد" 
              icon={<KeyRound size={18} />}
              value={formData.password}
              onChange={handleInputChange}
              required
            />

            <Input 
              name="confirmPassword"
              type="password" 
              placeholder="تأكيد الباسورد" 
              icon={<KeyRound size={18} />}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />

            <button type="submit" className="auth-btn primary-btn register-btn" disabled={loading}>
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
            </button>
          </form>

          <p className="bottom-link">
            لديك حساب بالفعل؟ <Link to={role ? `/login?role=${role}` : '/login'}>تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
