import { FormEvent, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthFooter from '../../components/AuthFooter';
import { useTranslation } from '../../shared/contexts/TranslationContext';
import { IconEye, IconEyeOff } from '../../admin/components/icons';

type Step = 'method' | 'input' | 'otp' | 'reset';

export default function ForgotPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();

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

    const [step, setStep] = useState<Step>('method');
    const [otpMethod, setOtpMethod] = useState<'phone' | 'email' | null>(null);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Handle method selection
    const handleMethodSelect = (method: 'phone' | 'email') => {
        setOtpMethod(method);
        setStep('input');
        setError('');
    };

    // Handle input submit (phone or email)
    const handleInputSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (otpMethod === 'phone' && !phone.trim()) {
            setError(t('auth.phoneRequired'));
            return;
        }

        if (otpMethod === 'email' && !email.trim()) {
            setError(t('auth.emailRequired') || 'Email is required');
            return;
        }

        setIsLoading(true);

        // Normalize email to lowercase before sending
        const normalizedEmail = otpMethod === 'email' ? email.trim().toLowerCase() : undefined;
        if (otpMethod === 'email' && normalizedEmail) {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                setError(t('auth.invalidEmail') || 'Please enter a valid email address');
                setIsLoading(false);
                return;
            }
            // Update state with normalized email
            setEmail(normalizedEmail);
        }

        try {
            const response = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send',
                    phone: otpMethod === 'phone' ? phone.trim() : undefined,
                    email: normalizedEmail,
                    purpose: 'password_reset'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || t('auth.sendOTPFailed') || 'Failed to send verification code');
                setIsLoading(false);
                return;
            }

            setStep('otp');
            setResendCooldown(60);
            setIsLoading(false);
        } catch (err) {
            setError(t('auth.verifyFailed') || 'Failed to connect to server. Please try again.');
            setIsLoading(false);
        }
    };

    // Handle OTP change
    const handleOTPChange = (index: number, value: string) => {
        if (value.length > 1) return;
        
        const newOtp = [...otp];
        newOtp[index] = value.replace(/\D/g, '');
        setOtp(newOtp);
        setError('');

        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOTPPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        if (pastedData.length === 4) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[3]?.focus();
            setError('');
        }
    };

    // Handle OTP verification
    const handleOTPVerify = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        
        const otpCode = otp.join('');
        if (otpCode.length !== 4) {
            setError(t('auth.enterCompleteCode'));
            return;
        }

        setIsLoading(true);

        try {
            // Normalize email to lowercase before verification
            const normalizedEmail = otpMethod === 'email' ? email.trim().toLowerCase() : undefined;
            
            const response = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify',
                    phone: otpMethod === 'phone' ? phone.trim() : undefined,
                    email: normalizedEmail,
                    code: otpCode,
                    purpose: 'password_reset'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || t('auth.invalidCode'));
                setIsLoading(false);
                return;
            }

            setStep('reset');
            setIsLoading(false);
        } catch (err) {
            setError(t('auth.verifyFailed'));
            setIsLoading(false);
        }
    };

    // Handle password reset
    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError(t('auth.passwordsDoNotMatch'));
            return;
        }

        if (newPassword.length < 6) {
            setError(t('auth.passwordTooShort'));
            return;
        }

        setIsLoading(true);

        try {
            const otpCode = otp.join('');
            
            // Normalize email to lowercase before reset
            const normalizedEmail = otpMethod === 'email' ? email.trim().toLowerCase() : undefined;
            
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: otpMethod === 'phone' ? phone.trim() : undefined,
                    email: normalizedEmail,
                    newPassword,
                    otpCode
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || t('auth.resetPasswordFailed') || 'Failed to reset password');
                setIsLoading(false);
                return;
            }

            // Success - redirect to login
            navigate('/login', {
                replace: true,
                state: { message: t('auth.passwordResetSuccess') || 'Password reset successfully! Please log in with your new password.' }
            });
        } catch (err) {
            setError(t('auth.verifyFailed') || 'Failed to connect to server. Please try again.');
            setIsLoading(false);
        }
    };

    // Handle resend OTP
    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        
        setIsLoading(true);
        setError('');

        try {
            // Normalize email to lowercase before resend
            const normalizedEmail = otpMethod === 'email' ? email.trim().toLowerCase() : undefined;
            
            const response = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resend',
                    phone: otpMethod === 'phone' ? phone.trim() : undefined,
                    email: normalizedEmail,
                    purpose: 'password_reset'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || t('auth.resendFailed'));
                setIsLoading(false);
                return;
            }

            setOtp(['', '', '', '']);
            setResendCooldown(60);
            setIsLoading(false);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(t('auth.resendFailed'));
            setIsLoading(false);
        }
    };

    // Format phone/email for display
    const formatPhone = (phoneNumber: string) => {
        if (phoneNumber.length <= 4) return phoneNumber;
        const start = phoneNumber.slice(0, 2);
        const end = phoneNumber.slice(-2);
        return `${start}****${end}`;
    };

    const formatEmail = (emailAddress: string) => {
        const [localPart, domain] = emailAddress.split('@');
        if (localPart.length <= 2) return emailAddress;
        const start = localPart.slice(0, 2);
        const end = localPart.slice(-1);
        return `${start}***${end}@${domain}`;
    };

    return (
        <div className="auth-root">
            <div className="auth-gradient" aria-hidden="true" />
            <div className="auth-card">
                <h1 className="brand">{t('auth.resetPassword')}</h1>
                
                {/* Method Selection Step */}
                {step === 'method' && (
                    <>
                        <p className="subtitle">{t('auth.selectMethod')}</p>
                        <div className="form">
                            <div className="otp-method-buttons">
                                <button
                                    type="button"
                                    onClick={() => handleMethodSelect('phone')}
                                    className="otp-method-btn"
                                >
                                    <span className="otp-method-icon">📱</span>
                                    <span className="otp-method-text">{t('auth.viaPhone')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMethodSelect('email')}
                                    className="otp-method-btn"
                                >
                                    <span className="otp-method-icon">✉️</span>
                                    <span className="otp-method-text">{t('auth.viaEmail')}</span>
                                </button>
                            </div>
                            {error && <div className="error" style={{ marginTop: '16px' }}>{error}</div>}
                        </div>
                    </>
                )}

                {/* Input Step (Phone or Email) */}
                {step === 'input' && (
                    <>
                        <p className="subtitle">
                            {otpMethod === 'phone' 
                                ? t('auth.enterPhoneToReset') || 'Enter your phone number to receive a verification code'
                                : t('auth.enterEmailToReset') || 'Enter your email address to receive a verification code'}
                        </p>
                        <form onSubmit={handleInputSubmit} className="form">
                            <label>
                                {otpMethod === 'phone' ? t('auth.phone') : t('auth.email')}
                                <input 
                                    type={otpMethod === 'phone' ? 'tel' : 'email'}
                                    value={otpMethod === 'phone' ? phone : email}
                                    onChange={(e) => {
                                        if (otpMethod === 'phone') {
                                            setPhone(e.target.value);
                                        } else {
                                            // Normalize email to lowercase to prevent capitalization issues
                                            const normalizedEmail = e.target.value.toLowerCase();
                                            setEmail(normalizedEmail);
                                        }
                                        setError('');
                                    }}
                                    placeholder={otpMethod === 'phone' ? t('auth.enterPhoneNumber') : t('auth.enterEmail') || 'Enter your email'}
                                    required 
                                    disabled={isLoading}
                                    inputMode={otpMethod === 'phone' ? 'tel' : 'email'}
                                    autoComplete={otpMethod === 'phone' ? 'tel' : 'email'}
                                    autoCapitalize="off"
                                    autoCorrect="off"
                                    spellCheck="false"
                                />
                            </label>
                            {error && <div className="error">{error}</div>}
                            <button type="submit" className="primary" disabled={isLoading}>
                                {isLoading ? t('common.loading') : t('auth.sendOTP')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('method');
                                    setOtpMethod(null);
                                    setPhone('');
                                    setEmail('');
                                    setError('');
                                }}
                                className="secondary"
                                style={{ marginTop: '12px', width: '100%' }}
                                disabled={isLoading}
                            >
                                {t('common.back')}
                            </button>
                        </form>
                    </>
                )}

                {/* OTP Verification Step */}
                {step === 'otp' && (
                    <>
                        <p className="subtitle">
                            {t('auth.codeSentTo')}<br />
                            <strong>
                                {otpMethod === 'phone' && phone 
                                    ? formatPhone(phone) 
                                    : formatEmail(email)}
                            </strong>
                        </p>
                        <form onSubmit={handleOTPVerify} className="form">
                            <div className="otp-container">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOTPChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                                        onPaste={handleOTPPaste}
                                        className="otp-input"
                                        autoFocus={index === 0}
                                        disabled={isLoading}
                                    />
                                ))}
                            </div>
                            {error && <div className="error">{error}</div>}
                            <button 
                                type="submit" 
                                className="primary" 
                                disabled={isLoading || otp.join('').length !== 4}
                            >
                                {isLoading ? t('common.loading') : t('auth.verifyOTP')}
                            </button>
                            <div className="otp-resend">
                                <p>{t('auth.didntReceiveCode')}</p>
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={isLoading || resendCooldown > 0}
                                    className="resend-link"
                                >
                                    {resendCooldown > 0 
                                        ? `${t('auth.resendIn')} ${resendCooldown}s` 
                                        : isLoading 
                                            ? t('common.loading') 
                                            : t('auth.resendOTP')}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('input');
                                    setOtp(['', '', '', '']);
                                    setError('');
                                }}
                                className="secondary"
                                style={{ marginTop: '12px', width: '100%' }}
                                disabled={isLoading}
                            >
                                {t('common.back')}
                            </button>
                        </form>
                    </>
                )}

                {/* Password Reset Step */}
                {step === 'reset' && (
                    <>
                        <p className="subtitle">{t('auth.enterNewPassword') || 'Enter your new password'}</p>
                        <form onSubmit={handleResetPassword} className="form">
                            <label>
                                {t('auth.newPassword') || 'New Password'}
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPassword.new ? 'text' : 'password'}
                                        value={newPassword} 
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            setError('');
                                        }}
                                        placeholder={t('auth.enterNewPassword') || 'Enter new password'} 
                                        required 
                                        minLength={6}
                                        disabled={isLoading}
                                        style={{ paddingRight: '45px', width: '100%' }}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                                        style={{ position: 'absolute', right: '8px', bottom: '8px' }}
                                    >
                                        {showPassword.new ? <IconEyeOff /> : <IconEye />}
                                    </button>
                                </div>
                            </label>
                            <label>
                                {t('auth.confirmPassword')}
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPassword.confirm ? 'text' : 'password'}
                                        value={confirmPassword} 
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setError('');
                                        }}
                                        placeholder={t('auth.confirmPassword') || 'Confirm new password'} 
                                        required 
                                        minLength={6}
                                        disabled={isLoading}
                                        style={{ paddingRight: '45px', width: '100%' }}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        style={{ position: 'absolute', right: '8px', bottom: '8px' }}
                                    >
                                        {showPassword.confirm ? <IconEyeOff /> : <IconEye />}
                                    </button>
                                </div>
                            </label>
                            {error && <div className="error">{error}</div>}
                            <button type="submit" className="primary" disabled={isLoading}>
                                {isLoading ? t('common.loading') : t('auth.changePassword') || 'Change Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('otp');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setError('');
                                }}
                                className="secondary"
                                style={{ marginTop: '12px', width: '100%' }}
                                disabled={isLoading}
                            >
                                {t('common.back')}
                            </button>
                        </form>
                    </>
                )}

                <div className="auth-footer">
                    <span>{t('auth.rememberedIt') || 'Remembered it?'}</span>
                    <Link to="/login" className="auth-link">{t('auth.backToSignIn') || 'Back to sign in'}</Link>
                </div>
            </div>
            <AuthFooter />
        </div>
    );
}
