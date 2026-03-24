import React, { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ icon, className = '', ...props }) => {
  return (
    <div className={`input-wrapper ${className}`}>
      {icon && <span className="input-icon">{icon}</span>}
      <input 
        className={`custom-input ${icon ? 'with-icon' : ''}`}
        {...props} 
      />
    </div>
  );
};

export default Input;
