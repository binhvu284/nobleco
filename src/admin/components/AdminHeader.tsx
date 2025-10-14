export default function AdminHeader() {
    return (
        <header className="admin-header">
            <div className="admin-page-title">Admin</div>
            <div className="admin-actions">
                <button className="secondary" onClick={() => (window.location.href = '/admin-dashboard')}>Dashboard</button>
                <div className="admin-account">
                    <button className="secondary">Profile</button>
                    <button className="secondary">Settings</button>
                    <button className="secondary" onClick={() => (window.location.href = '/')}>Logout</button>
                </div>
            </div>
        </header>
    );
}
