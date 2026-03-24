import React, { useState } from 'react';
import { Mail, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import { authService } from '../../services/authService';
import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      navigate('/reset-activation', { state: { email } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Back Button positioned at top right */}
      <button 
        className="back-btn"
        onClick={() => navigate('/login')}
      >
        عودة <ChevronRight size={18} />
      </button>

      <div className="forgot-container">
        <div className="form-container">
          <div className="header-text forgot-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>استرجاع الرقم السري</h2>
            <p>من فضلك ادخل البريد الخاص بك لتتمكن من استرجاع كلمة السر</p>
          </div>

          <form className="forgot-form" onSubmit={handleSubmit}>
            <Input 
              type="email" 
              placeholder="البريد الالكتروني" 
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            {error && <p className="error-text" style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</p>}

            <button type="submit" className="auth-btn primary-btn submit-btn" disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'تأكيد'}
            </button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
