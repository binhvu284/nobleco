import { IconX, IconAlertTriangle } from './icons';

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export default function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    loading = false
}: ConfirmModalProps) {
    if (!open) return null;

    const handleConfirm = () => {
        if (!loading) {
            onConfirm();
        }
    };

    const handleCancel = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <>
            <div className="confirm-modal-overlay" onClick={handleCancel}></div>
            <div className="confirm-modal">
                <div className="confirm-modal-header">
                    <div className={`confirm-modal-icon ${type}`}>
                        <IconAlertTriangle />
                    </div>
                    <button 
                        className="confirm-modal-close"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        <IconX />
                    </button>
                </div>
                <div className="confirm-modal-content">
                    <h3 className="confirm-modal-title">{title}</h3>
                    <p className="confirm-modal-message">{message}</p>
                </div>
                <div className="confirm-modal-footer">
                    <button 
                        className="btn-confirm-cancel"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className={`btn-confirm-action ${type}`}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </>
    );
}

