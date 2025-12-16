import { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { IconPlus, IconSearch, IconFilter, IconList, IconGrid, IconMoreVertical, IconEdit, IconTrash2, IconEye, IconPackage, IconLayout, IconChevronDown, IconChevronUp, IconCheck, IconX, IconImage, IconHistory, IconUpload } from '../components/icons';
import ProductDetailModal from '../components/ProductDetailModal';
import ConfirmModal from '../components/ConfirmModal';
import ExcelImportModal from '../components/ExcelImportModal';
import AddProductModal from '../components/AddProductModal';
import ActivityLogModal from '../components/ActivityLogModal';
import { useTranslation } from '../../shared/contexts/TranslationContext';

interface Category {
    id: number;
    name: string;
    slug: string;
    color: string;
    is_primary: boolean;
}

interface ProductImage {
    id: number;
    url: string;
    alt_text?: string;
    is_featured: boolean;
    sort_order: number;
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
    images?: ProductImage[];
    // KiotViet integration fields
    kiotviet_id?: string | null;
    serial_number?: string | null;
    supplier_id?: string | null;
    center_stone_size_mm?: number | null;
    shape?: string | null;
    dimensions?: string | null;
    stone_count?: number | null;
    carat_weight_ct?: number | null;
    gold_purity?: string | null;
    product_weight_g?: number | null;
    type?: string | null;
    inventory_value?: number | null;
    last_synced_at?: string | null;
    sync_status?: string | null;
}

// Format number as VND currency
const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

export default function AdminProducts() {
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'card'>(
        window.innerWidth <= 768 ? 'card' : 'table'
    );
    const [mobileColumns, setMobileColumns] = useState<1 | 2 | 3>(1);
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (activeDropdown !== null) {
                const target = e.target as HTMLElement;
                if (!target.closest('.unified-dropdown')) {
                    setActiveDropdown(null);
                }
            }
        };

        if (activeDropdown !== null) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [activeDropdown]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState<{ id: number, name: string } | null>(null);
    const [showExcelImportModal, setShowExcelImportModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
        const saved = localStorage.getItem('autoSyncEnabled');
        return saved === 'true';
    });
    const [isAutoSyncing, setIsAutoSyncing] = useState(false);
    const [sortColumn, setSortColumn] = useState<'name' | 'sku' | 'stock' | 'price' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Fetch categories for filter
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    const data = await response.json();
                    setAvailableCategories(data || []);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    // Close category dropdown when clicking outside
    useEffect(() => {
        if (!showCategoryDropdown) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.filter-category-selector')) {
                setShowCategoryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCategoryDropdown]);

    // Handle category toggle
    const handleCategoryToggle = (categoryId: number) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
    };

    // Get selected category names
    const selectedCategoryNames = useMemo(() => {
        return availableCategories
            .filter(cat => selectedCategories.includes(cat.id))
            .map(cat => cat.name);
    }, [availableCategories, selectedCategories]);

    // Memoize filtered products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            // Search filter
            const matchesSearch = product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                product.category_names.some(cat => cat.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
            
            // Category filter
            const matchesCategory = selectedCategories.length === 0 || 
                product.categories.some(cat => selectedCategories.includes(cat.id));
            
            // Status filter
            const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
            
            // Price range filter
            const matchesPrice = (!priceRange.min || product.price >= parseFloat(priceRange.min)) &&
                (!priceRange.max || product.price <= parseFloat(priceRange.max));
            
            return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
        });
    }, [products, debouncedSearchTerm, selectedCategories, filterStatus, priceRange]);

    // Memoize active/inactive counts
    const { activeCount, inactiveCount } = useMemo(() => {
        return {
            activeCount: products.filter(p => p.status === 'active').length,
            inactiveCount: products.filter(p => p.status === 'inactive').length
        };
    }, [products]);

    // Memoize sorted products
    const sortedProducts = useMemo(() => {
        return [...filteredProducts].sort((a, b) => {
            if (!sortColumn) return 0;
            
            let aValue: string | number;
            let bValue: string | number;
            
            switch (sortColumn) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'sku':
                    aValue = (a.sku || '').toLowerCase();
                    bValue = (b.sku || '').toLowerCase();
                    break;
                case 'stock':
                    aValue = a.stock ?? 0;
                    bValue = b.stock ?? 0;
                    break;
                case 'price':
                    aValue = a.price ?? 0;
                    bValue = b.price ?? 0;
                    break;
                default:
                    return 0;
            }
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (sortDirection === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            } else {
                if (sortDirection === 'asc') {
                    return (aValue as number) - (bValue as number);
                } else {
                    return (bValue as number) - (aValue as number);
                }
            }
        });
    }, [filteredProducts, sortColumn, sortDirection]);

    const handleSort = useCallback((column: 'name' | 'sku' | 'stock' | 'price') => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn, sortDirection]);

    // Fetch products from API
    useEffect(() => {
        fetchProducts();
    }, []);

    // Auto-sync on page load if enabled
    useEffect(() => {
        if (autoSyncEnabled) {
            handleAutoSync();
        }
    }, []);

    const handleAutoSync = async () => {
        if (isAutoSyncing) return;
        
        setIsAutoSyncing(true);
        try {
            // Get default integration (KiotViet)
            const response = await fetch('/api/integrations/test?integrationId=1');
            const testData = await response.json();
            
            if (testData.success) {
                const syncResponse = await fetch('/api/integrations/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ integrationId: 1 })
                });

                if (syncResponse.ok) {
                    // Refresh products after sync
                    await fetchProducts();
                }
            }
        } catch (error) {
            console.error('Auto-sync error:', error);
        } finally {
            setIsAutoSyncing(false);
        }
    };

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
            
            // Fetch images for each product
            const productsWithImages = await Promise.all(
                data.map(async (product: Product) => {
                    try {
                        const imagesResponse = await fetch(`/api/product-images?productId=${product.id}`);
                        if (imagesResponse.ok) {
                            const images = await imagesResponse.json();
                            return { ...product, images: images || [] };
                        }
                    } catch (error) {
                        console.warn(`Failed to load images for product ${product.id}:`, error);
                    }
                    return { ...product, images: [] };
                })
            );
            
            setProducts(productsWithImages);
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

    const handleViewDetail = useCallback((product: Product) => {
        setActiveDropdown(null);
        setSelectedProduct(product);
        setShowDetailModal(true);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setShowDetailModal(false);
        setSelectedProduct(null);
    }, []);

    const handleDeleteClick = useCallback((productId: number, productName: string) => {
        setActiveDropdown(null);
        setProductToDelete({ id: productId, name: productName });
        setShowDeleteConfirm(true);
    }, []);

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

    const handleExcelImport = async (file: File): Promise<{ success: boolean; estimatedCount?: number; errors?: string[] }> => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch('/api/products/upload-excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to import products');
            }

            const result = await response.json();
            return {
                success: true,
                estimatedCount: result.processed || 0,
                errors: result.errors || []
            };
        } catch (error) {
            console.error('Excel import error:', error);
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error occurred']
            };
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const authToken = localStorage.getItem('nobleco_auth_token');
            const response = await fetch('/api/products/download-template', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download template');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product-import-template.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Template download error:', error);
            throw error;
        }
    };

    const handleSyncData = async (integrationId: number) => {
        // TODO: Implement sync logic
        console.log('Syncing data from integration:', integrationId);
        // Show success notification
        setNotification({
            type: 'success',
            message: 'Data sync started successfully!'
        });
        setTimeout(() => setNotification(null), 3000);
        // Refresh products after sync
        setTimeout(() => {
            fetchProducts();
        }, 2000);
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

    const [showAddProductModal, setShowAddProductModal] = useState(false);

    const handleEditProduct = useCallback((product: Product) => {
        setActiveDropdown(null);
        setEditingProduct(product);
        setShowAddProductModal(true);
    }, []);

    const handleStatusChange = useCallback(async (productId: number, productName: string, newStatus: 'active' | 'inactive') => {
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
    }, []);

    return (
        <AdminLayout title={t('products.management')}>
            <div className="admin-products-page">

                {/* Toolbar */}
                <div className="admin-products-toolbar">
                    <div className="toolbar-left">
                        <div className="search-container">
                            <IconSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder={t('products.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button 
                            className="btn-filter" 
                            title="Filter products"
                            onClick={() => setShowFilterPopup(true)}
                        >
                            <IconFilter />
                        </button>
                        <button 
                            className="btn-activity-log" 
                            title="View Activity Log"
                            onClick={() => setShowActivityLog(true)}
                        >
                            <IconHistory />
                            <span className="btn-text">{t('products.activityLog')}</span>
                        </button>
                        <button 
                            className="btn-import" 
                            title={t('products.import')}
                            onClick={() => setShowExcelImportModal(true)}
                        >
                            <IconUpload />
                            <span className="btn-text">{t('products.import')}</span>
                        </button>
                    </div>
                    <div className="toolbar-right">
                        <button 
                            className="btn-add" 
                            title={t('products.addProduct')}
                            onClick={() => {
                                setEditingProduct(null);
                                setShowAddProductModal(true);
                            }}
                        >
                            <IconPlus />
                            <span className="btn-text">{t('products.addProduct')}</span>
                        </button>
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
                        
                    </div>
                </div>

                {/* Loading State */}
                {loading && viewMode === 'table' && (
                    <div className="products-table-container">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>{t('products.product')}</th>
                                    <th>{t('products.category')}</th>
                                    <th>{t('products.sku')}</th>
                                    <th>{t('products.stock')}</th>
                                    <th>{t('products.price')}</th>
                                    <th>{t('products.status')}</th>
                                    <th>{t('products.actions')}</th>
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

                {/* Product Status Counts */}
                {!loading && !error && (
                    <div className="products-count-bar">
                        <div className="products-status-counts">
                            <span className="products-count-text">
                                {t('products.totalProducts')}: <strong>{filteredProducts.length}</strong>
                            </span>
                            <span className="status-count active">
                                {t('products.active')}: <strong>{activeCount}</strong>
                            </span>
                            <span className="status-count inactive">
                                {t('products.inactive')}: <strong>{inactiveCount}</strong>
                            </span>
                        </div>
                    </div>
                )}

                {/* Content */}
                {!loading && !error && viewMode === 'table' ? (
                    <div className="products-table-container">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th className="sortable-header">
                                        <div className="th-content">
                                            <span>{t('products.product')}</span>
                                            <button 
                                                className="sort-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSort('name');
                                                }}
                                            >
                                                {sortColumn === 'name' ? (
                                                    sortDirection === 'asc' ? <IconChevronUp /> : <IconChevronDown />
                                                ) : (
                                                    <IconChevronUp style={{ opacity: 0.3 }} />
                                                )}
                                            </button>
                                        </div>
                                    </th>
                                    <th>{t('products.category')}</th>
                                    <th className="sortable-header">
                                        <div className="th-content">
                                            <span>{t('products.sku')}</span>
                                            <button 
                                                className="sort-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSort('sku');
                                                }}
                                            >
                                                {sortColumn === 'sku' ? (
                                                    sortDirection === 'asc' ? <IconChevronUp /> : <IconChevronDown />
                                                ) : (
                                                    <IconChevronUp style={{ opacity: 0.3 }} />
                                                )}
                                            </button>
                                        </div>
                                    </th>
                                    <th className="sortable-header">
                                        <div className="th-content">
                                            <span>{t('products.stock')}</span>
                                            <button 
                                                className="sort-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSort('stock');
                                                }}
                                            >
                                                {sortColumn === 'stock' ? (
                                                    sortDirection === 'asc' ? <IconChevronUp /> : <IconChevronDown />
                                                ) : (
                                                    <IconChevronUp style={{ opacity: 0.3 }} />
                                                )}
                                            </button>
                                        </div>
                                    </th>
                                    <th className="sortable-header">
                                        <div className="th-content">
                                            <span>{t('products.price')}</span>
                                            <button 
                                                className="sort-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSort('price');
                                                }}
                                            >
                                                {sortColumn === 'price' ? (
                                                    sortDirection === 'asc' ? <IconChevronUp /> : <IconChevronDown />
                                                ) : (
                                                    <IconChevronUp style={{ opacity: 0.3 }} />
                                                )}
                                            </button>
                                        </div>
                                    </th>
                                    <th>{t('products.status')}</th>
                                    <th>{t('products.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                            No products found
                                        </td>
                                    </tr>
                                ) : (
                                    sortedProducts.map((product) => (
                                    <tr 
                                        key={product.id}
                                        onClick={() => handleViewDetail(product)}
                                        style={{ cursor: 'pointer' }}
                                        className="product-row-clickable"
                                    >
                                        <td>
                                            <div className="product-info">
                                                <div className="product-image">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img 
                                                            src={product.images[0].url} 
                                                            alt={product.name}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <span>📦</span>
                                                    )}
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
                                            <span className="sku">{product.sku || 'N/A'}</span>
                                        </td>
                                        <td>
                                            <span className={`stock ${product.stock === 0 ? 'out-of-stock' : ''} ${product.stock == null ? 'stock-null' : ''}`}>
                                                {product.stock != null ? product.stock : 'null'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="price">{formatVND(product.price)}</span>
                                        </td>
                                        <td>
                                            <span className={`product-status ${getProductStatusClass(product.status)}`}>
                                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                            </span>
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div 
                                                className={`unified-dropdown ${activeDropdown === product.id ? 'active' : ''}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    className="unified-more-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === product.id ? null : product.id);
                                                    }}
                                                    title="More Actions"
                                                >
                                                    <IconMoreVertical />
                                                </button>
                                                {activeDropdown === product.id && (
                                                    <div className="unified-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                                        <button 
                                                            className="unified-dropdown-item"
                                                            onClick={() => handleViewDetail(product)}
                                                        >
                                                            <IconEye />
                                                            View Details
                                                        </button>
                                                        <button 
                                                            className="unified-dropdown-item"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditProduct(product);
                                                            }}
                                                        >
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
                        {sortedProducts.map((product) => (
                            <div 
                                key={product.id} 
                                className="product-card product-card-clickable"
                                onClick={() => handleViewDetail(product)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="product-card-image">
                                    {product.images && product.images.length > 0 ? (
                                        <img 
                                            src={product.images[0].url} 
                                            alt={product.name}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <span>📦</span>
                                    )}
                                    <div className="product-card-actions" onClick={(e) => e.stopPropagation()}>
                                        <div 
                                            className={`unified-dropdown ${activeDropdown === product.id ? 'active' : ''}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="unified-more-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === product.id ? null : product.id);
                                                }}
                                                title="More Actions"
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
                                                    <button 
                                                        className="unified-dropdown-item"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditProduct(product);
                                                        }}
                                                    >
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
                                            </span>
                                        ))}
                                        {product.categories.length === 0 && (
                                            <span className="category-badge" style={{ opacity: 0.5 }}>
                                                Uncategorized
                                            </span>
                                        )}
                                    </div>
                                    <div className="product-card-footer">
                                        <div className="product-card-sku-stock">
                                            <div className="product-card-sku">
                                                <span className="sku-label">SKU:</span>
                                                <span className="sku-value">{product.sku || 'N/A'}</span>
                                            </div>
                                            <div className="product-card-stock">
                                                <span className="stock-label">Stock:</span>
                                                <span className={`stock-value ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                                                    {product.stock ?? 'null'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="price">{formatVND(product.price)}</span>
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
            {selectedProduct && (
                <ProductDetailModal
                    open={showDetailModal}
                    onClose={handleCloseDetail}
                    product={{
                        ...selectedProduct,
                        images: selectedProduct.images?.map(img => ({
                            id: img.id,
                            url: img.url,
                            storage_path: '',
                            alt_text: img.alt_text || undefined,
                            sort_order: img.sort_order,
                            is_featured: img.is_featured,
                            file_size: undefined,
                            width: undefined,
                            height: undefined,
                            mime_type: undefined
                        }))
                    }}
                    onEdit={handleEditProduct}
                />
            )}

            {/* Add/Edit Product Modal */}
            <AddProductModal
                open={showAddProductModal}
                onClose={() => {
                    setShowAddProductModal(false);
                    setEditingProduct(null);
                }}
                onSuccess={() => {
                    setShowAddProductModal(false);
                    setEditingProduct(null);
                    fetchProducts();
                }}
                product={editingProduct}
            />

            {/* Excel Import Modal */}
            <ExcelImportModal
                open={showExcelImportModal}
                onClose={() => setShowExcelImportModal(false)}
                onImport={handleExcelImport}
                onDownloadTemplate={handleDownloadTemplate}
            />

            {/* Filter Popup */}
            {showFilterPopup && (
                <>
                    <div className="filter-popup-overlay active" onClick={() => {
                        setShowFilterPopup(false);
                        setShowCategoryDropdown(false);
                    }} />
                    <div className={`filter-popup ${showFilterPopup ? 'active' : ''}`}>
                        <div className="filter-popup-header">
                            <h3 className="filter-popup-title">Filters</h3>
                            <button className="filter-popup-close" onClick={() => {
                                setShowFilterPopup(false);
                                setShowCategoryDropdown(false);
                            }}>×</button>
                        </div>
                        <div className="filter-popup-body">
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">Categories</label>
                                <div className="filter-category-selector">
                                    <button
                                        type="button"
                                        className={`filter-category-dropdown-toggle ${showCategoryDropdown ? 'active' : ''}`}
                                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    >
                                        <span>
                                            {selectedCategoryNames.length > 0
                                                ? `${selectedCategoryNames.length} categor${selectedCategoryNames.length === 1 ? 'y' : 'ies'} selected`
                                                : 'Select categories'}
                                        </span>
                                        <span className="dropdown-arrow">▼</span>
                                    </button>
                                    {showCategoryDropdown && (
                                        <div className="filter-category-dropdown-menu">
                                            {availableCategories.length === 0 ? (
                                                <div className="dropdown-empty">No categories available</div>
                                            ) : (
                                                availableCategories.map(category => {
                                                    const isSelected = selectedCategories.includes(category.id);
                                                    return (
                                                        <label
                                                            key={category.id}
                                                            className={`filter-category-dropdown-item ${isSelected ? 'selected' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCategoryToggle(category.id);
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCategoryToggle(category.id);
                                                                }}
                                                            />
                                                            <span 
                                                                className="category-color-dot"
                                                                style={{ backgroundColor: category.color }}
                                                            />
                                                            <span>{category.name}</span>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">Price Range</label>
                                <div className="filter-price-range">
                                    <div className="filter-price-input-wrapper">
                                        <span className="filter-price-prefix">₫</span>
                                        <input
                                            type="number"
                                            className="filter-price-input"
                                            placeholder="Min price"
                                            value={priceRange.min}
                                            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                        />
                                    </div>
                                    <div className="filter-price-separator">to</div>
                                    <div className="filter-price-input-wrapper">
                                        <span className="filter-price-prefix">₫</span>
                                        <input
                                            type="number"
                                            className="filter-price-input"
                                            placeholder="Max price"
                                            value={priceRange.max}
                                            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="filter-popup-group">
                                <label className="filter-popup-label">Status</label>
                                <div className="filter-status-group">
                                    <label className={`filter-status-item ${filterStatus === 'all' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="all"
                                            checked={filterStatus === 'all'}
                                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                                        />
                                        <span className="filter-status-label">All</span>
                                    </label>
                                    <label className={`filter-status-item ${filterStatus === 'active' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="active"
                                            checked={filterStatus === 'active'}
                                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                                        />
                                        <span className="filter-status-label">
                                            <span className="filter-status-indicator active"></span>
                                            {t('products.active')}
                                        </span>
                                    </label>
                                    <label className={`filter-status-item ${filterStatus === 'inactive' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="inactive"
                                            checked={filterStatus === 'inactive'}
                                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                                        />
                                        <span className="filter-status-label">
                                            <span className="filter-status-indicator inactive"></span>
                                            {t('products.inactive')}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="filter-popup-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setSelectedCategories([]);
                                    setFilterStatus('all');
                                    setPriceRange({ min: '', max: '' });
                                    setShowCategoryDropdown(false);
                                }}
                            >
                                Clear All
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    setShowFilterPopup(false);
                                    setShowCategoryDropdown(false);
                                }}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Activity Log Modal */}
            <ActivityLogModal
                open={showActivityLog}
                onClose={() => setShowActivityLog(false)}
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
