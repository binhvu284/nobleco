import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconSearch, IconFilter, IconList, IconGrid, IconEye, IconTrash2, IconMoreVertical } from '../components/icons';
import { getCurrentUser } from '../../auth';
import AdminOrderDetailModal from '../components/AdminOrderDetailModal';
import ConfirmModal from '../components/ConfirmModal';
import { getAvatarColor, getAvatarInitial, getAvatarViewportStyles } from '../../utils/avatarUtils';

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
        email?: string;
    };
    created_by: number;
    creator?: {
        id: number;
        name: string;
        email: string;
        avatar?: {
            url: string;
            viewport_x?: number;
            viewport_y?: number;
            viewport_size?: number;
            width?: number;
            height?: number;
        } | null;
    };
    created_at: string;
    updated_at: string;
    item_count?: number;
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

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Load orders
    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const currentUser = getCurrentUser();
            if (!currentUser || currentUser.role !== 'admin') {
                setOrders([]);
                return;
            }

            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch('/api/orders', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setOrders(data || []);
            } else {
                console.error('Failed to load orders');
                setOrders([]);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

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

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.creator?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.creator?.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

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
        return statusConfig[status] || { label: status, class: 'status-pending' };
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
        setShowOrderDetailModal(true);
        setActiveDropdown(null);
    };

    // Handle delete click - show confirmation modal
    const handleDelete = (order: Order) => {
        setActiveDropdown(null);
        setOrderToDelete(order);
        setShowDeleteConfirm(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!orderToDelete) return;

        setDeleteLoading(true);

        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/orders/${orderToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                setOrders(orders.filter(o => o.id !== orderToDelete.id));
                setShowDeleteConfirm(false);
                setOrderToDelete(null);
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert((error as Error).message || 'Failed to delete order');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle delete cancel
    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setOrderToDelete(null);
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

    return (
        <AdminLayout title="Orders Management">
            <div className="admin-orders-page">
                {/* Toolbar */}
                <div className="orders-toolbar">
                    <div className="toolbar-left">
                        {/* Search */}
                        <div className="search-container">
                            <IconSearch />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search orders..."
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
                                        className={`filter-option ${filterStatus === 'completed' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('completed');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        Completed
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


                {/* Table View */}
                {viewMode === 'table' && !isMobile ? (
                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order Code</th>
                                    <th>Products</th>
                                    <th>Order Value</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th>Created By</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <span className="order-code">{order.order_number}</span>
                                        </td>
                                        <td>
                                            <span className="product-count">{order.item_count || 0} items</span>
                                        </td>
                                        <td>
                                            <span className="order-value">{formatVND(order.total_amount)}</span>
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
                                            {order.creator ? (
                                                <div className="user-info">
                                                    {order.creator.avatar?.url ? (
                                                        <img
                                                            className="user-avatar"
                                                            src={order.creator.avatar.url}
                                                            alt={order.creator.name}
                                                            style={getAvatarViewportStyles(order.creator.avatar, 40)}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const fallback = target.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className="user-avatar"
                                                        style={{
                                                            display: order.creator.avatar?.url ? 'none' : 'flex',
                                                            backgroundColor: getAvatarColor(order.creator.name)
                                                        }}
                                                    >
                                                        {getAvatarInitial(order.creator.name)}
                                                    </div>
                                                    <div className="user-details">
                                                        <div className="user-name">{order.creator.name}</div>
                                                        <div className="user-email">{order.creator.email}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted">N/A</span>
                                            )}
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
                                                            onClick={() => handleViewDetail(order.id)}
                                                        >
                                                            <IconEye />
                                                            View Detail
                                                        </button>
                                                        <button
                                                            className="unified-dropdown-item danger"
                                                            onClick={() => handleDelete(order)}
                                                        >
                                                            <IconTrash2 />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {loading ? (
                            <div className="empty-state">
                                <div className="loading-spinner"></div>
                                <p>Loading orders...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📦</div>
                                <p>No orders found</p>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    /* Card View */
                    <div className="orders-grid">
                        {loading ? (
                            <div className="empty-state">
                                <div className="loading-spinner"></div>
                                <p>Loading orders...</p>
                            </div>
                        ) : (
                            <>
                                {filteredOrders.map((order) => (
                                    <div key={order.id} className="order-card">
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
                                                            onClick={() => handleViewDetail(order.id)}
                                                        >
                                                            <IconEye />
                                                            View Detail
                                                        </button>
                                                        <button
                                                            className="unified-dropdown-item danger"
                                                            onClick={() => handleDelete(order)}
                                                        >
                                                            <IconTrash2 />
                                                            Delete
                                                        </button>
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
                                                        {order.client.phone && (
                                                            <span className="card-value-sub">{order.client.phone}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="card-row">
                                                <span className="card-label">Products:</span>
                                                <span className="card-value">{order.item_count || 0} items</span>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">Order Value:</span>
                                                <span className="card-value order-value">{formatVND(order.total_amount)}</span>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">Payment Method:</span>
                                                <span className="card-value">{getPaymentMethodDisplay(order.payment_method)}</span>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">Created Date:</span>
                                                <span className="card-value">{formatDate(order.created_at)}</span>
                                            </div>
                                        </div>

                                        {order.creator && (
                                            <div className="card-footer">
                                                <div className="user-info">
                                                    {order.creator.avatar?.url ? (
                                                        <img
                                                            className="user-avatar"
                                                            src={order.creator.avatar.url}
                                                            alt={order.creator.name}
                                                            style={getAvatarViewportStyles(order.creator.avatar, 40)}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const fallback = target.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className="user-avatar"
                                                        style={{
                                                            display: order.creator.avatar?.url ? 'none' : 'flex',
                                                            backgroundColor: getAvatarColor(order.creator.name)
                                                        }}
                                                    >
                                                        {getAvatarInitial(order.creator.name)}
                                                    </div>
                                                    <div className="user-details">
                                                        <div className="user-name">{order.creator.name}</div>
                                                        <div className="user-email">{order.creator.email}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {filteredOrders.length === 0 && (
                                    <div className="empty-state">
                                        <div className="empty-icon">📦</div>
                                        <p>No orders found</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Order Detail Modal */}
                <AdminOrderDetailModal
                    open={showOrderDetailModal}
                    orderId={selectedOrderId}
                    onClose={() => {
                        setShowOrderDetailModal(false);
                        setSelectedOrderId(null);
                    }}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    open={showDeleteConfirm}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Order"
                    message={orderToDelete ? `Are you sure you want to delete order "${orderToDelete.order_number}"? This will permanently remove the order and all associated order items. This action cannot be undone.` : 'Are you sure you want to delete this order?'}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                    loading={deleteLoading}
                />
            </div>
        </AdminLayout>
    );
}
