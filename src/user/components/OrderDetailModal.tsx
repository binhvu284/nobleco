import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    IconX,
    IconMaximize,
    IconMinimize,
    IconPackage,
    IconUser,
    IconCreditCard,
    IconFileText
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
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
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
            // TODO: Replace with actual API endpoint
            // const response = await fetch(`/api/orders/${id}`);
            // if (response.ok) {
            //     const data = await response.json();
            //     setOrder(data);
            // }

            // Mock data for UI development
            const mockOrder: Order = {
                id: id,
                order_number: `ORD-2024-${String(id).padStart(5, '0')}`,
                subtotal_amount: 5000000,
                discount_amount: 500000,
                tax_amount: 0,
                total_amount: 4500000,
                status: 'completed',
                payment_method: 'cash',
                payment_status: 'paid',
                payment_date: '2024-01-15T10:35:00Z',
                client_id: 1,
                client: {
                    id: 1,
                    name: 'Nguyễn Văn A',
                    phone: '0901234567',
                    email: 'nguyenvana@example.com',
                    location: 'Vietnam'
                },
                created_by: 1,
                notes: 'Please handle with care. Customer prefers morning delivery.',
                shipping_address: '123 Main Street, District 1, Ho Chi Minh City',
                created_at: '2024-01-15T10:30:00Z',
                updated_at: '2024-01-15T10:35:00Z',
                completed_at: '2024-01-15T10:35:00Z',
                cancelled_at: null,
                items: [
                    {
                        id: 1,
                        product_id: 1,
                        product_name: 'Diamond Ring - Classic',
                        product_sku: 'RING-001',
                        product_price: 2000000,
                        quantity: 1,
                        unit_price: 2000000,
                        discount_amount: 200000,
                        line_total: 1800000
                    },
                    {
                        id: 2,
                        product_id: 2,
                        product_name: 'Gold Necklace - Elegant',
                        product_sku: 'NECK-002',
                        product_price: 1500000,
                        quantity: 2,
                        unit_price: 1500000,
                        discount_amount: 300000,
                        line_total: 2700000
                    }
                ]
            };

            setOrder(mockOrder);
        } catch (error) {
            console.error('Error loading order detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
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
                            {/* Order Information Section */}
                            <section className="order-detail-section">
                                <h3 className="order-detail-section-title">
                                    <IconPackage />
                                    Order Information
                                </h3>
                                <div className="order-detail-grid">
                                    <div className="order-detail-field">
                                        <label>Order Number</label>
                                        <span className="order-number">{order.order_number}</span>
                                    </div>
                                    <div className="order-detail-field">
                                        <label>Order Status</label>
                                        <span className={`status-badge ${getStatusDisplay(order.status).class}`}>
                                            {getStatusDisplay(order.status).label}
                                        </span>
                                    </div>
                                    <div className="order-detail-field">
                                        <label>Created Date</label>
                                        <span>{formatDateTime(order.created_at)}</span>
                                    </div>
                                    <div className="order-detail-field">
                                        <label>Last Updated</label>
                                        <span>{formatDateTime(order.updated_at)}</span>
                                    </div>
                                    {order.completed_at && (
                                        <div className="order-detail-field">
                                            <label>Completed Date</label>
                                            <span>{formatDateTime(order.completed_at)}</span>
                                        </div>
                                    )}
                                    {order.cancelled_at && (
                                        <div className="order-detail-field">
                                            <label>Cancelled Date</label>
                                            <span>{formatDateTime(order.cancelled_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Client Information Section */}
                            {order.client && (
                                <section className="order-detail-section">
                                    <h3 className="order-detail-section-title">
                                        <IconUser />
                                        Client Information
                                    </h3>
                                    <div className="order-detail-grid">
                                        <div className="order-detail-field">
                                            <label>Client Name</label>
                                            <span>{order.client.name}</span>
                                        </div>
                                        <div className="order-detail-field">
                                            <label>Phone</label>
                                            <span>{order.client.phone}</span>
                                        </div>
                                        {order.client.email && (
                                            <div className="order-detail-field">
                                                <label>Email</label>
                                                <span>{order.client.email}</span>
                                            </div>
                                        )}
                                        {order.client.location && (
                                            <div className="order-detail-field">
                                                <label>Location</label>
                                                <span>{order.client.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Shipping Information Section */}
                            {order.shipping_address && (
                                <section className="order-detail-section">
                                    <h3 className="order-detail-section-title">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                        Shipping Information
                                    </h3>
                                    <div className="order-detail-field full-width">
                                        <label>Shipping Address</label>
                                        <span>{order.shipping_address}</span>
                                    </div>
                                </section>
                            )}

                            {/* Payment Information Section */}
                            <section className="order-detail-section">
                                <h3 className="order-detail-section-title">
                                    <IconCreditCard />
                                    Payment Information
                                </h3>
                                <div className="order-detail-grid">
                                    <div className="order-detail-field">
                                        <label>Payment Method</label>
                                        <span>{getPaymentMethodDisplay(order.payment_method)}</span>
                                    </div>
                                    <div className="order-detail-field">
                                        <label>Payment Status</label>
                                        <span className={`payment-status payment-status-${order.payment_status}`}>
                                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                        </span>
                                    </div>
                                    {order.payment_date && (
                                        <div className="order-detail-field">
                                            <label>Payment Date</label>
                                            <span>{formatDateTime(order.payment_date)}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

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

