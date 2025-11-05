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
        short_description: '',
        long_description: '',
        categories: [] as number[],
        price: '',
        cost_price: '',
        stock: '0',
        status: 'active' as 'active' | 'inactive'
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
                short_description: product.short_description || '',
                long_description: product.long_description || '',
                categories: product.categories ? product.categories.map(c => c.id) : [],
                price: product.price?.toString() || '',
                cost_price: product.cost_price?.toString() || '',
                stock: product.stock?.toString() || '0',
                status: formStatus
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
                short_description: '',
                long_description: '',
                categories: [],
                price: '',
                cost_price: '',
                stock: '0',
                status: 'active'
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
            
            if (formData.cost_price && formData.cost_price.trim()) {
                const costPriceNum = parseFloat(formData.cost_price);
                if (isNaN(costPriceNum) || costPriceNum < 0) {
                    newErrors.cost_price = 'Cost price must be a valid positive number';
                }
            }
            
            if (formData.stock && formData.stock.trim()) {
                const stockNum = parseInt(formData.stock);
                if (isNaN(stockNum) || stockNum < 0) {
                    newErrors.stock = 'Stock must be a valid non-negative number';
                }
            }
        } else {
            // Validation for edit mode - only validate descriptions (name is read-only)
            // No additional validation needed for edit mode
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
                // Update existing product - only send editable fields (descriptions, images are handled separately)
                const productData = {
                    name: formData.name.trim(), // Include name but API should ignore changes
                    short_description: formData.short_description.trim() || '',
                    long_description: formData.long_description.trim() || null
                    // Don't send price, stock, status, categories - those are synced from KiotViet
                };
                
                response = await fetch('/api/products', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: product.id,
                        product: productData,
                        categoryIds: [] // Don't update categories in edit mode
                    })
                });
            } else {
                // Create new product - include all fields
                const productData = {
                    name: formData.name.trim(),
                    short_description: formData.short_description.trim() || '',
                    long_description: formData.long_description.trim() || null,
                    price: parseFloat(formData.price),
                    cost_price: formData.cost_price && formData.cost_price.trim() 
                        ? parseFloat(formData.cost_price) 
                        : null,
                    stock: parseInt(formData.stock) || 0,
                    status: formData.status,
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
                    <h2>{isEditMode ? 'Edit Product Images & Description' : 'Add New Product'}</h2>
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
                        {/* Product Name */}
                        <div className="form-group">
                            {isEditMode ? (
                                <>
                                    <label htmlFor="product-name">Product Name</label>
                                    <div className="product-name-display">
                                        {formData.name || 'N/A'}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <label htmlFor="product-name">
                                        Product Name <span className="required">*</span>
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
                                </>
                            )}
                        </div>

                        {/* Short Description */}
                        <div className="form-group">
                            <label htmlFor="short-description">
                                Short Description
                                <span className="char-count">
                                    {formData.short_description.length}/{SHORT_DESC_LIMIT}
                                </span>
                            </label>
                            <textarea
                                id="short-description"
                                value={formData.short_description}
                                onChange={(e) => handleInputChange('short_description', e.target.value)}
                                placeholder="Brief description of the product"
                                rows={3}
                                maxLength={SHORT_DESC_LIMIT}
                            />
                        </div>

                        {/* Long Description */}
                        <div className="form-group">
                            <label htmlFor="long-description">Long Description</label>
                            <textarea
                                id="long-description"
                                value={formData.long_description}
                                onChange={(e) => handleInputChange('long_description', e.target.value)}
                                placeholder="Detailed description including size, material, color, etc."
                                rows={6}
                            />
                        </div>

                        {/* Categories - Hidden in edit mode */}
                        {!isEditMode && (
                            <div className="form-group">
                                <label htmlFor="categories">Categories</label>
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
                        )}

                        {/* Image Upload */}
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

                        {/* Price and Cost Price Row - Hidden in edit mode */}
                        {!isEditMode && (
                            <>
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
                                        <label htmlFor="cost-price">Cost Price (VND)</label>
                                        <input
                                            id="cost-price"
                                            type="number"
                                            step="1"
                                            min="0"
                                            value={formData.cost_price}
                                            onChange={(e) => handleInputChange('cost_price', e.target.value)}
                                            placeholder="0"
                                            className={errors.cost_price ? 'error' : ''}
                                        />
                                        {errors.cost_price && <span className="error-message">{errors.cost_price}</span>}
                                    </div>
                                </div>

                                {/* Stock and Status Row */}
                                <div className="form-row">
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
                                </div>
                            </>
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

