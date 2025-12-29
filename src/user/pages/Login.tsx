import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, isAuthenticated, getUserRole, getCurrentUser } from '../../auth';
import AuthFooter from '../../components/AuthFooter';
import { useTranslation } from '../../shared/contexts/TranslationContext';

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

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
            const currentUser = getCurrentUser();
            if (role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            } else if (role === 'coworker' && currentUser?.id) {
                // For coworkers, find the first page they have access to
                (async () => {
                    try {
                        const authToken = localStorage.getItem('nobleco_auth_token');
                        const permissionsResponse = await fetch(`/api/coworker-permissions?coworkerId=${currentUser.id}`, {
                            headers: {
                                'Authorization': `Bearer ${authToken}`
                            }
                        });
                        if (permissionsResponse.ok) {
                            const permissions = await permissionsResponse.json();
                            if (Array.isArray(permissions) && permissions.length > 0) {
                                const pageOrder = [
                                    '/admin-dashboard',
                                    '/admin-clients',
                                    '/admin-products',
                                    '/admin-categories',
                                    '/admin-orders',
                                    '/admin-commission',
                                    '/admin-request',
                                    '/admin-discount',
                                    '/admin-users',
                                    '/admin-admin-users'
                                ];
                                const permissionPaths = permissions.map((p: any) => p.page_path);
                                const firstAccessiblePage = pageOrder.find(page => permissionPaths.includes(page)) || permissionPaths[0];
                                navigate(firstAccessiblePage, { replace: true });
                            } else {
                                navigate('/admin-access-denied', { replace: true });
                            }
                        } else {
                            navigate('/admin-dashboard', { replace: true });
                        }
                    } catch (error) {
                        console.error('Error fetching coworker permissions:', error);
                        navigate('/admin-dashboard', { replace: true });
                    }
                })();
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
        
        // Normalize email to lowercase if it's an email (contains @)
        // Keep phone numbers as-is
        const normalizedEmail = email.includes('@') ? email.trim().toLowerCase() : email.trim();
        
        const result = await login(normalizedEmail, password);
        setIsLoading(false);
        
        if (result.success && result.user) {
            try {
                // Store normalized email if it's an email
                if (remember) {
                    const emailToStore = normalizedEmail.includes('@') ? normalizedEmail : email;
                    localStorage.setItem('remember_email', emailToStore);
                } else {
                    localStorage.removeItem('remember_email');
                }
            } catch { }
            
            // Redirect based on user role
            if (result.user.role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            } else if (result.user.role === 'coworker') {
                // For coworkers, find the first page they have access to
                try {
                    const authToken = localStorage.getItem('nobleco_auth_token');
                    const permissionsResponse = await fetch(`/api/coworker-permissions?coworkerId=${result.user.id}`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    if (permissionsResponse.ok) {
                        const permissions = await permissionsResponse.json();
                        if (Array.isArray(permissions) && permissions.length > 0) {
                            // Find the first accessible page (prioritize dashboard, then others)
                            const pageOrder = [
                                '/admin-dashboard',
                                '/admin-clients',
                                '/admin-products',
                                '/admin-categories',
                                '/admin-orders',
                                '/admin-commission',
                                '/admin-request',
                                '/admin-discount',
                                '/admin-users',
                                '/admin-admin-users'
                            ];
                            const permissionPaths = permissions.map((p: any) => p.page_path);
                            const firstAccessiblePage = pageOrder.find(page => permissionPaths.includes(page)) || permissionPaths[0];
                            navigate(firstAccessiblePage, { replace: true });
                        } else {
                            // No permissions, redirect to access denied
                            navigate('/admin-access-denied', { replace: true });
                        }
                    } else {
                        // Error fetching permissions, try dashboard first
                        navigate('/admin-dashboard', { replace: true });
                    }
                } catch (error) {
                    console.error('Error fetching coworker permissions:', error);
                    // Fallback to dashboard
                    navigate('/admin-dashboard', { replace: true });
                }
            } else {
                navigate('/dashboard', { replace: true });
            }
        } else {
            setError(result.error || t('auth.invalidCredentials'));
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
                <p className="subtitle">{t('auth.login')}</p>
                <form onSubmit={onSubmit} className="form">
                    <label>
                        {t('auth.email')} {t('common.or')} {t('auth.phone')}
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Normalize email to lowercase if it contains @ (email format)
                                // Keep phone numbers as-is
                                const normalizedValue = value.includes('@') ? value.toLowerCase() : value;
                                setEmail(normalizedValue);
                            }}
                            placeholder={`${t('auth.email')} ${t('common.or')} ${t('auth.phone')}`}
                            required
                            autoCapitalize="off"
                            autoCorrect="off"
                            autoComplete="username"
                            spellCheck="false"
                            inputMode="text"
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
                    <div className="auth-row">
                        <label className="remember">
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                            <span>{t('auth.rememberMe')}</span>
                        </label>
                        <Link to="/forgot-password" className="auth-link">{t('auth.forgotPassword')}</Link>
                    </div>
                    {success && <div className="success">{success}</div>}
                    {error && <div className="error">{error}</div>}
                    <button type="submit" className="primary" disabled={isLoading}>
                        {isLoading ? t('common.loading') : t('auth.login')}
                    </button>
                </form>
                <div className="auth-footer">
                    <span>{t('auth.dontHaveAccount')}</span>
                    <Link to="/signup" className="auth-link">{t('auth.signup')}</Link>
                </div>
            </div>
            <AuthFooter />
        </div>
    );
}
