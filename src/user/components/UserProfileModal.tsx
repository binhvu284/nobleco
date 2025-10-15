export default function UserProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const user = { avatar: 'https://i.pravatar.cc/100?img=8', email: 'user@example.com', name: 'User', role: 'member' };
    if (!open) return null;
    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="modal-card" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <span>Your Profile</span>
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
