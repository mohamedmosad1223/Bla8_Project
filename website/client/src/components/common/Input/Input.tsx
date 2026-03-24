import React, { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onIconRightClick?: () => void;
}

const Input: React.FC<InputProps> = ({ icon, iconRight, onIconRightClick, className = '', ...props }) => {
  return (
    <div className={`input-wrapper ${className}`}>
      {icon && <span className="input-icon">{icon}</span>}
      <input 
        className={`custom-input ${icon ? 'with-icon' : ''} ${iconRight ? 'with-icon-right' : ''}`}
        {...props} 
      />
      {iconRight && (
        <button
          type="button"
          className="input-icon-right"
          onClick={onIconRightClick}
        >
          {iconRight}
        </button>
      )}
    </div>
  );
};

export default Input;
