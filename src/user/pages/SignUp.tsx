import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import OTPVerification from '../components/OTPVerification';
import AuthFooter from '../../components/AuthFooter';
import { useTranslation } from '../../shared/contexts/TranslationContext';

export default function SignUp() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

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
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [referCode, setReferCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // OTP method selection state (shown after clicking Sign Up)
    const [showOTPMethodSelection, setShowOTPMethodSelection] = useState(false);
    const [otpMethod, setOtpMethod] = useState<'phone' | 'email' | null>(null);
    const [phone, setPhone] = useState('');
    const [isSendingOTP, setIsSendingOTP] = useState(false);
    
    // OTP verification state
    const [showOTPVerification, setShowOTPVerification] = useState(false);
    const [signupData, setSignupData] = useState<{ phone?: string; email: string; password: string; otpMethod: 'phone' | 'email' } | null>(null);

    // Auto-fill refer code from URL parameter
    useEffect(() => {
        const refParam = searchParams.get('ref');
        if (refParam) {
            setReferCode(refParam.toUpperCase());
        }
    }, [searchParams]);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirm) {
            setError(t('auth.passwordsDoNotMatch'));
            return;
        }

        if (password.length < 6) {
            setError(t('auth.passwordTooShort'));
            return;
        }

        // Show OTP method selection screen
        setShowOTPMethodSelection(true);
    };

    const handleOTPMethodSelect = async (method: 'phone' | 'email') => {
        setError('');
        setOtpMethod(method);
        
        // If phone method is selected, we need phone number input
        // If email method is selected, proceed directly to send OTP
        if (method === 'email') {
            setIsSendingOTP(true);
            try {
                await sendOTP(method);
            } catch (err) {
                // Error handling is done in sendOTP
            } finally {
                setIsSendingOTP(false);
            }
        }
        // If phone, wait for phone input
    };

    const handlePhoneSubmit = async () => {
        if (!phone.trim()) {
            setError(t('auth.phoneRequired'));
            return;
        }
        await sendOTP('phone');
    };

    const sendOTP = async (method: 'phone' | 'email') => {
        setIsSendingOTP(true);
        setError('');

        // Normalize email to lowercase before sending
        const normalizedEmail = email.trim().toLowerCase();

        // Validate email format (basic check)
        if (method === 'email' && normalizedEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                setError(t('auth.invalidEmail') || 'Please enter a valid email address');
                setIsSendingOTP(false);
                return;
            }
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email: normalizedEmail,
                    phone: phone.trim() || undefined, // Optional phone - backend will validate if provided
                    password,
                    referCode: referCode.trim() || undefined,
                    otpMethod: method,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to send verification code');
                setIsSendingOTP(false);
                return;
            }

            // OTP sent successfully, show verification screen
            // Use normalized email to ensure consistency
            setSignupData({
                phone: method === 'phone' ? (data.phone || phone) : undefined,
                email: normalizedEmail,
                password: password,
                otpMethod: method
            });
            setShowOTPMethodSelection(false);
            setShowOTPVerification(true);
            setIsSendingOTP(false);
        } catch (err) {
            setError('Failed to connect to server. Please try again.');
            setIsSendingOTP(false);
        }
    };

    const handleOTPSuccess = () => {
        // OTP verified and user logged in - redirect to dashboard
        navigate('/dashboard', { replace: true });
    };

    const handleOTPBack = () => {
        setShowOTPVerification(false);
        setSignupData(null);
        setShowOTPMethodSelection(false);
        setOtpMethod(null);
        setPhone('');
    };

    const handleMethodSelectionBack = () => {
        setShowOTPMethodSelection(false);
        setOtpMethod(null);
        setPhone('');
    };

    // Show OTP verification screen if needed
    if (showOTPVerification && signupData) {
        return (
            <OTPVerification
                phone={signupData.otpMethod === 'phone' ? signupData.phone : undefined}
                email={signupData.email}
                password={signupData.password}
                otpMethod={signupData.otpMethod}
                onSuccess={handleOTPSuccess}
                onBack={handleOTPBack}
            />
        );
    }

    // Show OTP method selection screen
    if (showOTPMethodSelection) {
        return (
            <div className="auth-root">
                <div className="auth-gradient" aria-hidden="true" />
                <div className="auth-card">
                    <h1 className="brand">Choose Verification Method</h1>
                    <p className="subtitle">How would you like to receive your verification code?</p>
                    
                    {!otpMethod ? (
                        <div className="form">
                            <div className="otp-method-buttons">
                                <button
                                    type="button"
                                    onClick={() => handleOTPMethodSelect('phone')}
                                    disabled={isSendingOTP}
                                    className="otp-method-btn"
                                    style={{
                                        opacity: isSendingOTP ? 0.6 : 1,
                                        cursor: isSendingOTP ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <span className="otp-method-icon">📱</span>
                                    <span className="otp-method-text">{t('auth.viaPhone')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOTPMethodSelect('email')}
                                    disabled={isSendingOTP}
                                    className="otp-method-btn"
                                    style={{
                                        opacity: isSendingOTP ? 0.6 : 1,
                                        cursor: isSendingOTP ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isSendingOTP ? (
                                        <>
                                            <div className="otp-loading-spinner"></div>
                                            <span className="otp-method-text">{t('common.loading')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="otp-method-icon">✉️</span>
                                            <span className="otp-method-text">{t('auth.viaEmail')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            {error && <div className="error" style={{ marginTop: '16px' }}>{error}</div>}
                            {isSendingOTP && !error && (
                                <div className="otp-sending-message">
                                    <div className="otp-loading-spinner-small"></div>
                                    <span>{t('common.loading')}</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleMethodSelectionBack}
                                className="secondary"
                                style={{ marginTop: '16px', width: '100%' }}
                                disabled={isSendingOTP}
                            >
                                Back
                            </button>
                        </div>
                    ) : otpMethod === 'phone' ? (
                        <form onSubmit={(e) => { e.preventDefault(); handlePhoneSubmit(); }} className="form">
                            <label>
                                {t('auth.phone')}
                                <input 
                                    type="tel"
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    placeholder={t('auth.enterPhoneNumber')} 
                                    required 
                                    disabled={isSendingOTP}
                                    inputMode="tel"
                                    autoComplete="tel"
                                />
                            </label>
                            {error && <div className="error">{error}</div>}
                            <button 
                                type="submit" 
                                className="primary" 
                                disabled={isSendingOTP || !phone.trim()}
                            >
                                {isSendingOTP ? (
                                    <>
                                        <div className="otp-loading-spinner-small" style={{ marginRight: '8px' }}></div>
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    t('auth.sendOTP')
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleMethodSelectionBack}
                                className="secondary"
                                style={{ marginTop: '12px', width: '100%' }}
                                disabled={isSendingOTP}
                            >
                                {t('common.back')}
                            </button>
                        </form>
                    ) : null}
                </div>
                <AuthFooter />
            </div>
        );
    }

    return (
        <div className="auth-root">
            <div className="auth-gradient" aria-hidden="true" />
            <div className="auth-card">
                <h1 className="brand">Create account</h1>
                <p className="subtitle">Join Nobleco</p>
                <form onSubmit={onSubmit} className="form">
                    <label>
                        Name
                        <input 
                            type="text"
                            value={name} 
                            onChange={(e) => {
                                const value = e.target.value;
                                // Auto-uppercase the first letter of each word (including Vietnamese characters)
                                // Split by spaces and capitalize first letter of each word
                                const words = value.split(' ');
                                const formattedWords = words.map(word => {
                                    if (word.length === 0) return word;
                                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                                });
                                setName(formattedWords.join(' '));
                            }} 
                            placeholder="Your full name" 
                            required 
                        />
                    </label>
                    <label>
                        {t('auth.email')}
                        <input 
                            type="email"
                            value={email} 
                            onChange={(e) => {
                                // Normalize email to lowercase to prevent capitalization issues
                                const normalizedEmail = e.target.value.toLowerCase();
                                setEmail(normalizedEmail);
                            }} 
                            placeholder={t('auth.email')} 
                            required
                            autoCapitalize="off"
                            autoCorrect="off"
                            autoComplete="email"
                            spellCheck="false"
                            inputMode="email"
                        />
                    </label>
                    <label>
                        {t('auth.phone')} ({t('common.optional')})
                        <input 
                            type="tel"
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)} 
                            placeholder={t('auth.enterPhoneNumber') || 'Enter phone number (optional)'} 
                            inputMode="tel"
                            autoComplete="tel"
                        />
                    </label>
                    <label style={{ position: 'relative' }}>
                        {t('auth.password')}
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('auth.password')}
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle"
                            aria-label={showPassword ? t('common.close') : t('common.add')}
                        >
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </label>
                    <label style={{ position: 'relative' }}>
                        {t('auth.confirmPassword')}
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder={t('auth.password')}
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="password-toggle"
                            aria-label={showConfirm ? t('common.close') : t('common.add')}
                        >
                            {showConfirm ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </label>
                    <label>
                        {t('auth.referCode')} ({t('common.optional')})
                        <input 
                            type="text"
                            value={referCode} 
                            onChange={(e) => setReferCode(e.target.value.toUpperCase())} 
                            placeholder={t('auth.referCode')} 
                            maxLength={6}
                            style={{ textTransform: 'uppercase' }}
                        />
                    </label>
                    {error && <div className="error">{error}</div>}
                    <button type="submit" className="primary" disabled={isLoading}>
                        {isLoading ? t('common.loading') : t('auth.signup')}
                    </button>
                </form>
                <div className="auth-footer">
                    <span>{t('auth.alreadyHaveAccount')}</span>
                    <Link to="/login" className="auth-link">{t('auth.login')}</Link>
                </div>
            </div>
            <AuthFooter />
        </div>
    );
}
