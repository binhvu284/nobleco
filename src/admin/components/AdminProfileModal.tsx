export default function AdminProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const user = { avatar: '/images/logo.png', email: 'admin@example.com', name: 'Admin User', role: 'admin' };
    if (!open) return null;
    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="modal-card" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <span>Admin Profile</span>
                    <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
                </div>
                <div className="profile-grid">
                    <img className="profile-avatar" src={user.avatar} alt="avatar" />
                    <div>
                        <div className="field"><div className="label">Email</div><div className="value">{user.email}</div></div>
                        <div className="field"><div className="label">Name</div><div className="value">{user.name}</div></div>
                        <div className="field"><div className="label">Role</div><div className="value">{user.role}</div></div>
                    </div>
                </div>
            </div>
        </>
    );
}
