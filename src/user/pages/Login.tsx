import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, isAuthenticated, getUserRole } from '../../auth';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // If already logged in, redirect to appropriate dashboard
        if (isAuthenticated()) {
            const role = getUserRole();
            if (role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
            return;
        }

        // Check for success message from signup
        if (location.state?.message) {
            setSuccess(location.state.message);
            // Clear the state
            window.history.replaceState({}, document.title);
        }

        try {
            const saved = localStorage.getItem('remember_email');
            if (saved) setEmail(saved);
        } catch { }
    }, [navigate, location]);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        const result = await login(email, password);
        setIsLoading(false);
        
        if (result.success && result.user) {
            try {
                if (remember) localStorage.setItem('remember_email', email);
                else localStorage.removeItem('remember_email');
            } catch { }
            
            // Redirect based on user role
            if (result.user.role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        } else {
            setError(result.error || 'Invalid credentials');
        }
    };

    return (
        <div className="auth-root">
            <div className="auth-gradient" aria-hidden="true" />
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/images/logo.png" width={64} height={64} alt="Nobleco" />
                </div>
                <h1 className="brand">Nobleco</h1>
                <p className="subtitle">Sign in to continue</p>
                <form onSubmit={onSubmit} className="form">
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
                    <div className="auth-row">
                        <label className="remember">
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                            <span>Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
                    </div>
                    {success && <div className="success">{success}</div>}
                    {error && <div className="error">{error}</div>}
                    <button type="submit" className="primary" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <div className="auth-footer">
                    <span>Don’t have account?</span>
                    <Link to="/signup" className="auth-link">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
