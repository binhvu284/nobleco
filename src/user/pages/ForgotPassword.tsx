import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        // Placeholder: Normally send reset link via API
        setSent(true);
    };

    return (
        <div className="auth-root">
            <div className="auth-gradient" aria-hidden="true" />
            <div className="auth-card">
                <h1 className="brand">Reset password</h1>
                <p className="subtitle">We’ll send you a reset link</p>
                {sent ? (
                    <div className="success">If an account exists for {email}, a reset link has been sent.</div>
                ) : (
                    <form onSubmit={onSubmit} className="form">
                        <label>
                            Email
                            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                        </label>
                        <button type="submit" className="primary">Send reset link</button>
                    </form>
                )}
                <div className="auth-footer">
                    <span>Remembered it?</span>
                    <Link to="/login" className="auth-link">Back to sign in</Link>
                </div>
            </div>
        </div>
    );
}
