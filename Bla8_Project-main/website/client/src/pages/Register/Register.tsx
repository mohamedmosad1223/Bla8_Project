import React, { useState, useEffect } from 'react';
import { User, Mail, KeyRound, ChevronRight, Phone } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import { interestedPersonService } from '../../services/interestedPersonService';
import { muslimCallerService } from '../../services/muslimCallerService';
import './Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || sessionStorage.getItem('registerRole');

  useEffect(() => {
    console.log("Register Page loaded with role:", role, "| URL param:", searchParams.get('role'), "| storage:", sessionStorage.getItem('registerRole'));
  }, [role]);

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

    // Client-side password validation
    if (!/[A-Z]/.test(formData.password)) {
      setError('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (role === 'muslim_caller') {
        const muslimPayload = {
          email: formData.email,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          full_name: formData.fullName,
          phone: formData.phone || null,
          gender: 'male'
        };
        await muslimCallerService.register(muslimPayload);
      } else {
        const payload = {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          nationality_country_id: 1,
          residence_country_id: 1,
          current_religion: 'Other',
          contact_method: 'phone'
        };
        await interestedPersonService.register(payload);
      }

      // On success, redirect to login
      navigate(role ? `/login?role=${role}` : '/login');
    } catch (err: any) {
      console.error('Registration Error:', err.response?.data || err);
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // Extract msg from pydantic validation errors
          setError(detail.map((d: any) => d.msg?.replace('Value error, ', '') || d.msg).join('\n'));
        } else {
          setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
        }
      } else if (err.code === 'ERR_NETWORK') {
        setError('تعذر الاتصال بالسيرفر. تأكد من تشغيل الـ Backend على Port 8000');
      } else {
        setError('حدث خطأ أثناء التسجيل');
      }
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
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px', whiteSpace: 'pre-line' }}>
                {error}
              </div>
            )}

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
            />

            <Input
              name="password"
              type="password"
              placeholder="الباسورد (حرف كبير + رقم)"
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
