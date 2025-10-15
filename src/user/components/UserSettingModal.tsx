export default function UserSettingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="modal-card" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <span>User Settings</span>
                    <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
                </div>
                <p className="muted">Coming soon...</p>
            </div>
        </>
    );
}
