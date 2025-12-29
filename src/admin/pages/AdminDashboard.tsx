import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import DashboardGrid from '../components/DashboardGrid';
import SectionHeader from '../components/SectionHeader';
import MetricCard from '../components/MetricCard';
import MetricChart from '../components/MetricChart';
import MetricProgress from '../components/MetricProgress';
import MetricTable from '../components/MetricTable';
import SortableTable from '../components/SortableTable';
import { IconUsers, IconAdmin, IconTrendingUp, IconDollarSign, IconShoppingCart, IconActivity } from '../components/icons';
import { useTranslation } from '../../shared/contexts/TranslationContext';

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
    ordersThisYear: number;
    ordersLastYear: number;
    ordersYearChange: number;
    ordersYearTrend: StatTrend;
    averageOrderValue: number;
    ordersByCountry: Array<{ country: string; orderCount: number; revenue: number; percentage: number; revenuePercentage: number }>;
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

interface ProductMetrics {
    totalProductsWithOrders: number;
    totalCompletedOrders: number;
    bestSellers: number[];
    productsWithOrders: Array<{
        product_id: number;
        product_name: string;
        order_count: number;
        total_quantity: number;
        total_revenue: number;
        name?: string;
        sku?: string | null;
        price?: number;
        status?: string;
        images?: Array<{ url: string; is_featured: boolean; sort_order: number }>;
    }>;
}

export default function AdminDashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
    const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
    const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
    const [productMetrics, setProductMetrics] = useState<ProductMetrics | null>(null);
    const [loading, setLoading] = useState({ system: true, business: false, users: false, products: false });
    const [error, setError] = useState<string | null>(null);
    
    // Lazy loading refs
    const systemRef = useRef<HTMLDivElement>(null);
    const businessRef = useRef<HTMLDivElement>(null);
    const usersRef = useRef<HTMLDivElement>(null);
    const productsRef = useRef<HTMLDivElement>(null);
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
    const fetchMetrics = async (section: 'system' | 'business' | 'users' | 'products') => {
        if (loadedSections.has(section)) return; // Already loaded

        try {
            setLoading(prev => ({ ...prev, [section]: true }));
            const authToken = localStorage.getItem('nobleco_auth_token');
            
            let url: string;
            if (section === 'products') {
                url = '/api/admin/product-metrics';
            } else {
                url = `/api/admin/dashboard-metrics?section=${section}`;
            }
            
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
                } else if (section === 'products' && result.data) {
                    setProductMetrics(result.data);
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
                        if (section && (section === 'business' || section === 'users' || section === 'products')) {
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
        if (productsRef.current) observer.observe(productsRef.current);

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
            'Guest': '#94a3b8', // grey
            'Member': '#3b82f6', // blue
            'Unit Manager': '#f59e0b', // orange
            'Brand Manager': '#8b5cf6', // purple
            'guest': '#94a3b8',
            'member': '#3b82f6',
            'unit manager': '#f59e0b',
            'brand manager': '#8b5cf6'
        };
        return colors[level] || '#94a3b8';
    };

    return (
        <AdminLayout title={t('dashboard.title')}>
            <div className="dashboard-page">
                {/* System Section */}
                <div ref={systemRef} data-section="system">
                    <SectionHeader 
                        title={t('adminDashboard.systemMetrics')} 
                        description={t('adminDashboard.systemMetricsDescription')}
                    />
                    {loading.system ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                        </DashboardGrid>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : systemMetrics ? (
                        <DashboardGrid>
                            {/* Row 1: Total Users, Admin Users, Coworker Users, Associate Users */}
                            <MetricCard
                                title={t('adminDashboard.totalUsers')}
                                value={systemMetrics.totalUsers}
                                trend={systemMetrics.newUsersMonthTrend}
                                change={systemMetrics.newUsersMonthChange}
                                icon={<IconUsers style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title={t('adminDashboard.administrator')}
                                value={systemMetrics.adminUsers}
                                icon={<IconAdmin style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                                className="metric-blue"
                            />
                            <MetricCard
                                title={t('adminDashboard.coworker')}
                                value={systemMetrics.coworkerUsers}
                                icon={<IconUsers style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                                className="metric-blue"
                            />
                            <MetricCard
                                title={t('adminDashboard.associateUser')}
                                value={systemMetrics.associateUsers}
                                icon={<IconUsers style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                                className="metric-orange"
                            />
                            {/* Row 2: Active Users, Inactive Users, New Users This Month, New Users This Year */}
                            <MetricCard
                                title={t('adminDashboard.activeUser')}
                                value={systemMetrics.activeUsers}
                                icon={<IconActivity style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                                className="metric-green"
                            />
                            <MetricCard
                                title={t('adminDashboard.inactiveUser')}
                                value={systemMetrics.inactiveUsers}
                                icon={<IconUsers style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                                className="metric-red"
                            />
                            <MetricCard
                                title={t('adminDashboard.newUsersThisMonth')}
                                value={systemMetrics.newUsersThisMonth}
                                trend={systemMetrics.newUsersMonthTrend}
                                change={systemMetrics.newUsersMonthChange}
                                icon={<IconTrendingUp style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title={t('adminDashboard.newUsersThisYear')}
                                value={systemMetrics.newUsersThisYear}
                                trend={systemMetrics.newUsersYearTrend}
                                change={systemMetrics.newUsersYearChange}
                                icon={<IconTrendingUp style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                        </DashboardGrid>
                    ) : null}
                </div>

                {/* Business Analytics Section */}
                <div ref={businessRef} data-section="business">
                    <SectionHeader 
                        title={t('adminDashboard.businessAnalytics')} 
                        description={t('adminDashboard.businessAnalyticsDescription')}
                    />
                    {loading.business ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-chart" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-chart" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
                            <div className="skeleton skeleton-chart" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
                            <div className="skeleton skeleton-table" style={{ gridColumn: 'span 4' }} />
                        </DashboardGrid>
                    ) : businessMetrics ? (
                        <DashboardGrid>
                            {/* Row 1: Total Revenue (2x1), Revenue This Month (1x1), Revenue This Year (1x1) */}
                            <MetricCard
                                title={t('adminDashboard.totalRevenue')}
                                value={formatCurrency(businessMetrics.totalRevenue)}
                                icon={<IconDollarSign style={{ width: '24px', height: '24px' }} />}
                                width={2}
                                height={1}
                                className={businessMetrics.totalRevenue > 0 ? 'metric-green' : 'metric-red'}
                            />
                            <MetricCard
                                title={t('adminDashboard.revenueThisMonth')}
                                value={formatCurrency(businessMetrics.revenueThisMonth)}
                                trend={businessMetrics.revenueMonthTrend}
                                change={businessMetrics.revenueMonthChange}
                                icon={<IconDollarSign style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title={t('adminDashboard.revenueThisYear')}
                                value={formatCurrency(businessMetrics.revenueThisYear)}
                                trend={businessMetrics.revenueYearTrend}
                                change={businessMetrics.revenueYearChange}
                                icon={<IconDollarSign style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            
                            {/* Row 2: Revenue Trend (2x2), Total Orders (1x1), Orders This Month (1x1), Orders This Year (1x1), Average Order Value (1x1) */}
                            <MetricChart
                                title={t('adminDashboard.revenueTrend')}
                                data={businessMetrics.revenueTrend}
                                type="line"
                                dataKey="revenue"
                                nameKey="date"
                                width={2}
                                height={2}
                            />
                            <MetricCard
                                title={t('adminDashboard.totalOrders')}
                                value={businessMetrics.totalOrders}
                                icon={<IconShoppingCart style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title={t('adminDashboard.ordersThisMonth')}
                                value={businessMetrics.ordersThisMonth}
                                trend={businessMetrics.ordersMonthTrend}
                                change={businessMetrics.ordersMonthChange}
                                icon={<IconShoppingCart style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title={t('adminDashboard.ordersThisYear')}
                                value={businessMetrics.ordersThisYear}
                                trend={businessMetrics.ordersYearTrend}
                                change={businessMetrics.ordersYearChange}
                                icon={<IconShoppingCart style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title={t('adminDashboard.averageOrderValue')}
                                value={formatCurrency(businessMetrics.averageOrderValue)}
                                icon={<IconDollarSign style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            
                            {/* Row 3: Orders by Status (2x2), Orders by Country Table (2x2) */}
                            {/* #region agent log */}
                            {(() => {
                                const statusData = businessMetrics.ordersByStatus.map(s => ({ 
                                    name: s.status === 'processing' ? 'Processing' : s.status === 'completed' ? 'Completed' : s.status, 
                                    value: s.count 
                                }));
                                fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:432',message:'Orders by Status data',data:{ordersByStatus:businessMetrics.ordersByStatus,statusData,totalOrders:businessMetrics.totalOrders},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                return null;
                            })()}
                            {/* #endregion */}
                            <MetricChart
                                title={t('adminDashboard.ordersByStatus')}
                                data={businessMetrics.ordersByStatus.map(s => ({ 
                                    name: s.status === 'processing' ? t('orders.processing') : s.status === 'completed' ? t('orders.completed') : s.status, 
                                    value: s.count 
                                }))}
                                type="pie"
                                dataKey="value"
                                nameKey="name"
                                width={2}
                                height={2}
                            />
                            {/* Orders by Country Table (2x2) */}
                            <div className="metric-card metric-table" style={{ gridColumn: 'span 2', gridRow: 'span 2', display: 'flex', flexDirection: 'column' }}>
                        <div className="widget-header">
                                    <h3>{t('adminDashboard.ordersByCountry')}</h3>
                                </div>
                                <div className="table-container" style={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
                                    <table className="metric-table-content">
                                        <thead>
                                            <tr>
                                                <th>{t('adminDashboard.country')}</th>
                                                <th>{t('adminDashboard.orders')}</th>
                                                <th>{t('adminDashboard.revenue')}</th>
                                                <th>{t('adminDashboard.percentOrders')}</th>
                                                <th>{t('adminDashboard.percentRevenue')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {businessMetrics.ordersByCountry.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="empty-state">{t('common.loading')}</td>
                                                </tr>
                                            ) : (
                                                businessMetrics.ordersByCountry.map((row, index) => {
                                                    // #region agent log
                                                    fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:466',message:'Country row data',data:{country:row.country,revenuePercentage:row.revenuePercentage,revenue:row.revenue,totalRevenue:businessMetrics.totalRevenue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                                                    // #endregion
                                                    return (
                                                        <tr key={index}>
                                                        <td>{row.country}</td>
                                                        <td>{row.orderCount}</td>
                                                        <td>{formatCurrency(row.revenue)}</td>
                                                        <td>{typeof row.percentage === 'number' ? row.percentage.toFixed(2) : '0.00'}%</td>
                                                        <td>{row.revenuePercentage !== undefined && row.revenuePercentage !== null ? (typeof row.revenuePercentage === 'number' ? row.revenuePercentage.toFixed(2) : '0.00') : '0.00'}%</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                        </div>
                        </DashboardGrid>
                    ) : null}
                </div>

                {/* User Analytics Section */}
                <div ref={usersRef} data-section="users">
                    <SectionHeader 
                        title={t('adminDashboard.userAnalytics')} 
                        description={t('adminDashboard.userAnalyticsDescription')}
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
                            {/* Row 1: User Level Distribution (2x2), Top Users by Points (2x2) */}
                            {(() => {
                                // #region agent log
                                const levelItems = userMetrics.levelDistribution.map(level => {
                                    const color = getLevelColor(level.level);
                                    fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:517',message:'Level color mapping',data:{level:level.level,color,count:level.count,percentage:level.percentage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                    return {
                                        label: level.level,
                                        value: level.count,
                                        percentage: level.percentage,
                                        color
                                    };
                                });
                                fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:525',message:'All level items with colors',data:{levelItems},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                                return (
                                    <MetricProgress
                                        title={t('adminDashboard.userLevelDistribution')}
                                        items={levelItems}
                                        width={2}
                                        height={2}
                                    />
                                );
                            })()}
                            <div className="metric-card metric-table" style={{ gridColumn: 'span 2', gridRow: 'span 2', display: 'flex', flexDirection: 'column' }}>
                                <div className="widget-header">
                                    <h3>{t('adminDashboard.topUsersByPoints')}</h3>
                                </div>
                                <div className="table-container" style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
                                    <table className="metric-table-content">
                                        <thead>
                                            <tr>
                                                <th>{t('users.name')}</th>
                                                <th>{t('users.level')}</th>
                                                <th>{t('adminUsers.points')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userMetrics.topUsersByPoints.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="empty-state">No data available</td>
                                                </tr>
                                            ) : (
                                                userMetrics.topUsersByPoints.map((row, index) => {
                                                    // #region agent log
                                                    fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminDashboard.tsx:546',message:'Top user by points row',data:{id:row.id,name:row.name,level:row.level,levelLower:row.level?.toLowerCase(),points:row.points,index},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                                                    // #endregion
                                                    return (
                                                        <tr key={row.id}>
                                                            <td>{row.name}</td>
                                                            <td>{row.level}</td>
                                                            <td style={index === 0 ? { color: '#f59e0b', fontWeight: 'bold' } : index === 1 ? { color: '#eab308', fontWeight: 'bold' } : {}}>
                                                                {formatNumber(row.points)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {/* Row 2: Top Users by Order and Value (2x2), User Growth Trend (2x2) */}
                            <SortableTable
                                title={t('adminDashboard.topUsersByOrderAndValue')}
                                columns={[
                                    { key: 'name', label: t('users.name') },
                                    { key: 'level', label: t('users.level') },
                                    { key: 'orderCount', label: 'Orders', sortable: true, render: (val, row) => {
                                        const sortedByOrders = [...userMetrics.topUsersByOrders].sort((a, b) => b.orderCount - a.orderCount);
                                        const index = sortedByOrders.findIndex(u => u.id === row.id);
                                        const style = index === 0 ? { color: '#f59e0b', fontWeight: 'bold' } : 
                                                     index === 1 ? { color: '#eab308', fontWeight: 'bold' } : {};
                                        return <span style={style}>{val}</span>;
                                    }},
                                    { key: 'totalValue', label: t('adminDashboard.totalRevenue'), sortable: true, render: (val, row) => {
                                        const sortedByValue = [...userMetrics.topUsersByValue].sort((a, b) => b.totalValue - a.totalValue);
                                        const index = sortedByValue.findIndex(u => u.id === row.id);
                                        const style = index === 0 ? { color: '#f59e0b', fontWeight: 'bold' } : 
                                                     index === 1 ? { color: '#eab308', fontWeight: 'bold' } : {};
                                        return <span style={style}>{formatCurrency(val)}</span>;
                                    }}
                                ]}
                                data={[...userMetrics.topUsersByOrders]}
                                width={2}
                                height={2}
                            />
                            <MetricChart
                                title={t('adminDashboard.userGrowthTrend')}
                                data={userMetrics.growthTrend}
                                type="line"
                                dataKey="count"
                                nameKey="month"
                                width={2}
                                height={2}
                            />
                        </DashboardGrid>
                    ) : null}
                </div>

                {/* Product Analytics Section */}
                <div ref={productsRef} data-section="products">
                    <SectionHeader 
                        title={t('adminDashboard.productAnalytics')} 
                        description={t('adminDashboard.productAnalyticsDescription')}
                    />
                    {loading.products ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-table" style={{ gridColumn: 'span 4' }} />
                        </DashboardGrid>
                    ) : productMetrics ? (
                        <DashboardGrid>
                            {/* Row 1: Total Products with Orders, Total Completed Orders */}
                            <MetricCard
                                title={t('adminDashboard.productsWithCompletedOrders')}
                                value={productMetrics.totalProductsWithOrders}
                                icon={<IconShoppingCart style={{ width: '24px', height: '24px' }} />}
                                width={2}
                                height={1}
                            />
                            <MetricCard
                                title={t('adminDashboard.totalCompletedOrders')}
                                value={productMetrics.totalCompletedOrders}
                                icon={<IconActivity style={{ width: '24px', height: '24px' }} />}
                                width={2}
                                height={1}
                            />
                            
                            {/* Row 2: Products Table */}
                            <div className="metric-card metric-table" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
                                <div className="widget-header">
                                    <h3>{t('adminDashboard.productsWithCompletedOrders')}</h3>
                                </div>
                                <div className="table-container" style={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
                                    <table className="metric-table-content">
                                        <thead>
                                            <tr>
                                                <th>{t('adminDashboard.product')}</th>
                                                <th>{t('products.sku')}</th>
                                                <th>{t('adminDashboard.orders')}</th>
                                                <th>{t('adminDashboard.quantitySold')}</th>
                                                <th>{t('adminDashboard.totalRevenue')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productMetrics.productsWithOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="empty-state">{t('common.loading')}</td>
                                                </tr>
                                            ) : (
                                                productMetrics.productsWithOrders.map((product, index) => {
                                                    const isBestSeller = productMetrics.bestSellers.includes(product.product_id);
                                                    return (
                                                        <tr key={product.product_id}>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {product.images && product.images.length > 0 && (
                                                                        <img 
                                                                            src={product.images[0].url} 
                                                                            alt={product.name || product.product_name}
                                                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                                                        />
                                                                    )}
                                                                    <div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span>{product.name || product.product_name}</span>
                                                                            {isBestSeller && (
                                                                                <span style={{
                                                                                    background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
                                                                                    color: 'white',
                                                                                    fontSize: '10px',
                                                                                    fontWeight: 'bold',
                                                                                    padding: '2px 6px',
                                                                                    borderRadius: '4px',
                                                                                    textTransform: 'uppercase',
                                                                                    letterSpacing: '0.5px'
                                                                                }}>
                                                                                    {t('adminDashboard.bestSeller')}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {product.status && (
                                                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                                                {product.status}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{product.sku || '-'}</td>
                                                            <td style={index === 0 ? { color: '#f59e0b', fontWeight: 'bold' } : index === 1 ? { color: '#eab308', fontWeight: 'bold' } : {}}>
                                                                {formatNumber(product.order_count)}
                                                            </td>
                                                            <td>{formatNumber(product.total_quantity)}</td>
                                                            <td>{formatCurrency(product.total_revenue)}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </DashboardGrid>
                    ) : null}
                </div>
            </div>
        </AdminLayout>
    );
}
