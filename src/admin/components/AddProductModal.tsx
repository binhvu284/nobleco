import { useState, useEffect } from 'react';
import { IconX, IconMaximize, IconMinimize } from './icons';
import ImageUpload from '../../components/ImageUpload';
import { UploadedImage } from '../../utils/imageUpload';
import { deleteProductImage } from '../../utils/imageUpload';

interface Category {
    id: number;
    name: string;
    slug: string;
    color: string;
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
    categories: Category[];
}

interface AddProductModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: Product | null; // If provided, we're in edit mode
}

export default function AddProductModal({ open, onClose, onSuccess, product }: AddProductModalProps) {
    const isEditMode = !!product;
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        short_description: '',
        long_description: '',
        categories: [] as number[],
        price: '',
        stock: '0',
        status: 'active' as 'active' | 'inactive',
        // Jewelry specification fields
        supplier_id: '',
        type: '' as '' | 'L' | 'N' | 'K',
        center_stone_size_mm: '',
        ni_tay: '',
        shape: [] as string[], // Array to support multiple shapes
        dimensions: '',
        stone_count: '',
        carat_weight_ct: '',
        gold_purity: '' as '' | '18k' | '14k',
        product_weight_g: '',
        inventory_value: ''
    });
    
    // Product images (stored separately, uploaded immediately)
    const [productImages, setProductImages] = useState<UploadedImage[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);
    
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Character limit for short description
    const SHORT_DESC_LIMIT = 200;
    const MAX_IMAGES = 999; // No practical limit with pro plan storage
    
    // Temporary product ID for image uploads (created product ID or temporary ID)
    const [tempProductId, setTempProductId] = useState<number | null>(null);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch categories when modal opens
    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    // Load product data when editing
    useEffect(() => {
        if (open && product) {
            // Map product status to form status (only 'active' or 'inactive' allowed in form)
            const formStatus: 'active' | 'inactive' = 
                product.status === 'active' || product.status === 'inactive' 
                    ? product.status 
                    : 'active'; // Default 'draft' and 'archived' to 'active'
            
            setFormData({
                name: product.name || '',
                sku: product.sku || '',
                short_description: product.short_description || '',
                long_description: product.long_description || '',
                categories: product.categories ? product.categories.map(c => c.id) : [],
                price: product.price?.toString() || '',
                stock: product.stock?.toString() || '0',
                status: formStatus,
                // Jewelry specification fields
                supplier_id: (product as any).supplier_id || '',
                type: ((product as any).type === 'L' || (product as any).type === 'N' || (product as any).type === 'K') ? (product as any).type : '',
                center_stone_size_mm: (product as any).center_stone_size_mm?.toString() || '',
                ni_tay: (product as any).ni_tay?.toString() || '',
                shape: (product as any).shape ? (Array.isArray((product as any).shape) ? (product as any).shape : [(product as any).shape].filter(Boolean)) : [],
                dimensions: (product as any).dimensions || '',
                stone_count: (product as any).stone_count?.toString() || '',
                carat_weight_ct: (product as any).carat_weight_ct?.toString() || '',
                gold_purity: ((product as any).gold_purity === '18k' || (product as any).gold_purity === '14k') ? (product as any).gold_purity : '',
                product_weight_g: (product as any).product_weight_g?.toString() || '',
                inventory_value: (product as any).inventory_value?.toString() || ''
            });
            
            // Set product ID for image uploads
            setTempProductId(product.id);
            
            // Load existing images
            loadProductImages(product.id);
        } else if (open && !product) {
            // New product - reset images
            setProductImages([]);
            setTempProductId(null);
        }
    }, [open, product]);
    
    // Load product images
    const loadProductImages = async (productId: number) => {
        try {
            setLoadingImages(true);
            const response = await fetch(`/api/product-images?productId=${productId}`);
            if (response.ok) {
                const images = await response.json();
                setProductImages(images || []);
            }
        } catch (error) {
            console.error('Error loading product images:', error);
        } finally {
            setLoadingImages(false);
        }
    };

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            setFormData({
                name: '',
                sku: '',
                short_description: '',
                long_description: '',
                categories: [],
                price: '',
                stock: '0',
                status: 'active',
                supplier_id: '',
                type: '',
                center_stone_size_mm: '',
                ni_tay: '',
                shape: '',
                dimensions: '',
                stone_count: '',
                carat_weight_ct: '',
                gold_purity: '',
                product_weight_g: '',
                inventory_value: ''
            });
            setProductImages([]);
            setTempProductId(null);
            setErrors({});
            setIsFullscreen(false);
            setShowCategoryDropdown(false);
        }
    }, [open]);

    // Close category dropdown when clicking outside
    useEffect(() => {
        if (!showCategoryDropdown) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.category-selector')) {
                setShowCategoryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCategoryDropdown]);

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await fetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.filter((cat: any) => cat.status === 'active'));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleInputChange = (field: string, value: any) => {
        if (field === 'short_description' && value.length > SHORT_DESC_LIMIT) {
            return; // Don't allow exceeding limit
        }
        
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCategoryToggle = (categoryId: number, e?: React.MouseEvent | React.ChangeEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setFormData(prev => {
            const currentCategories = prev.categories || [];
            const newCategories = currentCategories.includes(categoryId)
                ? currentCategories.filter(id => id !== categoryId)
                : [...currentCategories, categoryId];
            return { ...prev, categories: newCategories };
        });
    };

    // Handle image upload success
    const handleImageUploadSuccess = (image: UploadedImage) => {
        setProductImages(prev => [...prev, image]);
        if (errors.images) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.images;
                return newErrors;
            });
        }
    };
    
    // Handle image upload error
    const handleImageUploadError = (error: Error) => {
        setErrors(prev => ({
            ...prev,
            images: error.message
        }));
    };
    
    // Handle image removal
    const handleImageRemove = async (imageId: number) => {
        const image = productImages.find(img => img.id === imageId);
        if (!image) return;
        
        try {
            await deleteProductImage(imageId, image.storage_path);
            setProductImages(prev => prev.filter(img => img.id !== imageId));
        } catch (error) {
            console.error('Error removing image:', error);
            setErrors(prev => ({
                ...prev,
                images: error instanceof Error ? error.message : 'Failed to remove image'
            }));
        }
    };
    
    // Handle images change (reordering, featured, etc.)
    const handleImagesChange = (images: UploadedImage[]) => {
        setProductImages(images);
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        
        if (!isEditMode) {
            // Validation for new products
            if (!formData.name.trim()) {
                newErrors.name = 'Product name is required';
            }
            
            if (!formData.price.trim()) {
                newErrors.price = 'Price is required';
            } else {
                const priceNum = parseFloat(formData.price);
                if (isNaN(priceNum) || priceNum < 0) {
                    newErrors.price = 'Price must be a valid positive number';
                }
            }
            
            if (formData.stock && formData.stock.trim()) {
                const stockNum = parseInt(formData.stock);
                if (isNaN(stockNum) || stockNum < 0) {
                    newErrors.stock = 'Stock must be a valid non-negative number';
                }
            }
            
            // Validate jewelry specification numeric fields
            if (formData.center_stone_size_mm && formData.center_stone_size_mm.trim()) {
                const value = parseFloat(formData.center_stone_size_mm);
                if (isNaN(value) || value < 0) {
                    newErrors.center_stone_size_mm = 'Center stone size must be a valid positive number';
                }
            }
            
            if (formData.ni_tay && formData.ni_tay.trim()) {
                const value = parseFloat(formData.ni_tay);
                if (isNaN(value) || value < 0) {
                    newErrors.ni_tay = 'Ni tay must be a valid positive number';
                }
            }
            
            if (formData.stone_count && formData.stone_count.trim()) {
                const value = parseInt(formData.stone_count);
                if (isNaN(value) || value < 0) {
                    newErrors.stone_count = 'Stone count must be a valid non-negative number';
                }
            }
            
            if (formData.carat_weight_ct && formData.carat_weight_ct.trim()) {
                const value = parseFloat(formData.carat_weight_ct);
                if (isNaN(value) || value < 0) {
                    newErrors.carat_weight_ct = 'Carat weight must be a valid positive number';
                }
            }
            
            if (formData.product_weight_g && formData.product_weight_g.trim()) {
                const value = parseFloat(formData.product_weight_g);
                if (isNaN(value) || value < 0) {
                    newErrors.product_weight_g = 'Product weight must be a valid positive number';
                }
            }
            
            if (formData.inventory_value && formData.inventory_value.trim()) {
                const value = parseFloat(formData.inventory_value);
                if (isNaN(value) || value < 0) {
                    newErrors.inventory_value = 'Inventory value must be a valid positive number';
                }
            }
        } else {
            // Validation for edit mode - validate numeric fields
            if (formData.price && formData.price.trim()) {
                const priceNum = parseFloat(formData.price);
                if (isNaN(priceNum) || priceNum < 0) {
                    newErrors.price = 'Price must be a valid positive number';
                }
            }
            
            if (formData.stock && formData.stock.trim()) {
                const stockNum = parseInt(formData.stock);
                if (isNaN(stockNum) || stockNum < 0) {
                    newErrors.stock = 'Stock must be a valid non-negative number';
                }
            }
            
            // Validate jewelry specification numeric fields
            if (formData.center_stone_size_mm && formData.center_stone_size_mm.trim()) {
                const value = parseFloat(formData.center_stone_size_mm);
                if (isNaN(value) || value < 0) {
                    newErrors.center_stone_size_mm = 'Center stone size must be a valid positive number';
                }
            }
            
            if (formData.ni_tay && formData.ni_tay.trim()) {
                const value = parseFloat(formData.ni_tay);
                if (isNaN(value) || value < 0) {
                    newErrors.ni_tay = 'Ni tay must be a valid positive number';
                }
            }
            
            if (formData.stone_count && formData.stone_count.trim()) {
                const value = parseInt(formData.stone_count);
                if (isNaN(value) || value < 0) {
                    newErrors.stone_count = 'Stone count must be a valid non-negative number';
                }
            }
            
            if (formData.carat_weight_ct && formData.carat_weight_ct.trim()) {
                const value = parseFloat(formData.carat_weight_ct);
                if (isNaN(value) || value < 0) {
                    newErrors.carat_weight_ct = 'Carat weight must be a valid positive number';
                }
            }
            
            if (formData.product_weight_g && formData.product_weight_g.trim()) {
                const value = parseFloat(formData.product_weight_g);
                if (isNaN(value) || value < 0) {
                    newErrors.product_weight_g = 'Product weight must be a valid positive number';
                }
            }
            
            if (formData.inventory_value && formData.inventory_value.trim()) {
                const value = parseFloat(formData.inventory_value);
                if (isNaN(value) || value < 0) {
                    newErrors.inventory_value = 'Inventory value must be a valid positive number';
                }
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // For new products, we need to create the product first, then upload images
        // But images are uploaded immediately, so we need to handle this differently
        // For now, we'll create/update the product normally
        // Images uploaded via ImageUpload component are already saved
        
        setSubmitting(true);
        
        try {
            let response;
            let createdProduct;
            
            if (isEditMode && product) {
                // Update existing product - include all fields
                const productData: any = {
                    name: formData.name.trim(),
                    sku: formData.sku.trim() || null,
                    short_description: formData.short_description.trim() || '',
                    long_description: formData.long_description.trim() || null,
                    price: formData.price ? parseFloat(formData.price) : 0,
                    stock: formData.stock ? parseInt(formData.stock) : 0,
                    // Jewelry specification fields
                    supplier_id: formData.supplier_id.trim() || null,
                    type: formData.type || null,
                    center_stone_size_mm: formData.center_stone_size_mm ? parseFloat(formData.center_stone_size_mm) : null,
                    ni_tay: formData.ni_tay ? parseFloat(formData.ni_tay) : null,
                    shape: formData.shape.length > 0 ? (formData.shape.length === 1 ? formData.shape[0] : formData.shape.join(', ')) : null,
                    dimensions: formData.dimensions.trim() || null,
                    stone_count: formData.stone_count ? parseInt(formData.stone_count) : null,
                    carat_weight_ct: formData.carat_weight_ct ? parseFloat(formData.carat_weight_ct) : null,
                    gold_purity: formData.gold_purity || null,
                    product_weight_g: formData.product_weight_g ? parseFloat(formData.product_weight_g) : null,
                    inventory_value: formData.inventory_value ? parseFloat(formData.inventory_value) : null
                };
                
                const requestBody: any = {
                    id: product.id,
                    product: productData
                };
                
                // Include categories if they exist
                if (formData.categories.length > 0) {
                    requestBody.categoryIds = formData.categories;
                }
                
                response = await fetch('/api/products', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
            } else {
                // Create new product - include all fields
                const productData: any = {
                    name: formData.name.trim(),
                    sku: formData.sku.trim() || null,
                    short_description: formData.short_description.trim() || '',
                    long_description: formData.long_description.trim() || null,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock) || 0,
                    status: formData.status,
                    // Jewelry specification fields
                    supplier_id: formData.supplier_id.trim() || null,
                    type: formData.type || null,
                    center_stone_size_mm: formData.center_stone_size_mm ? parseFloat(formData.center_stone_size_mm) : null,
                    ni_tay: formData.ni_tay ? parseFloat(formData.ni_tay) : null,
                    shape: formData.shape.length > 0 ? (formData.shape.length === 1 ? formData.shape[0] : formData.shape.join(', ')) : null,
                    dimensions: formData.dimensions.trim() || null,
                    stone_count: formData.stone_count ? parseInt(formData.stone_count) : null,
                    carat_weight_ct: formData.carat_weight_ct ? parseFloat(formData.carat_weight_ct) : null,
                    gold_purity: formData.gold_purity || null,
                    product_weight_g: formData.product_weight_g ? parseFloat(formData.product_weight_g) : null,
                    inventory_value: formData.inventory_value ? parseFloat(formData.inventory_value) : null,
                    category_ids: formData.categories.length > 0 ? formData.categories : []
                };
                
                response = await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                });
                
                if (response.ok) {
                    createdProduct = await response.json();
                    // Set the product ID for image uploads
                    setTempProductId(createdProduct.id);
                    // Reload images if any were uploaded before product creation
                    // (they would have failed, so this is just for consistency)
                }
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ 
                    error: isEditMode ? 'Failed to update product' : 'Failed to create product' 
                }));
                throw new Error(errorData.error || (isEditMode ? 'Failed to update product' : 'Failed to create product'));
            }
            
            // For new products, don't close immediately - allow user to upload images
            if (isEditMode) {
                // Success - close modal for edits
                onSuccess();
                onClose();
            } else {
                // For new products, show success message but keep modal open for image uploads
                // User can close manually or we can add a "Done" button
                onSuccess(); // Refresh product list
                // Keep modal open so user can upload images
                // They can close manually or we add auto-close after delay
                setTimeout(() => {
                    onClose();
                }, 2000); // Auto-close after 2 seconds, or remove this to keep it open
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error);
            setErrors({
                submit: error instanceof Error ? error.message : (isEditMode ? 'Failed to update product. Please try again.' : 'Failed to create product. Please try again.')
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    const selectedCategoryNames = categories
        .filter(cat => formData.categories.includes(cat.id))
        .map(cat => cat.name);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className={`add-product-modal ${isFullscreen ? 'fullscreen' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="add-product-modal-header">
                    <h2>{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
                    <div className="add-product-modal-actions">
                        {!isMobile && (
                            <button 
                                className="add-product-modal-expand"
                                onClick={toggleFullscreen}
                                title={isFullscreen ? 'Shrink' : 'Expand'}
                            >
                                {isFullscreen ? <IconMinimize /> : <IconMaximize />}
                            </button>
                        )}
                        <button 
                            className="add-product-modal-close"
                            onClick={onClose}
                            title="Close"
                        >
                            <IconX />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="add-product-form">
                    <div className="add-product-form-body">
                        {/* First Section */}
                        <div className="form-section">
                            <h3 className="form-section-title">Product Information</h3>
                            
                            {/* Product Name */}
                            <div className="form-group">
                                <label htmlFor="product-name">
                                    Name <span className="required">*</span>
                                </label>
                                <input
                                    id="product-name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter product name"
                                    className={errors.name ? 'error' : ''}
                                />
                                {errors.name && <span className="error-message">{errors.name}</span>}
                            </div>

                            {/* Product ID (SKU) */}
                            <div className="form-group">
                                <label htmlFor="product-sku">Product ID (SKU)</label>
                                <input
                                    id="product-sku"
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => handleInputChange('sku', e.target.value)}
                                    placeholder="Enter SKU"
                                />
                            </div>

                            {/* Short Description */}
                            <div className="form-group">
                                <label htmlFor="short-description">
                                    Short Description
                                    <span className="char-count" style={{ 
                                        float: 'right', 
                                        fontWeight: 'normal', 
                                        color: formData.short_description.length > SHORT_DESC_LIMIT ? '#ef4444' : '#6b7280',
                                        fontSize: '0.875rem'
                                    }}>
                                        {formData.short_description.length}/{SHORT_DESC_LIMIT}
                                    </span>
                                </label>
                                <textarea
                                    id="short-description"
                                    value={formData.short_description}
                                    onChange={(e) => {
                                        if (e.target.value.length <= SHORT_DESC_LIMIT) {
                                            handleInputChange('short_description', e.target.value);
                                        }
                                    }}
                                    placeholder="Enter short description (max 200 characters)"
                                    rows={3}
                                    maxLength={SHORT_DESC_LIMIT}
                                    className={errors.short_description ? 'error' : ''}
                                />
                                {errors.short_description && <span className="error-message">{errors.short_description}</span>}
                            </div>

                            {/* Product Images */}
                            <div className="form-group">
                                {(tempProductId || isEditMode) ? (
                                    <ImageUpload
                                        productId={tempProductId || (product?.id ?? 0)}
                                        maxImages={MAX_IMAGES}
                                        existingImages={productImages}
                                        onUploadSuccess={handleImageUploadSuccess}
                                        onUploadError={handleImageUploadError}
                                        onRemove={handleImageRemove}
                                        onImagesChange={handleImagesChange}
                                        disabled={submitting || loadingImages}
                                    />
                                ) : (
                                    <div className="image-upload-placeholder">
                                        <label>
                                            Product Images
                                            <span className="image-count">(0/{MAX_IMAGES})</span>
                                        </label>
                                        <p className="image-upload-hint">
                                            Create the product first, then you can upload images.
                                        </p>
                                    </div>
                                )}
                                {errors.images && (
                                    <span className="error-message">{errors.images}</span>
                                )}
                            </div>

                            {/* Categories */}
                            <div className="form-group">
                                <label htmlFor="categories">Category</label>
                                <div className="category-selector">
                                    <button
                                        type="button"
                                        className={`category-dropdown-toggle ${showCategoryDropdown ? 'active' : ''}`}
                                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    >
                                        <span>
                                            {selectedCategoryNames.length > 0
                                                ? `${selectedCategoryNames.length} categor${selectedCategoryNames.length === 1 ? 'y' : 'ies'} selected`
                                                : 'Select categories (optional)'}
                                        </span>
                                        <span className="dropdown-arrow">▼</span>
                                    </button>
                                    {showCategoryDropdown && (
                                        <div className="category-dropdown-menu">
                                            {loadingCategories ? (
                                                <div className="dropdown-loading">Loading categories...</div>
                                            ) : categories.length === 0 ? (
                                                <div className="dropdown-empty">No categories available</div>
                                            ) : (
                                                categories.map(category => {
                                                    const isSelected = formData.categories.includes(category.id);
                                                    return (
                                                        <label
                                                            key={category.id}
                                                            className={`category-dropdown-item ${isSelected ? 'selected' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCategoryToggle(category.id, e);
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
                                {selectedCategoryNames.length > 0 && (
                                    <div className="selected-categories">
                                        {selectedCategoryNames.map((name, idx) => {
                                            const cat = categories.find(c => c.name === name);
                                            return (
                                                <span key={idx} className="selected-category-tag">
                                                    <span 
                                                        className="category-color-dot"
                                                        style={{ backgroundColor: cat?.color || '#ccc' }}
                                                    />
                                                    {name}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCategoryToggle(cat?.id || 0, e);
                                                        }}
                                                        className="remove-category"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Jewelry Specification Section */}
                        <div className="form-section">
                            <h3 className="form-section-title">Jewelry Specification</h3>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="supplier-id">Supplier ID</label>
                                    <input
                                        id="supplier-id"
                                        type="text"
                                        value={formData.supplier_id}
                                        onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                                        placeholder="Enter supplier ID"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="product-type">Type</label>
                                    <select
                                        id="product-type"
                                        value={formData.type}
                                        onChange={(e) => handleInputChange('type', e.target.value as '' | 'L' | 'N' | 'K')}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            backgroundColor: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="L">L - Lab Grown Diamond</option>
                                        <option value="N">N - Natural Diamond</option>
                                        <option value="K">K - Others</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="center-stone-size">Center Stone Size (mm)</label>
                                    <input
                                        id="center-stone-size"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.center_stone_size_mm}
                                        onChange={(e) => handleInputChange('center_stone_size_mm', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="ni-tay">Ni tay</label>
                                    <input
                                        id="ni-tay"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.ni_tay}
                                        onChange={(e) => handleInputChange('ni_tay', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="shape">Shape</label>
                                    <div className="shape-checkbox-group">
                                        <label className="shape-checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={formData.shape.includes('Round')}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        handleInputChange('shape', [...formData.shape, 'Round']);
                                                    } else {
                                                        handleInputChange('shape', formData.shape.filter(s => s !== 'Round'));
                                                    }
                                                }}
                                            />
                                            <span>Round</span>
                                        </label>
                                        <label className="shape-checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={formData.shape.includes('Baguette')}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        handleInputChange('shape', [...formData.shape, 'Baguette']);
                                                    } else {
                                                        handleInputChange('shape', formData.shape.filter(s => s !== 'Baguette'));
                                                    }
                                                }}
                                            />
                                            <span>Baguette</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="dimensions">Dimensions</label>
                                <input
                                    id="dimensions"
                                    type="text"
                                    value={formData.dimensions}
                                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                                    placeholder="Enter dimensions"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="stone-count">Stone Count</label>
                                    <input
                                        id="stone-count"
                                        type="number"
                                        min="0"
                                        value={formData.stone_count}
                                        onChange={(e) => handleInputChange('stone_count', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="carat-weight">Carat Weight (ct)</label>
                                    <input
                                        id="carat-weight"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.carat_weight_ct}
                                        onChange={(e) => handleInputChange('carat_weight_ct', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="gold-purity">Gold Purity</label>
                                    <select
                                        id="gold-purity"
                                        value={formData.gold_purity}
                                        onChange={(e) => handleInputChange('gold_purity', e.target.value as '' | '18k' | '14k')}
                                    >
                                        <option value="">Select gold purity</option>
                                        <option value="18k">18k</option>
                                        <option value="14k">14k</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="product-weight">Product Weight (g)</label>
                                    <input
                                        id="product-weight"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.product_weight_g}
                                        onChange={(e) => handleInputChange('product_weight_g', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="price">
                                        Price (VND) <span className="required">*</span>
                                    </label>
                                    <input
                                        id="price"
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => handleInputChange('price', e.target.value)}
                                        placeholder="0"
                                        className={errors.price ? 'error' : ''}
                                    />
                                    {errors.price && <span className="error-message">{errors.price}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="stock">Stock</label>
                                    <input
                                        id="stock"
                                        type="number"
                                        min="0"
                                        value={formData.stock}
                                        onChange={(e) => handleInputChange('stock', e.target.value)}
                                        placeholder="0"
                                        className={errors.stock ? 'error' : ''}
                                    />
                                    {errors.stock && <span className="error-message">{errors.stock}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="inventory-value">Inventory Value (VND)</label>
                                <input
                                    id="inventory-value"
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={formData.inventory_value}
                                    onChange={(e) => handleInputChange('inventory_value', e.target.value)}
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.long_description}
                                    onChange={(e) => handleInputChange('long_description', e.target.value)}
                                    placeholder="Enter product description"
                                    rows={6}
                                />
                            </div>
                        </div>

                        {/* Status - Only shown in create mode */}
                        {!isEditMode && (
                            <div className="form-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        )}

                        {errors.submit && (
                            <div className="form-error">
                                {errors.submit}
                            </div>
                        )}
                    </div>

                    <div className="add-product-form-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={submitting}
                        >
                            {submitting 
                                ? (isEditMode ? 'Saving...' : 'Creating...') 
                                : (isEditMode ? 'Save Product' : 'Create Product')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

