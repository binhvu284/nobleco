import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { getCurrentUser } from '../../auth';
import OrderDetailModal from '../components/OrderDetailModal';
import ConfirmModal from '../../admin/components/ConfirmModal';
import {
    IconSearch,
    IconFilter,
    IconList,
    IconGrid,
    IconEye,
    IconMoreVertical,
    IconPackage,
    IconShoppingBag,
    IconTrash2
} from '../../admin/components/icons';

// Order status type based on database schema
type OrderStatus = 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';

// Order interface based on database schema
interface Order {
    id: number;
    order_number: string;
    subtotal_amount: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    status: OrderStatus;
    payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'other' | null;
    payment_status: 'pending' | 'partial' | 'paid' | 'failed' | 'refunded';
    client_id: number | null;
    client?: {
        id: number;
        name: string;
        phone: string;
    };
    created_by: number;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    cancelled_at: string | null;
    item_count?: number; // Will be calculated from order_items
}

// Format number as VND currency
const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

// Format date
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

export default function UserOrders() {
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'card'>(
        window.innerWidth <= 768 ? 'card' : 'table'
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Detect mobile view
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile && viewMode === 'table') {
                setViewMode('card');
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [viewMode]);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const currentUser = getCurrentUser();
            if (!currentUser?.id) {
                setOrders([]);
                setLoading(false);
                return;
            }

            const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
            const authToken = localStorage.getItem('nobleco_auth_token');
            
            const response = await fetch(`/api/orders?created_by=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Orders loaded:', data?.length || 0, 'orders');
                setOrders(data || []);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Failed to load orders:', response.status, errorData);
                setOrders([]);
            }

            // Mock data for UI development (fallback)
            /*const mockOrders: Order[] = [
                {
                    id: 1,
                    order_number: 'ORD-2024-00001',
                    subtotal_amount: 5000000,
                    discount_amount: 500000,
                    tax_amount: 0,
                    total_amount: 4500000,
                    status: 'completed',
                    payment_method: 'cash',
                    payment_status: 'paid',
                    client_id: 1,
                    client: {
                        id: 1,
                        name: 'Nguyễn Văn A',
                        phone: '0901234567'
                    },
                    created_by: Number(currentUser.id),
                    created_at: '2024-01-15T10:30:00Z',
                    updated_at: '2024-01-15T10:35:00Z',
                    completed_at: '2024-01-15T10:35:00Z',
                    cancelled_at: null,
                    item_count: 3
                },
                {
                    id: 2,
                    order_number: 'ORD-2024-00002',
                    subtotal_amount: 3000000,
                    discount_amount: 0,
                    tax_amount: 0,
                    total_amount: 3000000,
                    status: 'processing',
                    payment_method: 'bank_transfer',
                    payment_status: 'pending',
                    client_id: 2,
                    client: {
                        id: 2,
                        name: 'Trần Thị B',
                        phone: '0912345678'
                    },
                    created_by: Number(currentUser.id),
                    created_at: '2024-01-16T14:20:00Z',
                    updated_at: '2024-01-16T14:20:00Z',
                    completed_at: null,
                    cancelled_at: null,
                    item_count: 2
                },
                {
                    id: 3,
                    order_number: 'ORD-2024-00003',
                    subtotal_amount: 2000000,
                    discount_amount: 200000,
                    tax_amount: 0,
                    total_amount: 1800000,
                    status: 'pending',
                    payment_method: null,
                    payment_status: 'pending',
                    client_id: 3,
                    client: {
                        id: 3,
                        name: 'Lê Văn C',
                        phone: '0923456789'
                    },
                    created_by: Number(currentUser.id),
                    created_at: '2024-01-17T09:15:00Z',
                    updated_at: '2024-01-17T09:15:00Z',
                    completed_at: null,
                    cancelled_at: null,
                    item_count: 1
                },
                {
                    id: 4,
                    order_number: 'ORD-2024-00004',
                    subtotal_amount: 8000000,
                    discount_amount: 0,
                    tax_amount: 0,
                    total_amount: 8000000,
                    status: 'cancelled',
                    payment_method: 'card',
                    payment_status: 'refunded',
                    client_id: 4,
                    client: {
                        id: 4,
                        name: 'Phạm Thị D',
                        phone: '0934567890'
                    },
                    created_by: Number(currentUser.id),
                    created_at: '2024-01-18T11:45:00Z',
                    updated_at: '2024-01-18T12:00:00Z',
                    completed_at: null,
                    cancelled_at: '2024-01-18T12:00:00Z',
                    item_count: 5
                }
            ];*/

            // setOrders(mockOrders); // Commented out - using real API
        } catch (error) {
            console.error('Error loading orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []); // Empty deps - function doesn't depend on any state/props

    // Load orders on mount and when navigating back to this page
    useEffect(() => {
        // Only reload if we're on the orders page
        if (location.pathname === '/orders') {
            loadOrders();
        }
    }, [location.pathname, loadOrders]); // Reload when navigating to /orders page

    // Also reload when page becomes visible (user switches back to tab/window)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && location.pathname === '/orders') {
                loadOrders();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [location.pathname, loadOrders]);

    // Filter orders
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = 
                order.order_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                order.client?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                order.client?.phone?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
            
            return matchesSearch && matchesStatus;
        });
    }, [orders, debouncedSearchTerm, filterStatus]);

    // Get status display
    const getStatusDisplay = (status: OrderStatus) => {
        const statusConfig = {
            pending: { label: 'Pending', class: 'status-pending' },
            processing: { label: 'Processing', class: 'status-processing' },
            confirmed: { label: 'Confirmed', class: 'status-confirmed' },
            shipped: { label: 'Shipped', class: 'status-shipped' },
            delivered: { label: 'Delivered', class: 'status-delivered' },
            completed: { label: 'Completed', class: 'status-completed' },
            cancelled: { label: 'Cancelled', class: 'status-cancelled' },
            refunded: { label: 'Refunded', class: 'status-refunded' },
        };
        return statusConfig[status];
    };

    // Get payment method display
    const getPaymentMethodDisplay = (method: string | null) => {
        if (!method) return 'N/A';
        const methodMap: Record<string, string> = {
            cash: 'Cash',
            card: 'Card',
            bank_transfer: 'Bank Transfer',
            credit: 'Credit',
            other: 'Other'
        };
        return methodMap[method] || method;
    };

    // Handle view detail
    const handleViewDetail = (orderId: number) => {
        setSelectedOrderId(orderId);
        setShowOrderDetail(true);
        setActiveDropdown(null);
    };

    // Handle checkout (for processing orders)
    const handleCheckout = async (orderId: number) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        try {
            setCheckoutLoading(orderId);
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const orderData = await response.json();
                // Navigate to checkout with order data
                navigate('/checkout', {
                    state: {
                        orderId: orderData.id,
                        // You may need to reconstruct cartItems from order items
                        // For now, redirecting to checkout page
                    }
                });
            } else {
                alert('Failed to load order details');
            }
        } catch (error) {
            console.error('Error loading order:', error);
            alert('Failed to load order details');
        } finally {
            setCheckoutLoading(null);
            setActiveDropdown(null);
        }
    };

    // Handle delete click (show confirmation modal)
    const handleDeleteClick = (order: Order) => {
        setOrderToDelete(order);
        setShowDeleteConfirm(true);
        setActiveDropdown(null);
    };

    // Handle delete cancel
    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setOrderToDelete(null);
    };

    // Handle delete confirm (for processing orders)
    const handleDeleteConfirm = async () => {
        if (!orderToDelete) return;

        try {
            setDeleteLoading(true);
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/orders/${orderToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                // Remove order from list
                setOrders(orders.filter(o => o.id !== orderToDelete.id));
                setShowDeleteConfirm(false);
                setOrderToDelete(null);
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to delete order' }));
                throw new Error(error.error || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert((error as Error).message || 'Failed to delete order');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Toggle dropdown
    const toggleDropdown = (orderId: number) => {
        setActiveDropdown(activeDropdown === orderId ? null : orderId);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.unified-dropdown')) {
                setActiveDropdown(null);
            }
            if (!target.closest('.filter-dropdown-container')) {
                setShowFilterDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (loading) {
        return (
            <UserLayout title="Orders">
                <div className="empty-state">
                    <div className="loading-spinner"></div>
                    <p>Loading orders...</p>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout title="Orders">
            <div className="user-orders-page">
                {/* Toolbar */}
                <div className="orders-toolbar">
                    <div className="toolbar-left">
                        {/* Search */}
                        <div className="search-container">
                            <IconSearch className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search orders by order number, client name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter */}
                        <div className="filter-dropdown-container">
                            <button 
                                className="btn-filter"
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                title="Filter by status"
                            >
                                <IconFilter />
                            </button>
                            {showFilterDropdown && (
                                <div className="filter-dropdown-menu">
                                    <button 
                                        className={`filter-option ${filterStatus === 'all' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('all');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        All Orders
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'pending' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('pending');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Pending
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'processing' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('processing');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Processing
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'confirmed' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('confirmed');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Confirmed
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'shipped' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('shipped');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Shipped
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'delivered' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('delivered');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Delivered
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'completed' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('completed');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Completed
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'cancelled' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('cancelled');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Cancelled
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'refunded' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('refunded');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Refunded
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="toolbar-right">
                        {/* View Toggle */}
                        <div className="view-toggle desktop-only">
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => !isMobile && setViewMode('table')}
                                disabled={isMobile}
                                title="Table view"
                            >
                                <IconList />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                                title="Card view"
                            >
                                <IconGrid />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="orders-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading orders...</p>
                    </div>
                )}

                {/* Table View */}
                {!loading && viewMode === 'table' && !isMobile ? (
                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order Number</th>
                                    <th>Client</th>
                                    <th>Items</th>
                                    <th>Total Amount</th>
                                    <th>Payment Method</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr 
                                        key={order.id}
                                        className="order-row-clickable"
                                        onClick={(e) => {
                                            // Don't trigger if clicking on dropdown button
                                            if (!(e.target as Element).closest('.unified-dropdown')) {
                                                handleViewDetail(order.id);
                                            }
                                        }}
                                    >
                                        <td>
                                            <span className="order-code">{order.order_number}</span>
                                        </td>
                                        <td>
                                            {order.client ? (
                                                <div className="client-info">
                                                    <div className="client-name">{order.client.name}</div>
                                                    <div className="client-phone">{order.client.phone}</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted">N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="item-count">{order.item_count || 0} items</span>
                                        </td>
                                        <td>
                                            <span className="order-value">{formatVND(order.total_amount)}</span>
                                        </td>
                                        <td>
                                            <span className="payment-method">{getPaymentMethodDisplay(order.payment_method)}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusDisplay(order.status).class}`}>
                                                {getStatusDisplay(order.status).label}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="order-date">{formatDate(order.created_at)}</span>
                                        </td>
                                        <td>
                                            <div className={`unified-dropdown ${activeDropdown === order.id ? 'active' : ''}`}>
                                                <button
                                                    className="unified-more-btn"
                                                    onClick={() => toggleDropdown(order.id)}
                                                >
                                                    <IconMoreVertical />
                                                </button>
                                                {activeDropdown === order.id && (
                                                    <div className="unified-dropdown-menu">
                                                        <button
                                                            className="unified-dropdown-item"
                                                            onClick={() => {
                                                                handleViewDetail(order.id);
                                                                setActiveDropdown(null);
                                                            }}
                                                        >
                                                            <IconEye />
                                                            View Detail
                                                        </button>
                                                        {order.status === 'processing' && (
                                                            <>
                                                                <button
                                                                    className="unified-dropdown-item"
                                                                    onClick={() => handleCheckout(order.id)}
                                                                    disabled={checkoutLoading === order.id}
                                                                >
                                                                    {checkoutLoading === order.id ? (
                                                                        <>
                                                                            <div className="loading-spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }}></div>
                                                                            <span>Loading...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <IconShoppingBag />
                                                                            Checkout
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    className="unified-dropdown-item danger"
                                                                    onClick={() => handleDeleteClick(order)}
                                                                >
                                                                    <IconTrash2 />
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredOrders.length === 0 && (
                            <div className="empty-state">
                                <IconPackage />
                                <h3>No orders found</h3>
                                <p>Try adjusting your search or filter criteria</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Card View */
                    !loading && (
                        <div className="orders-grid">
                            {filteredOrders.map((order) => (
                                <div 
                                    key={order.id} 
                                    className="order-card order-card-clickable"
                                    onClick={(e) => {
                                        // Don't trigger if clicking on dropdown button
                                        if (!(e.target as Element).closest('.unified-dropdown')) {
                                            handleViewDetail(order.id);
                                        }
                                    }}
                                >
                                <div className="card-header">
                                    <div className="card-title">
                                        <span className="order-code">{order.order_number}</span>
                                        <span className={`status-badge ${getStatusDisplay(order.status).class}`}>
                                            {getStatusDisplay(order.status).label}
                                        </span>
                                    </div>
                                    <div className={`unified-dropdown ${activeDropdown === order.id ? 'active' : ''}`}>
                                        <button
                                            className="unified-more-btn"
                                            onClick={() => toggleDropdown(order.id)}
                                        >
                                            <IconMoreVertical />
                                        </button>
                                        {activeDropdown === order.id && (
                                            <div className="unified-dropdown-menu">
                                                <button
                                                    className="unified-dropdown-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetail(order.id);
                                                        setActiveDropdown(null);
                                                    }}
                                                >
                                                    <IconEye />
                                                    View Detail
                                                </button>
                                                {order.status === 'processing' && (
                                                    <>
                                                        <button
                                                            className="unified-dropdown-item"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCheckout(order.id);
                                                                setActiveDropdown(null);
                                                            }}
                                                            disabled={checkoutLoading === order.id}
                                                        >
                                                            {checkoutLoading === order.id ? (
                                                                <>
                                                                    <div className="loading-spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }}></div>
                                                                    <span>Loading...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <IconShoppingBag />
                                                                    Checkout
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            className="unified-dropdown-item danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClick(order);
                                                                setActiveDropdown(null);
                                                            }}
                                                        >
                                                            <IconTrash2 />
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="card-body">
                                    {order.client && (
                                        <div className="card-row">
                                            <span className="card-label">Client:</span>
                                            <div className="card-value-group">
                                                <span className="card-value">{order.client.name}</span>
                                                <span className="card-value-sub">{order.client.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="card-row">
                                        <span className="card-label">Items:</span>
                                        <span className="card-value">{order.item_count || 0} items</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="card-label">Total Amount:</span>
                                        <span className="card-value order-value">{formatVND(order.total_amount)}</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="card-label">Payment Method:</span>
                                        <span className="card-value">{getPaymentMethodDisplay(order.payment_method)}</span>
                                    </div>
                                    <div className="card-row">
                                        <span className="card-label">Payment Status:</span>
                                        <span className={`card-value payment-status payment-status-${order.payment_status}`}>
                                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="card-row">
                                        <span className="card-label">Created Date:</span>
                                        <span className="card-value">{formatDate(order.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                            {filteredOrders.length === 0 && (
                                <div className="empty-state">
                                    <IconPackage />
                                    <h3>No orders found</h3>
                                    <p>Try adjusting your search or filter criteria</p>
                                </div>
                            )}
                        </div>
                    )
                )}

                {/* Order Detail Modal */}
                <OrderDetailModal
                    open={showOrderDetail}
                    orderId={selectedOrderId}
                    onClose={() => {
                        setShowOrderDetail(false);
                        setSelectedOrderId(null);
                    }}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    open={showDeleteConfirm}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Order"
                    message={orderToDelete ? `Are you sure you want to delete order ${orderToDelete.order_number}? This action cannot be undone.` : 'Are you sure you want to delete this order?'}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                    loading={deleteLoading}
                />
            </div>
        </UserLayout>
    );
}
