import React from 'react';
import { Check } from 'lucide-react';
import './SuccessModal.css';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actionLabel?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, description, actionLabel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" dir="rtl">
      <div className="modal-content">
        {/* Close Button "X" */}
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>

        <div className="modal-icon-wrapper">
          <div className="modal-icon-circle">
            <Check size={48} strokeWidth={3} className="check-icon" />
          </div>
        </div>

        <h3 className="modal-title">{title ?? 'تم بنجاح!'}</h3>
        <p className="modal-desc">{description ?? 'لقد تم تغيير كلمة السر بنجاح'}</p>

        {actionLabel && (
          <button className="modal-action-btn" onClick={onClose}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessModal;
