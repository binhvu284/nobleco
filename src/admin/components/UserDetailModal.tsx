interface UserDetailModalProps {
    open: boolean;
    onClose: () => void;
    user: {
        id: string | number;
        name?: string;
        email: string;
        phone?: string;
        address?: string;
        role?: string;
        level?: string;
        points?: number;
        status?: string;
        created_at?: string;
        refer_code?: string;
        referred_by?: string | number;
    } | null;
    onEditReferrer?: (userId: string | number, userName: string) => void;
}

import { useState, useEffect } from 'react';
import { getAvatarInitial, getAvatarColor } from '../../utils/avatarUtils';
import { useTranslation } from '../../shared/contexts/TranslationContext';

export default function UserDetailModal({ open, onClose, user, onEditReferrer }: UserDetailModalProps) {
    const { t } = useTranslation();
    const [directInferiorsCount, setDirectInferiorsCount] = useState<number>(0);
    const [indirectInferiorsCount, setIndirectInferiorsCount] = useState<number>(0);
    const [superiorInfo, setSuperiorInfo] = useState<{ name: string; email?: string; avatar?: string } | null>(null);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [loadingHierarchy, setLoadingHierarchy] = useState(false);
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [personalID, setPersonalID] = useState<{
        front_image_url?: string;
        back_image_url?: string;
        verified?: boolean;
    } | null>(null);
    const [showPersonalIDExpanded, setShowPersonalIDExpanded] = useState<{ type: 'front' | 'back' } | null>(null);
    const [loadingPersonalID, setLoadingPersonalID] = useState(false);

    useEffect(() => {
        if (open && user) {
            fetchHierarchyInfo();
            fetchUserAvatar();
            fetchPersonalID();
        }
    }, [open, user]);
    
    const fetchUserAvatar = async () => {
        if (!user?.id) return;
        setLoadingAvatar(true);
        try {
            const response = await fetch(`/api/user-avatars?userId=${user.id}`);
            if (response.ok) {
                const avatarData = await response.json();
                if (avatarData?.url) {
                    setUserAvatar(avatarData.url);
                } else {
                    setUserAvatar(null);
                }
            }
        } catch (error) {
            console.error('Error fetching user avatar:', error);
            setUserAvatar(null);
        } finally {
            setLoadingAvatar(false);
        }
    };

    const fetchPersonalID = async () => {
        if (!user?.id) return;
        setLoadingPersonalID(true);
        try {
            const token = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/user-personal-ids?userId=${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data && (data.front_image_url || data.back_image_url)) {
                    setPersonalID(data);
                } else {
                    setPersonalID(null);
                }
            }
        } catch (error) {
            console.error('Error fetching personal ID:', error);
            setPersonalID(null);
        } finally {
            setLoadingPersonalID(false);
        }
    };

    const fetchHierarchyInfo = async () => {
        if (!user) return;
        
        setLoadingHierarchy(true);
        try {
            // Fetch hierarchy data with details to get indirect inferiors
            const response = await fetch(`/api/users?endpoint=hierarchy&userId=${user.id}&includeDetails=true`);
            if (response.ok) {
                const data = await response.json();
                
                // Count direct inferiors
                const directCount = data.inferiors?.length || 0;
                setDirectInferiorsCount(directCount);
                
                // Count indirect inferiors (all inferiors of direct inferiors)
                let indirectCount = 0;
                if (data.inferiors) {
                    data.inferiors.forEach((inferior: any) => {
                        if (inferior.inferiors_list) {
                            indirectCount += inferior.inferiors_list.length;
                        }
                    });
                }
                setIndirectInferiorsCount(indirectCount);
                
                // The hierarchy API already returns the superior object with name and avatar
                if (data.superior) {
                    setSuperiorInfo({
                        name: data.superior.name || data.superior.email || 'Unknown',
                        email: data.superior.email,
                        avatar: data.superior.avatar || null
                    });
                } else {
                    setSuperiorInfo(null);
                }
            }
        } catch (error) {
            console.error('Error fetching hierarchy info:', error);
            setDirectInferiorsCount(0);
            setIndirectInferiorsCount(0);
            setSuperiorInfo(null);
        } finally {
            setLoadingHierarchy(false);
        }
    };

    const generateQRCodeUrl = (referCode: string) => {
        const baseUrl = window.location.origin;
        const signupUrl = `${baseUrl}/signup?ref=${referCode}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(signupUrl)}`;
    };

    const copyReferCode = () => {
        if (user?.refer_code) {
            navigator.clipboard.writeText(user.refer_code);
        }
    };

    if (!open || !user) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return t('common.notAvailable');
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getLevelDisplay = (level?: string) => {
        if (!level) return t('adminUsers.guest');
        if (level === 'unit manager') return t('adminUsers.unitManager');
        if (level === 'brand manager') return t('adminUsers.brandManager');
        if (level === 'member') return t('adminUsers.member');
        return t('adminUsers.guest');
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="profile-modal-card user-detail-modal" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <span>{t('adminUsers.userDetails')}</span>
                    <button className="modal-close" aria-label={t('common.close')} onClick={onClose}>✕</button>
                </div>
                
                <div className="profile-content">
                    {/* Compact Header with Avatar and Basic Info */}
                    <div className="user-detail-header">
                        <div className="user-detail-avatar">
                            {userAvatar ? (
                                <img 
                                    src={userAvatar} 
                                    alt={user.name || user.email}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent && user.name) {
                                            const fallback = document.createElement('div');
                                            fallback.style.cssText = `
                                                width: 80px;
                                                height: 80px;
                                                border-radius: 50%;
                                                background-color: ${getAvatarColor(user.name)};
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                color: white;
                                                font-size: 32px;
                                                font-weight: 600;
                                                text-transform: uppercase;
                                            `;
                                            fallback.textContent = getAvatarInitial(user.name);
                                            parent.appendChild(fallback);
                                        }
                                    }}
                                />
                            ) : (
                                <div 
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        backgroundColor: getAvatarColor(user.name || user.email),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '32px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {getAvatarInitial(user.name || user.email)}
                                </div>
                            )}
                        </div>
                        <div className="user-detail-basic">
                            <h3>{user.name || user.email}</h3>
                            <div className="user-detail-meta">
                                <span className={`level-badge level-${user.level?.replace(/\s+/g, '-')}`}>
                                    {getLevelDisplay(user.level)}
                                </span>
                                <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                                    {user.status || 'inactive'}
                                </span>
                                <span className="user-points">⭐ {user.points || 0} {t('adminUsers.points')}</span>
                            </div>
                            <div className="user-detail-info">
                                <span className="info-item">
                                    <strong>{t('adminUsers.id')}:</strong> {user.id}
                                </span>
                                <span className="info-separator">•</span>
                                <span className="info-item">
                                    <strong>{t('adminUsers.joined')}:</strong> {formatDate(user.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Three Column Grid Layout */}
                    <div className="user-detail-grid">
                        {/* Account Information */}
                        <div className="detail-group">
                            <h4>{t('adminUsers.accountInformation')}</h4>
                            <div className="detail-list">
                                <div className="detail-row">
                                    <span className="detail-label">{t('users.email')}</span>
                                    <span className="detail-value">{user.email}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('users.phone')}</span>
                                    <span className="detail-value">{user.phone || t('settings.notSet')}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('profile.address')}</span>
                                    <span className="detail-value">{user.address || t('settings.notSet')}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('profile.country')}</span>
                                    <span className="detail-value">{(user as any).country || t('settings.notSet')}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('profile.stateProvinceCity')}</span>
                                    <span className="detail-value">{(user as any).state || t('settings.notSet')}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('adminUsers.personalID')}</span>
                                    <div className="detail-value" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {loadingPersonalID ? (
                                            <span>{t('common.loading')}</span>
                                        ) : personalID && (personalID.front_image_url || personalID.back_image_url) ? (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {personalID.front_image_url && (
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <img 
                                                            src={personalID.front_image_url}
                                                            alt={t('adminUsers.frontSide')}
                                                            style={{
                                                                width: '80px',
                                                                height: '50px',
                                                                objectFit: 'cover',
                                                                borderRadius: '6px',
                                                                border: '2px solid var(--border)',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => setShowPersonalIDExpanded({ type: 'front' })}
                                                        />
                                                        <button
                                                            onClick={() => setShowPersonalIDExpanded({ type: 'front' })}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '4px',
                                                                right: '4px',
                                                                width: '20px',
                                                                height: '20px',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                background: 'rgba(255, 255, 255, 0.9)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                padding: 0
                                                            }}
                                                            title={t('adminUsers.expandFrontImage')}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <polyline points="9 21 3 21 3 15" />
                                                                <line x1="21" y1="3" x2="14" y2="10" />
                                                                <line x1="3" y1="21" x2="10" y2="14" />
                                                            </svg>
                                                        </button>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>{t('adminUsers.front')}</div>
                                                    </div>
                                                )}
                                                {personalID.back_image_url && (
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <img 
                                                            src={personalID.back_image_url}
                                                            alt={t('adminUsers.backSide')}
                                                            style={{
                                                                width: '80px',
                                                                height: '50px',
                                                                objectFit: 'cover',
                                                                borderRadius: '6px',
                                                                border: '2px solid var(--border)',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => setShowPersonalIDExpanded({ type: 'back' })}
                                                        />
                                                        <button
                                                            onClick={() => setShowPersonalIDExpanded({ type: 'back' })}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '4px',
                                                                right: '4px',
                                                                width: '20px',
                                                                height: '20px',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                background: 'rgba(255, 255, 255, 0.9)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                padding: 0
                                                            }}
                                                            title={t('adminUsers.expandBackImage')}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <polyline points="9 21 3 21 3 15" />
                                                                <line x1="21" y1="3" x2="14" y2="10" />
                                                                <line x1="3" y1="21" x2="10" y2="14" />
                                                            </svg>
                                                        </button>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center' }}>{t('adminUsers.back')}</div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span>{t('adminUsers.notUploaded')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hierarchy */}
                        <div className="detail-group">
                            <h4>{t('adminUsers.hierarchy')}</h4>
                            <div className="detail-list">
                                <div className="detail-row">
                                    <span className="detail-label">{t('adminUsers.seniorJewelryConsultant')}</span>
                                    <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}>
                                        {loadingHierarchy ? (
                                            t('common.loading')
                                        ) : superiorInfo ? (
                                            <>
                                                <div className="superior-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    {superiorInfo.avatar ? (
                                                        <img 
                                                            className="superior-avatar"
                                                            src={superiorInfo.avatar}
                                                            alt={superiorInfo.name}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                objectFit: 'cover'
                                                            }}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const parent = target.parentElement;
                                                                if (parent) {
                                                                    const fallback = document.createElement('div');
                                                                    fallback.className = 'superior-avatar';
                                                                    fallback.style.cssText = `
                                                                        width: 32px;
                                                                        height: 32px;
                                                                        border-radius: 50%;
                                                                        background-color: ${getAvatarColor(superiorInfo.name)};
                                                                        display: flex;
                                                                        align-items: center;
                                                                        justify-content: center;
                                                                        color: white;
                                                                        font-size: 14px;
                                                                        font-weight: 600;
                                                                        text-transform: uppercase;
                                                                    `;
                                                                    fallback.textContent = getAvatarInitial(superiorInfo.name);
                                                                    parent.appendChild(fallback);
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div 
                                                            className="superior-avatar"
                                                            style={{
                                                                backgroundColor: getAvatarColor(superiorInfo.name),
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                fontSize: '14px',
                                                                fontWeight: 600,
                                                                textTransform: 'uppercase'
                                                            }}
                                                        >
                                                            {getAvatarInitial(superiorInfo.name)}
                                                        </div>
                                                    )}
                                                    <span className="superior-name">{superiorInfo.name}</span>
                                                </div>
                                                {onEditReferrer && (
                                                    <button
                                                        onClick={() => {
                                                            if (user) {
                                                                onEditReferrer(user.id, user.name || user.email);
                                                            }
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#6b7280',
                                                            borderRadius: '4px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#f3f4f6';
                                                            e.currentTarget.style.color = '#3b82f6';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = '#6b7280';
                                                        }}
                                                        title={t('adminUsers.editReferrer')}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <span>{t('adminUsers.none')}</span>
                                                {onEditReferrer && (
                                                    <button
                                                        onClick={() => {
                                                            if (user) {
                                                                onEditReferrer(user.id, user.name || user.email);
                                                            }
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#6b7280',
                                                            borderRadius: '4px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#f3f4f6';
                                                            e.currentTarget.style.color = '#10b981';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = '#6b7280';
                                                        }}
                                                        title={t('adminUsers.addReferrer')}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="12" y1="5" x2="12" y2="19" />
                                                            <line x1="5" y1="12" x2="19" y2="12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('adminUsers.directJewelryAdvisors')}</span>
                                    <span className="detail-value">{loadingHierarchy ? t('common.loading') : directInferiorsCount}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">{t('adminUsers.indirectJewelryAdvisors')}</span>
                                    <span className="detail-value">{loadingHierarchy ? t('common.loading') : indirectInferiorsCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Referral Information */}
                        <div className="detail-group">
                            <h4>{t('adminUsers.referralInformation')}</h4>
                            <div className="detail-list">
                                <div className="detail-row">
                                    <span className="detail-label">{t('profile.referCode')}</span>
                                    <div className="refer-code-display">
                                        <code>{user.refer_code || t('common.notAvailable')}</code>
                                        {user.refer_code && (
                                            <button 
                                                className="copy-btn" 
                                                onClick={copyReferCode}
                                                title={t('profile.copyReferCode')}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {user.refer_code && (
                                <div className="qr-code-section">
                                    <div className="qr-code-wrapper">
                                        <img 
                                            src={generateQRCodeUrl(user.refer_code)} 
                                            alt="QR Code"
                                            className="qr-code-image"
                                        />
                                    </div>
                                    <p className="qr-code-hint">{t('adminUsers.scanToSignup')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal ID Expanded Modal */}
            {showPersonalIDExpanded && personalID && (
                <div className="modal-overlay personal-id-expanded-overlay" onClick={() => setShowPersonalIDExpanded(null)}>
                    <div className="personal-id-expanded-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="personal-id-expanded-header">
                            <h3>{showPersonalIDExpanded.type === 'front' ? t('adminUsers.frontSide') : t('adminUsers.backSide')} - {t('adminUsers.personalID')}</h3>
                            <button className="modal-close" onClick={() => setShowPersonalIDExpanded(null)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="personal-id-expanded-content">
                            <img 
                                src={showPersonalIDExpanded.type === 'front' ? personalID.front_image_url : personalID.back_image_url} 
                                alt={`${showPersonalIDExpanded.type === 'front' ? 'Front' : 'Back'} side of personal ID`}
                                className="personal-id-expanded-image"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

