import { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';

type StatCard = {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    color: string;
};

type RecentActivity = {
    id: number;
    type: 'commission' | 'order' | 'client' | 'withdrawal';
    description: string;
    amount?: number;
    date: string;
    status?: 'completed' | 'pending' | 'processing';
};

type QuickAction = {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
};

export default function UserDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Sample data - will be replaced with real data later
    const userStats: StatCard[] = [
        {
            title: 'Total Earnings',
            value: '$2,450.00',
            change: '+12.5%',
            trend: 'up',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
            ),
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        {
            title: 'Available Balance',
            value: '$1,250.00',
            change: '+$180',
            trend: 'up',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
            ),
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        },
        {
            title: 'Total Clients',
            value: 24,
            change: '+3',
            trend: 'up',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            ),
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        },
        {
            title: 'Orders This Month',
            value: 18,
            change: '+5',
            trend: 'up',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
            ),
            color: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)'
        }
    ];

    const recentActivities: RecentActivity[] = [
        {
            id: 1,
            type: 'commission',
            description: 'Commission from order #12345 (Direct)',
            amount: 50.00,
            date: '2 hours ago',
            status: 'completed'
        },
        {
            id: 2,
            type: 'client',
            description: 'New client added: Sarah Johnson',
            date: '4 hours ago',
            status: 'completed'
        },
        {
            id: 3,
            type: 'order',
            description: 'Order #12346 completed',
            amount: 299.00,
            date: '6 hours ago',
            status: 'completed'
        },
        {
            id: 4,
            type: 'withdrawal',
            description: 'Withdrawal request submitted',
            amount: -500.00,
            date: '1 day ago',
            status: 'pending'
        },
        {
            id: 5,
            type: 'commission',
            description: 'Commission from order #12344 (Level 1)',
            amount: 20.00,
            date: '2 days ago',
            status: 'completed'
        }
    ];

    const quickActions: QuickAction[] = [
        {
            title: 'Add New Client',
            description: 'Store client information',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8.-2" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
            ),
            href: '/client',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        {
            title: 'View Orders',
            description: 'Manage your orders',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
            ),
            href: '/orders',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        },
        {
            title: 'Withdraw Funds',
            description: 'Request withdrawal',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
            ),
            href: '/wallet',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        },
        {
            title: 'My Network',
            description: 'View your members',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <path d="M20 8v6"/>
                    <path d="M23 11h-6"/>
                </svg>
            ),
            href: '/member',
            color: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)'
        }
    ];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'commission':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                );
            case 'order':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                );
            case 'client':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                );
            case 'withdrawal':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <polyline points="19 12 12 19 5 12"/>
                    </svg>
                );
            default:
                return null;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'commission':
                return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            case 'order':
                return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
            case 'client':
                return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            case 'withdrawal':
                return 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)';
            default:
                return '#e0e0e0';
        }
    };

    return (
        <UserLayout title="Dashboard">
            <div className="user-dashboard">
                {/* Welcome Section */}
                <div className="dashboard-welcome">
                    <div className="welcome-content">
                        <h1>Welcome back!</h1>
                        <p>Here's what's happening with your business today</p>
                        <div className="current-time">
                            {currentTime.toLocaleString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                    <div className="welcome-avatar">
                        <div className="avatar-circle">
                            <span>JS</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    {userStats.map((stat, index) => (
                        <div key={index} className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon" style={{ background: stat.color }}>
                                    {stat.icon}
                                </div>
                                <div className="stat-trend">
                                    {stat.trend === 'up' && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                                            <polyline points="17 6 23 6 23 12"/>
                                        </svg>
                                    )}
                                    {stat.trend === 'down' && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                                            <polyline points="17 18 23 18 23 12"/>
                                        </svg>
                                    )}
                                    <span className={`trend-${stat.trend}`}>{stat.change}</span>
                                </div>
                            </div>
                            <div className="stat-content">
                                <h3>{stat.value}</h3>
                                <p>{stat.title}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="dashboard-grid">
                    {/* Recent Activities */}
                    <div className="activity-section">
                        <div className="section-header">
                            <h2>Recent Activities</h2>
                            <button className="view-all-btn">View All</button>
                        </div>
                        <div className="activity-list">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="activity-item">
                                    <div 
                                        className="activity-icon"
                                        style={{ background: getActivityColor(activity.type) }}
                                    >
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="activity-content">
                                        <p className="activity-description">{activity.description}</p>
                                        <div className="activity-meta">
                                            <span className="activity-date">{activity.date}</span>
                                            {activity.amount && (
                                                <span className={`activity-amount ${activity.amount > 0 ? 'positive' : 'negative'}`}>
                                                    {activity.amount > 0 ? '+' : ''}${Math.abs(activity.amount).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {activity.status && (
                                        <div className={`activity-status status-${activity.status}`}>
                                            {activity.status}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions-section">
                        <div className="section-header">
                            <h2>Quick Actions</h2>
                        </div>
                        <div className="quick-actions-grid">
                            {quickActions.map((action, index) => (
                                <a key={index} href={action.href} className="quick-action-card">
                                    <div 
                                        className="action-icon"
                                        style={{ background: action.color }}
                                    >
                                        {action.icon}
                                    </div>
                                    <div className="action-content">
                                        <h3>{action.title}</h3>
                                        <p>{action.description}</p>
                                    </div>
                                    <div className="action-arrow">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                            <polyline points="12 5 19 12 12 19"/>
                                        </svg>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Summary */}
                <div className="performance-section">
                    <div className="section-header">
                        <h2>This Month's Performance</h2>
                    </div>
                    <div className="performance-grid">
                        <div className="performance-card">
                            <h3>Commission Earned</h3>
                            <div className="performance-value">$420.00</div>
                            <div className="performance-change positive">+15% from last month</div>
                        </div>
                        <div className="performance-card">
                            <h3>New Clients</h3>
                            <div className="performance-value">8</div>
                            <div className="performance-change positive">+3 from last month</div>
                        </div>
                        <div className="performance-card">
                            <h3>Orders Completed</h3>
                            <div className="performance-value">18</div>
                            <div className="performance-change positive">+5 from last month</div>
                        </div>
                        <div className="performance-card">
                            <h3>Network Growth</h3>
                            <div className="performance-value">12</div>
                            <div className="performance-change positive">+4 new referrals</div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
