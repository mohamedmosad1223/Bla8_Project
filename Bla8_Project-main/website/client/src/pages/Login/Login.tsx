import React, { useState } from 'react';
import { Mail, KeyRound, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import Checkbox from '../../components/common/Checkbox/Checkbox';
import { authService } from '../../services/authService';
import { useLanguage } from '../../i18n';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useLanguage();
  const role = new URLSearchParams(location.search).get('role');
  const isNonMuslim = role === 'non_muslim' || localStorage.getItem('appLanguage') !== null && localStorage.getItem('appLanguage') !== 'SA';
  const registerLink = role === 'preacher' ? '/preacher-register' : role === 'organization' ? '/partner-register' : role === 'non_muslim' ? '/register?role=non_muslim' : role === 'muslim_caller' ? '/register?role=muslim_caller' : '/register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear any stale role when login page loads
  React.useEffect(() => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(email, password, role);

      // Fetch full profile and save to localStorage
      await authService.getMe();
      localStorage.setItem('userRole', response.user.role);

      // Full reload so RoleDashboard reads fresh localStorage
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setError(isNonMuslim ? t('login.wrongCredentials') : (apiErr.response?.data?.detail || 'كلمة المرور أو البريد الإلكتروني غير صحيح'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)} dir={isNonMuslim ? dir : 'rtl'}>
        {isNonMuslim ? (dir === 'ltr' ? <><ChevronRight size={18} /> {t('common.back')}</> : <>{t('common.back')} <ChevronRight size={18} /></>) : <>عودة <ChevronRight size={18} /></>}
      </button>

      <div className="login-container" dir={isNonMuslim ? dir : 'rtl'}>
        <div className="form-container">
          <div className="header-text login-header">
            <div className="top-logo">
              <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>{isNonMuslim ? t('login.title') : 'تسجيل الدخول'}</h2>
            <p>{isNonMuslim ? t('login.subtitle') : 'من فضلك قم بملأ البيانات التالية'}</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <Input
              type="email"
              placeholder={isNonMuslim ? t('login.email') : 'البريد الالكتروني'}
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={isNonMuslim ? t('login.password') : 'الباسورد'}
              icon={<KeyRound size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              onRightIconClick={() => setShowPassword((p) => !p)}
              rightIconLabel={isNonMuslim ? (showPassword ? t('login.hidePassword') : t('login.showPassword')) : (showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور')}
            />

            <div className="form-options">
              <button 
                type="button" 
                className="forgot-password" 
                onClick={() => navigate('/forgot-password', { state: { email } })}
                style={{ background: 'none', border: 'none', color: '#dba841', cursor: 'pointer', padding: 0, font: 'inherit' }}
              >
                {isNonMuslim ? t('login.forgotPassword') : 'نسيت الرقم السري ؟'}
              </button>
              <Checkbox label={isNonMuslim ? t('login.rememberMe') : 'تذكرني'} />
            </div>

            <button type="submit" className="auth-btn primary-btn login-btn" disabled={loading}>
              {loading ? (isNonMuslim ? t('login.loading') : 'جاري تسجيل الدخول...') : (isNonMuslim ? t('login.submit') : 'تسجيل الدخول')}
            </button>
          </form>

          <p className="bottom-link">
            {isNonMuslim ? t('login.noAccount') : 'لا تمتلك حساب؟'}{' '}
            <a href={registerLink}>{isNonMuslim ? t('login.createAccount') : 'ارسل طلب انشاء حساب'}</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
