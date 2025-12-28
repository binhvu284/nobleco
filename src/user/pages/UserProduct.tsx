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

    // Fetch products and categories
    useEffect(() => {
        fetchProducts();
        fetchCategories();
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
                        Center Stone
                    </button>
                </div>

                {/* Mobile Category Dropdown Button */}
                {isMobile && (
                    <div className="mobile-category-dropdown">
                        <button
                            className="mobile-category-btn"
                            onClick={() => {
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserProduct.tsx:288',message:'Dropdown button clicked',data:{currentState:showCategoryDropdown,willToggleTo:!showCategoryDropdown,isMobile:isMobile,categoriesCount:categories.length,productsCount:products.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
                                // #endregion
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
                                {/* #region agent log */}
                                {(() => { fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserProduct.tsx:301',message:'Dropdown rendering',data:{showCategoryDropdown:showCategoryDropdown,categoriesData:categories.map(c=>({id:c.id,name:c.name,product_count:c.product_count})),productsLength:products.length,selectedCategory:selectedCategory},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{}); return null; })() }
                                {/* #endregion */}
                                <div 
                                    className="category-dropdown-overlay" 
                                    onClick={() => {
                                        // #region agent log
                                        fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserProduct.tsx:305',message:'Overlay clicked',data:{action:'closing dropdown'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
                                        // #endregion
                                        setShowCategoryDropdown(false);
                                    }}
                                />
                                <div 
                                    className="category-dropdown-menu"
                                    ref={(el) => {
                                        if (el) {
                                            // #region agent log
                                            const rect = el.getBoundingClientRect();
                                            const styles = window.getComputedStyle(el);
                                            fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserProduct.tsx:307',message:'Dropdown menu element rendered',data:{viewport:{innerWidth:window.innerWidth,innerHeight:window.innerHeight,docClientWidth:document.documentElement.clientWidth,docClientHeight:document.documentElement.clientHeight},boundingRect:{top:rect.top,left:rect.left,width:rect.width,height:rect.height,bottom:rect.bottom,right:rect.right},edgeGaps:{leftGap:rect.left,rightGap:(window.innerWidth-rect.right),centerOffsetPx:((rect.left+(rect.width/2))-(window.innerWidth/2))},computedStyles:{position:styles.position,display:styles.display,visibility:styles.visibility,zIndex:styles.zIndex,transform:styles.transform,opacity:styles.opacity,width:styles.width,maxWidth:styles.maxWidth,boxSizing:styles.boxSizing,padding:styles.padding,overflowX:styles.overflowX,left:styles.left,right:styles.right,marginLeft:styles.marginLeft,marginRight:styles.marginRight},childrenCount:el.children.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H4,H5'})}).catch(()=>{});
                                            // #endregion
                                        }
                                    }}
                                >
                                    <button
                                        className={`category-dropdown-item ${selectedCategory === null ? 'active' : ''}`}
                                        onClick={() => {
                                            // #region agent log
                                            fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserProduct.tsx:310',message:'All Products clicked',data:{productsLength:products.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
                                            // #endregion
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
                                                // #region agent log
                                                fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserProduct.tsx:324',message:'Category item clicked',data:{categoryId:category.id,categoryName:category.name,productCount:category.product_count},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
                                                // #endregion
                                                setSelectedCategory(category.id);
                                                setShowCategoryDropdown(false);
                                            }}
                                            ref={(el) => {
                                                if (el && category.id === categories[0]?.id) {
                                                    // #region agent log
                                                    const colorEl = el.querySelector('.category-color');
                                                    const countEl = el.querySelector('.category-count');
                                                    if (colorEl && countEl) {
                                                        const colorStyles = window.getComputedStyle(colorEl);
                                                        const countStyles = window.getComputedStyle(countEl);
                                                        const itemStyles = window.getComputedStyle(el);
                                                        fetch('http://127.0.0.1:7242/ingest/3da31dfe-5721-4e1a-a160-93fd6dd15ec4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserProduct.tsx:350',message:'Category item CSS inspection',data:{colorCircle:{width:colorStyles.width,height:colorStyles.height,minWidth:colorStyles.minWidth,minHeight:colorStyles.minHeight,borderRadius:colorStyles.borderRadius,display:colorStyles.display},countBadge:{padding:countStyles.padding,fontSize:countStyles.fontSize,minWidth:countStyles.minWidth,textAlign:countStyles.textAlign},itemLayout:{gap:itemStyles.gap,padding:itemStyles.padding,justifyContent:itemStyles.justifyContent}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'CSS_APPLIED'})}).catch(()=>{});
                                                    }
                                                    // #endregion
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
                                            <IconPackage size={64} />
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

                                    {/* Product Specifications */}
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

                                    {/* Jewelry Specifications */}
                                    <div className="product-modal-section">
                                        <h3 className="section-title">Jewelry Specifications</h3>
                                        {selectedProduct.jewelry_specifications ? (
                                            <pre className="jewelry-specs-content">{selectedProduct.jewelry_specifications}</pre>
                                        ) : (
                                            <p className="no-specs">No specifications available</p>
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
