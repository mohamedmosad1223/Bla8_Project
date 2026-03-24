import React, { InputHTMLAttributes } from 'react';
import './Checkbox.css';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...props }) => {
  return (
    <label className={`custom-checkbox-container ${className}`}>
      <input type="checkbox" className="custom-checkbox-input" {...props} />
      <span className="custom-checkmark"></span>
      <span className="checkbox-label">{label}</span>
    </label>
  );
};

export default Checkbox;
