import { useState } from 'react';
import { IconX } from './icons';

interface Client {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    birthday: string | null;
    location: string | null;
    description: string | null;
    order_count: number;
    created_by: number | null;
    created_by_user: {
        id: number;
        name: string;
        refer_code: string;
    } | null;
    created_at: string;
    updated_at: string;
}

interface ClientDetailModalProps {
    open: boolean;
    onClose: () => void;
    client: Client | null;
}

export default function ClientDetailModal({ open, onClose, client }: ClientDetailModalProps) {
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
                        <div className="client-detail-header">
                            <div className="client-detail-avatar">
                                {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div className="client-detail-header-info">
                                <h1 className="client-detail-name">{client.name}</h1>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="detail-section">
                            <h3 className="detail-section-title">Contact Information</h3>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <div className="detail-label-wrapper">
                                        <label>Email</label>
                                    </div>
                                    <div className="detail-value-wrapper">
                                        <span className="detail-value-text">{client.email || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-label-wrapper">
                                        <label>Phone</label>
                                    </div>
                                    <div className="detail-value-wrapper">
                                        <span className="detail-value-text">{client.phone || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-label-wrapper">
                                        <label>Birthday</label>
                                    </div>
                                    <div className="detail-value-wrapper">
                                        <span className="detail-value-text">
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
                                        <span className="detail-value-text">{client.location || 'N/A'}</span>
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
                                        <span className="orders-badge-large">{client.order_count}</span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-label-wrapper">
                                        <label>Created By</label>
                                    </div>
                                    <div className="detail-value-wrapper">
                                        {client.created_by_user ? (
                                            <div className="created-by-info">
                                                <div className="creator-avatar-small">
                                                    {client.created_by_user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
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

                        {/* Description */}
                        {client.description && (
                            <div className="detail-section">
                                <h3 className="detail-section-title">Notes & Description</h3>
                                <div className="detail-description">
                                    <p>{client.description}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

