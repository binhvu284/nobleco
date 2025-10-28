import { useState } from 'react';
import { IconX, IconPlus, IconMinus, IconPackage, IconSearch } from './icons';

interface Category {
    id: number;
    name: string;
    color: string;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
    stock: number;
    categories: Category[];
}

interface StockManagementModalProps {
    open: boolean;
    onClose: () => void;
    products: Product[];
    onUpdateStock: (productId: number, newStock: number) => Promise<void>;
}

export default function StockManagementModal({
    open,
    onClose,
    products,
    onUpdateStock
}: StockManagementModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [stockChanges, setStockChanges] = useState<Record<number, number>>({});
    const [updating, setUpdating] = useState<number | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
    const [categoryStockAmount, setCategoryStockAmount] = useState<string>('');
    const [showCategoryBulk, setShowCategoryBulk] = useState(false);
    const [editMode, setEditMode] = useState<Record<number, 'add' | 'subtract' | null>>({});

    if (!open) return null;

    // Get unique categories from all products
    const allCategories = Array.from(
        new Map(
            products.flatMap(p => p.categories).map(cat => [cat.id, cat])
        ).values()
    );

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Get the amount being added/subtracted (not the final stock)
    const getStockChange = (productId: number) => {
        return stockChanges[productId] !== undefined ? stockChanges[productId] : 0;
    };

    // Calculate what the new stock will be
    const getNewStock = (productId: number, currentStock: number) => {
        const change = getStockChange(productId);
        const mode = editMode[productId];
        
        if (mode === 'add') {
            return currentStock + change;
        } else if (mode === 'subtract') {
            return Math.max(0, currentStock - change);
        }
        return currentStock;
    };

    const handleStockChange = (productId: number, value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setStockChanges(prev => ({ ...prev, [productId]: numValue }));
        }
    };

    const handleIncrement = (productId: number) => {
        const currentChange = getStockChange(productId);
        const mode = editMode[productId];
        
        // In both modes, + button increases the change amount
        setStockChanges(prev => ({ ...prev, [productId]: currentChange + 1 }));
    };

    const handleDecrement = (productId: number) => {
        const currentChange = getStockChange(productId);
        const mode = editMode[productId];
        
        // In both modes, - button decreases the change amount (but not below 0)
        if (currentChange > 0) {
            setStockChanges(prev => ({ ...prev, [productId]: currentChange - 1 }));
        }
    };

    const handleQuickAdd = (productId: number, amount: number) => {
        const currentChange = getStockChange(productId);
        setStockChanges(prev => ({ ...prev, [productId]: currentChange + amount }));
    };

    const handleQuickSubtract = (productId: number, amount: number) => {
        const currentChange = getStockChange(productId);
        setStockChanges(prev => ({ ...prev, [productId]: currentChange + amount }));
    };

    const handleCategoryBulkUpdate = () => {
        if (!categoryFilter || !categoryStockAmount) return;
        
        const amount = parseInt(categoryStockAmount);
        if (isNaN(amount)) return;

        const productsInCategory = filteredProducts.filter(product =>
            product.categories.some(cat => cat.id === categoryFilter)
        );

        const newChanges = { ...stockChanges };
        productsInCategory.forEach(product => {
            const currentValue = getNewStock(product.id, product.stock);
            newChanges[product.id] = amount >= 0 
                ? currentValue + amount 
                : Math.max(0, currentValue + amount);
        });

        setStockChanges(newChanges);
        setCategoryStockAmount('');
        setShowCategoryBulk(false);
    };

    const handleUpdate = async (productId: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const newStock = getNewStock(productId, product.stock);
        
        setUpdating(productId);
        try {
            await onUpdateStock(productId, newStock);
            // Remove from changes and reset mode after successful update
            setStockChanges(prev => {
                const updated = { ...prev };
                delete updated[productId];
                return updated;
            });
            setEditMode(prev => {
                const updated = { ...prev };
                delete updated[productId];
                return updated;
            });
        } catch (error) {
            console.error('Failed to update stock:', error);
        } finally {
            setUpdating(null);
        }
    };

    const hasChanges = (productId: number) => {
        return stockChanges[productId] !== undefined;
    };

    const handleModeSelect = (productId: number, mode: 'add' | 'subtract') => {
        setEditMode(prev => ({ ...prev, [productId]: mode }));
        // Reset stock change when switching mode
        setStockChanges(prev => {
            const updated = { ...prev };
            delete updated[productId];
            return updated;
        });
    };

    const handleCancel = (productId: number) => {
        setEditMode(prev => {
            const updated = { ...prev };
            delete updated[productId];
            return updated;
        });
        setStockChanges(prev => {
            const updated = { ...prev };
            delete updated[productId];
            return updated;
        });
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="stock-management-modal">
                <div className="stock-modal-header">
                    <div className="stock-modal-title-section">
                        <div className="stock-modal-icon">
                            <IconPackage />
                        </div>
                        <h2>Stock Management</h2>
                    </div>
                    <button className="stock-modal-close" onClick={onClose}>
                        <IconX />
                    </button>
                </div>

                <div className="stock-modal-filters">
                    <div className="stock-search-bar">
                        <IconSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by product name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="stock-search-input"
                        />
                    </div>
                    
                    <button 
                        className="btn-category-bulk"
                        onClick={() => setShowCategoryBulk(!showCategoryBulk)}
                    >
                        <IconPackage />
                        Bulk by Category
                    </button>
                </div>

                {showCategoryBulk && (
                    <div className="category-bulk-section">
                        <h3>Bulk Stock Update by Category</h3>
                        <div className="category-bulk-controls">
                            <select
                                className="category-select"
                                value={categoryFilter || ''}
                                onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">Select a category</option>
                                {allCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            
                            <input
                                type="number"
                                className="category-amount-input"
                                placeholder="Amount (use - to subtract)"
                                value={categoryStockAmount}
                                onChange={(e) => setCategoryStockAmount(e.target.value)}
                            />
                            
                            <button
                                className="btn-apply-category"
                                onClick={handleCategoryBulkUpdate}
                                disabled={!categoryFilter || !categoryStockAmount}
                            >
                                Apply to All
                            </button>
                        </div>
                        <p className="category-bulk-hint">
                            Enter positive number to add (e.g., 50) or negative to subtract (e.g., -10)
                        </p>
                    </div>
                )}

                <div className="stock-modal-content">
                    {filteredProducts.length === 0 ? (
                        <div className="stock-empty-state">
                            <IconPackage />
                            <p>No products found</p>
                        </div>
                    ) : (
                        <div className="stock-products-list">
                            {filteredProducts.map((product) => {
                                const stockChangeAmount = getStockChange(product.id);
                                const newStock = getNewStock(product.id, product.stock);
                                const isChanged = hasChanges(product.id);
                                const isUpdating = updating === product.id;
                                const currentMode = editMode[product.id];

                                return (
                                    <div key={product.id} className={`stock-product-item ${isChanged ? 'changed' : ''}`}>
                                        <div className="stock-product-left">
                                            <div className="stock-product-avatar">
                                                <IconPackage />
                                            </div>
                                            <div className="stock-product-info">
                                                <h4>{product.name}</h4>
                                                {product.sku && (
                                                    <span className="stock-product-sku">SKU: {product.sku}</span>
                                                )}
                                                <div className="stock-product-categories">
                                                    {product.categories.slice(0, 2).map(cat => (
                                                        <span 
                                                            key={cat.id} 
                                                            className="stock-category-badge"
                                                            style={{ 
                                                                backgroundColor: cat.color + '20',
                                                                color: cat.color,
                                                                borderColor: cat.color
                                                            }}
                                                        >
                                                            {cat.name}
                                                        </span>
                                                    ))}
                                                    {product.categories.length > 2 && (
                                                        <span className="stock-category-more">
                                                            +{product.categories.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="stock-info-row">
                                                    <span className="stock-current">
                                                        Current: <strong>{product.stock}</strong>
                                                    </span>
                                                    {currentMode && isChanged && (
                                                        <span className={`stock-preview ${currentMode}`}>
                                                            → New: <strong>{newStock}</strong>
                                                            <span className="stock-change-badge">
                                                                {currentMode === 'add' ? '+' : '-'}{stockChangeAmount}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="stock-product-controls">
                                            {!currentMode ? (
                                                <div className="stock-mode-selector">
                                                    <button
                                                        className="btn-mode-add"
                                                        onClick={() => handleModeSelect(product.id, 'add')}
                                                        disabled={isUpdating}
                                                    >
                                                        <IconPlus />
                                                        Add Stock
                                                    </button>
                                                    <button
                                                        className="btn-mode-subtract"
                                                        onClick={() => handleModeSelect(product.id, 'subtract')}
                                                        disabled={isUpdating}
                                                    >
                                                        <IconMinus />
                                                        Reduce Stock
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="stock-quick-actions">
                                                        {currentMode === 'subtract' && (
                                                            <>
                                                                <button
                                                                    className="btn-quick-subtract"
                                                                    onClick={() => handleQuickSubtract(product.id, 10)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    -10
                                                                </button>
                                                                <button
                                                                    className="btn-quick-subtract"
                                                                    onClick={() => handleQuickSubtract(product.id, 50)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    -50
                                                                </button>
                                                                <button
                                                                    className="btn-quick-subtract"
                                                                    onClick={() => handleQuickSubtract(product.id, 100)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    -100
                                                                </button>
                                                            </>
                                                        )}
                                                        {currentMode === 'add' && (
                                                            <>
                                                                <button
                                                                    className="btn-quick-add"
                                                                    onClick={() => handleQuickAdd(product.id, 10)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    +10
                                                                </button>
                                                                <button
                                                                    className="btn-quick-add"
                                                                    onClick={() => handleQuickAdd(product.id, 50)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    +50
                                                                </button>
                                                                <button
                                                                    className="btn-quick-add"
                                                                    onClick={() => handleQuickAdd(product.id, 100)}
                                                                    disabled={isUpdating}
                                                                >
                                                                    +100
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="stock-adjuster">
                                                        <button
                                                            className={`btn-stock-decrement ${currentMode === 'subtract' ? 'active' : ''}`}
                                                            onClick={() => handleDecrement(product.id)}
                                                            disabled={stockChangeAmount === 0 || isUpdating}
                                                        >
                                                            <IconMinus />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            className="stock-input"
                                                            value={stockChangeAmount}
                                                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                                                            disabled={isUpdating}
                                                            min="0"
                                                            placeholder="0"
                                                        />
                                                        <button
                                                            className={`btn-stock-increment ${currentMode === 'add' ? 'active' : ''}`}
                                                            onClick={() => handleIncrement(product.id)}
                                                            disabled={isUpdating}
                                                        >
                                                            <IconPlus />
                                                        </button>
                                                    </div>

                                                    <div className="stock-action-buttons">
                                                        <button
                                                            className="btn-cancel-stock"
                                                            onClick={() => handleCancel(product.id)}
                                                            disabled={isUpdating}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            className="btn-update-stock"
                                                            onClick={() => handleUpdate(product.id)}
                                                            disabled={!isChanged || isUpdating}
                                                        >
                                                            {isUpdating ? 'Updating...' : 'Update'}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="stock-modal-footer">
                    <p className="stock-footer-hint">
                        Changes are saved individually. Click "Update" to save each product's stock.
                    </p>
                </div>
            </div>
        </>
    );
}

