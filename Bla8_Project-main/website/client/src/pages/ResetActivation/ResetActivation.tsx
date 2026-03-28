import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import OTPInput from '../../components/common/OTPInput/OTPInput';
import { authService } from '../../services/authService';
import ErrorModal from '../../components/common/Modal/ErrorModal';
import './ResetActivation.css';

const ResetActivation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'error' | 'success'>('error');

  const handleComplete = (code: string) => {
    setOtp(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('البريد الإلكتروني مفقود. يرجى البدء من جديد.');
      return;
    }
    if (otp.length < 6) {
      setError('يرجى إدخال الكود كاملاً (6 أرقام)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.verifyOtp(email, otp);
      navigate('/reset-password', { state: { email, otp } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'الرمز غير صحيح أو منتهي الصلاحية');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setModalType('success');
      setModalMessage('تم إعادة إرسال الكود بنجاح');
      setIsModalOpen(true);
    } catch (err: any) {
      setModalType('error');
      setModalMessage(err.response?.data?.detail || 'فشل إعادة إرسال الكود');
      setIsModalOpen(true);
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

      <div className="reset-activation-container">
        <div className="form-container">
          <div className="header-text reset-activation-header">
            <div className="top-logo">
               <img src="/bla8_logo.png" alt="Balagh Logo" className="logo-colored" />
            </div>
            <h2>استرجاع الرقم السري</h2>
            <p>من فضلك ادخل كود التأكيد المرسل إلي بريدك الالكتروني لتحويلك لصفحة استرجاع كلمة السر</p>
          </div>

          <form className="reset-activation-form" onSubmit={handleSubmit}>
            <div className="otp-wrapper">
              <OTPInput length={6} onComplete={handleComplete} />
            </div>

            {error && <p className="error-text" style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</p>}

            <button type="submit" className="auth-btn primary-btn activation-btn" disabled={loading}>
              {loading ? 'جاري التحقق...' : 'تأكيد'}
            </button>
          </form>

          <p className="bottom-link">
            لم يصلك الكود؟ <a href="#" onClick={handleResend}>إعادة إرسال الكود</a>
          </p>
        </div>
      </div>

      <ErrorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
        type={modalType}
      />
    </AuthLayout>
  );
};

export default ResetActivation;
