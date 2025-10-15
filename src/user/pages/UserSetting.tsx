import { useState } from 'react';
import UserLayout from '../components/UserLayout';

export default function UserSetting() {
    const [open, setOpen] = useState(true);
    return (
        <UserLayout title="Settings">
            {open && <div className="modal-overlay" onClick={() => setOpen(false)} />}
            {open && (
                <div className="modal-card" role="dialog" aria-modal="true">
                    <div className="modal-header">
                        <span>User Settings</span>
                        <button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
                    </div>
                    <p className="muted">Coming soon...</p>
                </div>
            )}
            <p>Settings popup is open by default. Click outside or ✕ to close.</p>
        </UserLayout>
    );
}
