import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import UserLayout from '../components/UserLayout';
import {
    IconChevronLeft,
    IconCheck,
    IconPackage
} from '../../admin/components/icons';

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

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    const [orderCompleted, setOrderCompleted] = useState(false);
    const [creatingPayment, setCreatingPayment] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'expired' | 'checking'>('pending');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [bankAccount, setBankAccount] = useState<any>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const paymentCreatedRef = useRef(false);

    // Order data from location state
    const [orderData, setOrderData] = useState<{
        orderId?: number;
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

    // Create Sepay payment order on mount
    useEffect(() => {
        if (!orderData?.orderId || paymentCreatedRef.current) return;

        const createPayment = async () => {
            try {
                setCreatingPayment(true);
                const authToken = localStorage.getItem('nobleco_auth_token');
                
                if (!authToken) {
                    alert('Please login to continue');
                    navigate('/checkout');
                    return;
                }

                const response = await fetch(`/api/orders/${orderData.orderId}/create-payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (!response.ok) {
                    let errorMessage = 'Failed to create payment order';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || errorMessage;
                    } catch (e) {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }

                let paymentData;
                try {
                    paymentData = await response.json();
                } catch (e) {
                    throw new Error('Invalid response from server');
                }
                
                // Generate VietQR code using Sepay's QR code generator
                // Sepay QR generator creates proper VietQR format for Vietnamese banking apps
                if (paymentData.order_number) {
                    try {
                        // Get merchant bank account info
                        const configResponse = await fetch('/api/payment-config');
                        let bankInfo = null;
                        if (configResponse.ok) {
                            const configData = await configResponse.json();
                            bankInfo = configData.bank_account;
                        }

                        if (bankInfo?.account_number && bankInfo?.bank_name) {
                            // Use Sepay's QR code generator API
                            // Format: https://qr.sepay.vn/img?acc=ACCOUNT&bank=BANK_NAME&amount=AMOUNT&des=DESCRIPTION
                            const amount = Math.round(orderData.total);
                            const paymentCode = paymentData.order_number; // Payment code for Sepay detection
                            
                            // Encode parameters for URL
                            const qrCodeImageUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(bankInfo.account_number)}&bank=${encodeURIComponent(bankInfo.bank_name)}&amount=${amount}&des=${encodeURIComponent(paymentCode)}`;
                            
                            setQrCodeUrl(qrCodeImageUrl);
                        } else {
                            // Fallback: Generate simple QR code with payment code if bank info not available
                            const qrData = `Payment Code: ${paymentData.order_number}\nAmount: ${formatVND(orderData.total)}`;
                            const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                                width: 300,
                                margin: 2,
                                errorCorrectionLevel: 'M',
                                color: {
                                    dark: '#000000',
                                    light: '#FFFFFF'
                                }
                            });
                            setQrCodeUrl(qrCodeDataUrl);
                        }
                    } catch (qrError) {
                        console.error('Error generating QR code:', qrError);
                    }
                }
                
                // Get bank account info from payment config if not in response
                if (paymentData.bank_account) {
                    setBankAccount(paymentData.bank_account);
                } else {
                    // Fetch bank account info from config
                    try {
                        const configResponse = await fetch('/api/payment-config');
                        if (configResponse.ok) {
                            const configData = await configResponse.json();
                            if (configData.bank_account) {
                                setBankAccount(configData.bank_account);
                            }
                        }
                    } catch (e) {
                        console.error('Error fetching bank account info:', e);
                    }
                }
                
                setCreatingPayment(false);
                paymentCreatedRef.current = true;
                
                // Start polling payment status
                startPaymentPolling(orderData.orderId!);
            } catch (error) {
                console.error('Error creating payment:', error);
                alert((error as Error).message || 'Failed to create payment order. Please try again.');
                setCreatingPayment(false);
            }
        };

        createPayment();

        // Cleanup polling on unmount
        return () => {
            stopPaymentPolling();
        };
    }, [orderData?.orderId]);

    // Start polling payment status
    const startPaymentPolling = (orderId: number) => {
        // Poll immediately first time
        checkPaymentStatus(orderId);

        // Then poll every 5 seconds
        pollingIntervalRef.current = setInterval(() => {
            checkPaymentStatus(orderId);
        }, 5000);
    };

    // Stop polling
    const stopPaymentPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    // Check payment status
    const checkPaymentStatus = async (orderId: number) => {
        try {
            setPaymentStatus('checking');
            const authToken = localStorage.getItem('nobleco_auth_token');
            
            const response = await fetch(`/api/orders/${orderId}/payment-status`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                console.error('Failed to check payment status');
                setPaymentStatus('pending');
                return;
            }

            const statusData = await response.json();
            
            if (statusData.status === 'paid' || statusData.order_status === 'completed') {
                // Payment completed
                stopPaymentPolling();
                setPaymentStatus('paid');
                setOrderCompleted(true);
                // Clear cart from localStorage
                localStorage.removeItem('cart');
                
                // Auto-redirect after 3 seconds
                setTimeout(() => {
                    navigate('/orders');
                }, 3000);
            } else if (statusData.status === 'failed') {
                setPaymentStatus('failed');
                stopPaymentPolling();
            } else if (statusData.status === 'expired') {
                setPaymentStatus('expired');
                stopPaymentPolling();
            } else {
                setPaymentStatus('pending');
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
            setPaymentStatus('pending');
        }
    };

    const handleBackToCheckout = () => {
        stopPaymentPolling();
        if (orderData?.orderId) {
            navigate('/checkout', { 
                state: { 
                    orderId: orderData.orderId,
                    cartItems: orderData.cartItems,
                    clientId: orderData.clientId,
                    client: orderData.client,
                    location: orderData.location,
                    discountCode: orderData.discountCode,
                    notes: orderData.notes,
                    subtotal: orderData.subtotal,
                    discountAmount: orderData.discountAmount,
                    taxAmount: orderData.taxAmount,
                    total: orderData.total
                } 
            });
        } else {
            navigate('/checkout');
        }
    };

    const handleGoToProducts = () => {
        stopPaymentPolling();
        navigate('/product');
    };

    const handleManualRefresh = () => {
        if (orderData?.orderId) {
            checkPaymentStatus(orderData.orderId);
        }
    };

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

    return (
        <UserLayout title="Payment">
            <div className="payment-container">
                <div className="payment-header">
                    <button className="back-btn" onClick={handleBackToCheckout}>
                        <IconChevronLeft />
                        Back to Checkout
                    </button>
                </div>

                <div className="payment-content">
                    <div className="payment-main">
                        {/* Payment Section */}
                        <section className="payment-section">
                            <h2>Bank Transfer Payment</h2>
                            
                            {creatingPayment ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px' }}>
                                    <div className="loading-spinner" style={{ width: '48px', height: '48px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spinner-rotate 1s linear infinite' }}></div>
                                    <p>Creating payment order...</p>
                                </div>
                            ) : (
                                <div className="bank-transfer-info">
                                    <div className="bank-transfer-grid">
                                        {bankAccount && (
                                            <div className="bank-info-card">
                                                <div className="bank-info-row">
                                                    <span className="bank-info-label">Bank Name:</span>
                                                    <span className="bank-info-value">{bankAccount.bank_name || bankAccount.name || 'N/A'}</span>
                                                </div>
                                                {bankAccount.account_owner && (
                                                    <div className="bank-info-row">
                                                        <span className="bank-info-label">Account Owner:</span>
                                                        <span className="bank-info-value">{bankAccount.account_owner}</span>
                                                    </div>
                                                )}
                                                {bankAccount.account_number && (
                                                    <div className="bank-info-row">
                                                        <span className="bank-info-label">Account Number:</span>
                                                        <span className="bank-info-value copyable" onClick={() => {
                                                            navigator.clipboard.writeText(bankAccount.account_number);
                                                            alert('Account number copied to clipboard!');
                                                        }}>
                                                            {bankAccount.account_number}
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                            </svg>
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="bank-info-row">
                                                    <span className="bank-info-label">Amount:</span>
                                                    <span className="bank-info-value amount">{formatVND(total)}</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="bank-qr-section">
                                            <h3>QR Code</h3>
                                            {qrCodeUrl ? (
                                                <div className="bank-qr-code">
                                                    <img src={qrCodeUrl} alt="Payment QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
                                                </div>
                                            ) : (
                                                <div className="bank-qr-code" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                                                    <p>QR Code not available</p>
                                                </div>
                                            )}
                                            <p className="bank-qr-note">Scan with banking app to pay</p>
                                        </div>
                                    </div>

                                    {/* Payment Status */}
                                    <div className="payment-status-section" style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <h3 style={{ margin: 0 }}>Payment Status</h3>
                                            {paymentStatus === 'checking' && (
                                                <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spinner-rotate 1s linear infinite', display: 'inline-block' }}></div>
                                            )}
                                        </div>
                                        
                                        {paymentStatus === 'pending' && (
                                            <div>
                                                <p style={{ color: 'var(--text-secondary)', margin: '8px 0' }}>
                                                    Waiting for payment... Please scan the QR code and complete the payment in your banking app.
                                                </p>
                                                <button 
                                                    className="btn-secondary" 
                                                    onClick={handleManualRefresh}
                                                    style={{ marginTop: '8px' }}
                                                >
                                                    Refresh Status
                                                </button>
                                            </div>
                                        )}
                                        
                                        {paymentStatus === 'paid' && (
                                            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <IconCheck />
                                                <p style={{ margin: 0 }}>Payment received! Order will be completed automatically.</p>
                                            </div>
                                        )}
                                        
                                        {paymentStatus === 'failed' && (
                                            <div style={{ color: 'var(--danger)' }}>
                                                <p>Payment failed. Please try again or contact support.</p>
                                                <button className="btn-primary" onClick={handleBackToCheckout} style={{ marginTop: '8px' }}>
                                                    Back to Checkout
                                                </button>
                                            </div>
                                        )}
                                        
                                        {paymentStatus === 'expired' && (
                                            <div style={{ color: 'var(--warning)' }}>
                                                <p>Payment order expired. Please create a new payment order.</p>
                                                <button className="btn-primary" onClick={handleBackToCheckout} style={{ marginTop: '8px' }}>
                                                    Back to Checkout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>

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
                            <h2>Payment Received!</h2>
                            <p>Your order has been confirmed. Redirecting to orders page...</p>
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
