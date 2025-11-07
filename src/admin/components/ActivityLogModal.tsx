import { useState, useEffect } from 'react';
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
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchActivities();
        }
    }, [open, productId]);

    const fetchActivities = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = productId 
                ? `/api/product-activities?productId=${productId}`
                : '/api/product-activities';
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch activity log');
            }
            const data = await response.json();
            setActivities(data || []);
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError(err instanceof Error ? err.message : 'Failed to load activity log');
        } finally {
            setLoading(false);
        }
    };

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
            <div className="modal-overlay" onClick={onClose} />
            <div className="activity-log-modal">
                <div className="activity-log-header">
                    <h2>Activity Log</h2>
                    <button className="modal-close" onClick={onClose}>
                        <IconX />
                    </button>
                </div>
                <div className="activity-log-content">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="loader" />
                            <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading activities...</p>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                            <p>{error}</p>
                            <button 
                                className="btn-primary" 
                                onClick={fetchActivities}
                                style={{ marginTop: '16px' }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : activities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            <IconClock style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }} />
                            <p>No activities found</p>
                        </div>
                    ) : (
                        <div className="activity-log-list">
                            {activities.map((activity) => (
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

