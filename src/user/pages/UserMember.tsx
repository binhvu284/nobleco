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
}

export default function UserMember() {
    const [superior, setSuperior] = useState<MemberData | null>(null);
    const [inferiors, setInferiors] = useState<MemberData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMemberData();
        
        // Refresh data when window gains focus (user comes back to the page)
        const handleFocus = () => {
            loadMemberData();
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const loadMemberData = async () => {
        try {
            setLoading(true);
            const currentUser = getCurrentUser();
            
            if (!currentUser?.id) {
                setError('User not found');
                return;
            }

            // Fetch superior and inferiors data
            const response = await fetch(`/api/users/hierarchy?userId=${currentUser.id}`);
            
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

    if (loading) {
        return (
            <UserLayout title="My Member">
                <div className="member-page">
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                        Loading member data...
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
            <div className="member-page">
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
        </UserLayout>
    );
}

