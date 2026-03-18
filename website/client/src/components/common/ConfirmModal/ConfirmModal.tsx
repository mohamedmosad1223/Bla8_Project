import React from 'react';
import { X } from 'lucide-react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="confirm-modal-content animate-scale-up" 
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="confirm-icon-container">
          <div className="confirm-icon-circle">
            <X size={48} strokeWidth={3} />
          </div>
        </div>

        <div className="confirm-text-content">
          <h2 className="confirm-modal-title">{title}</h2>
          <p className="confirm-modal-message">{message}</p>
        </div>

        <div className="confirm-modal-actions">
          <button className="btn-confirm-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn-confirm-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
