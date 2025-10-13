import { useNavigate } from 'react-router-dom';
import { logout } from '../auth';

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    return (
        <div className="container">
            <div className="navbar">
                <div className="brand">Nobleco</div>
                <button className="secondary" onClick={handleLogout}>Log out</button>
            </div>
            <div className="content">
                <h2>Dashboard</h2>
                <p>Welcome! This is your dashboard. Replace this with your app content.</p>
                <div className="cards">
                    <div className="mini-card">Users: 128</div>
                    <div className="mini-card">Revenue: $3,420</div>
                    <div className="mini-card">Uptime: 99.9%</div>
                </div>
            </div>
        </div>
    );
}
