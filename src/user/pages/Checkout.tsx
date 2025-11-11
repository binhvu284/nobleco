import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { getCurrentUser } from '../../auth';
import {
    IconX,
    IconChevronLeft,
    IconPlus,
    IconChevronDown,
    IconPackage
} from '../../admin/components/icons';

// Product interface
interface Product {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    short_description: string;
    price: number;
    stock: number;
    images?: {
        id: number;
        url: string;
        alt_text?: string;
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
    location?: string;
}

// Format number as VND currency
const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

// Country list for location dropdown
const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh',
    'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia', 'Czech Republic', 'Denmark',
    'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'India', 'Indonesia',
    'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico',
    'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Philippines', 'Poland',
    'Portugal', 'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea',
    'Spain', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Vietnam', 'Other'
];

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [orderLocation, setOrderLocation] = useState('');
    const [discountCode, setDiscountCode] = useState('');
    const [notes, setNotes] = useState('');
    
    // Client dropdown
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [clientSearchQuery, setClientSearchQuery] = useState('');
    
    // Create client modal
    const [showCreateClientModal, setShowCreateClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({
        name: '',
        phone: '',
        email: '',
        location: ''
    });
    const [creatingClient, setCreatingClient] = useState(false);

    // Load cart items from location state or localStorage
    useEffect(() => {
        const loadCartData = () => {
            // Try to get cart from location state first (passed from cart popup)
            if (location.state?.cartItems) {
                setCartItems(location.state.cartItems);
            } else {
                // Fallback to localStorage if available
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    try {
                        setCartItems(JSON.parse(savedCart));
                    } catch (e) {
                        console.error('Failed to parse cart from localStorage', e);
                    }
                }
            }
        };

        loadCartData();
        loadClients();
        setLoading(false);
    }, [location.state]);

    const loadClients = async () => {
        try {
            const currentUser = getCurrentUser();
            if (!currentUser?.id) return;

            const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
            const response = await fetch(`/api/clients?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setClients(data || []);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
        client.phone?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(clientSearchQuery.toLowerCase())
    );

    const selectedClient = clients.find(c => c.id === selectedClientId);

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const discountAmount = 0; // TODO: Calculate discount from discount code
    const taxAmount = 0; // TODO: Calculate tax if applicable
    const total = subtotal - discountAmount + taxAmount;

    const handleCreateClient = async () => {
        if (!newClientData.name.trim() || !newClientData.phone.trim()) {
            alert('Please fill in name and phone number');
            return;
        }

        try {
            setCreatingClient(true);
            const currentUser = getCurrentUser();
            if (!currentUser?.id) return;

            const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newClientData,
                    created_by: userId
                })
            });

            if (response.ok) {
                const newClient = await response.json();
                setClients([...clients, newClient]);
                setSelectedClientId(newClient.id);
                setShowCreateClientModal(false);
                setNewClientData({ name: '', phone: '', email: '', location: '' });
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create client');
            }
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Failed to create client');
        } finally {
            setCreatingClient(false);
        }
    };

    const handleProceedToPayment = () => {
        if (!selectedClientId) {
            alert('Please select or create a client');
            return;
        }

        if (cartItems.length === 0) {
            alert('Your cart is empty');
            return;
        }

        // Navigate to payment page with order data
        navigate('/payment', {
            state: {
                cartItems,
                clientId: selectedClientId,
                client: selectedClient,
                location: orderLocation,
                discountCode: discountCode,
                notes: notes,
                subtotal,
                discountAmount,
                taxAmount,
                total
            }
        });
    };

    if (loading) {
        return (
            <UserLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <p>Loading...</p>
                </div>
            </UserLayout>
        );
    }

    if (cartItems.length === 0) {
        return (
            <UserLayout>
                <div className="checkout-container">
                    <div className="checkout-empty">
                        <IconPackage />
                        <h2>Your cart is empty</h2>
                        <p>Add some products to your cart before checkout</p>
                        <button className="btn-primary" onClick={() => navigate('/product')}>
                            Browse Products
                        </button>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="checkout-container">
                <div className="checkout-header">
                    <button className="back-btn" onClick={() => navigate('/product')}>
                        <IconChevronLeft />
                        Back to Products
                    </button>
                    <h1>Checkout</h1>
                </div>

                <div className="checkout-content">
                    <div className="checkout-main">
                        {/* Order Items Section */}
                        <section className="checkout-section">
                            <h2>Order Items</h2>
                            <div className="checkout-items">
                                {cartItems.map(item => (
                                    <div key={item.product.id} className="checkout-item">
                                        <div className="checkout-item-image">
                                            {item.product.images && item.product.images.length > 0 ? (
                                                <img
                                                    src={item.product.images[0].url}
                                                    alt={item.product.images[0].alt_text || item.product.name}
                                                />
                                            ) : (
                                                <IconPackage />
                                            )}
                                        </div>
                                        <div className="checkout-item-details">
                                            <h3>{item.product.name}</h3>
                                            {item.product.sku && <p className="checkout-item-sku">SKU: {item.product.sku}</p>}
                                            <div className="checkout-item-price-row">
                                                <span className="checkout-item-quantity">Qty: {item.quantity}</span>
                                                <span className="checkout-item-price">{formatVND(item.product.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Client Selection Section */}
                        <section className="checkout-section">
                            <h2>Client Information</h2>
                            <div className="checkout-form-group">
                                <label>Select Client *</label>
                                <div className="client-selector-wrapper">
                                    <div
                                        className="client-selector"
                                        onClick={() => setShowClientDropdown(!showClientDropdown)}
                                    >
                                        {selectedClient ? (
                                            <div className="selected-client">
                                                <span className="client-name">{selectedClient.name}</span>
                                                {selectedClient.phone && (
                                                    <span className="client-phone">{selectedClient.phone}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="client-placeholder">Select a client</span>
                                        )}
                                        <IconChevronDown className={showClientDropdown ? 'rotated' : ''} />
                                    </div>
                                    {showClientDropdown && (
                                        <div className="client-dropdown">
                                            <div className="client-dropdown-search">
                                                <input
                                                    type="text"
                                                    placeholder="Search clients..."
                                                    value={clientSearchQuery}
                                                    onChange={(e) => setClientSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="client-dropdown-list">
                                                {filteredClients.map(client => (
                                                    <div
                                                        key={client.id}
                                                        className="client-dropdown-item"
                                                        onClick={() => {
                                                            setSelectedClientId(client.id);
                                                            setShowClientDropdown(false);
                                                            setClientSearchQuery('');
                                                        }}
                                                    >
                                                        <div className="client-dropdown-name">{client.name}</div>
                                                        {client.phone && (
                                                            <div className="client-dropdown-phone">{client.phone}</div>
                                                        )}
                                                    </div>
                                                ))}
                                                {filteredClients.length === 0 && (
                                                    <div className="client-dropdown-empty">No clients found</div>
                                                )}
                                            </div>
                                            <div className="client-dropdown-footer">
                                                <button
                                                    className="create-client-btn"
                                                    onClick={() => {
                                                        setShowClientDropdown(false);
                                                        setShowCreateClientModal(true);
                                                    }}
                                                >
                                                    <IconPlus />
                                                    Create New Client
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Location Section */}
                        <section className="checkout-section">
                            <h2>Location</h2>
                            <div className="checkout-form-group">
                                <label>Order Location</label>
                                <select
                                    value={orderLocation}
                                    onChange={(e) => setOrderLocation(e.target.value)}
                                    className="checkout-select"
                                >
                                    <option value="">Select location</option>
                                    {COUNTRIES.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        {/* Discount Code Section */}
                        <section className="checkout-section">
                            <h2>Discount</h2>
                            <div className="checkout-form-group">
                                <label>Discount Code</label>
                                <input
                                    type="text"
                                    placeholder="Enter discount code"
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    className="checkout-input"
                                />
                            </div>
                        </section>

                        {/* Notes Section */}
                        <section className="checkout-section">
                            <h2>Additional Notes</h2>
                            <div className="checkout-form-group">
                                <textarea
                                    placeholder="Add any additional notes for this order..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="checkout-textarea"
                                    rows={4}
                                />
                            </div>
                        </section>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="checkout-sidebar">
                        <div className="checkout-summary">
                            <h2>Order Summary</h2>
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
                                <span>Total</span>
                                <span>{formatVND(total)}</span>
                            </div>
                            <button
                                className="proceed-payment-btn"
                                onClick={handleProceedToPayment}
                                disabled={!selectedClientId}
                            >
                                Proceed to Payment
                            </button>
                        </div>
                    </div>
                </div>

                {/* Create Client Modal */}
                {showCreateClientModal && (
                    <>
                        <div className="modal-overlay" onClick={() => setShowCreateClientModal(false)} />
                        <div className="modal-card create-client-modal">
                            <div className="modal-header">
                                <h2>Create New Client</h2>
                                <button className="modal-close" onClick={() => setShowCreateClientModal(false)}>
                                    <IconX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        value={newClientData.name}
                                        onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                                        placeholder="Enter client name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone *</label>
                                    <input
                                        type="text"
                                        value={newClientData.phone}
                                        onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={newClientData.email}
                                        onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <select
                                        value={newClientData.location}
                                        onChange={(e) => setNewClientData({ ...newClientData, location: e.target.value })}
                                    >
                                        <option value="">Select location</option>
                                        {COUNTRIES.map(country => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            setShowCreateClientModal(false);
                                            setNewClientData({ name: '', phone: '', email: '', location: '' });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={handleCreateClient}
                                        disabled={creatingClient}
                                    >
                                        {creatingClient ? 'Creating...' : 'Create Client'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </UserLayout>
    );
}

