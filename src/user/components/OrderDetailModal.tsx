import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    IconX,
    IconMaximize,
    IconMinimize,
    IconPackage,
    IconUser,
    IconCreditCard,
    IconFileText,
    IconMapPin,
    IconShoppingBag
} from '../../admin/components/icons';

// Order status type
type OrderStatus = 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';

// Order item interface
interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    product_sku: string | null;
    product_price: number;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    line_total: number;
}

// Order interface
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
    payment_date: string | null;
    client_id: number | null;
    client?: {
        id: number;
        name: string;
        phone: string;
        email?: string;
        gender?: 'Male' | 'Female' | 'Other';
        location?: string;
    };
    created_by: number;
    notes: string | null;
    shipping_address: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    cancelled_at: string | null;
    items?: OrderItem[];
}

// Format number as VND currency
const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

// Format date and time
const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Format date only
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

interface OrderDetailModalProps {
    open: boolean;
    orderId: number | null;
    onClose: () => void;
}

export default function OrderDetailModal({ open, orderId, onClose }: OrderDetailModalProps) {
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (open && orderId) {
            loadOrderDetail(orderId);
        } else {
            setOrder(null);
            setIsFullscreen(false);
        }
    }, [open, orderId]);

    const loadOrderDetail = async (id: number) => {
        try {
            setLoading(true);
            const authToken = localStorage.getItem('nobleco_auth_token');
            
            if (!authToken) {
                console.error('Auth token not found');
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/orders/${id}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrder(data);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Failed to load order detail:', response.status, errorData);
                alert('Failed to load order details');
            }
        } catch (error) {
            console.error('Error loading order detail:', error);
            alert('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleCheckout = async () => {
        if (order && order.status === 'processing') {
            try {
                setCheckoutLoading(true);
                // Small delay to show loading state
                await new Promise(resolve => setTimeout(resolve, 100));
                navigate('/checkout', {
                    state: {
                        orderId: order.id
                    }
                });
                onClose();
            } catch (error) {
                console.error('Error navigating to checkout:', error);
            } finally {
                setCheckoutLoading(false);
            }
        }
    };

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

    if (!open) return null;

    return createPortal(
        <>
            <div className="order-detail-overlay" onClick={onClose} />
            <div className={`order-detail-modal ${isFullscreen ? 'fullscreen' : ''}`}>
                <div className="order-detail-header">
                    <div className="order-detail-header-left">
                        <h2>Order Details</h2>
                        {order && (
                            <span className={`status-badge ${getStatusDisplay(order.status).class}`}>
                                {getStatusDisplay(order.status).label}
                            </span>
                        )}
                    </div>
                    <div className="order-detail-header-actions">
                        {order && order.status === 'processing' && (
                            <button
                                className="order-detail-checkout-btn"
                                onClick={handleCheckout}
                                title="Go to Checkout"
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading ? (
                                    <>
                                        <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}></div>
                                        <span>Loading...</span>
                                    </>
                                ) : (
                                    <>
                                        <IconShoppingBag />
                                        Checkout
                                    </>
                                )}
                            </button>
                        )}
                        {!isMobile && (
                            <button
                                className="order-detail-expand"
                                onClick={toggleFullscreen}
                                title={isFullscreen ? 'Shrink' : 'Expand'}
                            >
                                {isFullscreen ? <IconMinimize /> : <IconMaximize />}
                            </button>
                        )}
                        <button
                            className="order-detail-close"
                            onClick={onClose}
                            title="Close"
                        >
                            <IconX />
                        </button>
                    </div>
                </div>

                <div className="order-detail-body">
                    {loading ? (
                        <div className="order-detail-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading order details...</p>
                        </div>
                    ) : order ? (
                        <div className="order-detail-content">
                            {/* Order Information and Client Section - Side by Side */}
                            <div className="order-detail-sections-row">
                                {/* Order Information Section */}
                                <section className="order-detail-section compact">
                                    <h3 className="order-detail-section-title">
                                        <IconPackage />
                                        Order Information
                                    </h3>
                                    <div className="order-detail-grid compact-grid">
                                        {/* Order Number and Location on same line */}
                                        <div className="order-detail-field-row">
                                            <div className="order-detail-field">
                                                <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Order Number</label>
                                                <span className="order-number">{order.order_number}</span>
                                            </div>
                                            <div className="order-detail-field">
                                                <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Order Location</label>
                                                {order.shipping_address ? (
                                                    <span>
                                                        <IconMapPin style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                                                        {order.shipping_address}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">N/A</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Created Date and Last Updated/Completed Date on same line */}
                                        <div className="order-detail-field-row">
                                            <div className="order-detail-field">
                                                <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Created Date</label>
                                                <span>{formatDateTime(order.created_at)}</span>
                                            </div>
                                            <div className="order-detail-field">
                                                {order.status === 'completed' && order.completed_at ? (
                                                    <>
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Completed Date</label>
                                                        <span>{formatDateTime(order.completed_at)}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Last Updated</label>
                                                        <span>{formatDateTime(order.updated_at)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Cancelled date on separate line if exists */}
                                        {order.cancelled_at && (
                                            <div className="order-detail-field">
                                                <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Cancelled Date</label>
                                                <span>{formatDateTime(order.cancelled_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Client Information Section */}
                                <section className="order-detail-section compact">
                                    <h3 className="order-detail-section-title">
                                        <IconUser />
                                        Client Information
                                    </h3>
                                    <div className="order-detail-grid compact-grid">
                                        {order.client ? (
                                            <>
                                                <div className="order-detail-field-row">
                                                    <div className="order-detail-field">
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Client Name</label>
                                                        <span>{order.client.name}</span>
                                                    </div>
                                                    <div className="order-detail-field">
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Phone</label>
                                                        <span>{order.client.phone}</span>
                                                    </div>
                                                </div>
                                                <div className="order-detail-field-row">
                                                    <div className="order-detail-field">
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Location</label>
                                                        <span>{order.client.location || 'N/A'}</span>
                                                    </div>
                                                    <div className="order-detail-field">
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>Gender</label>
                                                        <span>{order.client.gender || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="order-detail-field">
                                                <span className="text-muted">No client assigned</span>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Order Items Section */}
                            {order.items && order.items.length > 0 && (
                                <section className="order-detail-section">
                                    <h3 className="order-detail-section-title">
                                        <IconPackage />
                                        Order Items ({order.items.length})
                                    </h3>
                                    <div className="order-items-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>SKU</th>
                                                    <th>Quantity</th>
                                                    <th>Unit Price</th>
                                                    <th>Discount</th>
                                                    <th>Line Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <span className="item-name">{item.product_name}</span>
                                                        </td>
                                                        <td>
                                                            <span className="item-sku">{item.product_sku || 'N/A'}</span>
                                                        </td>
                                                        <td>
                                                            <span className="item-quantity">{item.quantity}</span>
                                                        </td>
                                                        <td>
                                                            <span className="item-price">{formatVND(item.unit_price)}</span>
                                                        </td>
                                                        <td>
                                                            <span className="item-discount">
                                                                {item.discount_amount > 0 ? `-${formatVND(item.discount_amount)}` : '-'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="item-total">{formatVND(item.line_total)}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* Order Summary Section */}
                            <section className="order-detail-section">
                                <h3 className="order-detail-section-title">
                                    <IconFileText />
                                    Order Summary
                                </h3>
                                <div className="order-summary">
                                    <div className="order-summary-row">
                                        <span>Subtotal</span>
                                        <span>{formatVND(order.subtotal_amount)}</span>
                                    </div>
                                    {order.discount_amount > 0 && (
                                        <div className="order-summary-row discount">
                                            <span>Discount</span>
                                            <span>-{formatVND(order.discount_amount)}</span>
                                        </div>
                                    )}
                                    {order.tax_amount > 0 && (
                                        <div className="order-summary-row">
                                            <span>Tax</span>
                                            <span>{formatVND(order.tax_amount)}</span>
                                        </div>
                                    )}
                                    <div className="order-summary-divider"></div>
                                    <div className="order-summary-row total">
                                        <span>Total Amount</span>
                                        <span>{formatVND(order.total_amount)}</span>
                                    </div>
                                    {order.payment_method && (
                                        <>
                                            <div className="order-summary-divider"></div>
                                            <div className="order-summary-row">
                                                <span>
                                                    <IconCreditCard style={{ width: '16px', height: '16px', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                                                    Payment Method
                                                </span>
                                                <span>{getPaymentMethodDisplay(order.payment_method)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* Notes Section */}
                            {order.notes && (
                                <section className="order-detail-section">
                                    <h3 className="order-detail-section-title">
                                        <IconFileText />
                                        Additional Notes
                                    </h3>
                                    <div className="order-notes">
                                        <p>{order.notes}</p>
                                    </div>
                                </section>
                            )}
                        </div>
                    ) : (
                        <div className="order-detail-empty">
                            <IconPackage />
                            <p>Order not found</p>
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
}


