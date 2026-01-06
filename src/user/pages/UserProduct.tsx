import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import ImageGallery from '../../components/ImageGallery';
import LazyImage from '../../components/LazyImage';
import { useTranslation } from '../../shared/contexts/TranslationContext';
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
    // Jewelry/Centerstone specification fields
    material_purity?: string | null;
    material_weight_g?: number | null;
    total_weight_g?: number | null;
    size_text?: string | null;
    jewelry_size?: string | null;
    style_bst?: string | null;
    sub_style?: string | null;
    main_stone_type?: string | null;
    stone_quantity?: number | null;
    shape_and_polished?: string | null;
    origin?: string | null;
    item_serial?: string | null;
    country_of_origin?: string | null;
    certification_number?: string | null;
    size_mm?: number | null;
    color?: string | null;
    clarity?: string | null;
    weight_ct?: number | null;
    pcs?: number | null;
    cut_grade?: string | null;
    treatment?: string | null;
    sub_stone_type_1?: string | null;
    sub_stone_type_2?: string | null;
    sub_stone_type_3?: string | null;
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
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [productType, setProductType] = useState<'jewelry' | 'centerstone'>('jewelry');
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
    const [bestSellers, setBestSellers] = useState<number[]>([]);

    // Fetch best sellers
    const fetchBestSellers = async () => {
        try {
            const response = await fetch('/api/admin/product-metrics');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data?.bestSellers) {
                    setBestSellers(result.data.bestSellers);
                }
            }
        } catch (error) {
            console.error('Error fetching best sellers:', error);
        }
    };

    // Fetch products and categories
    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchBestSellers();
    }, [productType]);

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
            const endpoint = productType === 'jewelry' ? '/api/products' : '/api/centerstones';
            const response = await fetch(`${endpoint}?includeImages=true`);
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
            const endpoint = productType === 'jewelry' ? '/api/categories' : '/api/centerstone-categories';
            const response = await fetch(endpoint);
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
            <div className="user-products-page user-product-page">
                {/* Navigation Tabs */}
                <div className="product-type-tabs">
                    <button
                        className={`tab-button ${productType === 'jewelry' ? 'active' : ''}`}
                        onClick={() => {
                            setProductType('jewelry');
                            setSearchQuery('');
                            setSelectedCategory(null);
                        }}
                    >
                        Jewelry
                    </button>
                    <button
                        className={`tab-button ${productType === 'centerstone' ? 'active' : ''}`}
                        onClick={() => {
                            setProductType('centerstone');
                            setSearchQuery('');
                            setSelectedCategory(null);
                        }}
                    >
                        {t('products.centerStone')}
                    </button>
                </div>

                {/* Mobile Category Dropdown Button */}
                {isMobile && (
                    <div className="mobile-category-dropdown">
                        <button
                            className="mobile-category-btn"
                            onClick={() => {
                                
                                
                                setShowCategoryDropdown(!showCategoryDropdown);
                            }}
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
                                {}
                                {(() => {  return null; })() }
                                {}
                                <div 
                                    className="category-dropdown-overlay" 
                                    onClick={() => {
                                        
                                        
                                        setShowCategoryDropdown(false);
                                    }}
                                />
                                <div 
                                    className="category-dropdown-menu"
                                    ref={(el) => {
                                        if (el) {
                                            
                                            const rect = el.getBoundingClientRect();
                                            const styles = window.getComputedStyle(el);
                                            
                                        }
                                    }}
                                >
                                    <button
                                        className={`category-dropdown-item ${selectedCategory === null ? 'active' : ''}`}
                                        onClick={() => {
                                            
                                            
                                            setSelectedCategory(null);
                                            setShowCategoryDropdown(false);
                                        }}
                                    >
                                        <div className="category-info">
                                            <span>All Products</span>
                                        </div>
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
                                            ref={(el) => {
                                                if (el && category.id === categories[0]?.id) {
                                                    
                                                    const colorEl = el.querySelector('.category-color');
                                                    const countEl = el.querySelector('.category-count');
                                                    if (colorEl && countEl) {
                                                        const colorStyles = window.getComputedStyle(colorEl);
                                                        const countStyles = window.getComputedStyle(countEl);
                                                        const itemStyles = window.getComputedStyle(el);
                                                    }
                                                    
                                                }
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
                {!showCategoryDropdown && (
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
                )}

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
                            <div className={`products-${viewMode} products-grid user-products-grid`}>
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
                                                <h3 className="product-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    {product.name}
                                                    {bestSellers.includes(product.id) && (
                                                        <span style={{
                                                            background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
                                                            color: 'white',
                                                            fontSize: '10px',
                                                            fontWeight: 'bold',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            Best Seller
                                                        </span>
                                                    )}
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
                        <div className={`product-detail-modal user-product-detail-modal ${isFullscreen ? 'fullscreen' : ''}`}>
                            {/* Header with close button */}
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

                            {/* Scrollable content */}
                            <div className="product-modal-body">
                                {/* Image Gallery Section */}
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
                                        <div className="product-modal-image-placeholder">
                                            <IconPackage width={64} height={64} />
                                        </div>
                                    )}
                                </div>

                                {/* Product Info Section */}
                                <div className="product-modal-info-section">
                                    {/* Categories */}
                                    {selectedProduct.categories.length > 0 && (
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
                                    )}

                                    {/* Title */}
                                    <h1 className="product-modal-title">{selectedProduct.name}</h1>

                                    {/* SKU - Only for centerstone */}
                                    {productType === 'centerstone' && selectedProduct.sku && (
                                        <div className="product-modal-sku">
                                            <span className="sku-label">SKU:</span>
                                            <span className="sku-value">{selectedProduct.sku}</span>
                                        </div>
                                    )}

                                    {/* Short Description */}
                                    {selectedProduct.short_description && (
                                        <p className="product-modal-short-desc">{selectedProduct.short_description}</p>
                                    )}

                                    {/* Price */}
                                    <div className="product-modal-price-section">
                                        <span className="product-modal-price-label">Price:</span>
                                        <span className="product-modal-price-value">{formatVND(selectedProduct.price)}</span>
                                    </div>

                                    {/* Stock Status */}
                                    <div className="product-modal-stock-section">
                                        <span className={`stock-badge ${selectedProduct.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                            {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock})` : 'Out of Stock'}
                                        </span>
                                    </div>

                                    {/* Add to Cart Button */}
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

                                    {/* Divider */}
                                    <div className="product-modal-divider"></div>

                                    {/* Long Description */}
                                    {selectedProduct.long_description && (
                                        <div className="product-modal-section">
                                            <h3 className="section-title">Description</h3>
                                            <p className="section-content">{selectedProduct.long_description}</p>
                                        </div>
                                    )}

                                    {/* Product Specifications - Only for jewelry */}
                                    {productType === 'jewelry' && (
                                        <div className="product-modal-section">
                                            <h3 className="section-title">Product Specifications</h3>
                                            <div className="specs-list">
                                                <div className="spec-item">
                                                    <span className="spec-label">Supplier ID</span>
                                                    <span className="spec-value">{selectedProduct.supplier_id ?? 'N/A'}</span>
                                                </div>
                                                {selectedProduct.sku && (
                                                    <div className="spec-item">
                                                        <span className="spec-label">SKU</span>
                                                        <span className="spec-value">{selectedProduct.sku}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Specifications */}
                                    <div className="product-modal-section">
                                        <h3 className="section-title">
                                            {productType === 'jewelry' ? t('products.jewelrySpecifications') : t('products.centerStoneSpecifications')}
                                        </h3>
                                        {productType === 'jewelry' ? (
                                            <div className="centerstone-specs-grid">
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Material / Purity</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.material_purity ? 'empty' : ''}`}>
                                                        {selectedProduct.material_purity ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Material Weight (g)</div>
                                                    <div className={`centerstone-spec-value ${selectedProduct.material_weight_g == null ? 'empty' : ''}`}>
                                                        {selectedProduct.material_weight_g != null ? selectedProduct.material_weight_g.toFixed(3) : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Total Weight (g)</div>
                                                    <div className={`centerstone-spec-value ${selectedProduct.total_weight_g == null ? 'empty' : ''}`}>
                                                        {selectedProduct.total_weight_g != null ? selectedProduct.total_weight_g.toFixed(3) : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Size</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.size_text ? 'empty' : ''}`}>
                                                        {selectedProduct.size_text ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Jewelry Size</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.jewelry_size ? 'empty' : ''}`}>
                                                        {selectedProduct.jewelry_size ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Style (BST)</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.style_bst ? 'empty' : ''}`}>
                                                        {selectedProduct.style_bst ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Sub Style</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.sub_style ? 'empty' : ''}`}>
                                                        {selectedProduct.sub_style ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Main Stone Type</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.main_stone_type ? 'empty' : ''}`}>
                                                        {selectedProduct.main_stone_type ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Stone Quantity</div>
                                                    <div className={`centerstone-spec-value ${selectedProduct.stone_quantity == null ? 'empty' : ''}`}>
                                                        {selectedProduct.stone_quantity != null ? selectedProduct.stone_quantity : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Shape and Polished</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.shape_and_polished ? 'empty' : ''}`}>
                                                        {selectedProduct.shape_and_polished ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Origin</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.origin ? 'empty' : ''}`}>
                                                        {selectedProduct.origin ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Item Serial</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.item_serial ? 'empty' : ''}`}>
                                                        {selectedProduct.item_serial ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Country of Origin</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.country_of_origin ? 'empty' : ''}`}>
                                                        {selectedProduct.country_of_origin ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Certification Number</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.certification_number ? 'empty' : ''}`}>
                                                        {selectedProduct.certification_number ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Size (mm)</div>
                                                    <div className={`centerstone-spec-value ${selectedProduct.size_mm == null ? 'empty' : ''}`}>
                                                        {selectedProduct.size_mm != null ? selectedProduct.size_mm.toFixed(2) : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Color</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.color ? 'empty' : ''}`}>
                                                        {selectedProduct.color ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Clarity</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.clarity ? 'empty' : ''}`}>
                                                        {selectedProduct.clarity ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Weight (CT)</div>
                                                    <div className={`centerstone-spec-value ${selectedProduct.weight_ct == null ? 'empty' : ''}`}>
                                                        {selectedProduct.weight_ct != null ? selectedProduct.weight_ct.toFixed(2) : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">PCS</div>
                                                    <div className={`centerstone-spec-value ${selectedProduct.pcs == null ? 'empty' : ''}`}>
                                                        {selectedProduct.pcs != null ? selectedProduct.pcs : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Cut Grade</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.cut_grade ? 'empty' : ''}`}>
                                                        {selectedProduct.cut_grade ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Treatment</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.treatment ? 'empty' : ''}`}>
                                                        {selectedProduct.treatment ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Sub Stone Type 1</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.sub_stone_type_1 ? 'empty' : ''}`}>
                                                        {selectedProduct.sub_stone_type_1 ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Sub Stone Type 2</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.sub_stone_type_2 ? 'empty' : ''}`}>
                                                        {selectedProduct.sub_stone_type_2 ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Sub Stone Type 3</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.sub_stone_type_3 ? 'empty' : ''}`}>
                                                        {selectedProduct.sub_stone_type_3 ?? 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="centerstone-specs-grid">
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Shape and Polished</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.shape_and_polished ? 'empty' : ''}`}>
                                                        {selectedProduct.shape_and_polished ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Origin</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.origin ? 'empty' : ''}`}>
                                                        {selectedProduct.origin ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Item Serial</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.item_serial ? 'empty' : ''}`}>
                                                        {selectedProduct.item_serial ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Country of Origin</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.country_of_origin ? 'empty' : ''}`}>
                                                        {selectedProduct.country_of_origin ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Certification Number</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.certification_number ? 'empty' : ''}`}>
                                                        {selectedProduct.certification_number ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Size (mm)</div>
                                                    <div className={`centerstone-spec-value ${selectedProduct.size_mm == null ? 'empty' : ''}`}>
                                                        {selectedProduct.size_mm != null ? selectedProduct.size_mm.toFixed(2) : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Color</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.color ? 'empty' : ''}`}>
                                                        {selectedProduct.color ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Clarity</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.clarity ? 'empty' : ''}`}>
                                                        {selectedProduct.clarity ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Weight (CT)</div>
                                                    <div className={`centerstone-spec-value ${selectedProduct.weight_ct == null ? 'empty' : ''}`}>
                                                        {selectedProduct.weight_ct != null ? selectedProduct.weight_ct.toFixed(2) : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">PCS</div>
                                                    <div className={`centerstone-spec-value ${selectedProduct.pcs == null ? 'empty' : ''}`}>
                                                        {selectedProduct.pcs != null ? selectedProduct.pcs : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Cut Grade</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.cut_grade ? 'empty' : ''}`}>
                                                        {selectedProduct.cut_grade ?? 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="centerstone-spec-card">
                                                    <div className="centerstone-spec-label">Treatment</div>
                                                    <div className={`centerstone-spec-value ${!selectedProduct.treatment ? 'empty' : ''}`}>
                                                        {selectedProduct.treatment ?? 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
