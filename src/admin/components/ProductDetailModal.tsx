import { useState, useEffect } from 'react';
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
    serial_number?: string | null;
    supplier_id?: string | null;
    center_stone_size_mm?: number | null;
    shape?: string | null;
    dimensions?: string | null;
    stone_count?: number | null;
    carat_weight_ct?: number | null;
    gold_purity?: string | null;
    product_weight_g?: number | null;
    inventory_value?: number | null;
    last_synced_at?: string | null;
    sync_status?: string | null;
}

interface ProductDetailModalProps {
    open: boolean;
    onClose: () => void;
    product: Product | null;
    onEdit?: (product: Product) => void;
}

export default function ProductDetailModal({ open, onClose, product, onEdit }: ProductDetailModalProps) {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);

    // Load product images when modal opens
    useEffect(() => {
        if (open && product) {
            loadProductImages(product.id);
        } else {
            setImages([]);
        }
    }, [open, product]);

    const loadProductImages = async (productId: number) => {
        try {
            setLoadingImages(true);
            const response = await fetch(`/api/product-images?productId=${productId}`);
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
    };

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

                        {/* Product Specifications */}
                        {(product.kiotviet_id || product.serial_number != null || product.supplier_id != null || 
                          product.inventory_value != null) && (
                            <div className="product-section">
                                <label className="section-label">Product Specifications</label>
                                <div className="kiotviet-fields-grid">
                                    {product.kiotviet_id && (
                                        <div className="kiotviet-field">
                                            <label>3RD PARTY ID</label>
                                            <span>{product.kiotviet_id}</span>
                                        </div>
                                    )}
                                    <div className="kiotviet-field">
                                        <label>Serial Number</label>
                                        <span>{product.serial_number ?? 'null'}</span>
                                    </div>
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
                        )}

                        {/* Jewelry Specifications */}
                        {(product.center_stone_size_mm != null || product.shape != null || 
                          product.dimensions != null || product.stone_count != null || 
                          product.carat_weight_ct != null || product.gold_purity != null || 
                          product.product_weight_g != null) && (
                            <div className="product-section">
                                <label className="section-label">Jewelry Specifications</label>
                                <div className="kiotviet-fields-grid">
                                    <div className="kiotviet-field">
                                        <label>Center Stone Size (mm)</label>
                                        <span>{product.center_stone_size_mm != null ? `${product.center_stone_size_mm} mm` : 'null'}</span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Shape</label>
                                        <span>{product.shape ?? 'null'}</span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Dimensions</label>
                                        <span>{product.dimensions ?? 'null'}</span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Stone Count</label>
                                        <span>{product.stone_count != null ? product.stone_count : 'null'}</span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Carat Weight (ct)</label>
                                        <span>{product.carat_weight_ct != null ? `${product.carat_weight_ct} ct` : 'null'}</span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Gold Purity</label>
                                        <span>{product.gold_purity ?? 'null'}</span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Product Weight (g)</label>
                                        <span>{product.product_weight_g != null ? `${product.product_weight_g} g` : 'null'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

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
                        Edit Product
                    </button>
                </div>
            </div>
        </>
    );
}

