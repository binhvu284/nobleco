import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconPlus, IconSearch, IconFilter, IconList, IconGrid, IconMoreVertical, IconEdit, IconTrash2, IconEye, IconPackage, IconLayout, IconChevronDown } from '../components/icons';

interface Product {
    id: number;
    name: string;
    shortDescription: string;
    longDescription: string;
    price: number;
    stock: number;
    category: string;
    image?: string;
    created_at: string;
}

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([
        {
            id: 1,
            name: "Premium Coffee Beans",
            shortDescription: "High-quality arabica coffee beans",
            longDescription: "Carefully selected arabica coffee beans from the finest plantations. Perfect for coffee enthusiasts who appreciate quality and flavor.",
            price: 25.99,
            stock: 50,
            category: "Beverages, Coffee, Premium",
            created_at: "2024-01-15"
        },
        {
            id: 2,
            name: "Organic Green Tea",
            shortDescription: "Premium organic green tea leaves",
            longDescription: "Hand-picked organic green tea leaves with antioxidant properties. Great for health-conscious individuals.",
            price: 18.50,
            stock: 0,
            category: "Beverages, Tea, Organic, Health",
            created_at: "2024-01-14"
        },
        {
            id: 3,
            name: "Artisan Chocolate Bar",
            shortDescription: "Dark chocolate with sea salt",
            longDescription: "Premium dark chocolate bar with a hint of sea salt. Made with the finest cocoa beans for an exquisite taste experience.",
            price: 12.99,
            stock: 25,
            category: "Snacks, Chocolate, Gourmet",
            created_at: "2024-01-13"
        }
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'card'>(
        window.innerWidth <= 768 ? 'card' : 'table'
    );
    const [mobileColumns, setMobileColumns] = useState<1 | 2 | 3>(3);
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle window resize to force card view on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setViewMode('card');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.mobile-column-selector')) {
                setShowColumnDropdown(false);
            }
        };

        if (showColumnDropdown) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showColumnDropdown]);

    const handleDelete = (productId: number) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== productId));
        }
    };

    const getStockStatus = (stock: number) => {
        return stock > 0 ? 'In stock' : 'Out of stock';
    };

    const getStockStatusClass = (stock: number) => {
        return stock > 0 ? 'in-stock' : 'out-of-stock';
    };

    return (
        <AdminLayout title="Products Management">
            <div className="admin-products-page">

                {/* Toolbar */}
                <div className="admin-products-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <IconSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button className="btn-filter" title="Filter products">
                            <IconFilter />
                        </button>
                        <button className="btn-stock-management" title="Stock Management">
                            <IconPackage />
                            <span>Stock</span>
                        </button>
                    </div>
                    <div className="toolbar-right">
                        {/* Desktop view toggle */}
                        <div className="view-toggle desktop-only">
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => setViewMode('table')}
                                title="Table view"
                            >
                                <IconList />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                                title="Card view"
                            >
                                <IconGrid />
                            </button>
                        </div>
                        
                        {/* Mobile column selector */}
                        <div className="mobile-column-selector mobile-only">
                            <button
                                className="column-toggle-btn"
                                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                                title="Choose products per row"
                            >
                                <IconLayout />
                                <span className="column-count">{mobileColumns}</span>
                                <IconChevronDown className={`chevron ${showColumnDropdown ? 'rotated' : ''}`} />
                            </button>
                            {showColumnDropdown && (
                                <div className="column-dropdown">
                                    <div className="dropdown-header">Products per row</div>
                                    <button
                                        className={`column-option ${mobileColumns === 1 ? 'active' : ''}`}
                                        onClick={() => {
                                            setMobileColumns(1);
                                            setShowColumnDropdown(false);
                                        }}
                                    >
                                        <span className="option-icon">📱</span>
                                        <span className="option-text">1 per row</span>
                                        <span className="option-desc">Large view</span>
                                    </button>
                                    <button
                                        className={`column-option ${mobileColumns === 2 ? 'active' : ''}`}
                                        onClick={() => {
                                            setMobileColumns(2);
                                            setShowColumnDropdown(false);
                                        }}
                                    >
                                        <span className="option-icon">📱📱</span>
                                        <span className="option-text">2 per row</span>
                                        <span className="option-desc">Balanced</span>
                                    </button>
                                    <button
                                        className={`column-option ${mobileColumns === 3 ? 'active' : ''}`}
                                        onClick={() => {
                                            setMobileColumns(3);
                                            setShowColumnDropdown(false);
                                        }}
                                    >
                                        <span className="option-icon">📱📱📱</span>
                                        <span className="option-text">3 per row</span>
                                        <span className="option-desc">Compact</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <button className="btn-create-product-compact" title="Create Product">
                            <IconPlus />
                            <span className="desktop-only">Create Product</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {viewMode === 'table' ? (
                    <div className="products-table-container">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="product-info">
                                                <div className="product-image">
                                                    📦
                                                </div>
                                                <div className="product-details">
                                                    <h4>{product.name}</h4>
                                                    <p>{product.shortDescription}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="category-list">
                                                {product.category.split(',').map((cat, index) => (
                                                    <span key={index} className="category-badge">
                                                        {cat.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="price">${product.price.toFixed(2)}</span>
                                        </td>
                                        <td>
                                            <span className="stock-amount">{product.stock}</span>
                                        </td>
                                        <td>
                                            <span className={`stock-status ${getStockStatusClass(product.stock)}`}>
                                                {getStockStatus(product.stock)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={`unified-dropdown ${activeDropdown === product.id ? 'active' : ''}`}>
                                                <button
                                                    className="unified-more-btn"
                                                    onClick={() => setActiveDropdown(activeDropdown === product.id ? null : product.id)}
                                                >
                                                    <IconMoreVertical />
                                                </button>
                                                {activeDropdown === product.id && (
                                                    <div className="unified-dropdown-menu">
                                                        <button className="unified-dropdown-item">
                                                            <IconEye />
                                                            View Details
                                                        </button>
                                                        <button className="unified-dropdown-item">
                                                            <IconEdit />
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className="unified-dropdown-item danger"
                                                            onClick={() => handleDelete(product.id)}
                                                        >
                                                            <IconTrash2 />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={`products-grid ${window.innerWidth <= 768 ? `mobile-cols-${mobileColumns}` : ''}`}>
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="product-card">
                                <div className="product-card-image">
                                    📦
                                    <div className="product-card-actions">
                                        <div className={`unified-dropdown ${activeDropdown === product.id ? 'active' : ''}`}>
                                            <button
                                                className="unified-more-btn"
                                                onClick={() => setActiveDropdown(activeDropdown === product.id ? null : product.id)}
                                            >
                                                <IconMoreVertical />
                                            </button>
                                            {activeDropdown === product.id && (
                                                <div className="unified-dropdown-menu">
                                                    <button className="unified-dropdown-item">
                                                        <IconEye />
                                                        View Details
                                                    </button>
                                                    <button className="unified-dropdown-item">
                                                        <IconEdit />
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="unified-dropdown-item danger"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        <IconTrash2 />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="product-card-content">
                                    <div className="product-card-header">
                                        <h4>{product.name}</h4>
                                        <span className={`stock-status ${getStockStatusClass(product.stock)}`}>
                                            {getStockStatus(product.stock)}
                                        </span>
                                    </div>
                                    <p className="product-card-description">{product.shortDescription}</p>
                                    <div className="product-card-categories">
                                        {product.category.split(',').map((cat, index) => (
                                            <span key={index} className="category-badge">
                                                {cat.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="product-card-footer">
                                        <span className="price">${product.price.toFixed(2)}</span>
                                        <span className="product-card-stock">Stock: {product.stock}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredProducts.length === 0 && (
                    <div className="empty-state">
                        <div>📦</div>
                        <h3>No products found</h3>
                        <p>Try adjusting your search or create a new product.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
