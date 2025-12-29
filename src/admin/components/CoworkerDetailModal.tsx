import { useState, useEffect } from 'react';
import { getAvatarInitial, getAvatarColor, getAvatarViewportStyles } from '../../utils/avatarUtils';
import { IconX, IconSettings, IconPlay, IconPause, IconLoader } from './icons';
import { useTranslation } from '../../shared/contexts/TranslationContext';

interface CoworkerDetailModalProps {
    open: boolean;
    onClose: () => void;
    coworker: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        role: 'coworker';
        status: 'active' | 'inactive';
        created_at?: string;
    } | null;
    onStatusToggle?: (coworkerId: number, currentStatus: string) => Promise<void>;
    onEditPermissions?: (coworker: any) => void;
}

export default function CoworkerDetailModal({ 
    open, 
    onClose, 
    coworker, 
    onStatusToggle,
    onEditPermissions 
}: CoworkerDetailModalProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [avatar, setAvatar] = useState<{ url: string; viewport_x?: number | null; viewport_y?: number | null; viewport_size?: number | null; width?: number | null; height?: number | null } | null>(null);
    const [showAvatarExpanded, setShowAvatarExpanded] = useState(false);
    const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
    const [permissions, setPermissions] = useState<Array<{ page_path: string; page_name: string }>>([]);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        if (open && coworker) {
            loadUserAvatar(coworker.id);
            loadPermissions(coworker.id);
        } else {
            setAvatar(null);
            setPermissions([]);
        }
    }, [open, coworker]);

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

    const loadPermissions = async (coworkerId: number) => {
        setLoadingPermissions(true);
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/coworker-permissions?coworkerId=${coworkerId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setPermissions(data);
                }
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
        } finally {
            setLoadingPermissions(false);
        }
    };

    const handleStatusToggle = async () => {
        if (!coworker || !onStatusToggle) return;
        setStatusUpdating(true);
        try {
            await onStatusToggle(coworker.id, coworker.status);
            // Reload permissions in case status change affects them
            await loadPermissions(coworker.id);
        } catch (error) {
            console.error('Error toggling status:', error);
        } finally {
            setStatusUpdating(false);
        }
    };

    if (!open || !coworker) return null;

    const hasAvatar = avatar && avatar.url;
    const statusDisplay = coworker.status || 'active';

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="profile-modal-card" role="dialog" aria-modal="true" style={{ maxWidth: '900px', width: '90%' }}>
                <div className="modal-header">
                    <span>{t('adminAdminUsers.coworkerDetails')}</span>
                    <button className="modal-close" aria-label={t('common.close')} onClick={onClose}>✕</button>
                </div>
                
                {isLoading ? (
                    <div className="profile-loading">
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                        </div>
                        <p>{t('adminAdminUsers.loadingProfile')}</p>
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
                                        alt={coworker.name || coworker.email}
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
                                            backgroundColor: getAvatarColor(coworker.name || coworker.email),
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
                                        {getAvatarInitial(coworker.name || t('adminAdminUsers.coworkers'))}
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
                                        {t('common.view')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Profile Information */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                            {/* Account Information - Left Side */}
                            <div className="profile-section">
                                <h3 className="profile-section-title">{t('profile.accountInformation')}</h3>
                                <div className="profile-fields">
                                    <div className="profile-field">
                                        <label>{t('users.name')}</label>
                                        <div className="profile-field-value">{coworker.name || t('settings.notSet')}</div>
                                    </div>
                                    <div className="profile-field">
                                        <label>{t('profile.email')}</label>
                                        <div className="profile-field-value email-display">{coworker.email}</div>
                                    </div>
                                    <div className="profile-field">
                                        <label>{t('profile.phoneNumber')}</label>
                                        <div className="profile-field-value email-display">{coworker.phone || t('settings.notSet')}</div>
                                    </div>
                                    <div className="profile-field">
                                        <label>{t('users.status')}</label>
                                        <div className="profile-field-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span className={`status-badge ${statusDisplay}`}>
                                                {statusDisplay}
                                            </span>
                                            {onStatusToggle && (
                                                <button
                                                    onClick={handleStatusToggle}
                                                    disabled={statusUpdating}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 12px',
                                                        background: statusDisplay === 'active' ? '#fee2e2' : '#d1fae5',
                                                        color: statusDisplay === 'active' ? '#dc2626' : '#059669',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500',
                                                        cursor: statusUpdating ? 'not-allowed' : 'pointer',
                                                        opacity: statusUpdating ? 0.6 : 1,
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {statusUpdating ? (
                                                        <>
                                                            <IconLoader className="animate-spin" style={{ width: '14px', height: '14px' }} />
                                                            {t('common.updating')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {statusDisplay === 'active' ? (
                                                                <>
                                                                    <IconPause style={{ width: '14px', height: '14px' }} />
                                                                    {t('adminUsers.deactivate')}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <IconPlay style={{ width: '14px', height: '14px' }} />
                                                                    {t('adminUsers.activate')}
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {coworker.created_at && (
                                        <div className="profile-field">
                                            <label>{t('adminAdminUsers.createdAt')}</label>
                                            <div className="profile-field-value">
                                                {new Date(coworker.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Permissions - Right Side */}
                            <div className="profile-section">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <h3 className="profile-section-title" style={{ margin: 0 }}>{t('adminAdminUsers.currentPermissions')}</h3>
                                    {onEditPermissions && (
                                        <button
                                            onClick={() => {
                                                onEditPermissions(coworker);
                                                onClose();
                                            }}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--primary-dark)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'var(--primary)';
                                            }}
                                        >
                                            <IconSettings style={{ width: '14px', height: '14px' }} />
                                            {t('common.edit')}
                                        </button>
                                    )}
                                </div>
                                <div className="profile-fields">
                                    {loadingPermissions ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                                            <IconLoader className="animate-spin" style={{ width: '20px', height: '20px', marginBottom: '8px' }} />
                                            <div>{t('adminAdminUsers.loadingPermissions')}</div>
                                        </div>
                                    ) : permissions.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                                            {t('adminAdminUsers.noPermissionsAssigned')}
                                        </div>
                                    ) : (
                                        <div style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: '8px',
                                            maxHeight: '400px',
                                            overflowY: 'auto',
                                            padding: '4px'
                                        }}>
                                            {permissions.map((permission, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: '10px 12px',
                                                        background: 'var(--bg-secondary)',
                                                        borderRadius: '6px',
                                                        fontSize: '0.875rem',
                                                        color: 'var(--text-primary)',
                                                        border: '1px solid var(--border)'
                                                    }}
                                                >
                                                    {permission.page_name}
                                                </div>
                                            ))}
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
                            <h3>{t('profile.avatar')}</h3>
                            <button className="modal-close" onClick={() => setShowAvatarExpanded(false)}>
                                <IconX />
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

