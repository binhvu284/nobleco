import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../../auth';

export default function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        // If user is already logged in, redirect to appropriate dashboard
        if (isAuthenticated()) {
            const role = getUserRole();
            if (role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [navigate]);

    return (
        <div className="home-root">
            <div className="navbar">
                <div className="brand">Nobleco</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="secondary" onClick={() => navigate('/login')}>Log in</button>
                    <button className="primary" onClick={() => navigate('/signup')}>Sign up</button>
                </div>
            </div>
            <section className="home-hero">
                <h1 className="home-title">Elevate your brand</h1>
                <p className="home-subtitle">A modern platform with a refined, luxury aesthetic. Simple. Fast. Delightful.</p>
                <div className="home-actions">
                    <button className="primary" onClick={() => navigate('/signup')}>Get started</button>
                    <button className="secondary" onClick={() => navigate('/login')}>I already have an account</button>
                </div>
            </section>
            <section className="home-panels">
                <div className="home-panel">
                    <h3>Beautiful by default</h3>
                    <p>Thoughtful design with soft shadows, rounded corners, and subtle gradients.</p>
                </div>
                <div className="home-panel">
                    <h3>Built for speed</h3>
                    <p>Vite + React ensures instant feedback and a smooth developer experience.</p>
                </div>
                <div className="home-panel">
                    <h3>Secure & flexible</h3>
                    <p>Decoupled API with Supabase-ready repository pattern for easy swaps.</p>
                </div>
            </section>
        </div>
    );
}
