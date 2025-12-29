import { FormEvent, useState, useEffect, useRef } from 'react';
import { login } from '../../auth';
import AuthFooter from '../../components/AuthFooter';
import { useTranslation } from '../../shared/contexts/TranslationContext';

interface OTPVerificationProps {
  phone?: string;
  userId?: number; // Optional - only for legacy flow
  email: string;
  password: string;
  otpMethod?: 'phone' | 'email';
  onSuccess: () => void;
  onBack: () => void;
}

export default function OTPVerification({ phone, userId, email, password, otpMethod = 'phone', onSuccess, onBack }: OTPVerificationProps) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Add auth-page class to body/html/root for scrolling
    document.body.classList.add('auth-page');
    document.documentElement.classList.add('auth-page');
    const root = document.getElementById('root');
    if (root) root.classList.add('auth-page');

    return () => {
      // Cleanup on unmount
      document.body.classList.remove('auth-page');
      document.documentElement.classList.remove('auth-page');
      if (root) root.classList.remove('auth-page');
    };
  }, []);

  // Format phone number for display (mask middle digits)
  const formatPhone = (phoneNumber: string) => {
    if (phoneNumber.length <= 4) return phoneNumber;
    const start = phoneNumber.slice(0, 2);
    const end = phoneNumber.slice(-2);
    return `${start}****${end}`;
  };

  // Format email for display (mask middle part)
  const formatEmail = (emailAddress: string) => {
    const [localPart, domain] = emailAddress.split('@');
    if (localPart.length <= 2) return emailAddress;
    const start = localPart.slice(0, 2);
    const end = localPart.slice(-1);
    return `${start}***${end}@${domain}`;
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
      setError(t('auth.enterCompleteCode'));
      return;
    }

    setIsVerifying(true);

    try {
      // Verify OTP
      const verifyBody: any = {
        action: 'verify',
        code: otpCode,
        purpose: 'signup'
      };

      if (otpMethod === 'phone' && phone) {
        verifyBody.phone = phone;
      } else if (otpMethod === 'email' && email) {
        // Normalize email to lowercase to ensure consistency with backend
        verifyBody.email = email.toLowerCase().trim();
      }

      const verifyResponse = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyBody),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error || t('auth.invalidCode'));
        setIsVerifying(false);
        return;
      }

      // OTP verified successfully - account is now created (if signup)
      // Normalize email to lowercase before login to ensure consistency
      const normalizedEmail = email.toLowerCase().trim();
      const loginResult = await login(normalizedEmail, password);
      
      if (loginResult.success && loginResult.user) {
        // Success - redirect to dashboard
        onSuccess();
      } else {
        setError(t('auth.loginAfterSignupFailed'));
        setIsVerifying(false);
      }
    } catch (err) {
      setError(t('auth.verifyFailed'));
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setError('');

    try {
      const resendBody: any = {
        action: 'resend',
        purpose: 'signup'
      };

      if (otpMethod === 'phone' && phone) {
        resendBody.phone = phone;
      } else if (otpMethod === 'email' && email) {
        // Normalize email to lowercase to ensure consistency with backend
        resendBody.email = email.toLowerCase().trim();
      }

      const response = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resendBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.resendFailed'));
        setIsResending(false);
        return;
      }

      // Reset OTP inputs
      setOtp(['', '', '', '']);
      setResendCooldown(60); // 60 second cooldown
      setIsResending(false);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(t('auth.resendFailed'));
      setIsResending(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-gradient" aria-hidden="true" />
      <div className="auth-card">
        <h1 className="brand">{otpMethod === 'phone' ? t('auth.verifyPhoneNumber') : t('auth.verifyEmailAddress')}</h1>
        <p className="subtitle">
          {t('auth.codeSentTo')}
          <br className="mobile-break" />
          <strong className="otp-target">{otpMethod === 'phone' && phone ? formatPhone(phone) : formatEmail(email)}</strong>
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
            {isVerifying ? t('common.loading') : t('auth.verifyOTP')}
          </button>

          <div className="otp-resend">
            <p>{t('auth.didntReceiveCode')}</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="resend-link"
            >
              {resendCooldown > 0 
                ? `${t('auth.resendIn')} ${resendCooldown}s` 
                : isResending 
                  ? t('common.loading') 
                  : t('auth.resendOTP')}
            </button>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="secondary"
            style={{ marginTop: '12px', width: '100%' }}
          >
            {t('common.back')}
          </button>
        </form>
      </div>
      <AuthFooter />
    </div>
  );
}
