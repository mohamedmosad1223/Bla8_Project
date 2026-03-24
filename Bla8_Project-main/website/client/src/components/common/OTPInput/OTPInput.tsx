import React, { useRef, useState, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react';
import './OTPInput.css';

interface OTPInputProps {
  length?: number;
  onComplete?: (code: string) => void;
}

const OTPInput: React.FC<OTPInputProps> = ({ length = 4, onComplete }) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // allow only the last character entered if user types fast
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // trigger completion
    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === length && onComplete) {
      onComplete(combinedOtp);
    }

    // Move to next input if there's a value
    if (value && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      focusInput(index - 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < length) newOtp[index] = char;
    });
    setOtp(newOtp);

    if (pastedData.length === length && onComplete) {
      onComplete(newOtp.join(''));
    }

    const nextIndex = Math.min(pastedData.length, length - 1);
    focusInput(nextIndex);
  };

  return (
    <div className="otp-container" dir="ltr">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{1}"
          maxLength={1}
          className="otp-input"
          value={data}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          ref={(el) => (inputRefs.current[index] = el)}
        />
      ))}
    </div>
  );
};

export default OTPInput;
