export default function AdminHeader() {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>Admin Area</div>
            <nav style={{ display: 'flex', gap: 8 }}>
                <a href="/admin-dashboard" className="secondary">Dashboard</a>
                {/* Future admin links here, e.g., /admin-users, /admin-settings */}
            </nav>
        </div>
    );
}
