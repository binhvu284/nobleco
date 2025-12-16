import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import DashboardGrid from '../components/DashboardGrid';
import SectionHeader from '../components/SectionHeader';
import MetricCard from '../components/MetricCard';
import MetricChart from '../components/MetricChart';
import MetricTable from '../components/MetricTable';
import MetricProgress from '../components/MetricProgress';
import { IconUsers, IconAdmin, IconTrendingUp, IconDollarSign, IconShoppingCart, IconActivity } from '../components/icons';

type StatTrend = 'up' | 'down' | 'neutral';

interface SystemMetrics {
    totalUsers: number;
    adminUsers: number;
    coworkerUsers: number;
    associateUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsersThisMonth: number;
    newUsersLastMonth: number;
    newUsersMonthChange: number;
    newUsersMonthTrend: StatTrend;
    newUsersThisYear: number;
    newUsersLastYear: number;
    newUsersYearChange: number;
    newUsersYearTrend: StatTrend;
}

interface BusinessMetrics {
    totalRevenue: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    revenueMonthChange: number;
    revenueMonthTrend: StatTrend;
    revenueThisYear: number;
    revenueLastYear: number;
    revenueYearChange: number;
    revenueYearTrend: StatTrend;
    totalOrders: number;
    ordersThisMonth: number;
    ordersLastMonth: number;
    ordersMonthChange: number;
    ordersMonthTrend: StatTrend;
    averageOrderValue: number;
    ordersByCountry: Array<{ country: string; orderCount: number; revenue: number; percentage: number }>;
    ordersByStatus: Array<{ status: string; count: number; percentage: number }>;
    revenueTrend: Array<{ date: string; revenue: number }>;
}

interface UserMetrics {
    levelDistribution: Array<{ level: string; count: number; percentage: number }>;
    topUsersByPoints: Array<{ id: number; name: string; points: number; level: string }>;
    topUsersByOrders: Array<{ id: number; name: string; orderCount: number; totalValue: number; level: string }>;
    topUsersByValue: Array<{ id: number; name: string; orderCount: number; totalValue: number; level: string }>;
    growthTrend: Array<{ month: string; count: number }>;
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
    const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
    const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
    const [loading, setLoading] = useState({ system: true, business: false, users: false });
    const [error, setError] = useState<string | null>(null);
    
    // Lazy loading refs
    const systemRef = useRef<HTMLDivElement>(null);
    const businessRef = useRef<HTMLDivElement>(null);
    const usersRef = useRef<HTMLDivElement>(null);
    const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());
    const loadedSectionsRef = useRef<Set<string>>(new Set());
    
    // Keep ref in sync with state
    useEffect(() => {
        loadedSectionsRef.current = loadedSections;
    }, [loadedSections]);

    // Format currency (VND)
    const formatCurrency = (amount: number): string => {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M ₫`;
        }
        if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}k ₫`;
        }
        return `${amount.toLocaleString('vi-VN')} ₫`;
    };

    // Format number
    const formatNumber = (num: number): string => {
        return num.toLocaleString('vi-VN');
    };

    // Fetch metrics
    const fetchMetrics = async (section: 'system' | 'business' | 'users') => {
        if (loadedSections.has(section)) return; // Already loaded

        try {
            setLoading(prev => ({ ...prev, [section]: true }));
            const authToken = localStorage.getItem('nobleco_auth_token');
            const url = `/api/admin/dashboard-metrics?section=${section}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch ${section} metrics: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                if (section === 'system' && result.data.system) {
                    setSystemMetrics(result.data.system);
                } else if (section === 'business' && result.data.business) {
                    setBusinessMetrics(result.data.business);
                } else if (section === 'users' && result.data.users) {
                    setUserMetrics(result.data.users);
                }
                setLoadedSections(prev => new Set([...prev, section]));
            }
        } catch (err: any) {
            console.error(`Error fetching ${section} metrics:`, err);
            setError(err.message || `Failed to load ${section} metrics`);
        } finally {
            setLoading(prev => ({ ...prev, [section]: false }));
        }
    };

    // Initial load - system metrics
    useEffect(() => {
        fetchMetrics('system');
    }, []);

    // Intersection Observer for lazy loading with performance optimization
    useEffect(() => {
        let pendingSections = new Set<string>();
        let rafId: number | null = null;
        let isProcessing = false;

        const processPendingSections = () => {
            if (pendingSections.size > 0 && !isProcessing) {
                isProcessing = true;
                const sectionsToLoad = Array.from(pendingSections);
                pendingSections.clear();
                
                // Process all sections immediately but use requestIdleCallback for non-blocking execution
                const processSection = (section: string) => {
                    if (!loadedSectionsRef.current.has(section)) {
                        fetchMetrics(section as 'business' | 'users');
                    }
                };

                if ('requestIdleCallback' in window) {
                    // Use requestIdleCallback for smooth scrolling - executes when browser is idle
                    sectionsToLoad.forEach((section, index) => {
                        requestIdleCallback(() => processSection(section), { timeout: 100 });
                    });
                } else {
                    // Fallback: process immediately but batch in requestAnimationFrame
                    sectionsToLoad.forEach((section) => processSection(section));
                }
                
                // Reset processing flag after a short delay
                setTimeout(() => {
                    isProcessing = false;
                }, 100);
            }
            rafId = null;
        };

        let lastCallbackTime = 0;
        const THROTTLE_MS = 100; // Throttle observer callbacks to max once per 100ms

        const observer = new IntersectionObserver(
            (entries) => {
                const now = Date.now();
                // Throttle callbacks to prevent excessive firing during scroll
                if (now - lastCallbackTime < THROTTLE_MS) {
                    return;
                }
                lastCallbackTime = now;

                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const section = entry.target.getAttribute('data-section');
                        if (section && (section === 'business' || section === 'users')) {
                            // Use requestAnimationFrame to batch updates for smooth scrolling
                            // Check ref instead of state to avoid dependency issues
                            if (!loadedSectionsRef.current.has(section) && !pendingSections.has(section)) {
                                pendingSections.add(section);
                                if (rafId === null) {
                                    rafId = requestAnimationFrame(processPendingSections);
                                }
                            }
                        }
                    }
                });
            },
            { 
                threshold: 0.01, // Very low threshold for earlier detection
                rootMargin: '500px 0px' // Larger margin (500px) to preload sections well before viewport, especially for upward scroll
            }
        );

        if (businessRef.current) observer.observe(businessRef.current);
        if (usersRef.current) observer.observe(usersRef.current);

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            observer.disconnect();
        };
    }, []); // Empty dependency array - observer created once

    // Level colors mapping
    const getLevelColor = (level: string): string => {
        const colors: Record<string, string> = {
            'Guest': '#94a3b8',
            'Member': '#3b82f6',
            'Unit Manager': '#8b5cf6',
            'Brand Manager': '#f59e0b',
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
                {/* System Section */}
                <div ref={systemRef} data-section="system">
                    <SectionHeader 
                        title="System Metrics" 
                        description="Overview of user accounts and system statistics"
                    />
                    {loading.system ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-card" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                        </DashboardGrid>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : systemMetrics ? (
                        <DashboardGrid>
                            <MetricCard
                                title="Total Users"
                                value={systemMetrics.totalUsers}
                                trend={systemMetrics.newUsersMonthTrend}
                                change={systemMetrics.newUsersMonthChange}
                                icon={
                                    <IconUsers style={{ width: '24px', height: '24px' }} />
                                }
                                width={2}
                                height={1}
                            />
                            <MetricCard
                                title="Active Users"
                                value={systemMetrics.activeUsers}
                                icon={
                                    <IconActivity style={{ width: '24px', height: '24px' }} />
                                }
                                width={2}
                                height={1}
                            />
                            <MetricCard
                                title="Admin Users"
                                value={systemMetrics.adminUsers}
                                icon={
                                    <IconAdmin style={{ width: '24px', height: '24px' }} />
                                }
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Coworker Users"
                                value={systemMetrics.coworkerUsers}
                                icon={
                                    <IconUsers style={{ width: '24px', height: '24px' }} />
                                }
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Associate Users"
                                value={systemMetrics.associateUsers}
                                icon={
                                    <IconUsers style={{ width: '24px', height: '24px' }} />
                                }
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Inactive Users"
                                value={systemMetrics.inactiveUsers}
                                icon={
                                    <IconUsers style={{ width: '24px', height: '24px' }} />
                                }
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="New Users This Month"
                                value={systemMetrics.newUsersThisMonth}
                                trend={systemMetrics.newUsersMonthTrend}
                                change={systemMetrics.newUsersMonthChange}
                                icon={
                                    <IconTrendingUp style={{ width: '24px', height: '24px' }} />
                                }
                                width={2}
                                height={1}
                            />
                            <MetricCard
                                title="New Users This Year"
                                value={systemMetrics.newUsersThisYear}
                                trend={systemMetrics.newUsersYearTrend}
                                change={systemMetrics.newUsersYearChange}
                                icon={
                                    <IconTrendingUp style={{ width: '24px', height: '24px' }} />
                                }
                                width={2}
                                height={1}
                            />
                        </DashboardGrid>
                    ) : null}
                </div>

                {/* Business Analytics Section */}
                <div ref={businessRef} data-section="business">
                    <SectionHeader 
                        title="Business Analytics" 
                        description="Revenue, orders, and business performance metrics"
                    />
                    {loading.business ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-card" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-chart" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-chart" style={{ gridColumn: 'span 2' }} />
                        </DashboardGrid>
                    ) : businessMetrics ? (
                        <DashboardGrid>
                            <MetricCard
                                title="Total Revenue"
                                value={formatCurrency(businessMetrics.totalRevenue)}
                                trend={businessMetrics.revenueMonthTrend}
                                change={businessMetrics.revenueMonthChange}
                                icon={<IconDollarSign />}
                                width={2}
                                height={1}
                            />
                            <MetricCard
                                title="Total Orders"
                                value={businessMetrics.totalOrders}
                                trend={businessMetrics.ordersMonthTrend}
                                change={businessMetrics.ordersMonthChange}
                                icon={<IconShoppingCart />}
                                width={2}
                                height={1}
                            />
                            <MetricChart
                                title="Revenue Trend (Last 30 Days)"
                                data={businessMetrics.revenueTrend}
                                type="line"
                                dataKey="revenue"
                                nameKey="date"
                                width={2}
                                height={2}
                            />
                            <MetricChart
                                title="Orders by Status"
                                data={businessMetrics.ordersByStatus.map(s => ({ name: s.status, value: s.count }))}
                                type="pie"
                                dataKey="value"
                                nameKey="name"
                                width={2}
                                height={2}
                            />
                            <MetricTable
                                title="Orders by Country"
                                columns={[
                                    { key: 'country', label: 'Country' },
                                    { key: 'orderCount', label: 'Orders' },
                                    { key: 'revenue', label: 'Revenue', render: (val) => formatCurrency(val) },
                                    { key: 'percentage', label: '%', render: (val) => `${val}%` }
                                ]}
                                data={businessMetrics.ordersByCountry}
                                width={2}
                                height={2}
                            />
                            <MetricCard
                                title="Average Order Value"
                                value={formatCurrency(businessMetrics.averageOrderValue)}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Revenue This Month"
                                value={formatCurrency(businessMetrics.revenueThisMonth)}
                                trend={businessMetrics.revenueMonthTrend}
                                change={businessMetrics.revenueMonthChange}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Orders This Month"
                                value={businessMetrics.ordersThisMonth}
                                trend={businessMetrics.ordersMonthTrend}
                                change={businessMetrics.ordersMonthChange}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Revenue This Year"
                                value={formatCurrency(businessMetrics.revenueThisYear)}
                                trend={businessMetrics.revenueYearTrend}
                                change={businessMetrics.revenueYearChange}
                                width={1}
                                height={1}
                            />
                        </DashboardGrid>
                    ) : null}
                </div>

                {/* User Analytics Section */}
                <div ref={usersRef} data-section="users">
                    <SectionHeader 
                        title="User Analytics" 
                        description="User levels, top performers, and growth trends"
                    />
                    {loading.users ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-card" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-table" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-table" style={{ gridColumn: 'span 2' }} />
                        </DashboardGrid>
                    ) : userMetrics ? (
                        <DashboardGrid>
                            <MetricProgress
                                title="User Level Distribution"
                                items={userMetrics.levelDistribution.map(level => ({
                                    label: level.level,
                                    value: level.count,
                                    percentage: level.percentage,
                                    color: getLevelColor(level.level)
                                }))}
                                width={2}
                                height={2}
                            />
                            <MetricTable
                                title="Top Users by Points"
                                columns={[
                                    { key: 'name', label: 'Name' },
                                    { key: 'level', label: 'Level' },
                                    { key: 'points', label: 'Points', render: (val) => formatNumber(val) }
                                ]}
                                data={userMetrics.topUsersByPoints}
                                width={2}
                                height={2}
                            />
                            <MetricTable
                                title="Top Users by Orders"
                                columns={[
                                    { key: 'name', label: 'Name' },
                                    { key: 'level', label: 'Level' },
                                    { key: 'orderCount', label: 'Orders' },
                                    { key: 'totalValue', label: 'Total Value', render: (val) => formatCurrency(val) }
                                ]}
                                data={userMetrics.topUsersByOrders}
                                width={2}
                                height={2}
                            />
                            <MetricTable
                                title="Top Users by Value"
                                columns={[
                                    { key: 'name', label: 'Name' },
                                    { key: 'level', label: 'Level' },
                                    { key: 'orderCount', label: 'Orders' },
                                    { key: 'totalValue', label: 'Total Value', render: (val) => formatCurrency(val) }
                                ]}
                                data={userMetrics.topUsersByValue}
                                width={2}
                                height={2}
                            />
                            <MetricChart
                                title="User Growth Trend (Last 12 Months)"
                                data={userMetrics.growthTrend}
                                type="bar"
                                dataKey="count"
                                nameKey="month"
                                width={2}
                                height={2}
                            />
                            <MetricChart
                                title="Level Distribution"
                                data={userMetrics.levelDistribution.map(l => ({ name: l.level, value: l.count }))}
                                type="pie"
                                dataKey="value"
                                nameKey="name"
                                width={2}
                                height={2}
                            />
                        </DashboardGrid>
                    ) : null}
                </div>
            </div>
        </AdminLayout>
    );
}
