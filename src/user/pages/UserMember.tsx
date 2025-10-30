import { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
import { getCurrentUser } from '../../auth';

interface MemberData {
    id: number;
    name: string;
    email: string;
    level: string;
    refer_code: string;
    joined_date?: string;
    inferiors_count?: number;
    direct_commission?: number;
    indirect_commission?: number;
    inferiors_list?: MemberData[];
}

export default function UserMember() {
    const [superior, setSuperior] = useState<MemberData | null>(null);
    const [inferiors, setInferiors] = useState<MemberData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [selectedInferior, setSelectedInferior] = useState<MemberData | null>(null);
    const [loadingInferiors, setLoadingInferiors] = useState(false);
    const [removingInferior, setRemovingInferior] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    useEffect(() => {
        loadMemberData();
        
        // Refresh data when window gains focus (user comes back to the page)
        const handleFocus = () => {
            if (!loading) {
                // Only refresh if it's been more than 30 seconds since last refresh
                const now = new Date();
                if (!lastRefresh || (now.getTime() - lastRefresh.getTime()) > 30000) {
                    setRefreshing(true);
                    loadMemberData();
                }
            }
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.action-dropdown')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadMemberData = async (includeDetails = false) => {
        try {
            setLoading(true);
            const currentUser = getCurrentUser();
            
            if (!currentUser?.id) {
                setError('User not found');
                return;
            }

            // Fetch superior and inferiors data (only include details if needed)
            const url = includeDetails 
                ? `/api/users?endpoint=hierarchy&userId=${currentUser.id}&includeDetails=true`
                : `/api/users?endpoint=hierarchy&userId=${currentUser.id}`;
                
            const response = await fetch(url, {
                // Add cache headers for better performance (reduced for development)
                headers: {
                    'Cache-Control': 'max-age=30', // Cache for 30 seconds
                    // Add timestamp to bypass cache in development
                    ...(import.meta.env.DEV && { 'X-No-Cache': Date.now().toString() })
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch member data');
            }

            const data = await response.json();
            setSuperior(data.superior || null);
            setInferiors(data.inferiors || []);
        } catch (err) {
            console.error('Error loading member data:', err);
            setError('Failed to load member data');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLastRefresh(new Date());
        }
    };

    const getAvatarInitial = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        // Generate a consistent color based on the name
        const colors = [
            '#3b82f6', // blue
            '#8b5cf6', // purple
            '#ec4899', // pink
            '#f59e0b', // amber
            '#10b981', // emerald
            '#06b6d4', // cyan
            '#ef4444', // red
            '#6366f1', // indigo
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const getLevelBadgeClass = (level: string) => {
        return `badge badge-level-${level.replace(/\s+/g, '-')}`;
    };

    const getLevelDisplay = (level: string) => {
        if (level === 'unit manager') return 'Unit Manager';
        if (level === 'brand manager') return 'Brand Manager';
        return level.charAt(0).toUpperCase() + level.slice(1);
    };

    const handleDropdownToggle = (inferiorId: number) => {
        setActiveDropdown(activeDropdown === inferiorId ? null : inferiorId);
    };

    const handleDetailClick = async (inferior: MemberData) => {
        setSelectedInferior(inferior);
        setShowDetailModal(true);
        setActiveDropdown(null);
        setLoadingInferiors(true);
        
        // Fetch indirect inferiors and commission data for this specific inferior
        try {
            const response = await fetch(`/api/users?endpoint=hierarchy&userId=${inferior.id}&includeDetails=true`, {
                headers: {
                    'Cache-Control': 'max-age=30', // Cache for 30 seconds
                    // Add timestamp to bypass cache in development
                    ...(import.meta.env.DEV && { 'X-No-Cache': Date.now().toString() })
                }
            });
            if (response.ok) {
                const data = await response.json();
                const updatedInferior = {
                    ...inferior,
                    inferiors_list: data.inferiors || [],
                    direct_commission: data.inferiors?.reduce((sum: number, inf: any) => sum + (inf.direct_commission || 0), 0) || 0,
                    indirect_commission: data.inferiors?.reduce((sum: number, inf: any) => sum + (inf.indirect_commission || 0), 0) || 0
                };
                setSelectedInferior(updatedInferior);
            }
        } catch (err) {
            console.error('Error fetching inferior details:', err);
        } finally {
            setLoadingInferiors(false);
        }
    };

    const handleRemoveClick = (inferior: MemberData) => {
        setSelectedInferior(inferior);
        setShowRemoveModal(true);
        setActiveDropdown(null);
    };

    const handleRemoveConfirm = async () => {
        if (!selectedInferior) return;
        
        setRemovingInferior(true);
        setError(''); // Clear any previous errors
        
        try {
            console.log('Attempting to remove inferior with ID:', selectedInferior.id);
            
            // API call to remove inferior
            const response = await fetch(`/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inferiorId: selectedInferior.id
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Success response:', result);
                
                // Remove from local state
                setInferiors(prev => prev.filter(inf => inf.id !== selectedInferior.id));
                setShowRemoveModal(false);
                setSelectedInferior(null);
                
                // Show success message (you could add a toast notification here)
                console.log('Inferior removed successfully:', result.message);
            } else {
                console.log('Error response status:', response.status);
                const responseText = await response.text();
                console.log('Error response text:', responseText);
                
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.error || 'Failed to remove inferior');
                } catch (parseError) {
                    // If response is HTML (like a 404 page), provide a more user-friendly error
                    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
                        throw new Error('API endpoint not found. Please try again or contact support.');
                    }
                    throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}...`);
                }
            }
        } catch (err) {
            console.error('Error removing inferior:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove inferior');
            // Keep the modal open so user can try again
        } finally {
            setRemovingInferior(false);
        }
    };

    const handleModalClose = () => {
        setShowDetailModal(false);
        setShowRemoveModal(false);
        setSelectedInferior(null);
        setLoadingInferiors(false);
        setRemovingInferior(false);
        setError(''); // Clear any errors when closing modal
    };

    if (loading) {
        return (
            <UserLayout title="My Member">
                <div className="member-page loading">
                    {/* Superior Section Skeleton */}
                    <div className="member-section">
                        <div className="section-header">
                            <div className="section-title">
                                <div className="skeleton-icon"></div>
                                <div className="skeleton-text skeleton-title"></div>
                            </div>
                            <div className="skeleton-text skeleton-subtitle"></div>
                        </div>
                        <div className="member-card-compact superior-card">
                            <div className="skeleton-avatar"></div>
                            <div className="member-info-compact">
                                <div className="member-name-row">
                                    <div className="skeleton-text skeleton-name"></div>
                                    <div className="skeleton-badge"></div>
                                </div>
                                <div className="member-meta">
                                    <div className="skeleton-text skeleton-email"></div>
                                    <div className="skeleton-text skeleton-code"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inferiors Section Skeleton */}
                    <div className="member-section">
                        <div className="section-header">
                            <div className="section-title">
                                <div className="skeleton-icon"></div>
                                <div className="skeleton-text skeleton-title"></div>
                            </div>
                            <div className="skeleton-text skeleton-subtitle"></div>
                        </div>
                        <div className="inferiors-list">
                            {[1, 2, 3, 4, 5].map((index) => (
                                <div key={index} className="member-card-compact">
                                    <div className="skeleton-avatar"></div>
                                    <div className="member-info-compact">
                                        <div className="member-name-row">
                                            <div className="skeleton-text skeleton-name"></div>
                                            <div className="skeleton-badge"></div>
                                        </div>
                                        <div className="member-meta">
                                            <div className="skeleton-text skeleton-email"></div>
                                            <div className="skeleton-text skeleton-inferiors"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Loading Overlay */}
                    <div className="loading-overlay">
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                        </div>
                        <p className="loading-text">Loading your network...</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    if (error) {
        return (
            <UserLayout title="My Member">
                <div className="member-page">
                    <div style={{ textAlign: 'center', padding: '40px', color: '#b42318' }}>
                        {error}
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout title="My Member">
            <div className={`member-page loaded ${refreshing ? 'refreshing' : ''}`}>
                {/* Refresh Indicator */}
                {refreshing && (
                    <div className="refresh-indicator">
                        <div className="refresh-spinner"></div>
                        <span>Refreshing...</span>
                    </div>
                )}

                {/* Superior Section */}
                <div className="member-section">
                    <div className="section-header">
                        <div className="section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h2>My Superior</h2>
                        </div>
                        <span className="section-subtitle">The person who referred you</span>
                    </div>

                    {superior ? (
                        <div className="member-card-compact superior-card">
                            <div 
                                className="member-avatar-compact member-avatar-default"
                                style={{ backgroundColor: getAvatarColor(superior.name) }}
                            >
                                {getAvatarInitial(superior.name)}
                            </div>
                            <div className="member-info-compact">
                                <div className="member-name-row">
                                    <h3>{superior.name}</h3>
                                    <span className={getLevelBadgeClass(superior.level)}>
                                        {getLevelDisplay(superior.level)}
                                    </span>
                                </div>
                                <div className="member-meta">
                                    <span>{superior.email}</span>
                                    <span>•</span>
                                    <span>Code: <strong>{superior.refer_code}</strong></span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>You don't have a superior yet</p>
                            <span>You signed up without a referral code</span>
                        </div>
                    )}
                </div>

                {/* Inferiors Section */}
                <div className="member-section">
                    <div className="section-header">
                        <div className="section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h2>My Inferiors</h2>
                        </div>
                        <span className="section-subtitle">People you have referred ({inferiors.length})</span>
                    </div>

                    {inferiors.length > 0 ? (
                        <div className="inferiors-list">
                            {inferiors.map((inferior) => (
                                <div key={inferior.id} className="member-card-compact">
                                    <div 
                                        className="member-avatar-compact member-avatar-default"
                                        style={{ backgroundColor: getAvatarColor(inferior.name) }}
                                    >
                                        {getAvatarInitial(inferior.name)}
                                    </div>
                                    <div className="member-info-compact">
                                        <div className="member-name-row">
                                            <h3>{inferior.name}</h3>
                                            <span className={getLevelBadgeClass(inferior.level)}>
                                                {getLevelDisplay(inferior.level)}
                                            </span>
                                        </div>
                                        <div className="member-meta">
                                            <span>{inferior.email}</span>
                                            <span>•</span>
                                            <span className="inferiors-count">
                                                {inferior.inferiors_count} {inferior.inferiors_count === 1 ? 'inferior' : 'inferiors'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="action-dropdown">
                                        <button
                                            className="btn-more"
                                            onClick={() => handleDropdownToggle(inferior.id)}
                                            title="More Actions"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="1"/>
                                                <circle cx="19" cy="12" r="1"/>
                                                <circle cx="5" cy="12" r="1"/>
                                            </svg>
                                        </button>
                                        {activeDropdown === inferior.id && (
                                            <div className="dropdown-menu">
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => handleDetailClick(inferior)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                    Detail
                                                </button>
                                                <button
                                                    className="dropdown-item delete"
                                                    onClick={() => handleRemoveClick(inferior)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3,6 5,6 21,6"/>
                                                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                                    </svg>
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <p>You don't have any inferiors yet</p>
                            <span>Share your referral code to grow your network</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedInferior && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Inferior Details</h2>
                            <button className="modal-close" onClick={handleModalClose}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <div 
                                    className="member-avatar-large"
                                    style={{ backgroundColor: getAvatarColor(selectedInferior.name) }}
                                >
                                    {getAvatarInitial(selectedInferior.name)}
                                </div>
                                <div className="detail-info">
                                    <div className="detail-name-row">
                                        <h3>{selectedInferior.name}</h3>
                                        <span className={`detail-level ${getLevelBadgeClass(selectedInferior.level)}`}>
                                            {getLevelDisplay(selectedInferior.level)}
                                        </span>
                                    </div>
                                    <p className="detail-email">{selectedInferior.email}</p>
                                </div>
                            </div>

                            <div className="detail-stats">
                                <div className="stat-item">
                                    <div className="stat-label">Direct Commission</div>
                                    <div className="stat-value">${selectedInferior.direct_commission || 0}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">Indirect Commission</div>
                                    <div className="stat-value">${selectedInferior.indirect_commission || 0}</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-label">Total Commission</div>
                                    <div className="stat-value total">${(selectedInferior.direct_commission || 0) + (selectedInferior.indirect_commission || 0)}</div>
                                </div>
                            </div>

                            <div className="detail-inferiors">
                                <h4>Indirect Inferiors ({selectedInferior.inferiors_list?.length || 0})</h4>
                                {loadingInferiors ? (
                                    <div className="inferiors-loading">
                                        <div className="loading-spinner">
                                            <div className="spinner-ring"></div>
                                            <div className="spinner-ring"></div>
                                            <div className="spinner-ring"></div>
                                        </div>
                                        <p className="loading-text">Loading indirect inferiors...</p>
                                    </div>
                                ) : selectedInferior.inferiors_list && selectedInferior.inferiors_list.length > 0 ? (
                                    <div className="inferiors-mini-list">
                                        {selectedInferior.inferiors_list.map((subInferior) => (
                                            <div key={subInferior.id} className="mini-member-card">
                                                <div 
                                                    className="mini-avatar"
                                                    style={{ backgroundColor: getAvatarColor(subInferior.name) }}
                                                >
                                                    {getAvatarInitial(subInferior.name)}
                                                </div>
                                                <div className="mini-info">
                                                    <div className="mini-name-row">
                                                        <span className="mini-name">{subInferior.name}</span>
                                                        <span className={`mini-level ${getLevelBadgeClass(subInferior.level)}`}>
                                                            {getLevelDisplay(subInferior.level)}
                                                        </span>
                                                    </div>
                                                    <span className="mini-email">{subInferior.email}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-inferiors">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        <p>This member hasn't referred anyone yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Confirmation Modal */}
            {showRemoveModal && selectedInferior && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    <div className="modal-content alert-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Remove Inferior</h2>
                            <button className="modal-close" onClick={handleModalClose}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="alert-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                            </div>
                            <div className="alert-content">
                                <h3>Are you sure you want to remove this inferior?</h3>
                                <div className="alert-member">
                                    <div 
                                        className="alert-avatar"
                                        style={{ backgroundColor: getAvatarColor(selectedInferior.name) }}
                                    >
                                        {getAvatarInitial(selectedInferior.name)}
                                    </div>
                                    <div className="alert-member-info">
                                        <span className="alert-name">{selectedInferior.name}</span>
                                        <span className="alert-email">{selectedInferior.email}</span>
                                    </div>
                                </div>
                                <div className="alert-warning">
                                    <p><strong>Warning:</strong> When you remove this inferior, you will no longer receive commission from:</p>
                                    <ul>
                                        <li>This inferior's direct sales</li>
                                        <li>All sales from their inferiors (indirect commission)</li>
                                        <li>Any future sales from their network</li>
                                    </ul>
                                </div>
                                
                                {error && (
                                    <div className="alert-error">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="15" y1="9" x2="9" y2="15"/>
                                            <line x1="9" y1="9" x2="15" y2="15"/>
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary" 
                                onClick={handleModalClose}
                                disabled={removingInferior}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-danger" 
                                onClick={handleRemoveConfirm}
                                disabled={removingInferior}
                            >
                                {removingInferior ? (
                                    <>
                                        <div className="spinner-ring" style={{ width: '16px', height: '16px', marginRight: '8px' }}></div>
                                        Removing...
                                    </>
                                ) : (
                                    'Remove Inferior'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}

