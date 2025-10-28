import { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
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
    IconTag
} from '../../admin/components/icons';

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

export default function UserProduct() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showProductDetail, setShowProductDetail] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);

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
            const response = await fetch('/api/products');
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

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.short_description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === null ||
            product.categories.some(cat => cat.id === selectedCategory);

        return matchesSearch && matchesCategory;
    });

    // Cart functions
    const addToCart = (product: Product) => {
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
    };

    const updateCartQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(prev =>
            prev.map(item =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const getTotalItems = () => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    const getTotalPrice = () => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    };

    const handleViewDetail = (product: Product) => {
        setSelectedProduct(product);
        setShowProductDetail(true);
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
                            <div className="loading-state">
                                <p>Loading products...</p>
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
                                    <div key={product.id} className="product-card">
                                        {/* Product Image */}
                                        <div className="product-image" onClick={() => handleViewDetail(product)}>
                                            <div className="image-placeholder">
                                                <IconPackage />
                                            </div>
                                            {product.stock === 0 ? (
                                                <span className="stock-badge out">Out of Stock</span>
                                            ) : product.stock < 10 && (
                                                <span className="stock-badge low">Only {product.stock} left</span>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="product-info">
                                            <div>
                                                <h3
                                                    className="product-name"
                                                    onClick={() => handleViewDetail(product)}
                                                >
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
                                                    ${product.price.toFixed(2)}
                                                </div>
                                                <button
                                                    className={`add-to-cart-btn ${addingToCart === product.id ? 'adding' : ''}`}
                                                    onClick={() => addToCart(product)}
                                                    disabled={addingToCart === product.id || product.stock === 0}
                                                >
                                                    <IconShoppingBag />
                                                    {product.stock === 0 ? 'Out of Stock' : addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
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
                {showCart && (
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
                                                        <IconPackage />
                                                    </div>
                                                    <div className="cart-item-details">
                                                        <h4>{item.product.name}</h4>
                                                        <p>${item.product.price.toFixed(2)}</p>
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
                                                <span className="total-price">${getTotalPrice().toFixed(2)}</span>
                                            </div>
                                            <button className="checkout-btn">
                                                Proceed to Checkout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Product Detail Modal */}
                {showProductDetail && selectedProduct && (
                    <>
                        <div className="modal-overlay" onClick={() => setShowProductDetail(false)} />
                        <div className="user-product-detail-modal">
                            <button className="modal-close" onClick={() => setShowProductDetail(false)}>
                                <IconX />
                            </button>
                            <div className="modal-content">
                                <div className="modal-image-section">
                                    <div className="modal-image-main">
                                        <IconPackage />
                                    </div>
                                </div>
                                <div className="modal-info-section">
                                    <div className="modal-categories">
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
                                    <h1>{selectedProduct.name}</h1>
                                    <p className="modal-short-desc">{selectedProduct.short_description}</p>
                                    <div className="modal-price">
                                        <span className="price-label">Price:</span>
                                        <span className="price-value">${selectedProduct.price.toFixed(2)}</span>
                                    </div>
                                    <div className="modal-stock">
                                        <span className={`stock-status ${selectedProduct.stock < 10 ? 'low' : 'available'}`}>
                                            {selectedProduct.stock} in stock
                                        </span>
                                    </div>
                                    {selectedProduct.long_description && (
                                        <div className="modal-description">
                                            <h3>Description</h3>
                                            <p>{selectedProduct.long_description}</p>
                                        </div>
                                    )}
                                    <button
                                        className="modal-add-to-cart"
                                        onClick={() => {
                                            addToCart(selectedProduct);
                                            setShowProductDetail(false);
                                        }}
                                    >
                                        <IconShoppingBag />
                                        Add to Cart
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
