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
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [referCode, setReferCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // OTP verification state
    const [showOTPVerification, setShowOTPVerification] = useState(false);
    const [signupData, setSignupData] = useState<{ phone: string; userId: number; email: string; password: string } | null>(null);

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

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password,
                    referCode: referCode.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to create account');
                setIsLoading(false);
                return;
            }

            // Check if OTP verification is required
            if (data.requiresVerification && data.user) {
                setSignupData({
                    phone: data.phone,
                    userId: data.user.id,
                    email: email,
                    password: password
                });
                setShowOTPVerification(true);
                setIsLoading(false);
            } else {
                // If no verification needed (shouldn't happen), redirect to login
                navigate('/login', { 
                    replace: true, 
                    state: { message: 'Account created successfully! Please log in.' }
                });
            }
        } catch (err) {
            setError('Failed to connect to server. Please try again.');
            setIsLoading(false);
        }
    };

    const handleOTPSuccess = () => {
        // OTP verified and user logged in - redirect to dashboard
        navigate('/dashboard', { replace: true });
    };

    const handleOTPBack = () => {
        setShowOTPVerification(false);
        setSignupData(null);
    };

    // Show OTP verification screen if needed
    if (showOTPVerification && signupData) {
        return (
            <OTPVerification
                phone={signupData.phone}
                userId={signupData.userId}
                email={signupData.email}
                password={signupData.password}
                onSuccess={handleOTPSuccess}
                onBack={handleOTPBack}
            />
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
                        {isLoading ? 'Creating account...' : 'Sign Up'}
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
