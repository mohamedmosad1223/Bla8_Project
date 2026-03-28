import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import './ErrorModal.css';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'error' | 'success';
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, title, message, type = 'error' }) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="error-modal-overlay">
      <div className="error-modal" dir="rtl">
        <button className="error-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="error-modal-content">
          <div className={`error-modal-icon-wrap ${isSuccess ? 'icon-success' : 'icon-error'}`}>
            {isSuccess ? <CheckCircle2 size={40} strokeWidth={2.5} /> : <AlertCircle size={40} strokeWidth={2.5} />}
          </div>
          <h2 className="error-modal-title">{title ?? (isSuccess ? 'تمت العملية بنجاح' : 'عذراً، حدث خطأ')}</h2>
          <p className="error-modal-desc">
            {message}
          </p>
          <div className="error-modal-actions">
            <button className={`error-modal-btn ${isSuccess ? 'btn-success' : 'error-btn-primary'}`} onClick={onClose}>
              {isSuccess ? 'متابعـة' : 'حسناً، فهمت'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
