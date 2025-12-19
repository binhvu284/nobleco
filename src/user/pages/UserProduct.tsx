import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import ImageGallery from '../../components/ImageGallery';
import LazyImage from '../../components/LazyImage';
import {
    IconSearch,
    IconShoppingBag,
    IconGrid,
    IconList,
    IconX,
    IconPlus,
    IconMinus,
    IconPackage,
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconTag,
    IconMaximize,
    IconMinimize
} from '../../admin/components/icons';

// Product image interface
interface ProductImage {
    id: number;
    url: string;
    alt_text?: string;
    is_featured: boolean;
    sort_order: number;
}

// Product interface for user view
interface Product {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    short_description: string;
    long_description: string | null;
    price: number;
    stock: number;
    status: 'draft' | 'active' | 'inactive' | 'archived';
    categories: {
        id: number;
        name: string;
        color: string;
    }[];
    images?: ProductImage[];
    // KiotViet integration fields
    kiotviet_id?: string | null;
    supplier_id?: string | null;
    jewelry_specifications?: string | null;
    // Legacy fields (kept for backward compatibility)
    center_stone_size_mm?: number | null;
    ni_tay?: number | null;
    shape?: string | null;
    dimensions?: string | null;
    stone_count?: number | null;
    carat_weight_ct?: number | null;
    gold_purity?: string | null;
    product_weight_g?: number | null;
    type?: string | null;
}

// Category interface
interface Category {
    id: number;
    name: string;
    slug: string;
    color: string;
    product_count: number;
}

// Cart item interface
interface CartItem {
    product: Product;
    quantity: number;
}

// Format number as VND currency
const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

export default function UserProduct() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showProductDetail, setShowProductDetail] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Fetch products and categories
    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setViewMode('grid'); // Force grid view on mobile
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/products?includeImages=true');
            if (response.ok) {
                const data = await response.json();
                // Filter out only inactive products (show active, draft, archived even if stock is 0)
                const availableProducts = data.filter((p: any) => 
                    p.status !== 'inactive'
                );
                setProducts(availableProducts);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Memoize filtered products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                product.short_description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
            
            const matchesCategory = selectedCategory === null ||
                product.categories.some(cat => cat.id === selectedCategory);

            return matchesSearch && matchesCategory;
        });
    }, [products, debouncedSearchQuery, selectedCategory]);

    // Use filteredProducts directly - no pagination, just lazy loading

    // Cart functions
    const addToCart = useCallback((product: Product) => {
        setAddingToCart(product.id);
        setTimeout(() => {
            setCart(prev => {
                const existing = prev.find(item => item.product.id === product.id);
                if (existing) {
                    return prev.map(item =>
                        item.product.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                }
                return [...prev, { product, quantity: 1 }];
            });
            setAddingToCart(null);
        }, 300);
    }, []);

    const updateCartQuantity = useCallback((productId: number, quantity: number) => {
        if (quantity <= 0) {
            setCart(prev => prev.filter(item => item.product.id !== productId));
            return;
        }
        setCart(prev =>
            prev.map(item =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    }, []);

    const removeFromCart = useCallback((productId: number) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    }, []);

    const getTotalItems = useCallback(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    const getTotalPrice = useCallback(() => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }, [cart]);

    const handleProductClick = useCallback((product: Product) => {
        setSelectedProduct(product);
        setShowProductDetail(true);
        setIsFullscreen(false);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setShowProductDetail(false);
        setSelectedProduct(null);
        setIsFullscreen(false);
    }, []);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const getSelectedCategoryName = () => {
        if (selectedCategory === null) return 'All Products';
        const category = categories.find(c => c.id === selectedCategory);
        return category ? category.name : 'All Products';
    };

    const getSelectedCategoryColor = () => {
        if (selectedCategory === null) return null;
        const category = categories.find(c => c.id === selectedCategory);
        return category ? category.color : null;
    };

    return (
        <UserLayout title="Products">
            <div className="user-products-page">
                {/* Mobile Category Dropdown Button */}
                {isMobile && (
                    <div className="mobile-category-dropdown">
                        <button
                            className="mobile-category-btn"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            <div className="mobile-category-name">
                                {getSelectedCategoryColor() && (
                                    <span 
                                        className="mobile-category-dot" 
                                        style={{ backgroundColor: getSelectedCategoryColor() || undefined }}
                                    />
                                )}
                                <span>{getSelectedCategoryName()}</span>
                            </div>
                            <IconChevronDown />
                        </button>
                        {showCategoryDropdown && (
                            <>
                                <div 
                                    className="category-dropdown-overlay" 
                                    onClick={() => setShowCategoryDropdown(false)}
                                />
                                <div className="category-dropdown-menu">
                                    <button
                                        className={`category-dropdown-item ${selectedCategory === null ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedCategory(null);
                                            setShowCategoryDropdown(false);
                                        }}
                                    >
                                        <span>All Products</span>
                                        <span className="category-count">{products.length}</span>
                                    </button>
                                    {categories.map(category => (
                                        <button
                                            key={category.id}
                                            className={`category-dropdown-item ${selectedCategory === category.id ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedCategory(category.id);
                                                setShowCategoryDropdown(false);
                                            }}
                                        >
                                            <div className="category-info">
                                                <span
                                                    className="category-color"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                                <span>{category.name}</span>
                                            </div>
                                            <span className="category-count">{category.product_count}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Header with Search and Cart */}
                <div className="products-header">
                    <div className="search-section">
                        <div className="search-box">
                            <IconSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>
                    <div className="header-actions">
                        {!isMobile && (
                            <div className="view-toggle">
                                <button
                                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                    title="Grid view"
                                >
                                    <IconGrid />
                                </button>
                                <button
                                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                    title="List view"
                                >
                                    <IconList />
                                </button>
                            </div>
                        )}
                        <button
                            className="cart-button"
                            onClick={() => setShowCart(true)}
                        >
                            <IconShoppingBag />
                            {getTotalItems() > 0 && (
                                <span className="cart-badge">{getTotalItems()}</span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="products-content">
                    {/* Categories Sidebar */}
                    <aside className={`categories-sidebar ${categoriesCollapsed ? 'collapsed' : ''}`}>
                        <div className="categories-header">
                            <div className="categories-title">
                                <IconTag className="categories-icon" />
                                {!categoriesCollapsed && <h3>Categories</h3>}
                            </div>
                            <button
                                className="collapse-btn"
                                onClick={() => setCategoriesCollapsed(!categoriesCollapsed)}
                                title={categoriesCollapsed ? 'Expand categories' : 'Collapse categories'}
                            >
                                {categoriesCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
                            </button>
                        </div>
                        {!categoriesCollapsed && (
                            <div className="categories-list">
                                <button
                                    className={`category-item ${selectedCategory === null ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    <span className="category-name">All Products</span>
                                    <span className="category-count">{products.length}</span>
                                </button>
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        <div className="category-indicator" style={{ backgroundColor: category.color }} />
                                        <span className="category-name">{category.name}</span>
                                        <span className="category-count">{category.product_count}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </aside>

                    {/* Products Grid/List */}
                    <main className="products-main">
                        {loading ? (
                            <div className={`products-${viewMode} products-loading`}>
                                {[...Array(6)].map((_, index) => (
                                    <div key={index} className="product-card skeleton-product-card">
                                        <div className="product-image skeleton-image">
                                            <div className="skeleton" />
                                        </div>
                                        <div className="product-info">
                                            <div>
                                                <div className="skeleton skeleton-text skeleton-title" style={{ marginBottom: '8px' }} />
                                                <div className="skeleton skeleton-text skeleton-subtitle" style={{ marginBottom: '8px', width: '100%' }} />
                                                <div className="skeleton skeleton-text skeleton-subtitle" style={{ width: '60%' }} />
                                                <div className="product-categories" style={{ marginTop: '12px' }}>
                                                    <div className="skeleton skeleton-badge" style={{ width: '80px', height: '24px' }} />
                                                    <div className="skeleton skeleton-badge" style={{ width: '100px', height: '24px', marginLeft: '8px' }} />
                                                </div>
                                            </div>
                                            <div className="product-footer">
                                                <div className="skeleton skeleton-text" style={{ width: '120px', height: '24px' }} />
                                                <div className="skeleton skeleton-badge" style={{ width: '140px', height: '40px', borderRadius: '8px' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="empty-state">
                                <IconPackage />
                                <h3>No products found</h3>
                                <p>Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <div className={`products-${viewMode}`}>
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="product-card" onClick={() => handleProductClick(product)}>
                                        {/* Product Image */}
                                        <div className="product-image">
                                            {product.images && product.images.length > 0 ? (
                                                <LazyImage 
                                                    src={product.images[0].url} 
                                                    alt={product.images[0].alt_text || product.name}
                                                />
                                            ) : (
                                                <div className="image-placeholder">
                                                    <IconPackage />
                                                </div>
                                            )}
                                            {product.stock === 0 && (
                                                <span className="stock-badge out">Out of Stock</span>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="product-info">
                                            <div>
                                                <h3 className="product-name">
                                                    {product.name}
                                                </h3>
                                                <p className="product-description">
                                                    {product.short_description}
                                                </p>
                                                <div className="product-categories">
                                                    {product.categories.slice(0, 2).map(cat => (
                                                        <span
                                                            key={cat.id}
                                                            className="category-badge"
                                                            style={{
                                                                backgroundColor: `${cat.color}20`,
                                                                color: cat.color,
                                                                borderColor: cat.color
                                                            }}
                                                        >
                                                            {cat.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="product-footer">
                                                <div className="product-price">
                                                    {formatVND(product.price)}
                                                </div>
                                                <button
                                                    className={`add-to-cart-btn ${addingToCart === product.id ? 'adding' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart(product);
                                                    }}
                                                    disabled={addingToCart === product.id || product.stock === 0}
                                                >
                                                    <IconShoppingBag />
                                                    {product.stock === 0 
                                                        ? (isMobile ? 'Out' : 'Out of Stock') 
                                                        : addingToCart === product.id 
                                                            ? (isMobile ? 'Adding' : 'Adding...') 
                                                            : isMobile ? 'Add' : 'Add to Cart'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </main>
                </div>

                {/* Shopping Cart Sidebar */}
                {showCart && createPortal(
                    <>
                        <div className="cart-overlay" onClick={() => setShowCart(false)} />
                        <div className="cart-sidebar">
                            <div className="cart-header">
                                <h2>Shopping Cart</h2>
                                <button className="close-cart" onClick={() => setShowCart(false)}>
                                    <IconX />
                                </button>
                            </div>
                            <div className="cart-content">
                                {cart.length === 0 ? (
                                    <div className="cart-empty">
                                        <IconShoppingBag />
                                        <p>Your cart is empty</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="cart-items">
                                            {cart.map(item => (
                                                <div key={item.product.id} className="cart-item">
                                                    <div className="cart-item-image">
                                                        {item.product.images && item.product.images.length > 0 ? (
                                                            <img 
                                                                src={item.product.images[0].url} 
                                                                alt={item.product.images[0].alt_text || item.product.name}
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <IconPackage />
                                                        )}
                                                    </div>
                                                    <div className="cart-item-details">
                                                        <h4>{item.product.name}</h4>
                                                        <p>{formatVND(item.product.price)}</p>
                                                        <div className="quantity-controls">
                                                            <button
                                                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                                            >
                                                                <IconMinus />
                                                            </button>
                                                            <span>{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                                                disabled={item.quantity >= item.product.stock}
                                                            >
                                                                <IconPlus />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="remove-item"
                                                        onClick={() => removeFromCart(item.product.id)}
                                                    >
                                                        <IconX />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="cart-footer">
                                            <div className="cart-total">
                                                <span>Total:</span>
                                                <span className="total-price">{formatVND(getTotalPrice())}</span>
                                            </div>
                                            <button 
                                                className="checkout-btn"
                                                onClick={() => {
                                                    navigate('/checkout', { state: { cartItems: cart } });
                                                    setShowCart(false);
                                                }}
                                            >
                                                Proceed to Checkout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>,
                    document.body
                )}

                {/* Product Detail Modal */}
                {showProductDetail && selectedProduct && createPortal(
                    <>
                        <div className="product-detail-overlay" onClick={handleCloseDetail} />
                        <div className={`product-detail-modal ${isFullscreen ? 'fullscreen' : ''}`}>
                            <div className="product-modal-header">
                                {!isMobile && (
                                    <button className="product-modal-expand" onClick={toggleFullscreen}>
                                        {isFullscreen ? <IconMinimize /> : <IconMaximize />}
                                    </button>
                                )}
                                <button className="product-modal-close" onClick={handleCloseDetail}>
                                    <IconX />
                                </button>
                            </div>
                            <div className="product-modal-body">
                                <div className="product-modal-image-section">
                                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                        <ImageGallery
                                            images={selectedProduct.images.map(img => ({
                                                id: img.id,
                                                url: img.url,
                                                storage_path: '',
                                                alt_text: img.alt_text,
                                                sort_order: img.sort_order,
                                                is_featured: img.is_featured,
                                                file_size: undefined,
                                                width: undefined,
                                                height: undefined,
                                                mime_type: undefined
                                            }))}
                                            showThumbnails={true}
                                            className="product-modal-gallery"
                                        />
                                    ) : (
                                        <div className="product-modal-image">
                                            <IconPackage />
                                        </div>
                                    )}
                                </div>
                                <div className="product-modal-info-section">
                                    <div className="product-modal-categories">
                                        {selectedProduct.categories.map(cat => (
                                            <span
                                                key={cat.id}
                                                className="category-badge"
                                                style={{
                                                    backgroundColor: `${cat.color}20`,
                                                    color: cat.color,
                                                    borderColor: cat.color
                                                }}
                                            >
                                                {cat.name}
                                            </span>
                                        ))}
                                    </div>
                                    <h1 className="product-modal-title">{selectedProduct.name}</h1>
                                    <p className="product-modal-short-desc">{selectedProduct.short_description}</p>
                                    <div className="product-modal-price-section">
                                        <span className="product-modal-price-label">Price:</span>
                                        <span className="product-modal-price-value">{formatVND(selectedProduct.price)}</span>
                                    </div>
                                    <button
                                        className="product-modal-add-to-cart"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(selectedProduct);
                                            handleCloseDetail();
                                        }}
                                        disabled={selectedProduct.stock === 0}
                                    >
                                        <IconShoppingBag />
                                        {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                    </button>
                                    {selectedProduct.long_description && (
                                        <div className="product-modal-description-section">
                                            <h3>Description</h3>
                                            <p>{selectedProduct.long_description}</p>
                                        </div>
                                    )}
                                    {/* Product Specifications - Always display (excludes Inventory Value per requirements) */}
                                    <div className="product-modal-description-section">
                                        <h3>Product Specifications</h3>
                                        <div className="kiotviet-fields-grid">
                                            <div className="kiotviet-field">
                                                <label>Supplier ID</label>
                                                <span>{selectedProduct.supplier_id ?? 'null'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Jewelry Specifications - Always display */}
                                    <div className="product-modal-description-section">
                                        <h3>Jewelry Specifications</h3>
                                        <div className="jewelry-specifications-content">
                                            {selectedProduct.jewelry_specifications ? (
                                                <pre style={{
                                                    whiteSpace: 'pre-wrap',
                                                    fontFamily: 'inherit',
                                                    fontSize: '14px',
                                                    lineHeight: '1.6',
                                                    margin: 0,
                                                    padding: '12px',
                                                    backgroundColor: '#f9fafb',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e5e7eb'
                                                }}>
                                                    {selectedProduct.jewelry_specifications}
                                                </pre>
                                            ) : (
                                                <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No specifications available</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>,
                    document.body
                )}
            </div>
        </UserLayout>
    );
}
