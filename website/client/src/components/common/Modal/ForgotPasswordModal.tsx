import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, X } from 'lucide-react';
import OTPInput from '../OTPInput/OTPInput';
import Input from '../Input/Input';
import { authService } from '../../../services/authService';
import './ForgotPasswordModal.css';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, email }) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: OTP, 2: New Password
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOtp('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setError('يرجى إدخال كود التحقق كاملاً');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.verifyOtp(email, otp);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'الكود غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
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
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء حفظ كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-modal-overlay">
      <div className="forgot-modal-content" dir="rtl">
        <button className="forgot-modal-close" onClick={onClose}><X size={20} /></button>
        
        <div className="forgot-modal-header">
          <h2>استرجاع الحساب</h2>
          <p>{step === 1 ? 'أدخل الكود المرسل لبريدك' : 'قم بإنشاء كلمة سر جديدة'}</p>
        </div>

        {error && <div className="forgot-modal-error">{error}</div>}
        {success && <div className="forgot-modal-success">تم تغيير كلمة السر بنجاح! يتم الآن الإغلاق...</div>}

        {!success && (
          <>
            {step === 1 ? (
              <div className="forgot-modal-step">
                <div className="otp-modal-wrap">
                  <OTPInput onComplete={(code) => setOtp(code)} length={6} />
                </div>
                <button 
                  className="forgot-modal-btn" 
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? 'جاري التحقق...' : 'تأكيد الحساب'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="forgot-modal-step">
                <div className="modal-input-group" style={{ position: 'relative' }}>
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="كلمة السر الجديدة"
                    icon={<KeyRound size={18} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button type="button" className="modal-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="modal-input-group" style={{ position: 'relative' }}>
                  <Input 
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="تأكيد كلمة السر"
                    icon={<KeyRound size={18} />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button type="button" className="modal-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button type="submit" className="forgot-modal-btn" disabled={loading}>
                  {loading ? 'جاري الحفظ...' : 'تغيير كلمة السر'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
