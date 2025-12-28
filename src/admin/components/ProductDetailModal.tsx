import { useState, useEffect, useCallback } from 'react';
import { IconX } from '../components/icons';
import ImageGallery from '../../components/ImageGallery';
import { UploadedImage } from '../../utils/imageUpload';

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
    images?: UploadedImage[];
    // KiotViet integration fields
    kiotviet_id?: string | null;
    supplier_id?: string | null;
    jewelry_specifications?: string | null;
    inventory_value?: number | null;
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
    last_synced_at?: string | null;
    sync_status?: string | null;
}

interface ProductDetailModalProps {
    open: boolean;
    onClose: () => void;
    product: Product | null;
    onEdit?: (product: Product) => void;
    productType?: 'jewelry' | 'centerstone';
}

export default function ProductDetailModal({ open, onClose, product, onEdit, productType = 'jewelry' }: ProductDetailModalProps) {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);

    const loadProductImages = useCallback(async (productId: number) => {
        try {
            setLoadingImages(true);
            const endpoint = productType === 'jewelry' ? '/api/product-images' : '/api/centerstone-images';
            const productIdParam = productType === 'jewelry' ? 'productId' : 'centerstoneId';
            const response = await fetch(`${endpoint}?${productIdParam}=${productId}`);
            if (response.ok) {
                const imageData = await response.json();
                setImages(imageData || []);
            }
        } catch (error) {
            console.error('Error loading product images:', error);
            setImages([]);
        } finally {
            setLoadingImages(false);
        }
    }, [productType]);

    // Load product images when modal opens
    useEffect(() => {
        if (open && product) {
            loadProductImages(product.id);
        } else {
            setImages([]);
        }
    }, [open, product, loadProductImages]);

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
                    {/* Product Images Section */}
                    <div className="product-images-section">
                        {loadingImages ? (
                            <div className="image-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading images...</p>
                            </div>
                        ) : (
                            <ImageGallery
                                images={images}
                                showThumbnails={true}
                                className="product-detail-gallery"
                            />
                        )}
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

                        {/* Product Specifications - Always display */}
                        <div className="product-section">
                            <label className="section-label">Product Specifications</label>
                            <div className="kiotviet-fields-grid">
                                <div className="kiotviet-field">
                                    <label>Supplier ID</label>
                                    <span>{product.supplier_id ?? 'null'}</span>
                                </div>
                                <div className="kiotviet-field">
                                    <label>Inventory Value</label>
                                    <span>{product.inventory_value != null ? new Intl.NumberFormat('vi-VN').format(product.inventory_value) + ' ₫' : 'null'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Specifications - Always display */}
                        <div className="product-section">
                            <label className="section-label">
                                {productType === 'jewelry' ? 'Jewelry Specifications' : 'Center Stone Specifications'}
                            </label>
                            <div className="jewelry-specifications-content">
                                {product.jewelry_specifications ? (
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
                                        {product.jewelry_specifications}
                                    </pre>
                                ) : (
                                    <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No specifications available</span>
                                )}
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
                                {product.last_synced_at && (
                                    <div className="meta-item">
                                        <label>Last Synced</label>
                                        <span>{formatDate(product.last_synced_at)}</span>
                                    </div>
                                )}
                                {product.sync_status && (
                                    <div className="meta-item">
                                        <label>Sync Status</label>
                                        <span className={`sync-status-badge ${product.sync_status}`}>
                                            {product.sync_status}
                                        </span>
                                    </div>
                                )}
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
                        {productType === 'jewelry' ? 'Edit Jewelry' : 'Edit Center Stone'}
                    </button>
                </div>
            </div>
        </>
    );
}

