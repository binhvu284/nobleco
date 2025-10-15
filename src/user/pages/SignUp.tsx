import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignUp() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

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
                    <label>
                        Password
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                    </label>
                    <label>
                        Confirm Password
                        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
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
