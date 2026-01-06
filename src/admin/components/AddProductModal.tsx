import { useState, useEffect } from 'react';
import { IconX, IconMaximize, IconMinimize } from './icons';
import ImageUpload from '../../components/ImageUpload';
import { UploadedImage } from '../../utils/imageUpload';
import { deleteProductImage } from '../../utils/imageUpload';
import { useTranslation } from '../../shared/contexts/TranslationContext';

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
    // Jewelry specification fields
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
}

interface AddProductModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: Product | null; // If provided, we're in edit mode
    productType?: 'jewelry' | 'centerstone'; // Product type: jewelry or centerstone
}

export default function AddProductModal({ open, onClose, onSuccess, product, productType = 'jewelry' }: AddProductModalProps) {
    const { t } = useTranslation();
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
        // Legacy jewelry specification fields
        supplier_id: '',
        jewelry_specifications: '',
        inventory_value: '',
        // New jewelry/centerstone specification fields
        material_purity: '',
        material_weight_g: '',
        total_weight_g: '',
        size_text: '',
        jewelry_size: '',
        style_bst: '',
        sub_style: '',
        main_stone_type: '',
        stone_quantity: '',
        shape_and_polished: '',
        origin: '',
        item_serial: '',
        country_of_origin: '',
        certification_number: '',
        size_mm: '',
        color: '',
        clarity: '',
        weight_ct: '',
        pcs: '',
        cut_grade: '',
        treatment: '',
        sub_stone_type_1: '',
        sub_stone_type_2: '',
        sub_stone_type_3: ''
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
                // Legacy jewelry specification fields
                supplier_id: (product as any).supplier_id || '',
                jewelry_specifications: (product as any).jewelry_specifications || '',
                inventory_value: (product as any).inventory_value?.toString() || '',
                // New jewelry/centerstone specification fields
                material_purity: (product as any).material_purity || '',
                material_weight_g: (product as any).material_weight_g?.toString() || '',
                total_weight_g: (product as any).total_weight_g?.toString() || '',
                size_text: (product as any).size_text || '',
                jewelry_size: (product as any).jewelry_size || '',
                style_bst: (product as any).style_bst || '',
                sub_style: (product as any).sub_style || '',
                main_stone_type: (product as any).main_stone_type || '',
                stone_quantity: (product as any).stone_quantity?.toString() || '',
                shape_and_polished: (product as any).shape_and_polished || '',
                origin: (product as any).origin || '',
                item_serial: (product as any).item_serial || '',
                country_of_origin: (product as any).country_of_origin || '',
                certification_number: (product as any).certification_number || '',
                size_mm: (product as any).size_mm?.toString() || '',
                color: (product as any).color || '',
                clarity: (product as any).clarity || '',
                weight_ct: (product as any).weight_ct?.toString() || '',
                pcs: (product as any).pcs?.toString() || '',
                cut_grade: (product as any).cut_grade || '',
                treatment: (product as any).treatment || '',
                sub_stone_type_1: (product as any).sub_stone_type_1 || '',
                sub_stone_type_2: (product as any).sub_stone_type_2 || '',
                sub_stone_type_3: (product as any).sub_stone_type_3 || ''
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
            const endpoint = productType === 'jewelry' ? '/api/product-images' : '/api/centerstone-images';
            const response = await fetch(`${endpoint}?${productType === 'jewelry' ? 'productId' : 'centerstoneId'}=${productId}`);
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
                jewelry_specifications: '',
                inventory_value: '',
                material_purity: '',
                material_weight_g: '',
                total_weight_g: '',
                size_text: '',
                jewelry_size: '',
                style_bst: '',
                sub_style: '',
                main_stone_type: '',
                stone_quantity: '',
                shape_and_polished: '',
                origin: '',
                item_serial: '',
                country_of_origin: '',
                certification_number: '',
                size_mm: '',
                color: '',
                clarity: '',
                weight_ct: '',
                pcs: '',
                cut_grade: '',
                treatment: '',
                sub_stone_type_1: '',
                sub_stone_type_2: '',
                sub_stone_type_3: ''
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
            const endpoint = productType === 'jewelry' ? '/api/categories' : '/api/centerstone-categories';
            const response = await fetch(endpoint);
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
            await deleteProductImage(imageId, image.storage_path, productType);
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
            // Name is optional for both jewelry and centerstone (will default to SKU if empty)
            
            // SKU is required for both product types
            if (!formData.sku.trim()) {
                newErrors.sku = 'Product Code (SKU) is required';
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
            
            // Validate inventory value
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
            
            // Validate inventory value
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
                    name: formData.name.trim() || null, // Name can be null (will use SKU)
                    sku: formData.sku.trim() || null,
                    short_description: formData.short_description.trim() || '',
                    long_description: formData.long_description.trim() || null,
                    price: formData.price ? parseFloat(formData.price) : 0,
                    stock: formData.stock ? parseInt(formData.stock) : 0,
                    // Legacy jewelry specification fields
                    supplier_id: formData.supplier_id.trim() || null,
                    jewelry_specifications: formData.jewelry_specifications.trim() || null,
                    inventory_value: formData.inventory_value ? parseFloat(formData.inventory_value) : null
                };
                
                // Add specification fields for both jewelry and centerstone
                productData.material_purity = formData.material_purity.trim() || null;
                productData.material_weight_g = formData.material_weight_g ? parseFloat(formData.material_weight_g) : null;
                productData.total_weight_g = formData.total_weight_g ? parseFloat(formData.total_weight_g) : null;
                productData.size_text = formData.size_text.trim() || null;
                productData.jewelry_size = formData.jewelry_size.trim() || null;
                productData.style_bst = formData.style_bst.trim() || null;
                productData.sub_style = formData.sub_style.trim() || null;
                productData.main_stone_type = formData.main_stone_type.trim() || null;
                productData.stone_quantity = formData.stone_quantity ? parseInt(formData.stone_quantity) : null;
                productData.shape_and_polished = formData.shape_and_polished.trim() || null;
                productData.origin = formData.origin.trim() || null;
                productData.item_serial = formData.item_serial.trim() || null;
                productData.country_of_origin = formData.country_of_origin.trim() || null;
                productData.certification_number = formData.certification_number.trim() || null;
                productData.size_mm = formData.size_mm ? parseFloat(formData.size_mm) : null;
                productData.color = formData.color.trim() || null;
                productData.clarity = formData.clarity.trim() || null;
                productData.weight_ct = formData.weight_ct ? parseFloat(formData.weight_ct) : null;
                productData.pcs = formData.pcs ? parseInt(formData.pcs) : null;
                productData.cut_grade = formData.cut_grade.trim() || null;
                productData.treatment = formData.treatment.trim() || null;
                productData.sub_stone_type_1 = formData.sub_stone_type_1.trim() || null;
                productData.sub_stone_type_2 = formData.sub_stone_type_2.trim() || null;
                productData.sub_stone_type_3 = formData.sub_stone_type_3.trim() || null;
                
                const requestBody: any = {
                    id: product.id,
                    product: productData
                };
                
                // Include categories if they exist
                if (formData.categories.length > 0) {
                    requestBody.categoryIds = formData.categories;
                }
                
                const endpoint = productType === 'jewelry' ? '/api/products' : '/api/centerstones';
                response = await fetch(endpoint, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
            } else {
                // Create new product - include all fields
                const productData: any = {
                    name: formData.name.trim() || null, // Name can be null (will use SKU)
                    sku: formData.sku.trim() || null,
                    short_description: formData.short_description.trim() || '',
                    long_description: formData.long_description.trim() || null,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock) || 0,
                    status: formData.status,
                    // Legacy jewelry specification fields
                    supplier_id: formData.supplier_id.trim() || null,
                    jewelry_specifications: formData.jewelry_specifications.trim() || null,
                    inventory_value: formData.inventory_value ? parseFloat(formData.inventory_value) : null,
                    category_ids: formData.categories.length > 0 ? formData.categories : [],
                    // New specification fields for both jewelry and centerstone
                    material_purity: formData.material_purity.trim() || null,
                    material_weight_g: formData.material_weight_g ? parseFloat(formData.material_weight_g) : null,
                    total_weight_g: formData.total_weight_g ? parseFloat(formData.total_weight_g) : null,
                    size_text: formData.size_text.trim() || null,
                    jewelry_size: formData.jewelry_size.trim() || null,
                    style_bst: formData.style_bst.trim() || null,
                    sub_style: formData.sub_style.trim() || null,
                    main_stone_type: formData.main_stone_type.trim() || null,
                    stone_quantity: formData.stone_quantity ? parseInt(formData.stone_quantity) : null,
                    shape_and_polished: formData.shape_and_polished.trim() || null,
                    origin: formData.origin.trim() || null,
                    item_serial: formData.item_serial.trim() || null,
                    country_of_origin: formData.country_of_origin.trim() || null,
                    certification_number: formData.certification_number.trim() || null,
                    size_mm: formData.size_mm ? parseFloat(formData.size_mm) : null,
                    color: formData.color.trim() || null,
                    clarity: formData.clarity.trim() || null,
                    weight_ct: formData.weight_ct ? parseFloat(formData.weight_ct) : null,
                    pcs: formData.pcs ? parseInt(formData.pcs) : null,
                    cut_grade: formData.cut_grade.trim() || null,
                    treatment: formData.treatment.trim() || null,
                    sub_stone_type_1: formData.sub_stone_type_1.trim() || null,
                    sub_stone_type_2: formData.sub_stone_type_2.trim() || null,
                    sub_stone_type_3: formData.sub_stone_type_3.trim() || null
                };
                
                const endpoint = productType === 'jewelry' ? '/api/products' : '/api/centerstones';
                response = await fetch(endpoint, {
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
                    <h2>{isEditMode 
                        ? (productType === 'jewelry' ? t('products.editJewelry') : t('products.editCenterStone'))
                        : (productType === 'jewelry' ? t('products.addNewJewelry') : t('products.addNewCenterStone'))}</h2>
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
                                <label htmlFor="product-name">Name</label>
                                <input
                                    id="product-name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="If leave this field empty, it will auto = product code"
                                    className={errors.name ? 'error' : ''}
                                />
                                {errors.name && <span className="error-message">{errors.name}</span>}
                            </div>

                            {/* Product ID (SKU) */}
                            <div className="form-group">
                                <label htmlFor="product-sku">
                                    Product Code (SKU) <span className="required">*</span>
                                </label>
                                <input
                                    id="product-sku"
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => handleInputChange('sku', e.target.value)}
                                    placeholder="Enter SKU"
                                    className={errors.sku ? 'error' : ''}
                                />
                                {errors.sku && <span className="error-message">{errors.sku}</span>}
                                {productType === 'centerstone' && !errors.sku && <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 'normal' }}> Must be unique</span>}
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
                                        productType={productType}
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

                        {/* Specification Section */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                {productType === 'jewelry' ? t('products.jewelrySpecifications') : t('products.centerStoneSpecifications')}
                            </h3>
                            
                            {/* Supplier ID - Only for jewelry */}
                            {productType === 'jewelry' && (
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
                                </div>
                            )}

                            {/* Specification fields for both jewelry and centerstone */}
                            {productType === 'jewelry' && (
                                <>
                                    {/* Material and Weight Section */}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="material-purity">Material / Purity</label>
                                            <input
                                                id="material-purity"
                                                type="text"
                                                value={formData.material_purity}
                                                onChange={(e) => handleInputChange('material_purity', e.target.value)}
                                                placeholder="e.g., 18K, 24K, 925"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="material-weight-g">Material Weight (g)</label>
                                            <input
                                                id="material-weight-g"
                                                type="number"
                                                step="0.001"
                                                value={formData.material_weight_g}
                                                onChange={(e) => handleInputChange('material_weight_g', e.target.value)}
                                                placeholder="Enter material weight"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="total-weight-g">Total Weight (g)</label>
                                            <input
                                                id="total-weight-g"
                                                type="number"
                                                step="0.001"
                                                value={formData.total_weight_g}
                                                onChange={(e) => handleInputChange('total_weight_g', e.target.value)}
                                                placeholder="Enter total weight"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="size-text">Size</label>
                                            <input
                                                id="size-text"
                                                type="text"
                                                value={formData.size_text}
                                                onChange={(e) => handleInputChange('size_text', e.target.value)}
                                                placeholder="e.g., S, M, L"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="jewelry-size">Jewelry Size</label>
                                            <input
                                                id="jewelry-size"
                                                type="text"
                                                value={formData.jewelry_size}
                                                onChange={(e) => handleInputChange('jewelry_size', e.target.value)}
                                                placeholder="e.g., Ring size 6.5"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="style-bst">Style (BST)</label>
                                            <input
                                                id="style-bst"
                                                type="text"
                                                value={formData.style_bst}
                                                onChange={(e) => handleInputChange('style_bst', e.target.value)}
                                                placeholder="Enter style"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="sub-style">Sub Style</label>
                                            <input
                                                id="sub-style"
                                                type="text"
                                                value={formData.sub_style}
                                                onChange={(e) => handleInputChange('sub_style', e.target.value)}
                                                placeholder="Enter sub style"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="main-stone-type">Main Stone Type</label>
                                            <input
                                                id="main-stone-type"
                                                type="text"
                                                value={formData.main_stone_type}
                                                onChange={(e) => handleInputChange('main_stone_type', e.target.value)}
                                                placeholder="e.g., Diamond, Ruby"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="stone-quantity">Stone Quantity</label>
                                            <input
                                                id="stone-quantity"
                                                type="number"
                                                value={formData.stone_quantity}
                                                onChange={(e) => handleInputChange('stone_quantity', e.target.value)}
                                                placeholder="Enter number of stones"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="shape-and-polished">Shape and Polished</label>
                                            <input
                                                id="shape-and-polished"
                                                type="text"
                                                value={formData.shape_and_polished}
                                                onChange={(e) => handleInputChange('shape_and_polished', e.target.value)}
                                                placeholder="e.g., Round, Excellent"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="origin">Origin</label>
                                            <input
                                                id="origin"
                                                type="text"
                                                value={formData.origin}
                                                onChange={(e) => handleInputChange('origin', e.target.value)}
                                                placeholder="Enter origin"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="item-serial">Item Serial</label>
                                            <input
                                                id="item-serial"
                                                type="text"
                                                value={formData.item_serial}
                                                onChange={(e) => handleInputChange('item_serial', e.target.value)}
                                                placeholder="Enter item serial"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="country-of-origin">Country of Origin</label>
                                            <input
                                                id="country-of-origin"
                                                type="text"
                                                value={formData.country_of_origin}
                                                onChange={(e) => handleInputChange('country_of_origin', e.target.value)}
                                                placeholder="Enter country of origin"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="certification-number">Certification Number</label>
                                            <input
                                                id="certification-number"
                                                type="text"
                                                value={formData.certification_number}
                                                onChange={(e) => handleInputChange('certification_number', e.target.value)}
                                                placeholder="Enter certification number"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="size-mm">Size (mm)</label>
                                            <input
                                                id="size-mm"
                                                type="number"
                                                step="0.01"
                                                value={formData.size_mm}
                                                onChange={(e) => handleInputChange('size_mm', e.target.value)}
                                                placeholder="Enter size in mm"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="color">Color</label>
                                            <input
                                                id="color"
                                                type="text"
                                                value={formData.color}
                                                onChange={(e) => handleInputChange('color', e.target.value)}
                                                placeholder="Enter color"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="clarity">Clarity</label>
                                            <input
                                                id="clarity"
                                                type="text"
                                                value={formData.clarity}
                                                onChange={(e) => handleInputChange('clarity', e.target.value)}
                                                placeholder="Enter clarity"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="weight-ct">Weight (CT)</label>
                                            <input
                                                id="weight-ct"
                                                type="number"
                                                step="0.01"
                                                value={formData.weight_ct}
                                                onChange={(e) => handleInputChange('weight_ct', e.target.value)}
                                                placeholder="Enter weight in CT"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="pcs">PCS</label>
                                            <input
                                                id="pcs"
                                                type="number"
                                                value={formData.pcs}
                                                onChange={(e) => handleInputChange('pcs', e.target.value)}
                                                placeholder="Enter PCS"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="cut-grade">Cut Grade</label>
                                            <input
                                                id="cut-grade"
                                                type="text"
                                                value={formData.cut_grade}
                                                onChange={(e) => handleInputChange('cut_grade', e.target.value)}
                                                placeholder="Enter cut grade"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="treatment">Treatment</label>
                                            <input
                                                id="treatment"
                                                type="text"
                                                value={formData.treatment}
                                                onChange={(e) => handleInputChange('treatment', e.target.value)}
                                                placeholder="Enter treatment"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="sub-stone-type-1">Sub Stone Type 1</label>
                                            <input
                                                id="sub-stone-type-1"
                                                type="text"
                                                value={formData.sub_stone_type_1}
                                                onChange={(e) => handleInputChange('sub_stone_type_1', e.target.value)}
                                                placeholder="Enter sub stone type 1"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="sub-stone-type-2">Sub Stone Type 2</label>
                                            <input
                                                id="sub-stone-type-2"
                                                type="text"
                                                value={formData.sub_stone_type_2}
                                                onChange={(e) => handleInputChange('sub_stone_type_2', e.target.value)}
                                                placeholder="Enter sub stone type 2"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="sub-stone-type-3">Sub Stone Type 3</label>
                                            <input
                                                id="sub-stone-type-3"
                                                type="text"
                                                value={formData.sub_stone_type_3}
                                                onChange={(e) => handleInputChange('sub_stone_type_3', e.target.value)}
                                                placeholder="Enter sub stone type 3"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {productType === 'centerstone' && (
                                <>
                                    {/* Centerstone specific fields */}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="shape-and-polished">Shape and Polished</label>
                                            <input
                                                id="shape-and-polished"
                                                type="text"
                                                value={formData.shape_and_polished}
                                                onChange={(e) => handleInputChange('shape_and_polished', e.target.value)}
                                                placeholder="Enter shape and polished"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="origin">Origin</label>
                                            <input
                                                id="origin"
                                                type="text"
                                                value={formData.origin}
                                                onChange={(e) => handleInputChange('origin', e.target.value)}
                                                placeholder="Enter origin"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="item-serial">Item Serial</label>
                                            <input
                                                id="item-serial"
                                                type="text"
                                                value={formData.item_serial}
                                                onChange={(e) => handleInputChange('item_serial', e.target.value)}
                                                placeholder="Enter item serial"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="country-of-origin">Country of Origin</label>
                                            <input
                                                id="country-of-origin"
                                                type="text"
                                                value={formData.country_of_origin}
                                                onChange={(e) => handleInputChange('country_of_origin', e.target.value)}
                                                placeholder="Enter country of origin"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="certification-number">Certification Number</label>
                                            <input
                                                id="certification-number"
                                                type="text"
                                                value={formData.certification_number}
                                                onChange={(e) => handleInputChange('certification_number', e.target.value)}
                                                placeholder="Enter certification number"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="size-mm">Size (mm)</label>
                                            <input
                                                id="size-mm"
                                                type="number"
                                                step="0.01"
                                                value={formData.size_mm}
                                                onChange={(e) => handleInputChange('size_mm', e.target.value)}
                                                placeholder="Enter size in mm"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="color">Color</label>
                                            <input
                                                id="color"
                                                type="text"
                                                value={formData.color}
                                                onChange={(e) => handleInputChange('color', e.target.value)}
                                                placeholder="Enter color"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="clarity">Clarity</label>
                                            <input
                                                id="clarity"
                                                type="text"
                                                value={formData.clarity}
                                                onChange={(e) => handleInputChange('clarity', e.target.value)}
                                                placeholder="Enter clarity"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="weight-ct">Weight (CT)</label>
                                            <input
                                                id="weight-ct"
                                                type="number"
                                                step="0.01"
                                                value={formData.weight_ct}
                                                onChange={(e) => handleInputChange('weight_ct', e.target.value)}
                                                placeholder="Enter weight in CT"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="pcs">PCS</label>
                                            <input
                                                id="pcs"
                                                type="number"
                                                value={formData.pcs}
                                                onChange={(e) => handleInputChange('pcs', e.target.value)}
                                                placeholder="Enter PCS"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="cut-grade">Cut Grade</label>
                                            <input
                                                id="cut-grade"
                                                type="text"
                                                value={formData.cut_grade}
                                                onChange={(e) => handleInputChange('cut_grade', e.target.value)}
                                                placeholder="Enter cut grade"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="treatment">Treatment</label>
                                            <input
                                                id="treatment"
                                                type="text"
                                                value={formData.treatment}
                                                onChange={(e) => handleInputChange('treatment', e.target.value)}
                                                placeholder="Enter treatment"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

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

                            {/* Inventory Value - Only for jewelry */}
                            {productType === 'jewelry' && (
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
                            )}

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
                                ? (isEditMode ? t('common.saving') : t('common.adding')) 
                                : (isEditMode 
                                    ? (productType === 'jewelry' ? t('products.saveJewelry') : t('products.saveCenterStone'))
                                    : (productType === 'jewelry' ? t('products.createJewelry') : t('products.createCenterStone')))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

