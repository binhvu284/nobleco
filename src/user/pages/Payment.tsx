import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import {
    IconX,
    IconChevronLeft,
    IconCheck,
    IconPackage
} from '../../admin/components/icons';
import QRCode from 'qrcode';

// QR Code Display Component
function QRCodeDisplay({ value }: { value: string }) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');

    useEffect(() => {
        QRCode.toDataURL(value, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })
            .then(url => setQrDataUrl(url))
            .catch(err => console.error('Error generating QR code:', err));
    }, [value]);

    if (!qrDataUrl) {
        return <div className="qr-loading">Generating QR code...</div>;
    }

    return <img src={qrDataUrl} alt="Bank Transfer QR Code" className="qr-code-image" />;
}

// Product interface
interface Product {
    id: number;
    name: string;
    sku: string | null;
    price: number;
    images?: {
        id: number;
        url: string;
    }[];
}

// Cart item interface
interface CartItem {
    product: Product;
    quantity: number;
}

// Client interface
interface Client {
    id: number;
    name: string;
    phone: string;
    email?: string;
}

// Format number as VND currency
const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

// Bank information (can be moved to config later)
const BANK_INFO = {
    name: 'Vietcombank',
    accountOwner: 'NOBLECO JEWELRY COMPANY',
    accountNumber: '1234567890'
};

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | null>(null);
    const [cashReceived, setCashReceived] = useState('');
    const [orderCompleted, setOrderCompleted] = useState(false);

    // Order data from location state
    const [orderData, setOrderData] = useState<{
        cartItems: CartItem[];
        clientId: number;
        client: Client;
        location: string;
        discountCode: string;
        notes: string;
        subtotal: number;
        discountAmount: number;
        taxAmount: number;
        total: number;
    } | null>(null);

    useEffect(() => {
        if (location.state) {
            setOrderData(location.state as any);
        } else {
            // Redirect to checkout if no order data
            navigate('/checkout');
        }
    }, [location.state, navigate]);

    if (!orderData) {
        return (
            <UserLayout title="Payment">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <p>Loading...</p>
                </div>
            </UserLayout>
        );
    }

    const { cartItems, client, subtotal, discountAmount, taxAmount, total } = orderData;

    // Calculate change for cash payment
    const cashReceivedNum = parseFloat(cashReceived) || 0;
    const change = cashReceivedNum > total ? cashReceivedNum - total : 0;

    const handleCompleteOrder = () => {
        // TODO: Save order to database
        setOrderCompleted(true);
    };

    const handleBackToCheckout = () => {
        navigate('/checkout', { state: { cartItems } });
    };

    const handleGoToProducts = () => {
        navigate('/product');
    };

    return (
        <UserLayout title="Payment">
            <div className="payment-container">
                <div className="payment-header">
                    <button className="back-btn" onClick={handleBackToCheckout}>
                        <IconChevronLeft />
                        Back to Checkout
                    </button>
                    <h1>Payment</h1>
                </div>

                <div className="payment-content">
                    <div className="payment-main">
                        {/* Order Summary */}
                        <section className="payment-section">
                            <h2>Order Summary</h2>
                            <div className="payment-order-items">
                                {cartItems.map(item => (
                                    <div key={item.product.id} className="payment-order-item">
                                        <div className="payment-order-item-image">
                                            {item.product.images && item.product.images.length > 0 ? (
                                                <img
                                                    src={item.product.images[0].url}
                                                    alt={item.product.name}
                                                />
                                            ) : (
                                                <IconPackage />
                                            )}
                                        </div>
                                        <div className="payment-order-item-details">
                                            <h3>{item.product.name}</h3>
                                            <div className="payment-order-item-meta">
                                                <span>Qty: {item.quantity}</span>
                                                <span>{formatVND(item.product.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="payment-summary-breakdown">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>{formatVND(subtotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="summary-row discount">
                                        <span>Discount</span>
                                        <span>-{formatVND(discountAmount)}</span>
                                    </div>
                                )}
                                {taxAmount > 0 && (
                                    <div className="summary-row">
                                        <span>Tax</span>
                                        <span>{formatVND(taxAmount)}</span>
                                    </div>
                                )}
                                <div className="summary-divider"></div>
                                <div className="summary-row total">
                                    <span>Total Amount</span>
                                    <span>{formatVND(total)}</span>
                                </div>
                            </div>
                        </section>

                        {/* Payment Method Selection */}
                        <section className="payment-section">
                            <h2>Select Payment Method</h2>
                            <div className="payment-methods">
                                <div
                                    className={`payment-method-card ${paymentMethod === 'cash' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('cash')}
                                >
                                    <div className="payment-method-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                        </svg>
                                    </div>
                                    <div className="payment-method-info">
                                        <h3>Cash</h3>
                                        <p>Pay with cash</p>
                                    </div>
                                    {paymentMethod === 'cash' && (
                                        <div className="payment-method-check">
                                            <IconCheck />
                                        </div>
                                    )}
                                </div>

                                <div
                                    className={`payment-method-card ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('bank_transfer')}
                                >
                                    <div className="payment-method-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                            <line x1="1" y1="10" x2="23" y2="10"></line>
                                        </svg>
                                    </div>
                                    <div className="payment-method-info">
                                        <h3>Bank Transfer</h3>
                                        <p>Transfer money via bank</p>
                                    </div>
                                    {paymentMethod === 'bank_transfer' && (
                                        <div className="payment-method-check">
                                            <IconCheck />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Cash Payment Form */}
                        {paymentMethod === 'cash' && (
                            <section className="payment-section">
                                <h2>Cash Payment</h2>
                                <div className="cash-payment-form">
                                    <div className="payment-form-group">
                                        <label>Total Amount</label>
                                        <div className="payment-amount-display">{formatVND(total)}</div>
                                    </div>
                                    <div className="payment-form-group">
                                        <label>Amount Received</label>
                                        <input
                                            type="number"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            placeholder="Enter amount received"
                                            className="payment-input"
                                            min={total}
                                        />
                                    </div>
                                    {cashReceived && cashReceivedNum >= total && (
                                        <div className="payment-form-group">
                                            <label>Change</label>
                                            <div className="payment-change-display positive">
                                                {formatVND(change)}
                                            </div>
                                        </div>
                                    )}
                                    {cashReceived && cashReceivedNum < total && (
                                        <div className="payment-form-group">
                                            <div className="payment-error">
                                                Insufficient amount. Need {formatVND(total - cashReceivedNum)} more.
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        className="complete-order-btn"
                                        onClick={handleCompleteOrder}
                                        disabled={!cashReceived || cashReceivedNum < total}
                                    >
                                        Confirm Order Complete
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Bank Transfer Form */}
                        {paymentMethod === 'bank_transfer' && (
                            <section className="payment-section">
                                <h2>Bank Transfer Information</h2>
                                <div className="bank-transfer-info">
                                    <div className="bank-info-card">
                                        <div className="bank-info-row">
                                            <span className="bank-info-label">Bank Name:</span>
                                            <span className="bank-info-value">{BANK_INFO.name}</span>
                                        </div>
                                        <div className="bank-info-row">
                                            <span className="bank-info-label">Account Owner:</span>
                                            <span className="bank-info-value">{BANK_INFO.accountOwner}</span>
                                        </div>
                                        <div className="bank-info-row">
                                            <span className="bank-info-label">Account Number:</span>
                                            <span className="bank-info-value copyable" onClick={() => {
                                                navigator.clipboard.writeText(BANK_INFO.accountNumber);
                                                alert('Account number copied to clipboard!');
                                            }}>
                                                {BANK_INFO.accountNumber}
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="bank-info-row">
                                            <span className="bank-info-label">Amount:</span>
                                            <span className="bank-info-value amount">{formatVND(total)}</span>
                                        </div>
                                    </div>
                                    <div className="bank-qr-section">
                                        <h3>Scan QR Code to Transfer</h3>
                                        <div className="bank-qr-code">
                                            <QRCodeDisplay
                                                value={`${BANK_INFO.name}|${BANK_INFO.accountNumber}|${total}`}
                                            />
                                        </div>
                                        <p className="bank-qr-note">Scan this QR code with your banking app to transfer the amount</p>
                                    </div>
                                    <button
                                        className="complete-order-btn"
                                        onClick={handleCompleteOrder}
                                    >
                                        Confirm Order Complete
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Order Completed Modal */}
                {orderCompleted && (
                    <>
                        <div className="modal-overlay" onClick={() => {}} />
                        <div className="modal-card order-completed-modal">
                            <div className="order-completed-icon">
                                <IconCheck />
                            </div>
                            <h2>Order Completed!</h2>
                            <p>Your order has been successfully processed.</p>
                            <div className="order-completed-actions">
                                <button className="btn-secondary" onClick={handleGoToProducts}>
                                    Continue Shopping
                                </button>
                                <button className="btn-primary" onClick={() => navigate('/orders')}>
                                    View Orders
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </UserLayout>
    );
}

