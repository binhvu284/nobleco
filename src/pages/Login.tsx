import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, login } from '../auth';

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (isAuthenticated()) {
        navigate('/dashboard', { replace: true });
    }

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const ok = login(username, password);
        if (ok) {
            navigate('/dashboard', { replace: true });
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="container">
            <div className="card">
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
                    {error && <div className="error">{error}</div>}
                    <button type="submit" className="primary">Sign In</button>
                </form>
                <p className="hint">Use any non-empty credentials</p>
            </div>
        </div>
    );
}
