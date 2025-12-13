import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import OTPVerification from '../components/OTPVerification';
import AuthFooter from '../../components/AuthFooter';

export default function SignUp() {
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
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
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
            setError('Phone number is required');
            return;
        }
        await sendOTP('phone');
    };

    const sendOTP = async (method: 'phone' | 'email') => {
        setIsSendingOTP(true);
        setError('');

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    phone: method === 'phone' ? phone : undefined,
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
            setSignupData({
                phone: method === 'phone' ? (data.phone || phone) : undefined,
                email: email,
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                                <button
                                    type="button"
                                    onClick={() => handleOTPMethodSelect('phone')}
                                    disabled={isSendingOTP}
                                    style={{
                                        padding: '16px',
                                        border: '2px solid #007bff',
                                        borderRadius: '8px',
                                        background: '#f0f8ff',
                                        cursor: isSendingOTP ? 'not-allowed' : 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#007bff',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        opacity: isSendingOTP ? 0.6 : 1
                                    }}
                                >
                                    📱 Phone Number
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOTPMethodSelect('email')}
                                    disabled={isSendingOTP}
                                    style={{
                                        padding: '16px',
                                        border: '2px solid #007bff',
                                        borderRadius: '8px',
                                        background: '#f0f8ff',
                                        cursor: isSendingOTP ? 'not-allowed' : 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#007bff',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        opacity: isSendingOTP ? 0.6 : 1
                                    }}
                                >
                                    {isSendingOTP ? (
                                        <>
                                            <div style={{ width: '16px', height: '16px', border: '2px solid #007bff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                            Sending code...
                                        </>
                                    ) : (
                                        <>✉️ Email Address</>
                                    )}
                                </button>
                            </div>
                            {error && <div className="error" style={{ marginTop: '16px' }}>{error}</div>}
                            {isSendingOTP && !error && (
                                <div style={{ marginTop: '16px', textAlign: 'center', color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <div style={{ width: '14px', height: '14px', border: '2px solid #666', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                    Sending verification code to your email...
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
                                Phone Number
                                <input 
                                    type="tel"
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    placeholder="Enter your phone number" 
                                    required 
                                    disabled={isSendingOTP}
                                />
                            </label>
                            {error && <div className="error">{error}</div>}
                            <button 
                                type="submit" 
                                className="primary" 
                                disabled={isSendingOTP || !phone.trim()}
                            >
                                {isSendingOTP ? 'Sending code...' : 'Send Verification Code'}
                            </button>
                            <button
                                type="button"
                                onClick={handleMethodSelectionBack}
                                className="secondary"
                                style={{ marginTop: '12px', width: '100%' }}
                                disabled={isSendingOTP}
                            >
                                Back
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
                        Email
                        <input 
                            type="email"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="you@example.com" 
                            required 
                        />
                    </label>
                    <label style={{ position: 'relative' }}>
                        Password
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="your password"
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                        Confirm Password
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="your password"
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="password-toggle"
                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
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
                        Refer Code (Optional)
                        <input 
                            type="text"
                            value={referCode} 
                            onChange={(e) => setReferCode(e.target.value.toUpperCase())} 
                            placeholder="Enter referral code if you have one" 
                            maxLength={6}
                            style={{ textTransform: 'uppercase' }}
                        />
                    </label>
                    {error && <div className="error">{error}</div>}
                    <button type="submit" className="primary" disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Sign Up'}
                    </button>
                </form>
                <div className="auth-footer">
                    <span>Already have an account?</span>
                    <Link to="/login" className="auth-link">Sign in</Link>
                </div>
            </div>
            <AuthFooter />
        </div>
    );
}
