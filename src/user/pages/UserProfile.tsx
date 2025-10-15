import { useState } from 'react';
import UserLayout from '../components/UserLayout';

export default function UserProfile() {
    const [open, setOpen] = useState(true);
    const user = {
        avatar: 'https://i.pravatar.cc/100?img=8',
        email: 'user@example.com',
        name: 'User',
        role: 'member',
    };

    return (
        <UserLayout title="Profile">
            {open && <div className="modal-overlay" onClick={() => setOpen(false)} />}
            {open && (
                <div className="modal-card" role="dialog" aria-modal="true">
                    <div className="modal-header">
                        <span>Your Profile</span>
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
        </UserLayout>
    );
}
