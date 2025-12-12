import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { getCurrentUser } from '../../auth';
import {
    IconX,
    IconChevronLeft,
    IconPlus,
    IconChevronDown,
    IconPackage,
    IconShoppingBag,
    IconMinus
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

// States/Provinces/Cities mapping (simplified - can be expanded)
const LOCATIONS: { [key: string]: string[] } = {
    'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho', 'An Giang', 'Ba Ria-Vung Tau', 'Bac Lieu', 'Bac Giang', 'Bac Kan', 'Bac Ninh', 'Ben Tre', 'Binh Dinh', 'Binh Duong', 'Binh Phuoc', 'Binh Thuan', 'Ca Mau', 'Cao Bang', 'Dak Lak', 'Dak Nong', 'Dien Bien', 'Dong Nai', 'Dong Thap', 'Gia Lai', 'Ha Giang', 'Ha Nam', 'Ha Tinh', 'Hai Duong', 'Hau Giang', 'Hoa Binh', 'Hung Yen', 'Khanh Hoa', 'Kien Giang', 'Kon Tum', 'Lai Chau', 'Lam Dong', 'Lang Son', 'Lao Cai', 'Long An', 'Nam Dinh', 'Nghe An', 'Ninh Binh', 'Ninh Thuan', 'Phu Tho', 'Phu Yen', 'Quang Binh', 'Quang Nam', 'Quang Ngai', 'Quang Ninh', 'Quang Tri', 'Soc Trang', 'Son La', 'Tay Ninh', 'Thai Binh', 'Thai Nguyen', 'Thanh Hoa', 'Thua Thien-Hue', 'Tien Giang', 'Tra Vinh', 'Tuyen Quang', 'Vinh Long', 'Vinh Phuc', 'Yen Bai'],
    'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    'Canada': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'],
    'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'],
    'China': ['Beijing', 'Shanghai', 'Guangdong', 'Jiangsu', 'Zhejiang', 'Shandong', 'Henan', 'Sichuan', 'Hubei', 'Hunan', 'Fujian', 'Anhui', 'Liaoning', 'Jilin', 'Heilongjiang', 'Shaanxi', 'Shanxi', 'Hebei', 'Chongqing', 'Tianjin', 'Jiangxi', 'Guangxi', 'Yunnan', 'Inner Mongolia', 'Xinjiang', 'Guizhou', 'Gansu', 'Hainan', 'Ningxia', 'Qinghai', 'Tibet', 'Hong Kong', 'Macau'],
    'Other': []
};

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderId, setOrderId] = useState<number | null>(null);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const orderCreationInitiated = useRef(false);
    
    // Form states
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [orderCountry, setOrderCountry] = useState('');
    const [orderState, setOrderState] = useState('');
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscountCode, setAppliedDiscountCode] = useState('');
    const [appliedDiscountRate, setAppliedDiscountRate] = useState<number | null>(null);
    const [discountError, setDiscountError] = useState<string | null>(null);
    const [applyingDiscount, setApplyingDiscount] = useState(false);
    const [notes, setNotes] = useState('');
    
    // Client dropdown
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [clientSearchQuery, setClientSearchQuery] = useState('');
    
    // Location dropdowns
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    
    // Create client modal
    const [showCreateClientModal, setShowCreateClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({
        name: '',
        phone: '',
        email: '',
        location: ''
    });
    const [creatingClient, setCreatingClient] = useState(false);
    const [updatingOrder, setUpdatingOrder] = useState(false);
    const [proceedingToPayment, setProceedingToPayment] = useState(false);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true);
    const initializationRef = useRef<string | null>(null);

    // Auto-update order function with debouncing
    const updateOrderInDatabase = async (updates: Partial<{
        client_id: number | null;
        shipping_address: string | null;
        notes: string | null;
        subtotal_amount: number;
        discount_amount: number;
        tax_amount: number;
        total_amount: number;
        discount_code?: string | null;
        discount_rate?: number | null;
        cartItems?: CartItem[];
    }>) => {
        if (!orderId) return;

        // Clear existing timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Debounce: wait 500ms before updating
        updateTimeoutRef.current = setTimeout(async () => {
            try {
                setUpdatingOrder(true);
                const authToken = localStorage.getItem('nobleco_auth_token');
                if (!authToken) return;

                // Prepare update payload
                const updatePayload: any = { ...updates };
                
                // If cartItems is provided, include it in the payload
                if (updates.cartItems) {
                    updatePayload.cartItems = updates.cartItems.map(item => ({
                        product: {
                            id: item.product.id,
                            name: item.product.name,
                            sku: item.product.sku,
                            price: item.product.price
                        },
                        quantity: item.quantity
                    }));
                }

                const response = await fetch(`/api/orders/${orderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(updatePayload)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Failed to auto-update order:', errorData);
                } else {
                    console.log('Order auto-updated successfully');
                }
            } catch (error) {
                console.error('Error auto-updating order:', error);
            } finally {
                setUpdatingOrder(false);
            }
        }, 500);
    };

    // Load cart items and create/load order
    useEffect(() => {
        // Use a more stable check - create a unique key for this initialization
        const locationOrderId = location.state?.orderId;
        const locationCartItems = location.state?.cartItems;
        const cartItemsKey = locationCartItems ? `${locationCartItems.length}-${JSON.stringify(locationCartItems.map((i: any) => i.product?.id || i.product_id))}` : 'none';
        const initKey = `${locationOrderId || 'new'}-${cartItemsKey}`;
        
        // Prevent duplicate initialization for the same state
        if (initializationRef.current === initKey) {
            // Still ensure loading is false
            setLoading(false);
            return;
        }

        // Mark this initialization
        initializationRef.current = initKey;

        // Set a timeout to ensure loading is always set to false (safety net)
        const loadingTimeout = setTimeout(() => {
            console.warn('Checkout initialization timeout - forcing loading to false');
            setLoading(false);
        }, 10000); // 10 second timeout

        const initializeCheckout = async () => {
            try {
                // Load cart items
                let items: CartItem[] = [];
                if (locationCartItems && Array.isArray(locationCartItems) && locationCartItems.length > 0) {
                    items = locationCartItems;
                    setCartItems(items);
                } else {
                    // Fallback to localStorage if available
                    const savedCart = localStorage.getItem('cart');
                    if (savedCart) {
                        try {
                            const parsedCart = JSON.parse(savedCart);
                            if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                                items = parsedCart;
                                setCartItems(items);
                            }
                        } catch (e) {
                            console.error('Failed to parse cart from localStorage', e);
                        }
                    }
                }

                // Load clients
                await loadClients();

                // Check if we're editing an existing order
                if (locationOrderId) {
                    setOrderId(locationOrderId);
                    await loadExistingOrder(locationOrderId);
                    orderCreationInitiated.current = true;
                    // Mark initial load as complete after loading existing order
                    setTimeout(() => {
                        isInitialLoadRef.current = false;
                    }, 1000);
                } else if (items.length > 0 && !orderId && !orderCreationInitiated.current) {
                    // Create new order immediately when checkout page loads (only if orderId doesn't exist)
                    await createOrderOnLoad(items);
                    // Mark initial load as complete after creating order
                    setTimeout(() => {
                        isInitialLoadRef.current = false;
                    }, 1000);
                } else {
                    // No order to load/create, mark initial load as complete
                    isInitialLoadRef.current = false;
                }
            } catch (error) {
                console.error('Error initializing checkout:', error);
            } finally {
                // Clear timeout and always set loading to false, even if there's an error
                clearTimeout(loadingTimeout);
                setLoading(false);
            }
        };

        initializeCheckout();

        // Cleanup function
        return () => {
            clearTimeout(loadingTimeout);
        };
    }, [location.state?.orderId]);

    // Ensure loading is set to false on mount (safety check)
    useEffect(() => {
        // If we've been loading for more than 5 seconds, force it to false
        const mountTimeout = setTimeout(() => {
            if (loading) {
                console.warn('Checkout page stuck in loading state - forcing to false');
                setLoading(false);
            }
        }, 5000);

        return () => {
            clearTimeout(mountTimeout);
        };
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.location-dropdown-wrapper')) {
                setShowCountryDropdown(false);
                setShowStateDropdown(false);
            }
            if (!target.closest('.client-selector-wrapper')) {
                setShowClientDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Auto-update notes when changed (skip initial load)
    useEffect(() => {
        if (orderId && notes !== undefined && !isInitialLoadRef.current) {
            updateOrderInDatabase({ notes: notes || null });
        }
    }, [notes]);

    // Auto-update location when country/state changes (skip initial load, as onClick handlers handle immediate updates)
    useEffect(() => {
        if (orderId && (orderCountry || orderState) && !isInitialLoadRef.current) {
            const locationString = orderCountry 
                ? (orderState ? `${orderState}, ${orderCountry}` : orderCountry)
                : '';
            updateOrderInDatabase({ shipping_address: locationString || null });
        }
    }, [orderCountry, orderState]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

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

    // Create order when checkout page loads
    const createOrderOnLoad = async (items: CartItem[]) => {
        // Double-check: prevent duplicate order creation
        if (orderId || orderCreationInitiated.current) {
            console.log('Order already exists or creation already initiated, skipping...');
            return;
        }

        try {
            const currentUser = getCurrentUser();
            if (!currentUser?.id) {
                console.error('User not authenticated');
                return;
            }

            const authToken = localStorage.getItem('nobleco_auth_token');
            if (!authToken) {
                console.error('Auth token not found');
                return;
            }

            // Mark as initiated before making the API call
            orderCreationInitiated.current = true;

            // Calculate initial totals (without client, discount, etc.)
            const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
            const discountAmount = 0;
            const taxAmount = 0;
            const total = subtotal;

            // Create order with minimal data (will be updated when proceeding to payment)
            // Note: client_id will be set when user selects a client
            const requestBody = {
                cartItems: items.map(item => ({
                    product: {
                        id: item.product.id,
                        name: item.product.name,
                        sku: item.product.sku,
                        price: item.product.price
                    },
                    quantity: item.quantity
                })),
                subtotal_amount: subtotal,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total_amount: total
            };

            console.log('=== CREATING ORDER ON CHECKOUT LOAD ===');
            console.log('Request body:', JSON.stringify(requestBody, null, 2));

            setCreatingOrder(true);
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(requestBody)
            });

            const responseText = await response.text();
            console.log('Response status:', response.status);
            console.log('Response text:', responseText);

            if (!response.ok) {
                const errorData = JSON.parse(responseText);
                console.error('Failed to create order:', errorData);
                // Reset the ref on error so user can retry
                orderCreationInitiated.current = false;
                throw new Error(errorData.error || 'Failed to create order');
            }

            const orderData = JSON.parse(responseText);
            console.log('Order created successfully:', orderData);
            setOrderId(orderData.id);
            setOrderNumber(orderData.order_number || null);

            // If order had a client_id, set it
            if (orderData.client_id) {
                setSelectedClientId(orderData.client_id);
            }
        } catch (error) {
            console.error('Error creating order on load:', error);
            // Reset the ref on error so user can retry
            orderCreationInitiated.current = false;
            alert('Failed to initialize order. Please refresh the page.');
        } finally {
            setCreatingOrder(false);
        }
    };

    // Load existing order data
    const loadExistingOrder = async (existingOrderId: number) => {
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            if (!authToken) {
                console.error('Auth token not found');
                return;
            }

            const response = await fetch(`/api/orders/${existingOrderId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const orderData = await response.json();
                console.log('Loaded existing order:', orderData);

                // Set order number
                setOrderNumber(orderData.order_number || null);

                // Set form fields from order
                if (orderData.client_id) {
                    setSelectedClientId(orderData.client_id);
                }
                if (orderData.shipping_address) {
                    // Parse shipping address to extract country and state
                    const addressParts = orderData.shipping_address.split(', ');
                    if (addressParts.length >= 2) {
                        setOrderState(addressParts[0]);
                        setOrderCountry(addressParts[1]);
                    } else if (addressParts.length === 1) {
                        setOrderCountry(addressParts[0]);
                    }
                }
                if (orderData.notes) {
                    setNotes(orderData.notes);
                }
                if (orderData.discount_code) {
                    setAppliedDiscountCode(orderData.discount_code);
                    setDiscountCode(orderData.discount_code);
                    // Load the discount rate if available
                    if (orderData.discount_rate) {
                        setAppliedDiscountRate(orderData.discount_rate);
                    } else {
                        // If discount_rate is not in order, fetch it from the discount code
                        try {
                            const codeResponse = await fetch(`/api/discount-codes?action=validate&code=${encodeURIComponent(orderData.discount_code)}`);
                            if (codeResponse.ok) {
                                const codeData = await codeResponse.json();
                                if (codeData.valid && codeData.discount) {
                                    setAppliedDiscountRate(codeData.discount.discount_rate);
                                }
                            }
                        } catch (err) {
                            console.warn('Failed to fetch discount rate:', err);
                        }
                    }
                }

                // Order items are already included in the order response
                if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
                    // Convert order items to cart items format
                    const cartItemsFromOrder = orderData.items.map((item: any) => ({
                        product: {
                            id: item.product_id,
                            name: item.product_name,
                            sku: item.product_sku,
                            price: item.product_price,
                            images: item.product?.images || []
                        },
                        quantity: item.quantity
                    }));
                    setCartItems(cartItemsFromOrder);
                } else {
                    // If no items found, try to load from location state as fallback
                    if (location.state?.cartItems && location.state.cartItems.length > 0) {
                        setCartItems(location.state.cartItems);
                    }
                }
            } else {
                console.error('Failed to load existing order');
                // Fallback: try to use cartItems from location state if available
                if (location.state?.cartItems && location.state.cartItems.length > 0) {
                    setCartItems(location.state.cartItems);
                }
            }
        } catch (error) {
            console.error('Error loading existing order:', error);
            // Fallback: try to use cartItems from location state if available
            if (location.state?.cartItems && location.state.cartItems.length > 0) {
                setCartItems(location.state.cartItems);
            }
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
    const discountAmount = appliedDiscountCode && appliedDiscountRate ? (subtotal * appliedDiscountRate / 100) : 0;
    const taxAmount = 0; // TODO: Calculate tax if applicable
    const total = subtotal - discountAmount + taxAmount;

    const handleApplyDiscount = async () => {
        const codeToApply = discountCode.trim().toUpperCase();
        
        if (!codeToApply) {
            setAppliedDiscountCode('');
            setAppliedDiscountRate(null);
            setDiscountError(null);
            // Update order to remove discount
            if (orderId) {
                updateOrderInDatabase({
                    discount_code: null,
                    discount_rate: null,
                    discount_amount: 0,
                    subtotal_amount: subtotal,
                    total_amount: subtotal
                });
            }
            return;
        }

        // Check if code is already applied to this order
        if (appliedDiscountCode === codeToApply) {
            setDiscountError('This discount code is already applied to this order');
            return;
        }

        try {
            setApplyingDiscount(true);
            setDiscountError(null);

            const response = await fetch(`/api/discount-codes?action=validate&code=${encodeURIComponent(codeToApply)}`);
            const data = await response.json();

            if (!response.ok || !data.valid) {
                setDiscountError(data.error || 'Invalid discount code');
                return;
            }

            // Apply the discount code
            setAppliedDiscountCode(codeToApply);
            setAppliedDiscountRate(data.discount.discount_rate);
            
            // Calculate new totals with discount
            const newDiscountAmount = subtotal * data.discount.discount_rate / 100;
            const newTotal = subtotal - newDiscountAmount;

            // Update order with discount code and rate (locked in at this moment)
            if (orderId) {
                await updateOrderInDatabase({
                    discount_code: codeToApply,
                    discount_rate: data.discount.discount_rate,
                    discount_amount: newDiscountAmount,
                    subtotal_amount: subtotal,
                    total_amount: newTotal
                });
                
                // Increment usage count when discount code is successfully applied
                // Note: This provides immediate feedback. The count will also increment on order completion.
                try {
                    const authToken = localStorage.getItem('nobleco_auth_token');
                    const incrementResponse = await fetch('/api/discount-codes', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({
                            action: 'increment',
                            code: codeToApply
                        })
                    });
                    if (!incrementResponse.ok) {
                        console.warn('Failed to increment discount code usage on application');
                    } else {
                        console.log('Discount code usage incremented successfully');
                    }
                } catch (err) {
                    console.warn('Error incrementing discount code usage:', err);
                    // Don't fail the application if increment fails
                }
            }
        } catch (error) {
            console.error('Error validating discount code:', error);
            setDiscountError('Failed to validate discount code. Please try again.');
        } finally {
            setApplyingDiscount(false);
        }
    };

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
                    client: newClientData,
                    userId: userId
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

    const handleProceedToPayment = async () => {
        if (!selectedClientId) {
            alert('Please select or create a client');
            return;
        }

        if (cartItems.length === 0) {
            alert('Your cart is empty');
            return;
        }

        if (!orderId) {
            alert('Order not initialized. Please refresh the page.');
            return;
        }

        try {
            setProceedingToPayment(true);
            const currentUser = getCurrentUser();
            if (!currentUser?.id) {
                alert('Please login to continue');
                return;
            }

            const locationString = orderCountry 
                ? (orderState ? `${orderState}, ${orderCountry}` : orderCountry)
                : '';

            const authToken = localStorage.getItem('nobleco_auth_token');
            
            if (!authToken) {
                alert('Please login to continue');
                return;
            }

            // Update existing order with all details
            const updateData = {
                client_id: selectedClientId,
                subtotal_amount: subtotal,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total_amount: total,
                discount_code: appliedDiscountCode || null,
                discount_rate: appliedDiscountRate || null,
                notes: notes || null,
                shipping_address: locationString || null
            };

            console.log('=== UPDATING ORDER ===');
            console.log('Order ID:', orderId);
            console.log('Update data:', JSON.stringify(updateData, null, 2));

            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(updateData)
            });

            const responseText = await response.text();
            console.log('Response status:', response.status);
            console.log('Response text:', responseText);

            if (!response.ok) {
                const errorData = JSON.parse(responseText);
                console.error('Failed to update order:', errorData);
                throw new Error(errorData.error || 'Failed to update order');
            }

            const orderData = JSON.parse(responseText);
            console.log('Order updated successfully:', orderData);

            // Navigate to payment page with order data
            navigate('/payment', {
                state: {
                    orderId: orderData.id,
                    cartItems,
                    clientId: selectedClientId,
                    client: selectedClient,
                    location: locationString,
                    discountCode: appliedDiscountCode,
                    notes: notes,
                    subtotal,
                    discountAmount,
                    taxAmount,
                    total
                }
            });
        } catch (error) {
            console.error('Error updating order:', error);
            alert((error as Error).message || 'Failed to update order. Please try again.');
        } finally {
            setProceedingToPayment(false);
        }
    };

    if (loading || creatingOrder) {
        return (
            <UserLayout title="Checkout">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
                    <div className="loading-spinner" style={{ width: '48px', height: '48px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                    <p>{creatingOrder ? 'Creating order...' : 'Loading...'}</p>
                </div>
            </UserLayout>
        );
    }

    // Show empty state only if we don't have an orderId (meaning it's a new checkout, not returning from payment)
    // If we have an orderId, we should show the checkout form even if cartItems is temporarily empty (it will load)
    if (cartItems.length === 0 && !orderId && !loading) {
        return (
            <UserLayout title="Checkout">
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
        <UserLayout title="Checkout">
            <div className="checkout-container">
                <div className="checkout-header">
                    <button className="back-btn" onClick={() => navigate('/product')}>
                        <IconChevronLeft />
                        Back to Products
                    </button>
                </div>

                <div className="checkout-content">
                    <div className="checkout-main">
                        {/* Detail Section - Combined Client, Location, Discount, Notes */}
                        <section className="checkout-section">
                            <h2>
                                Detail
                                {orderNumber && (
                                    <span style={{ 
                                        marginLeft: '12px', 
                                        fontSize: '14px', 
                                        fontWeight: '600', 
                                        color: 'var(--primary)',
                                        fontFamily: 'monospace',
                                        letterSpacing: '0.5px'
                                    }}>
                                        ({orderNumber})
                                    </span>
                                )}
                            </h2>
                            
                            {/* Client Selection */}
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
                                                            // Auto-update order with selected client
                                                            if (orderId) {
                                                                updateOrderInDatabase({ client_id: client.id });
                                                            }
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

                            {/* Location Section - Country and State/Province/City on same line */}
                            <div className="checkout-form-group-row">
                                <div className="checkout-form-group">
                                    <label>Country</label>
                                    <div className="location-dropdown-wrapper">
                                        <div
                                            className="location-dropdown-toggle"
                                            onClick={() => {
                                                setShowCountryDropdown(!showCountryDropdown);
                                                setShowStateDropdown(false);
                                            }}
                                        >
                                            <span className={orderCountry ? '' : 'location-placeholder'}>
                                                {orderCountry || 'Select country'}
                                            </span>
                                            <IconChevronDown className={showCountryDropdown ? 'rotated' : ''} />
                                        </div>
                                        {showCountryDropdown && (
                                            <div className="location-dropdown-menu">
                                                <div className="location-dropdown-options">
                                                    <div
                                                        className={`location-dropdown-option ${!orderCountry ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setOrderCountry('');
                                                            setOrderState('');
                                                            setShowCountryDropdown(false);
                                                        }}
                                                    >
                                                        Select country
                                                    </div>
                                                    {COUNTRIES.map(country => (
                                                        <div
                                                            key={country}
                                                            className={`location-dropdown-option ${orderCountry === country ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setOrderCountry(country);
                                                                setOrderState('');
                                                                setShowCountryDropdown(false);
                                                                // Auto-update order with location
                                                                if (orderId) {
                                                                    const locationString = country || '';
                                                                    updateOrderInDatabase({ shipping_address: locationString || null });
                                                                }
                                                            }}
                                                        >
                                                            {country}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {orderCountry && (
                                    <div className="checkout-form-group">
                                        <label>State / Province / City</label>
                                        <div className="location-dropdown-wrapper">
                                            <div
                                                className={`location-dropdown-toggle ${LOCATIONS[orderCountry] && LOCATIONS[orderCountry].length > 0 ? '' : 'disabled'}`}
                                                onClick={() => {
                                                    if (LOCATIONS[orderCountry] && LOCATIONS[orderCountry].length > 0) {
                                                        setShowStateDropdown(!showStateDropdown);
                                                        setShowCountryDropdown(false);
                                                    }
                                                }}
                                            >
                                                <span className={orderState ? '' : 'location-placeholder'}>
                                                    {orderState || (LOCATIONS[orderCountry] && LOCATIONS[orderCountry].length > 0 ? 'Select state/province/city' : 'No locations available')}
                                                </span>
                                                {LOCATIONS[orderCountry] && LOCATIONS[orderCountry].length > 0 && (
                                                    <IconChevronDown className={showStateDropdown ? 'rotated' : ''} />
                                                )}
                                            </div>
                                            {showStateDropdown && LOCATIONS[orderCountry] && LOCATIONS[orderCountry].length > 0 && (
                                                <div className="location-dropdown-menu">
                                                    <div className="location-dropdown-options">
                                                        <div
                                                            className={`location-dropdown-option ${!orderState ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setOrderState('');
                                                                setShowStateDropdown(false);
                                                                // Auto-update order with location
                                                                if (orderId && orderCountry) {
                                                                    updateOrderInDatabase({ shipping_address: orderCountry });
                                                                }
                                                            }}
                                                        >
                                                            Select state/province/city
                                                        </div>
                                                        {LOCATIONS[orderCountry].map(location => (
                                                            <div
                                                                key={location}
                                                                className={`location-dropdown-option ${orderState === location ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setOrderState(location);
                                                                    setShowStateDropdown(false);
                                                                    // Auto-update order with location
                                                                    if (orderId && orderCountry) {
                                                                        const locationString = `${location}, ${orderCountry}`;
                                                                        updateOrderInDatabase({ shipping_address: locationString });
                                                                    }
                                                                }}
                                                            >
                                                                {location}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="checkout-form-group">
                                <label>Additional Notes</label>
                                <textarea
                                    placeholder="Add any additional notes for this order..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="checkout-textarea"
                                    rows={4}
                                />
                            </div>
                        </section>

                        {/* Order Items Section - Moved below Detail section */}
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
                                                <div className="checkout-item-quantity-controls">
                                                    <label>Quantity:</label>
                                                    <div className="quantity-control">
                                                        <button
                                                            type="button"
                                                            className="quantity-btn"
                                                            onClick={() => {
                                                                if (item.quantity > 1) {
                                                                    const updatedItems = cartItems.map(cartItem =>
                                                                        cartItem.product.id === item.product.id
                                                                            ? { ...cartItem, quantity: cartItem.quantity - 1 }
                                                                            : cartItem
                                                                    );
                                                                    setCartItems(updatedItems);
                                                                    // Update localStorage
                                                                    try {
                                                                        localStorage.setItem('cart', JSON.stringify(updatedItems));
                                                                    } catch (e) {
                                                                        console.error('Failed to save cart to localStorage', e);
                                                                    }
                                                                    // Auto-update order items and totals
                                                                    if (orderId) {
                                                                        const newSubtotal = updatedItems.reduce((sum, cartItem) => sum + (cartItem.product.price * cartItem.quantity), 0);
                                                                        const newDiscountAmount = appliedDiscountCode && appliedDiscountRate ? (newSubtotal * appliedDiscountRate / 100) : 0;
                                                                        const newTotal = newSubtotal - newDiscountAmount;
                                                                        updateOrderInDatabase({
                                                                            cartItems: updatedItems,
                                                                            subtotal_amount: newSubtotal,
                                                                            discount_amount: newDiscountAmount,
                                                                            total_amount: newTotal
                                                                        });
                                                                    }
                                                                }
                                                            }}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <IconMinus width={14} height={14} />
                                                        </button>
                                                        <span className="quantity-value">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            className="quantity-btn"
                                                            onClick={() => {
                                                                const updatedItems = cartItems.map(cartItem =>
                                                                    cartItem.product.id === item.product.id
                                                                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                                                                        : cartItem
                                                                );
                                                                setCartItems(updatedItems);
                                                                // Update localStorage
                                                                try {
                                                                    localStorage.setItem('cart', JSON.stringify(updatedItems));
                                                                } catch (e) {
                                                                    console.error('Failed to save cart to localStorage', e);
                                                                }
                                                                // Auto-update order items and totals
                                                                if (orderId) {
                                                                    const newSubtotal = updatedItems.reduce((sum, cartItem) => sum + (cartItem.product.price * cartItem.quantity), 0);
                                                                    const newDiscountAmount = appliedDiscountCode && appliedDiscountRate ? (newSubtotal * appliedDiscountRate / 100) : 0;
                                                                    const newTotal = newSubtotal - newDiscountAmount;
                                                                    updateOrderInDatabase({
                                                                        cartItems: updatedItems,
                                                                        subtotal_amount: newSubtotal,
                                                                        discount_amount: newDiscountAmount,
                                                                        total_amount: newTotal
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <IconPlus width={14} height={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <span className="checkout-item-price">{formatVND(item.product.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="checkout-sidebar">
                        <div className="checkout-summary">
                            <h2>Order Summary</h2>
                            
                            {/* Discount Code Section */}
                            <div className="checkout-discount-section">
                                <label>Discount Code</label>
                                <div className="discount-input-group">
                                    <input
                                        type="text"
                                        placeholder="Enter discount code"
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value)}
                                        className="checkout-input discount-input-field"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleApplyDiscount();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="apply-discount-btn"
                                        onClick={handleApplyDiscount}
                                        disabled={applyingDiscount}
                                    >
                                        {applyingDiscount ? 'Applying...' : 'Apply'}
                                    </button>
                                </div>
                                {discountError && (
                                    <div className="discount-error" style={{ 
                                        color: '#ef4444', 
                                        fontSize: '14px', 
                                        marginTop: '8px',
                                        padding: '8px',
                                        backgroundColor: '#fee2e2',
                                        borderRadius: '4px'
                                    }}>
                                        {discountError}
                                    </div>
                                )}
                                {appliedDiscountCode && (
                                    <div className="discount-applied" style={{ 
                                        marginTop: '8px',
                                        padding: '8px',
                                        backgroundColor: '#dcfce7',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ color: '#166534', fontWeight: '500' }}>
                                            Applied: {appliedDiscountCode} ({appliedDiscountRate}% off)
                                        </span>
                                        <button
                                            type="button"
                                            className="remove-discount-btn"
                                            onClick={async () => {
                                                setAppliedDiscountCode('');
                                                setAppliedDiscountRate(null);
                                                setDiscountCode('');
                                                setDiscountError(null);
                                                // Update order to remove discount
                                                if (orderId) {
                                                    const newSubtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
                                                    await updateOrderInDatabase({
                                                        discount_code: null,
                                                        discount_rate: null,
                                                        discount_amount: 0,
                                                        subtotal_amount: newSubtotal,
                                                        total_amount: newSubtotal
                                                    });
                                                }
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <IconX width={14} height={14} style={{ color: '#166534' }} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="summary-divider"></div>

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
                                disabled={!selectedClientId || proceedingToPayment}
                            >
                                {proceedingToPayment ? (
                                    <>
                                        <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}></div>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    'Proceed to Payment'
                                )}
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

