import { useState, useEffect } from 'react';
import { IconX } from './icons';
import { getAvatarInitial, getAvatarColor } from '../../utils/avatarUtils';

interface Client {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    gender?: 'Male' | 'Female' | 'Other';
    birthday: string | null;
    location: string | null;
    description: string | null;
    order_count: number;
    completed_orders_count?: number;
    created_by: number | null;
    created_by_user: {
        id: number;
        name: string;
        refer_code: string;
        avatar?: string;
    } | null;
    created_at: string;
    updated_at: string;
    avatar?: string;
}

interface ClientDetailModalProps {
    open: boolean;
    onClose: () => void;
    client: Client | null;
}

export default function ClientDetailModal({ open, onClose, client }: ClientDetailModalProps) {
    const [creatorAvatar, setCreatorAvatar] = useState<string | null>(null);
    const [loadingAvatar, setLoadingAvatar] = useState(false);

    useEffect(() => {
        if (open && client?.created_by_user?.id) {
            fetchCreatorAvatar();
        } else {
            setCreatorAvatar(null);
        }
    }, [open, client?.created_by_user?.id]);

    const fetchCreatorAvatar = async () => {
        if (!client?.created_by_user?.id) return;
        
        setLoadingAvatar(true);
        try {
            const response = await fetch(`/api/user-avatars?userId=${client.created_by_user.id}`);
            if (response.ok) {
                const avatarData = await response.json();
                if (avatarData?.url) {
                    setCreatorAvatar(avatarData.url);
                } else {
                    setCreatorAvatar(null);
                }
            }
        } catch (error) {
            console.error('Error fetching creator avatar:', error);
            setCreatorAvatar(null);
        } finally {
            setLoadingAvatar(false);
        }
    };

    if (!open || !client) return null;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateShort = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateAge = (birthday: string | null) => {
        if (!birthday) return null;
        const today = new Date();
        const birthDate = new Date(birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const age = calculateAge(client.birthday);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content client-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Client Details</h2>
                    <button className="modal-close" onClick={onClose}>
                        <IconX />
                    </button>
                </div>
                
                <div className="modal-body">
                    <div className="client-detail-info">
                        {/* Client Avatar & Name Section */}
                        <div className="client-detail-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div className="client-detail-avatar">
                                {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <h1 className="client-detail-name" style={{ margin: 0 }}>{client.name}</h1>
                        </div>

                        {/* Contact Information and Business Information - Side by Side */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {/* Contact Information */}
                            <div className="detail-section">
                                <h3 className="detail-section-title">Contact Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <div className="detail-label-wrapper">
                                            <label>Email</label>
                                        </div>
                                        <div className="detail-value-wrapper">
                                            <span className="detail-value-text" style={{ color: client.email ? 'inherit' : 'var(--muted)' }}>
                                                {client.email || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-label-wrapper">
                                            <label>Phone</label>
                                        </div>
                                        <div className="detail-value-wrapper">
                                            <span className="detail-value-text" style={{ color: client.phone ? 'inherit' : 'var(--muted)' }}>
                                                {client.phone || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-label-wrapper">
                                            <label>Gender</label>
                                        </div>
                                        <div className="detail-value-wrapper">
                                            <span className="detail-value-text" style={{ color: client.gender ? 'inherit' : 'var(--muted)' }}>
                                                {client.gender || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-label-wrapper">
                                            <label>Birthday</label>
                                        </div>
                                        <div className="detail-value-wrapper">
                                            <span className="detail-value-text" style={{ color: client.birthday ? 'inherit' : 'var(--muted)' }}>
                                                {client.birthday ? (
                                                    <>
                                                        {formatDateShort(client.birthday)}
                                                        {age !== null && <span className="age-badge"> ({age} years old)</span>}
                                                    </>
                                                ) : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-label-wrapper">
                                            <label>Location</label>
                                        </div>
                                        <div className="detail-value-wrapper">
                                            <span className="detail-value-text" style={{ color: client.location ? 'inherit' : 'var(--muted)' }}>
                                                {client.location || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Business Information */}
                            <div className="detail-section">
                                <h3 className="detail-section-title">Business Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <div className="detail-label-wrapper">
                                            <label>Orders Made</label>
                                        </div>
                                        <div className="detail-value-wrapper">
                                            <span className="orders-badge-large">{client.completed_orders_count || 0}</span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-label-wrapper">
                                            <label>Created By</label>
                                        </div>
                                        <div className="detail-value-wrapper">
                                            {client.created_by_user ? (
                                                <div className="created-by-info">
                                                    {creatorAvatar ? (
                                                        <img 
                                                            src={creatorAvatar} 
                                                            alt={client.created_by_user.name}
                                                            className="creator-avatar-img-modal"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const fallback = target.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className="creator-avatar-small"
                                                        style={{
                                                            display: creatorAvatar ? 'none' : 'flex',
                                                            backgroundColor: getAvatarColor(client.created_by_user.name)
                                                        }}
                                                    >
                                                        {getAvatarInitial(client.created_by_user.name)}
                                                    </div>
                                                    <div className="creator-details">
                                                        <div className="creator-name">{client.created_by_user.name}</div>
                                                        <div className="creator-refer-code">Ref: {client.created_by_user.refer_code}</div>
                                                    </div>
                                                </div>
                                            ) : <span className="detail-value-text">N/A</span>}
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-label-wrapper">
                                            <label>Created Date</label>
                                        </div>
                                        <div className="detail-value-wrapper">
                                            <span className="detail-value-text">{formatDate(client.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-label-wrapper">
                                            <label>Last Updated</label>
                                        </div>
                                        <div className="detail-value-wrapper">
                                            <span className="detail-value-text">{formatDate(client.updated_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="detail-section">
                            <h3 className="detail-section-title">Notes & Description</h3>
                            <div className="detail-description">
                                <p style={{ color: client.description ? 'inherit' : 'var(--muted)' }}>
                                    {client.description || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

