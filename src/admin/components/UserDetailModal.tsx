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
}

import { useState, useEffect } from 'react';

export default function UserDetailModal({ open, onClose, user }: UserDetailModalProps) {
    const [directInferiorsCount, setDirectInferiorsCount] = useState<number>(0);
    const [indirectInferiorsCount, setIndirectInferiorsCount] = useState<number>(0);
    const [superiorInfo, setSuperiorInfo] = useState<{ name: string; email?: string } | null>(null);
    const [loadingHierarchy, setLoadingHierarchy] = useState(false);

    useEffect(() => {
        if (open && user) {
            fetchHierarchyInfo();
        }
    }, [open, user]);

    const fetchHierarchyInfo = async () => {
        if (!user) return;
        
        setLoadingHierarchy(true);
        try {
            // Fetch hierarchy data with details to get indirect inferiors
            const response = await fetch(`/api/users/hierarchy?userId=${user.id}&includeDetails=true`);
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
                
                // The hierarchy API already returns the superior object with name
                if (data.superior) {
                    setSuperiorInfo({
                        name: data.superior.name || data.superior.email || 'Unknown',
                        email: data.superior.email
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
                            <img 
                                src="/images/logo.png" 
                                alt="avatar" 
                            />
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
                                    <span className="detail-label">Superior</span>
                                    <div className="detail-value">
                                        {loadingHierarchy ? (
                                            'Loading...'
                                        ) : superiorInfo ? (
                                            <div className="superior-info">
                                                <div className="superior-avatar">
                                                    {superiorInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </div>
                                                <span className="superior-name">{superiorInfo.name}</span>
                                            </div>
                                        ) : (
                                            'None'
                                        )}
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Number of Direct Inferiors</span>
                                    <span className="detail-value">{loadingHierarchy ? 'Loading...' : directInferiorsCount}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Number of Indirect Inferiors</span>
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

