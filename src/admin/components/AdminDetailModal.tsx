import { useState, useEffect } from 'react';
import { getAvatarInitial, getAvatarColor, getAvatarViewportStyles } from '../../utils/avatarUtils';

interface AdminDetailModalProps {
    open: boolean;
    onClose: () => void;
    admin: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        role: 'admin' | 'coworker';
        status?: string;
        created_at?: string;
    } | null;
}

export default function AdminDetailModal({ open, onClose, admin }: AdminDetailModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [avatar, setAvatar] = useState<{ url: string; viewport_x?: number | null; viewport_y?: number | null; viewport_size?: number | null; width?: number | null; height?: number | null } | null>(null);
    const [showAvatarExpanded, setShowAvatarExpanded] = useState(false);
    const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

    useEffect(() => {
        if (open && admin) {
            loadUserAvatar(admin.id);
        } else {
            setAvatar(null);
        }
    }, [open, admin]);

    const loadUserAvatar = async (userId: number) => {
        try {
            const response = await fetch(`/api/user-avatars?userId=${userId}`);
            if (response.ok) {
                const avatarData = await response.json();
                if (avatarData?.url) {
                    setAvatar(avatarData);
                } else {
                    setAvatar(null);
                }
            }
        } catch (error) {
            console.error('Error loading avatar:', error);
            setAvatar(null);
        }
    };

    if (!open || !admin) return null;

    const hasAvatar = avatar && avatar.url;
    const roleDisplay = admin.role === 'admin' ? 'Administrator' : 'Co-worker';
    const statusDisplay = admin.status || 'active';

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="profile-modal-card" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <span>Admin Details</span>
                    <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
                </div>
                
                {isLoading ? (
                    <div className="profile-loading">
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                        </div>
                        <p>Loading profile...</p>
                    </div>
                ) : (
                    <div className="profile-content">
                        {/* Avatar Section */}
                        <div className="profile-avatar-section">
                            <div 
                                className="profile-avatar-wrapper" 
                                style={{ 
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '16px'
                                }}
                                onMouseEnter={() => hasAvatar && setIsHoveringAvatar(true)}
                                onMouseLeave={() => setIsHoveringAvatar(false)}
                            >
                                {hasAvatar ? (
                                    <img 
                                        className="profile-avatar-large" 
                                        src={avatar.url} 
                                        alt={admin.name || admin.email}
                                        style={getAvatarViewportStyles(avatar, 120)}
                                        onError={() => setAvatar(null)}
                                    />
                                ) : (
                                    <div 
                                        className="profile-avatar-large"
                                        style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            backgroundColor: getAvatarColor(admin.name || admin.email),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '48px',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            flexShrink: 0
                                        }}
                                    >
                                        {getAvatarInitial(admin.name || 'Admin')}
                                    </div>
                                )}
                                {hasAvatar && isHoveringAvatar && (
                                    <button
                                        className="avatar-view-btn"
                                        onClick={() => setShowAvatarExpanded(true)}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            background: 'rgba(0, 0, 0, 0.7)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            transition: 'all 0.2s ease',
                                            zIndex: 10
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        View
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Profile Information */}
                        <div className="profile-info-grid">
                            {/* Account Information */}
                            <div className="profile-section">
                                <h3 className="profile-section-title">Account Information</h3>
                                <div className="profile-fields">
                                    <div className="profile-field">
                                        <label>Email</label>
                                        <div className="profile-field-value email-display">{admin.email}</div>
                                    </div>
                                    <div className="profile-field">
                                        <label>Phone Number</label>
                                        <div className="profile-field-value email-display">{admin.phone || 'Not set'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div className="profile-section">
                                <h3 className="profile-section-title">Personal Information</h3>
                                <div className="profile-fields">
                                    <div className="profile-field">
                                        <label>Name</label>
                                        <div className="profile-field-value">{admin.name || 'Not set'}</div>
                                    </div>
                                    <div className="profile-field">
                                        <label>Role</label>
                                        <div className="profile-field-value role-display">{roleDisplay}</div>
                                    </div>
                                    {admin.status && (
                                        <div className="profile-field">
                                            <label>Status</label>
                                            <div className="profile-field-value">
                                                <span className={`status-badge ${statusDisplay}`}>
                                                    {statusDisplay}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {admin.created_at && (
                                        <div className="profile-field">
                                            <label>Created At</label>
                                            <div className="profile-field-value">
                                                {new Date(admin.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Avatar Expanded Modal */}
            {showAvatarExpanded && avatar?.url && (
                <div className="modal-overlay personal-id-expanded-overlay" onClick={() => setShowAvatarExpanded(false)}>
                    <div className="personal-id-expanded-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="personal-id-expanded-header">
                            <h3>Avatar</h3>
                            <button className="modal-close" onClick={() => setShowAvatarExpanded(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="personal-id-expanded-content">
                            <img 
                                src={avatar.url} 
                                alt="User avatar"
                                className="personal-id-expanded-image"
                                style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

