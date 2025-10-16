import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignUp() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        // Placeholder: In a real flow, call your signup API and then redirect
        navigate('/login', { replace: true });
    };

    return (
        <div className="auth-root">
            <div className="auth-gradient" aria-hidden="true" />
            <div className="auth-card">
                <h1 className="brand">Create account</h1>
                <p className="subtitle">Join Nobleco</p>
                <form onSubmit={onSubmit} className="form">
                    <label>
                        Email
                        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </label>
                    <label style={{ position: 'relative' }}>
                        Password
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
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
                            placeholder="••••••••"
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
                    {error && <div className="error">{error}</div>}
                    <button type="submit" className="primary">Sign Up</button>
                </form>
                <div className="auth-footer">
                    <span>Already have an account?</span>
                    <Link to="/login" className="auth-link">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
