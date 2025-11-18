import { useNavigate } from 'react-router-dom';
import { logout } from '../../auth';
import { IconShield, IconLogout } from '../components/icons';

export default function AccessDenied() {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center',
            background: 'var(--bg-secondary)'
        }}>
            <div style={{
                background: 'white',
                padding: '48px',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                maxWidth: '500px',
                width: '100%'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    color: '#f59e0b'
                }}>
                    <IconShield style={{ width: '40px', height: '40px' }} />
                </div>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px'
                }}>
                    Access Denied
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: 'var(--muted)',
                    marginBottom: '32px',
                    lineHeight: '1.5'
                }}>
                    You don't have access to this page.
                </p>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--primary-hover)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'var(--primary)';
                    }}
                >
                    <IconLogout style={{ width: '18px', height: '18px' }} />
                    Logout
                </button>
            </div>
        </div>
    );
}

