import React, { useState, useEffect } from 'react';
import { KeyRound, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import { authService } from '../../services/authService';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      setError('البيانات مفقودة. يرجى البدء من جديد.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.resetPassword({
        email,
        otp,
        new_password: password,
        new_password_confirm: confirmPassword
      });
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccess(false);
    navigate('/login'); 
  };

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        handleModalClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  return (
    <>
      <AuthLayout>
        {/* Back Button positioned at top right */}
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          عودة <ChevronRight size={18} />
        </button>

        <div className="reset-password-container">
          <div className="form-container">
            <div className="header-text reset-password-header">
              <div className="top-logo">
                 <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
              </div>
              <h2>انشاء كلمة سر جديدة</h2>
              <p>قم بانشا كلمة سر جديدة وقم بتأكيدها</p>
            </div>

            <form className="reset-password-form" onSubmit={handleSubmit}>
              <div className="reset-input-wrapper" style={{ position: 'relative' }}>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="كلمة سر جديدة" 
                  icon={<KeyRound size={18} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button type="button" className="pf-eye-btn" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096', zIndex: 10 }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="reset-input-wrapper" style={{ position: 'relative' }}>
                <Input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="تأكيد كلمة سر جديدة" 
                  icon={<KeyRound size={18} />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button type="button" className="pf-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096', zIndex: 10 }}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && <p className="error-text" style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</p>}

              <button type="submit" className="auth-btn primary-btn reset-btn" disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'تأكيد'}
              </button>
            </form>
          </div>
        </div>
      </AuthLayout>

      <SuccessModal 
        isOpen={showSuccess} 
        onClose={handleModalClose} 
        actionLabel="الذهاب لتسجيل الدخول"
        description="تم تغيير كلمة السر بنجاح، يمكنك الآن تسجيل الدخول"
      />
    </>
  );
};

export default ResetPassword;
