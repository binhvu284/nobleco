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

export default function UserDetailModal({ open, onClose, user, onEditReferrer }: UserDetailModalProps) {
    const [directInferiorsCount, setDirectInferiorsCount] = useState<number>(0);
    const [indirectInferiorsCount, setIndirectInferiorsCount] = useState<number>(0);
    const [superiorInfo, setSuperiorInfo] = useState<{ name: string; email?: string; avatar?: string } | null>(null);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [loadingHierarchy, setLoadingHierarchy] = useState(false);
    const [loadingAvatar, setLoadingAvatar] = useState(false);

    useEffect(() => {
        if (open && user) {
            fetchHierarchyInfo();
            fetchUserAvatar();
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
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getLevelDisplay = (level?: string) => {
        if (!level) return 'Guest';
        if (level === 'unit manager') return 'Unit Manager';
        if (level === 'brand manager') return 'Brand Manager';
        if (level === 'member') return 'Member';
        return 'Guest';
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="profile-modal-card user-detail-modal" role="dialog" aria-modal="true">
                <div className="modal-header">
                    <span>User Details</span>
                    <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
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
                                <span className="user-points">⭐ {user.points || 0} Points</span>
                            </div>
                            <div className="user-detail-info">
                                <span className="info-item">
                                    <strong>ID:</strong> {user.id}
                                </span>
                                <span className="info-separator">•</span>
                                <span className="info-item">
                                    <strong>Joined:</strong> {formatDate(user.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Three Column Grid Layout */}
                    <div className="user-detail-grid">
                        {/* Account Information */}
                        <div className="detail-group">
                            <h4>Account Information</h4>
                            <div className="detail-list">
                                <div className="detail-row">
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">{user.email}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Phone</span>
                                    <span className="detail-value">{user.phone || 'Not set'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Address</span>
                                    <span className="detail-value">{user.address || 'Not set'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Hierarchy */}
                        <div className="detail-group">
                            <h4>Hierarchy</h4>
                            <div className="detail-list">
                                <div className="detail-row">
                                    <span className="detail-label">Senior Consultant</span>
                                    <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}>
                                        {loadingHierarchy ? (
                                            'Loading...'
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
                                                        title="Edit Referrer"
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
                                                <span>None</span>
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
                                                        title="Add Referrer"
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
                                    <span className="detail-label">Direct Junior Advisors</span>
                                    <span className="detail-value">{loadingHierarchy ? 'Loading...' : directInferiorsCount}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Indirect Junior Advisors</span>
                                    <span className="detail-value">{loadingHierarchy ? 'Loading...' : indirectInferiorsCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Referral Information */}
                        <div className="detail-group">
                            <h4>Referral Information</h4>
                            <div className="detail-list">
                                <div className="detail-row">
                                    <span className="detail-label">Refer Code</span>
                                    <div className="refer-code-display">
                                        <code>{user.refer_code || 'N/A'}</code>
                                        {user.refer_code && (
                                            <button 
                                                className="copy-btn" 
                                                onClick={copyReferCode}
                                                title="Copy refer code"
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
                                    <p className="qr-code-hint">Scan to signup with this code</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

