import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

export default function AdminProfile() {
    const [open, setOpen] = useState(true);
    const user = {
        avatar: '/images/logo.png',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
    };

    return (
        <AdminLayout title="Profile">
            {open && <div className="modal-overlay" onClick={() => setOpen(false)} />}
            {open && (
                <div className="modal-card" role="dialog" aria-modal="true">
                    <div className="modal-header">
                        <span>Admin Profile</span>
                        <button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
                    </div>
                    <div className="profile-grid">
                        <img className="profile-avatar" src={user.avatar} alt="avatar" />
                        <div>
                            <div className="field">
                                <div className="label">Email</div>
                                <div className="value">{user.email}</div>
                            </div>
                            <div className="field">
                                <div className="label">Name</div>
                                <div className="value">{user.name}</div>
                            </div>
                            <div className="field">
                                <div className="label">Role</div>
                                <div className="value">{user.role}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <p>Profile popup is open by default. Click outside or ✕ to close.</p>
        </AdminLayout>
    );
}
