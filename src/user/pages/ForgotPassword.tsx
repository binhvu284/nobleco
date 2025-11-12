import { FormEvent, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthFooter from '../../components/AuthFooter';

export default function ForgotPassword() {
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
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'reset'>('phone');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handlePhoneSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!phone) {
            setError('Phone number is required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send',
                    phone,
                    purpose: 'password_reset'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to send verification code');
                setIsLoading(false);
                return;
            }

            setStep('otp');
            setResendCooldown(60);
            setIsLoading(false);
        } catch (err) {
            setError('Failed to connect to server. Please try again.');
            setIsLoading(false);
        }
    };

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

    const handleOTPVerify = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        
        const otpCode = otp.join('');
        if (otpCode.length !== 4) {
            setError('Please enter the complete 4-digit code');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify',
                    phone,
                    code: otpCode,
                    purpose: 'password_reset'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Invalid verification code');
                setIsLoading(false);
                return;
            }

            setStep('reset');
            setIsLoading(false);
        } catch (err) {
            setError('Failed to verify code. Please try again.');
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            // TODO: Create API endpoint for password reset
            // For now, this is a placeholder
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    newPassword
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to reset password');
                setIsLoading(false);
                return;
            }

            // Success - redirect to login
            navigate('/login', {
                replace: true,
                state: { message: 'Password reset successfully! Please log in with your new password.' }
            });
        } catch (err) {
            setError('Failed to connect to server. Please try again.');
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resend',
                    phone,
                    purpose: 'password_reset'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to resend code');
                setIsLoading(false);
                return;
            }

            setOtp(['', '', '', '']);
            setResendCooldown(60);
            setIsLoading(false);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError('Failed to resend code. Please try again.');
            setIsLoading(false);
        }
    };

    const formatPhone = (phoneNumber: string) => {
        if (phoneNumber.length <= 4) return phoneNumber;
        const start = phoneNumber.slice(0, 2);
        const end = phoneNumber.slice(-2);
        return `${start}****${end}`;
    };

    return (
        <div className="auth-root">
            <div className="auth-gradient" aria-hidden="true" />
            <div className="auth-card">
                <h1 className="brand">Reset password</h1>
                
                {step === 'phone' && (
                    <>
                        <p className="subtitle">Enter your phone number to receive a verification code</p>
                        <form onSubmit={handlePhoneSubmit} className="form">
                            <label>
                                Phone Number
                                <input 
                                    type="tel"
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    placeholder="Enter your phone number" 
                                    required 
                                />
                            </label>
                            {error && <div className="error">{error}</div>}
                            <button type="submit" className="primary" disabled={isLoading}>
                                {isLoading ? 'Sending code...' : 'Send Verification Code'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <p className="subtitle">
                            Enter the 4-digit code sent to<br />
                            <strong>{formatPhone(phone)}</strong>
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
                                        className="otp-input"
                                        autoFocus={index === 0}
                                        disabled={isLoading}
                                    />
                                ))}
                            </div>
                            {error && <div className="error">{error}</div>}
                            <button type="submit" className="primary" disabled={isLoading || otp.join('').length !== 4}>
                                {isLoading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <div className="otp-resend">
                                <p>Didn't receive the code?</p>
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={isLoading || resendCooldown > 0}
                                    className="resend-link"
                                >
                                    {resendCooldown > 0 
                                        ? `Resend code in ${resendCooldown}s` 
                                        : isLoading 
                                            ? 'Sending...' 
                                            : 'Resend Code'}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="secondary"
                                style={{ marginTop: '12px' }}
                            >
                                Back
                            </button>
                        </form>
                    </>
                )}

                {step === 'reset' && (
                    <>
                        <p className="subtitle">Enter your new password</p>
                        <form onSubmit={handleResetPassword} className="form">
                            <label>
                                New Password
                                <input 
                                    type="password"
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    placeholder="Enter new password" 
                                    required 
                                    minLength={6}
                                />
                            </label>
                            <label>
                                Confirm New Password
                                <input 
                                    type="password"
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    placeholder="Confirm new password" 
                                    required 
                                    minLength={6}
                                />
                            </label>
                            {error && <div className="error">{error}</div>}
                            <button type="submit" className="primary" disabled={isLoading}>
                                {isLoading ? 'Resetting password...' : 'Reset Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('otp')}
                                className="secondary"
                                style={{ marginTop: '12px' }}
                            >
                                Back
                            </button>
                        </form>
                    </>
                )}

                <div className="auth-footer">
                    <span>Remembered it?</span>
                    <Link to="/login" className="auth-link">Back to sign in</Link>
                </div>
            </div>
            <AuthFooter />
        </div>
    );
}
