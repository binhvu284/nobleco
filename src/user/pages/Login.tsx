import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../auth';

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('remember_username');
            if (saved) setUsername(saved);
        } catch { }
    }, []);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const ok = await login(username, password);
        if (ok) {
            try {
                if (remember) localStorage.setItem('remember_username', username);
                else localStorage.removeItem('remember_username');
            } catch { }
            navigate('/', { replace: true });
        }
        else setError('Invalid credentials');
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
                        Email or Username
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </label>
                    <div className="auth-row">
                        <label className="remember">
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                            <span>Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
                    </div>
                    {error && <div className="error">{error}</div>}
                    <button type="submit" className="primary">Sign In</button>
                </form>
                <div className="auth-footer">
                    <span>Don’t have account?</span>
                    <Link to="/signup" className="auth-link">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
