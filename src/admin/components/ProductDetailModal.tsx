import { useState, useEffect, useCallback } from 'react';
import { IconX } from '../components/icons';
import ImageGallery from '../../components/ImageGallery';
import { UploadedImage } from '../../utils/imageUpload';
import { useTranslation } from '../../shared/contexts/TranslationContext';

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
    const { t } = useTranslation();
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

                        {/* Specifications */}
                        <div className="product-section">
                            <label className="section-label">
                                {productType === 'jewelry' ? t('products.jewelrySpecifications') : t('products.centerStoneSpecifications')}
                            </label>
                            {productType === 'jewelry' ? (
                                <div className="kiotviet-fields-grid">
                                    <div className="kiotviet-field">
                                        <label>Material / Purity</label>
                                        <span style={product.material_purity ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.material_purity ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Material Weight (g)</label>
                                        <span style={product.material_weight_g != null ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.material_weight_g != null ? product.material_weight_g.toFixed(3) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Total Weight (g)</label>
                                        <span style={product.total_weight_g != null ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.total_weight_g != null ? product.total_weight_g.toFixed(3) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Size</label>
                                        <span style={product.size_text ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.size_text ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Jewelry Size</label>
                                        <span style={product.jewelry_size ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.jewelry_size ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Style (BST)</label>
                                        <span style={product.style_bst ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.style_bst ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Sub Style</label>
                                        <span style={product.sub_style ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.sub_style ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Main Stone Type</label>
                                        <span style={product.main_stone_type ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.main_stone_type ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Stone Quantity</label>
                                        <span style={product.stone_quantity != null ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.stone_quantity != null ? product.stone_quantity : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Shape and Polished</label>
                                        <span style={product.shape_and_polished ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.shape_and_polished ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Origin</label>
                                        <span style={product.origin ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.origin ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Item Serial</label>
                                        <span style={product.item_serial ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.item_serial ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Country of Origin</label>
                                        <span style={product.country_of_origin ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.country_of_origin ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Certification Number</label>
                                        <span style={product.certification_number ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.certification_number ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Size (mm)</label>
                                        <span style={product.size_mm != null ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.size_mm != null ? product.size_mm.toFixed(2) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Color</label>
                                        <span style={product.color ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.color ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Clarity</label>
                                        <span style={product.clarity ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.clarity ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Weight (CT)</label>
                                        <span style={product.weight_ct != null ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.weight_ct != null ? product.weight_ct.toFixed(2) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>PCS</label>
                                        <span style={product.pcs != null ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.pcs != null ? product.pcs : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Cut Grade</label>
                                        <span style={product.cut_grade ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.cut_grade ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Treatment</label>
                                        <span style={product.treatment ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.treatment ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Sub Stone Type 1</label>
                                        <span style={product.sub_stone_type_1 ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.sub_stone_type_1 ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Sub Stone Type 2</label>
                                        <span style={product.sub_stone_type_2 ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.sub_stone_type_2 ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Sub Stone Type 3</label>
                                        <span style={product.sub_stone_type_3 ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.sub_stone_type_3 ?? 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="kiotviet-fields-grid">
                                    <div className="kiotviet-field">
                                        <label>Shape and Polished</label>
                                        <span style={product.shape_and_polished ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.shape_and_polished ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Origin</label>
                                        <span style={product.origin ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.origin ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Item Serial</label>
                                        <span style={product.item_serial ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.item_serial ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Country of Origin</label>
                                        <span style={product.country_of_origin ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.country_of_origin ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Certification Number</label>
                                        <span style={product.certification_number ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.certification_number ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Size (mm)</label>
                                        <span style={product.size_mm != null ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.size_mm != null ? product.size_mm.toFixed(2) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Color</label>
                                        <span style={product.color ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.color ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Clarity</label>
                                        <span style={product.clarity ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.clarity ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Weight (CT)</label>
                                        <span style={product.weight_ct != null ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.weight_ct != null ? product.weight_ct.toFixed(2) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>PCS</label>
                                        <span style={product.pcs != null ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.pcs != null ? product.pcs : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Cut Grade</label>
                                        <span style={product.cut_grade ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.cut_grade ?? 'N/A'}
                                        </span>
                                    </div>
                                    <div className="kiotviet-field">
                                        <label>Treatment</label>
                                        <span style={product.treatment ? {} : { color: '#9ca3af', fontStyle: 'italic' }}>
                                            {product.treatment ?? 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            )}
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
                        {productType === 'jewelry' ? t('products.editJewelry') : t('products.editCenterStone')}
                    </button>
                </div>
            </div>
        </>
    );
}

