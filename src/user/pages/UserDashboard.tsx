import { useState, useEffect, useRef } from 'react';
import UserLayout from '../components/UserLayout';
import DashboardGrid from '../../admin/components/DashboardGrid';
import SectionHeader from '../../admin/components/SectionHeader';
import MetricCard from '../../admin/components/MetricCard';
import MetricChart from '../../admin/components/MetricChart';
import SortableTable from '../../admin/components/SortableTable';
import { IconShoppingCart, IconUsers, IconTrendingUp, IconDollarSign, IconActivity, IconPackage } from '../../admin/components/icons';
import { getCurrentUser } from '../../auth';

type StatTrend = 'up' | 'down' | 'neutral';

interface OrdersMetrics {
    totalOrders: number;
    ordersThisMonth: number;
    ordersLastMonth: number;
    ordersMonthChange: number;
    ordersMonthTrend: StatTrend;
    ordersThisYear: number;
    ordersLastYear: number;
    ordersYearChange: number;
    ordersYearTrend: StatTrend;
    completedOrders: number;
    ordersByStatus: Array<{ status: string; count: number; percentage: number }>;
    revenueTrend: Array<{ date: string; revenue: number }>;
}

interface ClientsMetrics {
    totalClients: number;
    newClientsThisMonth: number;
    newClientsLastMonth: number;
    clientsMonthChange: number;
    clientsMonthTrend: StatTrend;
    newClientsThisYear: number;
    newClientsLastYear: number;
    clientsYearChange: number;
    clientsYearTrend: StatTrend;
    growthTrend: Array<{ month: string; count: number }>;
}

interface ProductsMetrics {
    totalProductsSold: number;
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

interface RevenueMetrics {
    totalRevenue: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    revenueMonthChange: number;
    revenueMonthTrend: StatTrend;
    revenueThisYear: number;
    revenueLastYear: number;
    revenueYearChange: number;
    revenueYearTrend: StatTrend;
}

export default function UserDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userName, setUserName] = useState<string>('');
    const [ordersMetrics, setOrdersMetrics] = useState<OrdersMetrics | null>(null);
    const [clientsMetrics, setClientsMetrics] = useState<ClientsMetrics | null>(null);
    const [productsMetrics, setProductsMetrics] = useState<ProductsMetrics | null>(null);
    const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
    const [loading, setLoading] = useState({ orders: false, clients: false, products: false, revenue: false });
    const [error, setError] = useState<string | null>(null);
    
    // Lazy loading refs
    const ordersRef = useRef<HTMLDivElement>(null);
    const clientsRef = useRef<HTMLDivElement>(null);
    const productsRef = useRef<HTMLDivElement>(null);
    const revenueRef = useRef<HTMLDivElement>(null);
    const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());
    const loadedSectionsRef = useRef<Set<string>>(new Set());
    
    // Keep ref in sync with state
    useEffect(() => {
        loadedSectionsRef.current = loadedSections;
    }, [loadedSections]);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Get user name
    useEffect(() => {
        const user = getCurrentUser();
        if (user?.name) {
            setUserName(user.name);
        }
    }, []);

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
    const fetchMetrics = async (section: 'orders' | 'clients' | 'products' | 'revenue') => {
        if (loadedSections.has(section)) return; // Already loaded

        try {
            setLoading(prev => ({ ...prev, [section]: true }));
            const authToken = localStorage.getItem('nobleco_auth_token');
            
            const response = await fetch('/api/user/dashboard-metrics', {
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
                if (result.data.orders) {
                    setOrdersMetrics(result.data.orders);
                }
                if (result.data.clients) {
                    setClientsMetrics(result.data.clients);
                }
                if (result.data.products) {
                    setProductsMetrics(result.data.products);
                }
                if (result.data.revenue) {
                    setRevenueMetrics(result.data.revenue);
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

    // Initial load - orders metrics
    useEffect(() => {
        fetchMetrics('orders');
    }, []);

    // Intersection Observer for lazy loading
    useEffect(() => {
        let pendingSections = new Set<string>();
        let rafId: number | null = null;
        let isProcessing = false;

        const processPendingSections = () => {
            if (pendingSections.size > 0 && !isProcessing) {
                isProcessing = true;
                const sectionsToLoad = Array.from(pendingSections);
                pendingSections.clear();
                
                const processSection = (section: string) => {
                    if (!loadedSectionsRef.current.has(section)) {
                        fetchMetrics(section as 'clients' | 'products' | 'revenue');
                    }
                };

                if ('requestIdleCallback' in window) {
                    sectionsToLoad.forEach((section) => {
                        requestIdleCallback(() => processSection(section), { timeout: 100 });
                    });
                } else {
                    sectionsToLoad.forEach((section) => processSection(section));
                }
                
                setTimeout(() => {
                    isProcessing = false;
                }, 100);
            }
            rafId = null;
        };

        let lastCallbackTime = 0;
        const THROTTLE_MS = 100;

        const observer = new IntersectionObserver(
            (entries) => {
                const now = Date.now();
                if (now - lastCallbackTime < THROTTLE_MS) {
                    return;
                }
                lastCallbackTime = now;

                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const section = entry.target.getAttribute('data-section');
                        if (section && (section === 'clients' || section === 'products' || section === 'revenue')) {
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
                threshold: 0.01,
                rootMargin: '500px 0px'
            }
        );

        if (clientsRef.current) observer.observe(clientsRef.current);
        if (productsRef.current) observer.observe(productsRef.current);
        if (revenueRef.current) observer.observe(revenueRef.current);

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            observer.disconnect();
        };
    }, []);

    return (
        <UserLayout title="Dashboard">
            <div className="dashboard-page">
                {/* Welcome Section */}
                <div className="dashboard-welcome" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    padding: '32px',
                    marginBottom: '32px',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '24px'
                }}>
                    <div className="welcome-content" style={{ flex: 1, minWidth: '250px' }}>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>
                            Welcome back{userName ? `, ${userName}` : ''}!
                        </h1>
                        <p style={{ margin: '0 0 16px 0', fontSize: '16px', opacity: 0.9 }}>
                            Here's what's happening with your business today
                        </p>
                        <div className="current-time" style={{ fontSize: '14px', opacity: 0.8 }}>
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
                    <div className="welcome-avatar" style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        flexShrink: 0
                    }}>
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>

                {/* Orders Section */}
                <div ref={ordersRef} data-section="orders">
                    <SectionHeader 
                        title="Orders" 
                        description="Your order statistics and trends"
                    />
                    {loading.orders ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-chart" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
                            <div className="skeleton skeleton-chart" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
                        </DashboardGrid>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : ordersMetrics ? (
                        <DashboardGrid>
                            <MetricCard
                                title="Total Orders"
                                value={ordersMetrics.totalOrders}
                                icon={<IconShoppingCart style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Orders This Month"
                                value={ordersMetrics.ordersThisMonth}
                                trend={ordersMetrics.ordersMonthTrend}
                                change={ordersMetrics.ordersMonthChange}
                                icon={<IconShoppingCart style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Orders This Year"
                                value={ordersMetrics.ordersThisYear}
                                trend={ordersMetrics.ordersYearTrend}
                                change={ordersMetrics.ordersYearChange}
                                icon={<IconShoppingCart style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Completed Orders"
                                value={ordersMetrics.completedOrders}
                                icon={<IconActivity style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                                className="metric-green"
                            />
                            <MetricChart
                                title="Revenue Trend (Last 30 Days)"
                                data={ordersMetrics.revenueTrend}
                                type="line"
                                dataKey="revenue"
                                nameKey="date"
                                width={2}
                                height={2}
                            />
                            <MetricChart
                                title="Orders by Status"
                                data={ordersMetrics.ordersByStatus.map(s => ({ 
                                    name: s.status === 'processing' ? 'Processing' : s.status === 'completed' ? 'Completed' : s.status === 'pending' ? 'Pending' : s.status === 'cancelled' ? 'Cancelled' : s.status, 
                                    value: s.count 
                                }))}
                                type="pie"
                                dataKey="value"
                                nameKey="name"
                                width={2}
                                height={2}
                            />
                        </DashboardGrid>
                    ) : null}
                </div>

                {/* Revenue Section */}
                <div ref={revenueRef} data-section="revenue">
                    <SectionHeader 
                        title="Revenue" 
                        description="Your revenue performance and trends"
                    />
                    {loading.revenue ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" style={{ gridColumn: 'span 2' }} />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-chart" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
                        </DashboardGrid>
                    ) : revenueMetrics ? (
                        <DashboardGrid>
                            <MetricCard
                                title="Total Revenue"
                                value={formatCurrency(revenueMetrics.totalRevenue)}
                                icon={<IconDollarSign style={{ width: '24px', height: '24px' }} />}
                                width={2}
                                height={1}
                                className={revenueMetrics.totalRevenue > 0 ? 'metric-green' : 'metric-red'}
                            />
                            <MetricCard
                                title="Revenue This Month"
                                value={formatCurrency(revenueMetrics.revenueThisMonth)}
                                trend={revenueMetrics.revenueMonthTrend}
                                change={revenueMetrics.revenueMonthChange}
                                icon={<IconDollarSign style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="Revenue This Year"
                                value={formatCurrency(revenueMetrics.revenueThisYear)}
                                trend={revenueMetrics.revenueYearTrend}
                                change={revenueMetrics.revenueYearChange}
                                icon={<IconDollarSign style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            {ordersMetrics && (
                                <MetricChart
                                    title="Revenue Trend (Last 30 Days)"
                                    data={ordersMetrics.revenueTrend}
                                    type="line"
                                    dataKey="revenue"
                                    nameKey="date"
                                    width={2}
                                    height={2}
                                />
                            )}
                        </DashboardGrid>
                    ) : null}
                </div>

                {/* Clients Section */}
                <div ref={clientsRef} data-section="clients">
                    <SectionHeader 
                        title="Clients" 
                        description="Your client statistics and growth"
                    />
                    {loading.clients ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-chart" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
                        </DashboardGrid>
                    ) : clientsMetrics ? (
                        <DashboardGrid>
                            <MetricCard
                                title="Total Clients"
                                value={clientsMetrics.totalClients}
                                icon={<IconUsers style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="New Clients This Month"
                                value={clientsMetrics.newClientsThisMonth}
                                trend={clientsMetrics.clientsMonthTrend}
                                change={clientsMetrics.clientsMonthChange}
                                icon={<IconTrendingUp style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricCard
                                title="New Clients This Year"
                                value={clientsMetrics.newClientsThisYear}
                                trend={clientsMetrics.clientsYearTrend}
                                change={clientsMetrics.clientsYearChange}
                                icon={<IconTrendingUp style={{ width: '24px', height: '24px' }} />}
                                width={1}
                                height={1}
                            />
                            <MetricChart
                                title="Client Growth Trend (Last 12 Months)"
                                data={clientsMetrics.growthTrend}
                                type="line"
                                dataKey="count"
                                nameKey="month"
                                width={2}
                                height={2}
                            />
                        </DashboardGrid>
                    ) : null}
                </div>

                {/* Products Section */}
                <div ref={productsRef} data-section="products">
                    <SectionHeader 
                        title="Products" 
                        description="Your product sales performance and best sellers"
                    />
                    {loading.products ? (
                        <DashboardGrid>
                            <div className="skeleton skeleton-card" />
                            <div className="skeleton skeleton-table" style={{ gridColumn: 'span 4' }} />
                        </DashboardGrid>
                    ) : productsMetrics ? (
                        <DashboardGrid>
                            <MetricCard
                                title="Products Sold"
                                value={productsMetrics.totalProductsSold}
                                icon={<IconPackage style={{ width: '24px', height: '24px' }} />}
                                width={2}
                                height={1}
                            />
                            <div className="metric-card metric-table" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
                                <div className="widget-header">
                                    <h3>Products with Orders</h3>
                                </div>
                                <div className="table-container" style={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
                                    <table className="metric-table-content">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>SKU</th>
                                                <th>Orders</th>
                                                <th>Quantity Sold</th>
                                                <th>Total Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productsMetrics.productsWithOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="empty-state">No products with orders yet</td>
                                                </tr>
                                            ) : (
                                                productsMetrics.productsWithOrders.map((product, index) => {
                                                    const isBestSeller = productsMetrics.bestSellers.includes(product.product_id);
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
                                                                                    Best Seller
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
        </UserLayout>
    );
}
