import { FormEvent, useState, useEffect, useRef } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

interface SettingsOTPVerificationProps {
    email?: string;
    phone?: string;
    otpMethod: 'phone' | 'email';
    purpose: 'email_change' | 'phone_change';
    onSuccess: () => void;
    onCancel: () => void;
}

export default function SettingsOTPVerification({ 
    email, 
    phone, 
    otpMethod, 
    purpose,
    onSuccess, 
    onCancel 
}: SettingsOTPVerificationProps) {
    const { t } = useTranslation();
    const [otp, setOtp] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Format phone number for display
    const formatPhone = (phoneNumber: string) => {
        if (phoneNumber.length <= 4) return phoneNumber;
        const start = phoneNumber.slice(0, 2);
        const end = phoneNumber.slice(-2);
        return `${start}****${end}`;
    };

    // Format email for display
    const formatEmail = (emailAddress: string) => {
        const [localPart, domain] = emailAddress.split('@');
        if (localPart.length <= 2) return emailAddress;
        const start = localPart.slice(0, 2);
        const end = localPart.slice(-1);
        return `${start}***${end}@${domain}`;
    };

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return;
        
        const newOtp = [...otp];
        newOtp[index] = value.replace(/\D/g, '');
        setOtp(newOtp);
        setError('');

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
            const verifyBody: any = {
                action: 'verify',
                code: otpCode,
                purpose: purpose
            };

            if (otpMethod === 'phone' && phone) {
                verifyBody.phone = phone;
            } else if (otpMethod === 'email' && email) {
                verifyBody.email = email;
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

            // OTP verified successfully
            onSuccess();
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
                purpose: purpose
            };

            if (otpMethod === 'phone' && phone) {
                resendBody.phone = phone;
            } else if (otpMethod === 'email' && email) {
                resendBody.email = email;
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

            setOtp(['', '', '', '']);
            setResendCooldown(60);
            setIsResending(false);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(t('auth.resendFailed'));
            setIsResending(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1000000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', zIndex: 1000001 }}>
                <div className="modal-header">
                    <h2>
                        {otpMethod === 'phone' 
                            ? t('auth.verifyPhoneNumber') 
                            : t('auth.verifyEmailAddress')}
                    </h2>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '24px', color: 'var(--muted)' }}>
                        {t('auth.codeSentTo')}{' '}
                        <strong style={{ color: 'var(--text)' }}>
                            {otpMethod === 'phone' && phone 
                                ? formatPhone(phone) 
                                : formatEmail(email || '')}
                        </strong>
                    </p>
                    
                    <form onSubmit={handleVerify}>
                        <div className="otp-container" style={{ marginBottom: '20px' }}>
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
                                    disabled={isVerifying}
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="error" style={{ marginBottom: '16px' }}>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={isVerifying || otp.join('').length !== 4}
                            style={{ width: '100%', marginBottom: '12px' }}
                        >
                            {isVerifying ? t('common.loading') : t('auth.verifyOTP')}
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <p style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--muted)' }}>
                                {t('auth.didntReceiveCode')}
                            </p>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={isResending || resendCooldown > 0}
                                className="btn-secondary"
                                style={{ fontSize: '14px' }}
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
                            onClick={onCancel}
                            className="btn-secondary"
                            style={{ width: '100%' }}
                            disabled={isVerifying}
                        >
                            {t('common.cancel')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

