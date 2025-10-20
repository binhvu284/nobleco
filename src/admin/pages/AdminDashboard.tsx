import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

type StatTrend = 'up' | 'down' | 'neutral';

export default function AdminDashboard() {
    const navigate = useNavigate();

    // Sample dashboard data
    const stats = {
        totalUsers: { value: 1247, trend: 'up' as StatTrend, change: 12 },
        activeUsers: { value: 892, trend: 'up' as StatTrend, change: 8 },
        totalRevenue: { value: 125840, trend: 'up' as StatTrend, change: 15 },
        pendingWithdraw: { value: 12450, trend: 'neutral' as StatTrend, change: 0 },
        totalOrders: { value: 3456, trend: 'up' as StatTrend, change: 22 },
        totalCommission: { value: 45680, trend: 'up' as StatTrend, change: 18 },
    };

    const levelDistribution = [
        { level: 'Guest', count: 450, color: '#94a3b8', percentage: 36 },
        { level: 'Member', count: 520, color: '#3b82f6', percentage: 42 },
        { level: 'Unit Manager', count: 210, color: '#8b5cf6', percentage: 17 },
        { level: 'Brand Manager', count: 67, color: '#f59e0b', percentage: 5 },
    ];

    const recentWithdrawals = [
        { id: 1, user: 'John Doe', level: 'member', amount: 500, status: 'pending', date: '2024-01-15' },
        { id: 2, user: 'Jane Smith', level: 'unit manager', amount: 1000, status: 'pending', date: '2024-01-14' },
        { id: 3, user: 'Mike Johnson', level: 'brand manager', amount: 2000, status: 'approved', date: '2024-01-10' },
    ];

    const topPerformers = [
        { id: 1, name: 'Sarah Wilson', level: 'brand manager', orders: 45, commission: 4500, avatar: 'SW' },
        { id: 2, name: 'Tom Brown', level: 'unit manager', orders: 38, commission: 3800, avatar: 'TB' },
        { id: 3, name: 'Alice Green', level: 'member', orders: 32, commission: 2400, avatar: 'AG' },
        { id: 4, name: 'Bob White', level: 'member', orders: 28, commission: 2100, avatar: 'BW' },
        { id: 5, name: 'Carol Black', level: 'unit manager', orders: 25, commission: 2800, avatar: 'CB' },
    ];

    const recentActivities = [
        { id: 1, type: 'user', message: 'New user registered', user: 'David Lee', time: '5 min ago' },
        { id: 2, type: 'order', message: 'Order completed', user: 'Emma Davis', time: '12 min ago' },
        { id: 3, type: 'withdraw', message: 'Withdrawal request', user: 'Frank Miller', time: '28 min ago' },
        { id: 4, type: 'level', message: 'Level upgraded to Member', user: 'Grace Taylor', time: '1 hour ago' },
        { id: 5, type: 'commission', message: 'Commission earned', user: 'Henry Clark', time: '2 hours ago' },
    ];

    const getTrendIcon = (trend: StatTrend) => {
        if (trend === 'up') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                </svg>
            );
        }
        if (trend === 'down') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                    <polyline points="17 18 23 18 23 12" />
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        );
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'user':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                );
            case 'order':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                );
            case 'withdraw':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                );
            case 'level':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                    </svg>
                );
            case 'commission':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getLevelColor = (level: string) => {
        const colors: Record<string, string> = {
            'guest': '#94a3b8',
            'member': '#3b82f6',
            'unit manager': '#8b5cf6',
            'brand manager': '#f59e0b'
        };
        return colors[level] || '#94a3b8';
    };

    return (
        <AdminLayout title="Dashboard">
            <div className="dashboard-page">
                {/* Main Stats Grid */}
                <div className="dashboard-stats-grid">
                    <div className="dashboard-stat-card">
                        <div className="stat-header">
                            <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="stat-trend">
                                {getTrendIcon(stats.totalUsers.trend)}
                                <span className={`trend-${stats.totalUsers.trend}`}>+{stats.totalUsers.change}%</span>
                            </div>
                        </div>
                        <div className="stat-body">
                            <div className="stat-value">{stats.totalUsers.value.toLocaleString()}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-header">
                            <div className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                </svg>
                            </div>
                            <div className="stat-trend">
                                {getTrendIcon(stats.activeUsers.trend)}
                                <span className={`trend-${stats.activeUsers.trend}`}>+{stats.activeUsers.change}%</span>
                            </div>
                        </div>
                        <div className="stat-body">
                            <div className="stat-value">{stats.activeUsers.value.toLocaleString()}</div>
                            <div className="stat-label">Active Users</div>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-header">
                            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                            </div>
                            <div className="stat-trend">
                                {getTrendIcon(stats.totalOrders.trend)}
                                <span className={`trend-${stats.totalOrders.trend}`}>+{stats.totalOrders.change}%</span>
                            </div>
                        </div>
                        <div className="stat-body">
                            <div className="stat-value">{stats.totalOrders.value.toLocaleString()}</div>
                            <div className="stat-label">Total Orders</div>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-header">
                            <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div className="stat-trend">
                                {getTrendIcon(stats.totalRevenue.trend)}
                                <span className={`trend-${stats.totalRevenue.trend}`}>+{stats.totalRevenue.change}%</span>
                            </div>
                        </div>
                        <div className="stat-body">
                            <div className="stat-value">${(stats.totalRevenue.value / 1000).toFixed(1)}k</div>
                            <div className="stat-label">Total Revenue</div>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-header">
                            <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                            </div>
                            <div className="stat-trend">
                                {getTrendIcon(stats.pendingWithdraw.trend)}
                            </div>
                        </div>
                        <div className="stat-body">
                            <div className="stat-value">${(stats.pendingWithdraw.value / 1000).toFixed(1)}k</div>
                            <div className="stat-label">Pending Withdrawals</div>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="stat-header">
                            <div className="stat-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                                    <path d="M12 18V6" />
                                </svg>
                            </div>
                            <div className="stat-trend">
                                {getTrendIcon(stats.totalCommission.trend)}
                                <span className={`trend-${stats.totalCommission.trend}`}>+{stats.totalCommission.change}%</span>
                            </div>
                        </div>
                        <div className="stat-body">
                            <div className="stat-value">${(stats.totalCommission.value / 1000).toFixed(1)}k</div>
                            <div className="stat-label">Total Commission Paid</div>
                        </div>
                    </div>
                </div>

                {/* Second Row: Charts and Level Distribution */}
                <div className="dashboard-row">
                    {/* Level Distribution */}
                    <div className="dashboard-widget level-distribution-widget">
                        <div className="widget-header">
                            <h3>User Level Distribution</h3>
                            <button className="widget-action" onClick={() => navigate('/admin-users')}>
                                View All
                            </button>
                        </div>
                        <div className="level-distribution-content">
                            {levelDistribution.map((item, index) => (
                                <div key={index} className="level-item">
                                    <div className="level-info">
                                        <div className="level-dot" style={{ backgroundColor: item.color }} />
                                        <span className="level-name">{item.level}</span>
                                    </div>
                                    <div className="level-stats">
                                        <span className="level-count">{item.count}</span>
                                        <span className="level-percentage">{item.percentage}%</span>
                                    </div>
                                    <div className="level-bar">
                                        <div
                                            className="level-bar-fill"
                                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="level-summary">
                            <div className="summary-item">
                                <span className="summary-label">Total Users</span>
                                <span className="summary-value">{levelDistribution.reduce((sum, item) => sum + item.count, 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Performers */}
                    <div className="dashboard-widget top-performers-widget">
                        <div className="widget-header">
                            <h3>Top Performers This Month</h3>
                            <button className="widget-action" onClick={() => navigate('/admin-users')}>
                                View All
                            </button>
                        </div>
                        <div className="performers-list">
                            {topPerformers.map((performer, index) => (
                                <div key={performer.id} className="performer-item">
                                    <div className="performer-rank">#{index + 1}</div>
                                    <div className="performer-avatar" style={{ backgroundColor: getLevelColor(performer.level) }}>
                                        {performer.avatar}
                                    </div>
                                    <div className="performer-info">
                                        <div className="performer-name">{performer.name}</div>
                                        <div className="performer-level">{performer.level}</div>
                                    </div>
                                    <div className="performer-stats">
                                        <div className="performer-orders">{performer.orders} orders</div>
                                        <div className="performer-commission">${performer.commission.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Third Row: Recent Withdrawals and Activities */}
                <div className="dashboard-row">
                    {/* Recent Withdrawals */}
                    <div className="dashboard-widget recent-withdrawals-widget">
                        <div className="widget-header">
                            <h3>Recent Withdrawal Requests</h3>
                            <button className="widget-action" onClick={() => navigate('/admin-request')}>
                                View All
                            </button>
                        </div>
                        <div className="withdrawals-list">
                            {recentWithdrawals.map((withdrawal) => (
                                <div key={withdrawal.id} className="withdrawal-item">
                                    <div className="withdrawal-user">
                                        <div className="withdrawal-name">{withdrawal.user}</div>
                                        <div className="withdrawal-date">{withdrawal.date}</div>
                                    </div>
                                    <div className="withdrawal-amount">${withdrawal.amount.toLocaleString()}</div>
                                    <span
                                        className={`withdrawal-status status-${withdrawal.status}`}
                                    >
                                        {withdrawal.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="dashboard-widget recent-activities-widget">
                        <div className="widget-header">
                            <h3>Recent Activities</h3>
                        </div>
                        <div className="activities-list">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="activity-item">
                                    <div className={`activity-icon activity-${activity.type}`}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-message">{activity.message}</div>
                                        <div className="activity-user">{activity.user}</div>
                                    </div>
                                    <div className="activity-time">{activity.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions-grid">
                        <button className="quick-action-btn" onClick={() => navigate('/admin-users')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <line x1="20" y1="8" x2="20" y2="14" />
                                <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                            <span>Manage Users</span>
                        </button>
                        <button className="quick-action-btn" onClick={() => navigate('/admin-request')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            <span>Review Withdrawals</span>
                        </button>
                        <button className="quick-action-btn" onClick={() => navigate('/admin-commission')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                                <path d="M12 18V6" />
                            </svg>
                            <span>Manage Commission</span>
                        </button>
                        <button className="quick-action-btn" onClick={() => navigate('/admin-products')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="3" width="15" height="13" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                            <span>Manage Products</span>
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
