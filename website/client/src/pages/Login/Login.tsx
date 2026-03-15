import React, { useState } from 'react';
import { Mail, KeyRound, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import Checkbox from '../../components/common/Checkbox/Checkbox';
// import { authService } from '../../services/authService';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = new URLSearchParams(location.search).get('role');
  const registerLink = role === 'preacher' ? '/preacher-register' : role === 'organization' ? '/partner-register' : '/register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      // const response = await authService.login(email, password);
      
      // Save role from URL param (e.g. ?role=muslim_caller)
      const savedRole = role || 'admin';
      localStorage.setItem('userData', JSON.stringify({ name: 'Test User', email }));
      localStorage.setItem('userRole', savedRole);
      
      // Full reload so RoleDashboard reads fresh localStorage
      window.location.href = '/dashboard';
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.response?.data?.detail || 'حدث خطأ أثناء تسجيل الدخول');
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

      <div className="login-container">
        <div className="form-container">
          <div className="header-text login-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>تسجيل الدخول</h2>
            <p>من فضلك قم بملأ البيانات التالية</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <Input 
              type="email" 
              placeholder="البريد الالكتروني" 
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input 
              type="password" 
              placeholder="الباسورد" 
              icon={<KeyRound size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="form-options">
              <a href="/forgot-password" className="forgot-password">نسيت الرقم السري ؟</a>
              <Checkbox label="تذكرني" />
            </div>

            <button type="submit" className="auth-btn primary-btn login-btn" disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="bottom-link">
            لا تمتلك حساب؟ <a href={registerLink}>ارسل طلب انشاء حساب</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
