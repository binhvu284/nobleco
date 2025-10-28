import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconPlus, IconSearch, IconFilter, IconList, IconGrid, IconMoreVertical, IconEdit, IconTrash2, IconEye, IconPackage, IconLayout, IconChevronDown, IconCheck, IconX } from '../components/icons';
import ProductDetailModal from '../components/ProductDetailModal';
import ConfirmModal from '../components/ConfirmModal';

interface Category {
    id: number;
    name: string;
    slug: string;
    color: string;
    is_primary: boolean;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    short_description: string;
    long_description: string | null;
    price: number;
    cost_price: number | null;
    stock: number;
    status: 'draft' | 'active' | 'inactive' | 'archived';
    is_featured: boolean;
    created_by: number | null;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
    categories: Category[];
    category_names: string[];
}

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'card'>(
        window.innerWidth <= 768 ? 'card' : 'table'
    );
    const [mobileColumns, setMobileColumns] = useState<1 | 2 | 3>(3);
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState<{ id: number, name: string } | null>(null);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category_names.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Fetch products from API
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch products`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

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

    const handleViewDetail = (product: Product) => {
        setSelectedProduct(product);
        setShowDetailModal(true);
        setActiveDropdown(null);
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedProduct(null);
    };

    const handleDeleteClick = (productId: number, productName: string) => {
        setProductToDelete({ id: productId, name: productName });
        setShowDeleteConfirm(true);
        setActiveDropdown(null);
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;

        setDeleteLoading(true);
        
        try {
            const response = await fetch(`/api/products?id=${productToDelete.id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to delete product');
            }
            
            // Close modal
            setShowDeleteConfirm(false);
            setProductToDelete(null);
            
            // Show success notification
            setNotification({
                type: 'success',
                message: `Product "${productToDelete.name}" has been successfully deleted.`
            });
            
            // Refresh products list
            await fetchProducts();
            
            // Hide notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error('Error deleting product:', err);
            
            // Close modal
            setShowDeleteConfirm(false);
            setProductToDelete(null);
            
            setNotification({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to delete product. Please try again.'
            });
            
            // Hide error notification after 5 seconds
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setProductToDelete(null);
    };

    const getStockStatus = (stock: number) => {
        return stock > 0 ? 'In stock' : 'Out of stock';
    };

    const getStockStatusClass = (stock: number) => {
        return stock > 0 ? 'in-stock' : 'out-of-stock';
    };

    const getProductStatusClass = (status: string) => {
        const statusMap: Record<string, string> = {
            'active': 'status-active',
            'inactive': 'status-inactive',
            'draft': 'status-draft',
            'archived': 'status-archived'
        };
        return statusMap[status] || 'status-draft';
    };

    const handleStatusChange = async (productId: number, productName: string, newStatus: 'active' | 'inactive') => {
        setActiveDropdown(null);
        
        try {
            const response = await fetch(`/api/products`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: productId,
                    status: newStatus
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to update product status');
            }
            
            // Show success notification
            setNotification({
                type: 'success',
                message: `Product "${productName}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`
            });
            
            // Refresh products list
            await fetchProducts();
            
            // Hide notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error('Error updating product status:', err);
            setNotification({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to update product status.'
            });
            
            // Hide error notification after 5 seconds
            setTimeout(() => setNotification(null), 5000);
        }
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
                        <div className={`mobile-column-selector mobile-only ${showColumnDropdown ? 'active' : ''}`}>
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

                {/* Loading State */}
                {loading && viewMode === 'table' && (
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
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`loading-${i}`} className="row-loading">
                                        <td>
                                            <div className="product-info">
                                                <div className="skeleton skeleton-circle" style={{ width: '50px', height: '50px' }}></div>
                                                <div style={{ flex: 1 }}>
                                                    <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '8px' }}></div>
                                                    <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-badge" style={{ width: '80px' }}></div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-text" style={{ width: '40px' }}></div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-badge" style={{ width: '80px' }}></div>
                                        </td>
                                        <td>
                                            <div className="skeleton skeleton-circle" style={{ width: '30px', height: '30px' }}></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Loading State - Card View */}
                {loading && viewMode === 'card' && (
                    <div className={`products-grid ${window.innerWidth <= 768 ? `mobile-cols-${mobileColumns}` : ''}`}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`loading-card-${i}`} className="product-card">
                                <div className="product-card-image skeleton" style={{ height: '200px' }}></div>
                                <div className="product-card-content">
                                    <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: '8px' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '90%', marginBottom: '8px' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '12px' }}></div>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <div className="skeleton skeleton-badge" style={{ width: '60px' }}></div>
                                        <div className="skeleton skeleton-badge" style={{ width: '60px' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div className="skeleton skeleton-text" style={{ width: '50px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '70px' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                        <p>Error: {error}</p>
                        <button onClick={fetchProducts} style={{ marginTop: '10px' }}>Retry</button>
                    </div>
                )}

                {/* Content */}
                {!loading && !error && viewMode === 'table' ? (
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
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                            No products found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                    <tr 
                                        key={product.id}
                                        onClick={() => handleViewDetail(product)}
                                        style={{ cursor: 'pointer' }}
                                        className="product-row-clickable"
                                    >
                                        <td>
                                            <div className="product-info">
                                                <div className="product-image">
                                                    📦
                                                </div>
                                                <div className="product-details">
                                                    <h4>{product.name}</h4>
                                                    <p>{product.short_description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="category-list">
                                                {product.categories.map((cat) => (
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
                                                        {cat.is_primary && ' ⭐'}
                                                    </span>
                                                ))}
                                                {product.categories.length === 0 && (
                                                    <span className="category-badge" style={{ opacity: 0.5 }}>
                                                        Uncategorized
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="price">${product.price.toFixed(2)}</span>
                                        </td>
                                        <td>
                                            <span className="stock-amount">{product.stock}</span>
                                        </td>
                                        <td>
                                            <span className={`product-status ${getProductStatusClass(product.status)}`}>
                                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                            </span>
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div className={`unified-dropdown ${activeDropdown === product.id ? 'active' : ''}`}>
                                                <button
                                                    className="unified-more-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === product.id ? null : product.id);
                                                    }}
                                                >
                                                    <IconMoreVertical />
                                                </button>
                                                {activeDropdown === product.id && (
                                                    <div className="unified-dropdown-menu">
                                                        <button 
                                                            className="unified-dropdown-item"
                                                            onClick={() => handleViewDetail(product)}
                                                        >
                                                            <IconEye />
                                                            View Details
                                                        </button>
                                                        <button className="unified-dropdown-item">
                                                            <IconEdit />
                                                            Edit
                                                        </button>
                                                        {product.status === 'inactive' ? (
                                                            <button 
                                                                className="unified-dropdown-item"
                                                                onClick={() => handleStatusChange(product.id, product.name, 'active')}
                                                            >
                                                                <IconCheck />
                                                                Activate
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                className="unified-dropdown-item"
                                                                onClick={() => handleStatusChange(product.id, product.name, 'inactive')}
                                                            >
                                                                <IconX />
                                                                Deactivate
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="unified-dropdown-item danger"
                                                            onClick={() => handleDeleteClick(product.id, product.name)}
                                                        >
                                                            <IconTrash2 />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : !loading && !error ? (
                    <div className={`products-grid ${window.innerWidth <= 768 ? `mobile-cols-${mobileColumns}` : ''}`}>
                        {filteredProducts.map((product) => (
                            <div 
                                key={product.id} 
                                className="product-card product-card-clickable"
                                onClick={() => handleViewDetail(product)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="product-card-image">
                                    📦
                                    <div className="product-card-actions" onClick={(e) => e.stopPropagation()}>
                                        <div className={`unified-dropdown ${activeDropdown === product.id ? 'active' : ''}`}>
                                            <button
                                                className="unified-more-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === product.id ? null : product.id);
                                                }}
                                            >
                                                <IconMoreVertical />
                                            </button>
                                            {activeDropdown === product.id && (
                                                <div className="unified-dropdown-menu">
                                                    <button 
                                                        className="unified-dropdown-item"
                                                        onClick={() => handleViewDetail(product)}
                                                    >
                                                        <IconEye />
                                                        View Details
                                                    </button>
                                                    <button className="unified-dropdown-item">
                                                        <IconEdit />
                                                        Edit
                                                    </button>
                                                    {product.status === 'inactive' ? (
                                                        <button 
                                                            className="unified-dropdown-item"
                                                            onClick={() => handleStatusChange(product.id, product.name, 'active')}
                                                        >
                                                            <IconCheck />
                                                            Activate
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="unified-dropdown-item"
                                                            onClick={() => handleStatusChange(product.id, product.name, 'inactive')}
                                                        >
                                                            <IconX />
                                                            Deactivate
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="unified-dropdown-item danger"
                                                        onClick={() => handleDeleteClick(product.id, product.name)}
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
                                        <span className={`product-status ${getProductStatusClass(product.status)}`}>
                                            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                        </span>
                                    </div>
                                    <p className="product-card-description">{product.short_description}</p>
                                    <div className="product-card-categories">
                                        {product.categories.map((cat) => (
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
                                                {cat.is_primary && ' ⭐'}
                                            </span>
                                        ))}
                                        {product.categories.length === 0 && (
                                            <span className="category-badge" style={{ opacity: 0.5 }}>
                                                Uncategorized
                                            </span>
                                        )}
                                    </div>
                                    <div className="product-card-footer">
                                        <span className="price">${product.price.toFixed(2)}</span>
                                        <span className="product-card-stock">Stock: {product.stock}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {!loading && !error && filteredProducts.length === 0 && (
                    <div className="empty-state">
                        <div>📦</div>
                        <h3>No products found</h3>
                        <p>Try adjusting your search or create a new product.</p>
                    </div>
                )}
            </div>

            {/* Product Detail Modal */}
            <ProductDetailModal
                open={showDetailModal}
                onClose={handleCloseDetail}
                product={selectedProduct}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={showDeleteConfirm}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Product"
                message={`Are you sure you want to delete "${productToDelete?.name}"? This will also remove all category associations for this product. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                loading={deleteLoading}
            />

            {/* Notification Toast */}
            {notification && (
                <div className={`notification-toast ${notification.type}`}>
                    <div className="notification-content">
                        <span className="notification-icon">
                            {notification.type === 'success' ? '✓' : '✕'}
                        </span>
                        <span className="notification-message">{notification.message}</span>
                    </div>
                    <button 
                        className="notification-close"
                        onClick={() => setNotification(null)}
                    >
                        ✕
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
