import { IconX, IconClock } from './icons';

interface ActivityLog {
    id: number;
    action: 'create' | 'update' | 'delete';
    product_id: number;
    product_name: string;
    user_id: number;
    user_name: string;
    changes?: Record<string, { old: any; new: any }>;
    created_at: string;
}

interface ActivityLogModalProps {
    open: boolean;
    onClose: () => void;
    productId?: number;
}

export default function ActivityLogModal({ open, onClose, productId }: ActivityLogModalProps) {
    // Mock data for UI demonstration
    const mockActivities: ActivityLog[] = [
        {
            id: 1,
            action: 'create',
            product_id: 1,
            product_name: 'Nhẫn 01R0125203',
            user_id: 1,
            user_name: 'General Admin',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            action: 'update',
            product_id: 1,
            product_name: 'Nhẫn 01R0125203',
            user_id: 1,
            user_name: 'General Admin',
            changes: {
                price: { old: '100000000', new: '114400000' },
                stock: { old: '5', new: '0' }
            },
            created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 3,
            action: 'update',
            product_id: 2,
            product_name: 'Vòng tay 02B0125204',
            user_id: 1,
            user_name: 'General Admin',
            changes: {
                status: { old: 'inactive', new: 'active' }
            },
            created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 4,
            action: 'delete',
            product_id: 3,
            product_name: 'Nhẫn cũ 03R0125205',
            user_id: 1,
            user_name: 'General Admin',
            created_at: new Date(Date.now() - 86400000).toISOString()
        }
    ];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'create':
                return '#10b981';
            case 'update':
                return '#3b82f6';
            case 'delete':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'create':
                return 'Created';
            case 'update':
                return 'Updated';
            case 'delete':
                return 'Deleted';
            default:
                return action;
        }
    };

    if (!open) return null;

    return (
        <>
            <div className="modal-overlay active" onClick={onClose} />
            <div className="activity-log-modal">
                <div className="activity-log-header">
                    <h2>Activity Log</h2>
                    <button className="modal-close" onClick={onClose}>
                        <IconX />
                    </button>
                </div>
                <div className="activity-log-content">
                    {mockActivities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            <IconClock style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }} />
                            <p>No activities found</p>
                        </div>
                    ) : (
                        <div className="activity-log-list">
                            {mockActivities.map((activity) => (
                                <div key={activity.id} className="activity-log-item">
                                    <div className="activity-log-item-header">
                                        <div className="activity-log-action-badge" style={{ backgroundColor: `${getActionColor(activity.action)}20`, color: getActionColor(activity.action) }}>
                                            {getActionLabel(activity.action)}
                                        </div>
                                        <span className="activity-log-time">
                                            <IconClock style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                            {formatDate(activity.created_at)}
                                        </span>
                                    </div>
                                    <div className="activity-log-item-body">
                                        <p className="activity-log-product">
                                            <strong>Product:</strong> {activity.product_name}
                                        </p>
                                        <p className="activity-log-user">
                                            <strong>User:</strong> {activity.user_name}
                                        </p>
                                        {activity.changes && Object.keys(activity.changes).length > 0 && (
                                            <div className="activity-log-changes">
                                                <strong>Changes:</strong>
                                                <ul>
                                                    {Object.entries(activity.changes).map(([field, change]) => (
                                                        <li key={field}>
                                                            <strong>{field}:</strong> {JSON.stringify(change.old)} → {JSON.stringify(change.new)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

