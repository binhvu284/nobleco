import { IconX } from '../components/icons';

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

interface ProductDetailModalProps {
    open: boolean;
    onClose: () => void;
    product: Product | null;
    onEdit?: (product: Product) => void;
}

export default function ProductDetailModal({ open, onClose, product, onEdit }: ProductDetailModalProps) {
    if (!open || !product) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return '#10B981';
            case 'draft':
                return '#F59E0B';
            case 'inactive':
                return '#6B7280';
            case 'archived':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="product-detail-modal" role="dialog" aria-modal="true">
                <div className="product-modal-header">
                    <button className="modal-close" aria-label="Close" onClick={onClose}>
                        <IconX />
                    </button>
                </div>

                <div className="product-modal-content">
                    {/* Product Images Section - Placeholder for now */}
                    <div className="product-images-section">
                        <div className="main-product-image">
                            <div className="image-placeholder">
                                📦
                                <p>Product Image</p>
                                <span className="image-note">Multiple images will be displayed here</span>
                            </div>
                        </div>
                        <div className="product-thumbnails">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="thumbnail-placeholder">
                                    <span>📷</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Information */}
                    <div className="product-info-section">
                        {/* Header with Name and Status */}
                        <div className="product-header-info">
                            <div className="product-name-sku-row">
                                <h1 className="product-name">{product.name}</h1>
                                {product.sku && (
                                    <p className="product-sku">SKU: {product.sku}</p>
                                )}
                            </div>
                            <span 
                                className="product-status-badge"
                                style={{ 
                                    backgroundColor: `${getStatusColor(product.status)}20`,
                                    color: getStatusColor(product.status),
                                    borderColor: getStatusColor(product.status)
                                }}
                            >
                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                            </span>
                        </div>

                        {/* Short Description */}
                        <div className="product-section">
                            <p className="product-short-desc">{product.short_description}</p>
                        </div>

                        {/* Price and Stock */}
                        <div className="product-pricing-section">
                            <div className="pricing-item">
                                <label>Price</label>
                                <div className="price-value">{new Intl.NumberFormat('vi-VN').format(product.price)} ₫</div>
                            </div>
                            {product.cost_price && (
                                <div className="pricing-item">
                                    <label>Cost Price</label>
                                    <div className="cost-price-value">{new Intl.NumberFormat('vi-VN').format(product.cost_price)} ₫</div>
                                </div>
                            )}
                            <div className="pricing-item">
                                <label>Stock</label>
                                <div className={`stock-value ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                                    {product.stock} units
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="product-section">
                            <label className="section-label">Categories</label>
                            <div className="categories-display">
                                {product.categories.length > 0 ? (
                                    product.categories.map((cat) => (
                                        <span
                                            key={cat.id}
                                            className="category-tag"
                                            style={{
                                                backgroundColor: `${cat.color}20`,
                                                color: cat.color,
                                                borderColor: cat.color
                                            }}
                                        >
                                            {cat.name}
                                            {cat.is_primary && <span className="primary-star">⭐</span>}
                                        </span>
                                    ))
                                ) : (
                                    <span className="no-categories">No categories assigned</span>
                                )}
                            </div>
                        </div>

                        {/* Long Description */}
                        <div className="product-section">
                            <label className="section-label">Description</label>
                            <div className="product-long-desc">
                                {product.long_description || 'No detailed description available.'}
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="product-meta-section">
                            <div className="meta-row">
                                <div className="meta-item">
                                    <label>Created At</label>
                                    <span>{formatDate(product.created_at)}</span>
                                </div>
                                <div className="meta-item">
                                    <label>Updated At</label>
                                    <span>{formatDate(product.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="product-modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    <button 
                        className="btn-primary"
                        onClick={() => {
                            if (onEdit && product) {
                                onEdit(product);
                                onClose();
                            }
                        }}
                    >
                        Edit Product
                    </button>
                </div>
            </div>
        </>
    );
}

