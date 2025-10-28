import { useState, useEffect } from 'react';
import { IconX, IconPackage } from './icons';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    level: number;
    color: string;
    status: 'active' | 'inactive';
    is_featured: boolean;
    product_count: number;
    created_at: string;
    updated_at: string;
}

interface ProductInCategory {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    short_description: string;
    price: number;
    stock: number;
    status: 'draft' | 'active' | 'inactive' | 'archived';
}

interface CategoryDetailModalProps {
    open: boolean;
    onClose: () => void;
    category: Category | null;
}

export default function CategoryDetailModal({ open, onClose, category }: CategoryDetailModalProps) {
    const [products, setProducts] = useState<ProductInCategory[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        if (open && category) {
            fetchCategoryProducts();
        }
    }, [open, category]);

    const fetchCategoryProducts = async () => {
        if (!category) return;

        try {
            setLoadingProducts(true);
            const response = await fetch(`/api/categories?categoryId=${category.id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch category products');
            }
            
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            console.error('Error fetching category products:', err);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    if (!open || !category) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getProductStatusClass = (status: string) => {
        return `status-${status}`;
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="category-detail-modal" role="dialog" aria-modal="true">
                <div className="category-modal-header">
                    <h2>Category Details</h2>
                    <button className="modal-close" aria-label="Close" onClick={onClose}>
                        <IconX />
                    </button>
                </div>

                <div className="category-modal-content">
                    {/* Category Header */}
                    <div className="category-header-section">
                        <div className="category-color-display">
                            <div 
                                className="color-preview" 
                                style={{ backgroundColor: category.color }}
                            />
                            <div className="category-main-info">
                                <h1 className="category-name">{category.name}</h1>
                                <p className="category-slug">{category.slug}</p>
                            </div>
                        </div>
                        <div className="category-badges">
                            <span 
                                className={`status-badge status-${category.status}`}
                            >
                                {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                            </span>
                            {category.is_featured && (
                                <span className="featured-badge">⭐ Featured</span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="category-section">
                        <label className="section-label">Description</label>
                        <div className="category-description">
                            {category.description || 'No description available.'}
                        </div>
                    </div>

                    {/* Color */}
                    <div className="category-section">
                        <label className="section-label">Color</label>
                        <div className="color-info">
                            <div 
                                className="color-swatch" 
                                style={{ backgroundColor: category.color }}
                            />
                            <span className="color-code">{category.color}</span>
                        </div>
                    </div>

                    {/* Created Date */}
                    <div className="category-section">
                        <label className="section-label">Created Date</label>
                        <div className="category-date">
                            {formatDate(category.created_at)}
                        </div>
                    </div>

                    {/* Products in this category */}
                    <div className="category-section products-section">
                        <label className="section-label">
                            Products in this category ({category.product_count})
                        </label>
                        
                        {loadingProducts ? (
                            <div className="loading-products">
                                <p>Loading products...</p>
                            </div>
                        ) : products.length > 0 ? (
                            <div className="category-products-list">
                                {products.map((product) => (
                                    <div key={product.id} className="category-product-item">
                                        <div className="product-avatar">
                                            <IconPackage />
                                        </div>
                                        <div className="product-info">
                                            <div className="product-header">
                                                <h4 className="product-name">{product.name}</h4>
                                                <span className={`product-status-mini ${getProductStatusClass(product.status)}`}>
                                                    {product.status}
                                                </span>
                                            </div>
                                            {product.sku && (
                                                <p className="product-sku-mini">SKU: {product.sku}</p>
                                            )}
                                            <p className="product-short-desc-mini">
                                                {product.short_description}
                                            </p>
                                            <div className="product-meta-mini">
                                                <span className="product-price">${product.price.toFixed(2)}</span>
                                                <span className="product-stock">
                                                    Stock: {product.stock}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-products">
                                <p>No products in this category yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="category-modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    <button className="btn-primary">
                        Edit Category
                    </button>
                </div>
            </div>
        </>
    );
}

