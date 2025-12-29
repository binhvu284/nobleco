import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconSearch, IconFilter, IconList, IconGrid, IconEye, IconTrash2, IconMoreVertical } from '../components/icons';
import { getCurrentUser } from '../../auth';
import AdminOrderDetailModal from '../components/AdminOrderDetailModal';
import ConfirmModal from '../components/ConfirmModal';
import { getAvatarColor, getAvatarInitial, getAvatarViewportStyles } from '../../utils/avatarUtils';
import { useTranslation } from '../../shared/contexts/TranslationContext';

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
    const { t } = useTranslation();
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
    const [testPaymentLoading, setTestPaymentLoading] = useState<number | null>(null);
    const [showTestPaymentConfirm, setShowTestPaymentConfirm] = useState(false);
    const [orderToTestPayment, setOrderToTestPayment] = useState<Order | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
                console.error(t('adminOrders.failedLoadOrders'));
                setOrders([]);
            }
        } catch (error) {
            console.error(t('adminOrders.errorLoadingOrders'), error);
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
            pending: { label: t('adminOrders.pending'), class: 'status-pending' },
            processing: { label: t('adminOrders.processing'), class: 'status-processing' },
            confirmed: { label: t('adminOrders.confirmed'), class: 'status-confirmed' },
            shipped: { label: t('adminOrders.shipped'), class: 'status-shipped' },
            delivered: { label: t('adminOrders.delivered'), class: 'status-delivered' },
            completed: { label: t('adminOrders.completed'), class: 'status-completed' },
            cancelled: { label: t('adminOrders.cancelled'), class: 'status-cancelled' },
            refunded: { label: t('adminOrders.refunded'), class: 'status-refunded' },
        };
        return statusConfig[status] || { label: status, class: 'status-pending' };
    };

    // Get payment method display
    const getPaymentMethodDisplay = (method: string | null) => {
        if (!method) return t('common.notAvailable');
        const methodMap: Record<string, string> = {
            cash: t('adminOrders.cash'),
            card: t('adminOrders.card'),
            bank_transfer: t('adminOrders.bankTransfer'),
            credit: t('adminOrders.credit'),
            other: t('adminOrders.other')
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
                throw new Error(error.error || t('adminOrders.failedDeleteOrder'));
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert((error as Error).message || t('adminOrders.failedDeleteOrder'));
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
    const toggleDropdown = (orderId: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation(); // Prevent row click when clicking dropdown
        }
        setActiveDropdown(activeDropdown === orderId ? null : orderId);
    };

    // Handle test payment click - show confirmation modal
    const handleTestPaymentClick = (order: Order, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation(); // Prevent row click when clicking test payment
        }
        setOrderToTestPayment(order);
        setShowTestPaymentConfirm(true);
        setActiveDropdown(null);
    };

    // Handle test payment confirmation
    const handleTestPaymentConfirm = async () => {
        if (!orderToTestPayment) return;

        try {
            setTestPaymentLoading(orderToTestPayment.id);
            const authToken = localStorage.getItem('nobleco_auth_token');
            
            if (!authToken) {
                setNotification({ type: 'error', message: t('common.authTokenNotFound') });
                setTimeout(() => setNotification(null), 3000);
                setShowTestPaymentConfirm(false);
                setOrderToTestPayment(null);
                return;
            }

            const response = await fetch(`/api/orders/${orderToTestPayment.id}/test-payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setNotification({ 
                    type: 'success', 
                    message: t('adminOrders.testPaymentSuccess').replace('{{orderNumber}}', orderToTestPayment.order_number)
                });
                setTimeout(() => setNotification(null), 5000);
                loadOrders(); // Reload orders to show updated status
            } else {
                throw new Error(data.error || t('adminOrders.failedProcessTestPayment'));
            }
        } catch (error) {
            console.error('Error processing test payment:', error);
            setNotification({ 
                type: 'error', 
                message: (error as Error).message || t('adminOrders.failedProcessTestPayment') 
            });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setTestPaymentLoading(null);
            setShowTestPaymentConfirm(false);
            setOrderToTestPayment(null);
        }
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
        <AdminLayout title={t('adminOrders.title')}>
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
                                placeholder={t('adminOrders.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter */}
                        <div className="filter-dropdown-container">
                            <button 
                                className="btn-filter"
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                title={t('adminOrders.filterByStatus')}
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
                                        {t('adminOrders.allOrders')}
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'pending' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('pending');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {t('adminOrders.pending')}
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'processing' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('processing');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {t('adminOrders.processing')}
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'completed' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('completed');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {t('adminOrders.completed')}
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'confirmed' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('confirmed');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {t('adminOrders.confirmed')}
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'shipped' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('shipped');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {t('adminOrders.shipped')}
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'delivered' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('delivered');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {t('adminOrders.delivered')}
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'cancelled' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('cancelled');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {t('adminOrders.cancelled')}
                                    </button>
                                    <button 
                                        className={`filter-option ${filterStatus === 'refunded' ? 'active' : ''}`}
                                        onClick={() => {
                                            setFilterStatus('refunded');
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {t('adminOrders.refunded')}
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
                                title={t('common.tableView')}
                            >
                                <IconList />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                                title={t('common.cardView')}
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
                                    <th>{t('adminOrders.orderCode')}</th>
                                    <th>{t('adminOrders.products')}</th>
                                    <th>{t('adminOrders.orderValue')}</th>
                                    <th>{t('adminOrders.status')}</th>
                                    <th>{t('adminOrders.createdDate')}</th>
                                    <th>{t('adminOrders.createdBy')}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr 
                                        key={order.id}
                                        onClick={() => handleViewDetail(order.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>
                                            <span className="order-code">{order.order_number}</span>
                                        </td>
                                        <td>
                                            <span className="product-count">{order.item_count || 0} {t('adminOrders.items')}</span>
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
                                                <span className="text-muted">{t('common.notAvailable')}</span>
                                            )}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div className={`unified-dropdown ${activeDropdown === order.id ? 'active' : ''}`}>
                                                <button
                                                    className="unified-more-btn"
                                                    onClick={(e) => toggleDropdown(order.id, e)}
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
                                                            }}
                                                        >
                                                            <IconEye />
                                                            {t('adminOrders.viewDetail')}
                                                        </button>
                                                        {order.status !== 'completed' && order.payment_status !== 'paid' && (
                                                            <button
                                                                className="unified-dropdown-item test-payment-item"
                                                                onClick={(e) => handleTestPaymentClick(order, e)}
                                                                disabled={testPaymentLoading === order.id}
                                                            >
                                                                {testPaymentLoading === order.id ? t('adminOrders.processing') : `🧪 ${t('adminOrders.testPayment')}`}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="unified-dropdown-item danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(order);
                                                            }}
                                                        >
                                                            <IconTrash2 />
                                                            {t('common.delete')}
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
                                <p>{t('adminOrders.loadingOrders')}</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📦</div>
                                <p>{t('adminOrders.noOrdersFound')}</p>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    /* Card View */
                    <div className="orders-grid">
                        {loading ? (
                            <div className="empty-state">
                                <div className="loading-spinner"></div>
                                <p>{t('adminOrders.loadingOrders')}</p>
                            </div>
                        ) : (
                            <>
                                {filteredOrders.map((order) => (
                                    <div 
                                        key={order.id} 
                                        className="order-card"
                                        onClick={() => handleViewDetail(order.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="card-header">
                                            <div className="card-title">
                                                <span className="order-code">{order.order_number}</span>
                                                <span className={`status-badge ${getStatusDisplay(order.status).class}`}>
                                                    {getStatusDisplay(order.status).label}
                                                </span>
                                            </div>
                                            <div className={`unified-dropdown ${activeDropdown === order.id ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="unified-more-btn"
                                                    onClick={(e) => toggleDropdown(order.id, e)}
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
                                                            }}
                                                        >
                                                            <IconEye />
                                                            {t('adminOrders.viewDetail')}
                                                        </button>
                                                        {order.status !== 'completed' && order.payment_status !== 'paid' && (
                                                            <button
                                                                className="unified-dropdown-item test-payment-item"
                                                                onClick={(e) => handleTestPaymentClick(order, e)}
                                                                disabled={testPaymentLoading === order.id}
                                                            >
                                                                {testPaymentLoading === order.id ? t('adminOrders.processing') : `🧪 ${t('adminOrders.testPayment')}`}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="unified-dropdown-item danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(order);
                                                            }}
                                                        >
                                                            <IconTrash2 />
                                                            {t('common.delete')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card-body">
                                            {order.client && (
                                                <div className="card-row">
                                                    <span className="card-label">{t('adminOrders.client')}:</span>
                                                    <div className="card-value-group">
                                                        <span className="card-value">{order.client.name}</span>
                                                        {order.client.phone && (
                                                            <span className="card-value-sub">{order.client.phone}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="card-row">
                                                <span className="card-label">{t('adminOrders.products')}:</span>
                                                <span className="card-value">{order.item_count || 0} items</span>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">{t('adminOrders.orderValue')}:</span>
                                                <span className="card-value order-value">{formatVND(order.total_amount)}</span>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">{t('adminOrders.paymentMethod')}:</span>
                                                <span className="card-value">{getPaymentMethodDisplay(order.payment_method)}</span>
                                            </div>
                                            <div className="card-row">
                                                <span className="card-label">{t('adminOrders.createdDate')}:</span>
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
                                        <p>{t('adminOrders.noOrdersFound')}</p>
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
                    title={t('adminOrders.deleteOrder')}
                    message={orderToDelete ? t('adminOrders.deleteOrderMessage').replace('{{orderNumber}}', orderToDelete.order_number) : t('adminOrders.deleteOrderConfirm')}
                    confirmText={t('common.delete')}
                    cancelText={t('common.cancel')}
                    type="danger"
                    loading={deleteLoading}
                />

                {/* Test Payment Confirmation Modal */}
                <ConfirmModal
                    open={showTestPaymentConfirm}
                    onClose={() => {
                        setShowTestPaymentConfirm(false);
                        setOrderToTestPayment(null);
                    }}
                    onConfirm={handleTestPaymentConfirm}
                    title={t('adminOrders.testPaymentTitle')}
                    message={orderToTestPayment ? t('adminOrders.testPaymentMessage').replace('{{orderNumber}}', orderToTestPayment.order_number) : t('adminOrders.testPaymentConfirm')}
                    confirmText={t('adminOrders.confirmTestPayment')}
                    cancelText={t('common.cancel')}
                    type="success"
                    loading={orderToTestPayment ? testPaymentLoading === orderToTestPayment.id : false}
                />

                {/* Notification Toast */}
                {notification && (
                    <div className={`notification-toast ${notification.type}`}>
                        <div className="notification-content">
                            {notification.type === 'success' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            )}
                            <span>{notification.message}</span>
                        </div>
                        <button 
                            className="notification-close"
                            onClick={() => setNotification(null)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
