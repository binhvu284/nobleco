import { FormEvent, useState, useEffect, useRef } from 'react';
import { login } from '../../auth';

interface OTPVerificationProps {
  phone: string;
  userId: number;
  email: string;
  password: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function OTPVerification({ phone, userId, email, password, onSuccess, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format phone number for display (mask middle digits)
  const formatPhone = (phoneNumber: string) => {
    if (phoneNumber.length <= 4) return phoneNumber;
    const start = phoneNumber.slice(0, 2);
    const end = phoneNumber.slice(-2);
    return `${start}****${end}`;
  };

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, ''); // Only digits
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData.length === 4) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[3]?.focus();
      setError('');
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      setError('Please enter the complete 4-digit code');
      return;
    }

    setIsVerifying(true);

    try {
      // Verify OTP
      const verifyResponse = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone,
          code: otpCode,
          purpose: 'signup'
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error || 'Invalid verification code');
        setIsVerifying(false);
        return;
      }

      // OTP verified successfully - now auto-login the user
      const loginResult = await login(email, password);
      
      if (loginResult.success && loginResult.user) {
        // Success - redirect to dashboard
        onSuccess();
      } else {
        setError('Verification successful, but login failed. Please try logging in manually.');
        setIsVerifying(false);
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend',
          phone,
          purpose: 'signup'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend code');
        setIsResending(false);
        return;
      }

      // Reset OTP inputs
      setOtp(['', '', '', '']);
      setResendCooldown(60); // 60 second cooldown
      setIsResending(false);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend code. Please try again.');
      setIsResending(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-gradient" aria-hidden="true" />
      <div className="auth-card">
        <h1 className="brand">Verify Phone Number</h1>
        <p className="subtitle">
          We've sent a 4-digit verification code to<br />
          <strong>{formatPhone(phone)}</strong>
        </p>
        
        <form onSubmit={handleVerify} className="form">
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="otp-input"
                autoFocus={index === 0}
                disabled={isVerifying || isLoading}
              />
            ))}
          </div>

          {error && <div className="error">{error}</div>}

          <button 
            type="submit" 
            className="primary" 
            disabled={isVerifying || isLoading || otp.join('').length !== 4}
          >
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className="otp-resend">
            <p>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="resend-link"
            >
              {resendCooldown > 0 
                ? `Resend code in ${resendCooldown}s` 
                : isResending 
                  ? 'Sending...' 
                  : 'Resend Code'}
            </button>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="secondary"
            style={{ marginTop: '12px', width: '100%' }}
          >
            Back to Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
