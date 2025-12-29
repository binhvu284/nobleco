import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    IconX,
    IconMaximize,
    IconMinimize,
    IconPackage,
    IconUser,
    IconCreditCard,
    IconFileText,
    IconMapPin
} from './icons';
import { getAvatarColor, getAvatarInitial, getAvatarViewportStyles } from '../../utils/avatarUtils';
import { useTranslation } from '../../shared/contexts/TranslationContext';

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

interface AdminOrderDetailModalProps {
    open: boolean;
    orderId: number | null;
    onClose: () => void;
}

export default function AdminOrderDetailModal({ open, orderId, onClose }: AdminOrderDetailModalProps) {
    const { t } = useTranslation();
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
                alert(t('adminOrders.failedLoadOrderDetails'));
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
        return statusConfig[status];
    };

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

    const getPaymentStatusDisplay = (status: string) => {
        const statusMap: Record<string, string> = {
            pending: t('adminOrders.paymentStatusPending'),
            partial: t('adminOrders.paymentStatusPartial'),
            paid: t('adminOrders.paymentStatusPaid'),
            failed: t('adminOrders.paymentStatusFailed'),
            refunded: t('adminOrders.paymentStatusRefunded')
        };
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    };

    if (!open) return null;

    return createPortal(
        <>
            <div className="order-detail-overlay" onClick={onClose} />
            <div className={`order-detail-modal ${isFullscreen ? 'fullscreen' : ''}`}>
                <div className="order-detail-header">
                    <div className="order-detail-header-left">
                        <h2>{t('adminOrders.orderDetails')}</h2>
                        {order && (
                            <span className={`status-badge ${getStatusDisplay(order.status).class}`}>
                                {getStatusDisplay(order.status).label}
                            </span>
                        )}
                        {order && order.creator && (
                            <div className="order-detail-made-by">
                                <span className="made-by-label">{t('adminOrders.madeBy')}:</span>
                                <div className="user-info" style={{ margin: 0 }}>
                                    {order.creator.avatar?.url ? (
                                        <img
                                            className="user-avatar"
                                            src={order.creator.avatar.url}
                                            alt={order.creator.name}
                                            style={getAvatarViewportStyles(order.creator.avatar, 32)}
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
                                            backgroundColor: getAvatarColor(order.creator.name),
                                            width: '32px',
                                            height: '32px',
                                            fontSize: '14px'
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
                    <div className="order-detail-header-actions">
                        {!isMobile && (
                            <button
                                className="order-detail-expand"
                                onClick={toggleFullscreen}
                                title={isFullscreen ? t('common.collapse') : t('common.expand')}
                            >
                                {isFullscreen ? <IconMinimize /> : <IconMaximize />}
                            </button>
                        )}
                        <button
                            className="order-detail-close"
                            onClick={onClose}
                            title={t('common.close')}
                        >
                            <IconX />
                        </button>
                    </div>
                </div>

                <div className="order-detail-body">
                    {loading ? (
                        <div className="order-detail-loading">
                            <div className="loading-spinner"></div>
                            <p>{t('adminOrders.loadingOrderDetails')}</p>
                        </div>
                    ) : order ? (
                        <div className="order-detail-content">
                            {/* Order Information and Client Section - Side by Side */}
                            <div className="order-detail-sections-row">
                                {/* Order Information Section */}
                                <section className="order-detail-section compact">
                                    <h3 className="order-detail-section-title">
                                        <IconPackage />
                                        {t('adminOrders.orderInformation')}
                                    </h3>
                                    <div className="order-detail-grid compact-grid">
                                        {/* Order Number and Location on same line */}
                                        <div className="order-detail-field-row">
                                            <div className="order-detail-field">
                                                <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.orderCode')}</label>
                                                <span className="order-number">{order.order_number}</span>
                                            </div>
                                            <div className="order-detail-field">
                                                <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.orderLocation')}</label>
                                                {order.shipping_address ? (
                                                    <span>
                                                        <IconMapPin style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                                                        {order.shipping_address}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">{t('common.notAvailable')}</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Created Date and Last Updated/Completed Date on same line */}
                                        <div className="order-detail-field-row">
                                            <div className="order-detail-field">
                                                <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.createdDate')}</label>
                                                <span>{formatDateTime(order.created_at)}</span>
                                            </div>
                                            <div className="order-detail-field">
                                                {order.status === 'completed' && order.completed_at ? (
                                                    <>
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.completedDate')}</label>
                                                        <span>{formatDateTime(order.completed_at)}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.lastUpdated')}</label>
                                                        <span>{formatDateTime(order.updated_at)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Cancelled date on separate line if exists */}
                                        {order.cancelled_at && (
                                            <div className="order-detail-field">
                                                <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.cancelledDate')}</label>
                                                <span>{formatDateTime(order.cancelled_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Client Information Section */}
                                <section className="order-detail-section compact">
                                    <h3 className="order-detail-section-title">
                                        <IconUser />
                                        {t('adminOrders.clientInformation')}
                                    </h3>
                                    <div className="order-detail-grid compact-grid">
                                        {order.client ? (
                                            <>
                                                <div className="order-detail-field-row">
                                                    <div className="order-detail-field">
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.clientName')}</label>
                                                        <span>{order.client.name}</span>
                                                    </div>
                                                    <div className="order-detail-field">
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.phone')}</label>
                                                        <span>{order.client.phone}</span>
                                                    </div>
                                                </div>
                                                <div className="order-detail-field-row">
                                                    <div className="order-detail-field">
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.location')}</label>
                                                        <span>{order.client.location || t('common.notAvailable')}</span>
                                                    </div>
                                                    <div className="order-detail-field">
                                                        <label style={{ color: 'var(--muted)', fontWeight: '500' }}>{t('adminOrders.gender')}</label>
                                                        <span>{order.client.gender ? (order.client.gender === 'Male' ? t('adminOrders.male') : order.client.gender === 'Female' ? t('adminOrders.female') : t('adminOrders.other')) : t('common.notAvailable')}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="order-detail-field">
                                                <span className="text-muted">{t('adminOrders.noClientAssigned')}</span>
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
                                        {t('adminOrders.orderItems')} ({order.items.length})
                                    </h3>
                                    <div className="order-items-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>{t('adminOrders.product')}</th>
                                                    <th>{t('adminOrders.sku')}</th>
                                                    <th>{t('adminOrders.quantity')}</th>
                                                    <th>{t('adminOrders.unitPrice')}</th>
                                                    <th>{t('adminOrders.discount')}</th>
                                                    <th>{t('adminOrders.lineTotal')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <span className="item-name">{item.product_name}</span>
                                                        </td>
                                                        <td>
                                                            <span className="item-sku">{item.product_sku || t('common.notAvailable')}</span>
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
                                    {t('adminOrders.orderSummary')}
                                </h3>
                                <div className="order-summary">
                                    <div className="order-summary-row">
                                        <span>{t('adminOrders.subtotal')}</span>
                                        <span>{formatVND(order.subtotal_amount)}</span>
                                    </div>
                                    {order.discount_amount > 0 && (
                                        <div className="order-summary-row discount">
                                            <span>{t('adminOrders.discount')}</span>
                                            <span>-{formatVND(order.discount_amount)}</span>
                                        </div>
                                    )}
                                    {order.tax_amount > 0 && (
                                        <div className="order-summary-row">
                                            <span>{t('adminOrders.tax')}</span>
                                            <span>{formatVND(order.tax_amount)}</span>
                                        </div>
                                    )}
                                    <div className="order-summary-divider"></div>
                                    <div className="order-summary-row total">
                                        <span>{t('adminOrders.totalAmount')}</span>
                                        <span>{formatVND(order.total_amount)}</span>
                                    </div>
                                    {order.payment_method && (
                                        <>
                                            <div className="order-summary-divider"></div>
                                            <div className="order-summary-row">
                                                <span>
                                                    <IconCreditCard style={{ width: '16px', height: '16px', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                                                    {t('adminOrders.paymentMethod')}
                                                </span>
                                                <span>{getPaymentMethodDisplay(order.payment_method)}</span>
                                            </div>
                                        </>
                                    )}
                                    {order.payment_status && (
                                        <>
                                            <div className="order-summary-divider"></div>
                                            <div className="order-summary-row">
                                                <span>
                                                    <IconCreditCard style={{ width: '16px', height: '16px', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                                                    {t('adminOrders.paymentStatus')}
                                                </span>
                                                <span className={`status-badge status-${order.payment_status}`}>
                                                    {getPaymentStatusDisplay(order.payment_status)}
                                                </span>
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
                                        {t('adminOrders.additionalNotes')}
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
                            <p>{t('adminOrders.orderNotFound')}</p>
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
}

