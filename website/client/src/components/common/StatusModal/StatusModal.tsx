import React from 'react';
import { X, Check } from 'lucide-react';
import './StatusModal.css';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
  actionLabel: string;
  onAction?: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  actionLabel,
  onAction
}) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="status-modal-content animate-scale-up" 
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="status-icon-container">
          <div className={`status-icon-circle ${isSuccess ? 'success' : 'error'}`}>
            {isSuccess ? (
              <Check size={48} strokeWidth={3} />
            ) : (
              <X size={48} strokeWidth={3} />
            )}
          </div>
        </div>

        <div className="status-text-content">
          <h2 className="status-modal-title">{title}</h2>
          <p className="status-modal-message">{message}</p>
        </div>

        <div className="status-modal-actions">
          <button 
            className={`btn-status-action ${isSuccess ? 'success' : 'error'}`}
            onClick={onAction || onClose}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
