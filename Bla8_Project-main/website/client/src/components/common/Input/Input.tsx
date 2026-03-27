import React, { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  rightIconLabel?: string;
}

const Input: React.FC<InputProps> = ({ icon, rightIcon, onRightIconClick, rightIconLabel, className = '', ...props }) => {
  return (
    <div className={`input-wrapper ${className}`}>
      {icon && <span className="input-icon">{icon}</span>}
      {rightIcon && (
        <button
          type="button"
          className="input-right-icon"
          onClick={onRightIconClick}
          aria-label={rightIconLabel || 'Toggle password visibility'}
        >
          {rightIcon}
        </button>
      )}
      <input 
        className={`custom-input ${icon ? 'with-icon' : ''} ${rightIcon ? 'with-right-icon' : ''}`}
        {...props} 
      />
    </div>
  );
};

export default Input;
