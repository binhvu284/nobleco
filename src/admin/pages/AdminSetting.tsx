import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

export default function AdminSetting() {
    const [open, setOpen] = useState(true);
    return (
        <AdminLayout title="Settings">
            {open && <div className="modal-overlay" onClick={() => setOpen(false)} />}
            {open && (
                <div className="modal-card" role="dialog" aria-modal="true">
                    <div className="modal-header">
                        <span>Admin Settings</span>
                        <button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
                    </div>
                    <p className="muted">Coming soon...</p>
                </div>
            )}
            <p>Settings popup is open by default. Click outside or ✕ to close.</p>
        </AdminLayout>
    );
}
