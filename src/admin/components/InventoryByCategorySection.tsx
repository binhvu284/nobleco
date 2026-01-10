import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import CategoryFilterDropdown from './CategoryFilterDropdown';
import { ReferenceLineInput, ReferenceLineList, ReferenceLine as ReferenceLineData, getReferenceLineStyle } from './ChartReferenceLines';
import { useTranslation } from '../../shared/contexts/TranslationContext';
import { IconMaximize, IconX, IconCheck } from './icons';

interface Category {
    id: string | number;
    name: string;
    color?: string;
}

interface CategoryData {
    categoryId: string | number;
    categoryName: string;
    totalStock: number;
    stockProportion: number;
    inventoryValue: number;
    valueProportion: number;
    averagePrice: number;
    productType?: 'jewelry' | 'centerstone';
}

interface InventoryByCategorySectionProps {
    jewelryCategories: Category[];
    centerstoneCategories: Category[];
    jewelryData: CategoryData[];
    centerstoneData: CategoryData[];
    loading?: boolean;
}

type SortField = 'categoryName' | 'totalStock' | 'stockProportion' | 'inventoryValue' | 'valueProportion' | 'averagePrice';
type SortDirection = 'asc' | 'desc';

// Chart colors for categories
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Fullscreen Modal Component
function FullscreenModal({ 
    isOpen, 
    onClose, 
    title, 
    children 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode;
}) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fullscreen-modal-overlay" onClick={onClose}>
            <div className="fullscreen-modal-content" onClick={e => e.stopPropagation()}>
                <div className="fullscreen-modal-header">
                    <h2>{title}</h2>
                    <button className="fullscreen-modal-close" onClick={onClose}>
                        <IconX />
                    </button>
                </div>
                <div className="fullscreen-modal-body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

// Product type options
const PRODUCT_TYPES = [
    { id: 'jewelry', name: 'Jewelry' },
    { id: 'centerstone', name: 'Centerstone' }
];

export default function InventoryByCategorySection({
    jewelryCategories,
    centerstoneCategories,
    jewelryData,
    centerstoneData,
    loading = false
}: InventoryByCategorySectionProps) {
    const { t } = useTranslation();
    const [selectedProductTypes, setSelectedProductTypes] = useState<(string | number)[]>(['jewelry', 'centerstone']);
    const [selectedCategories, setSelectedCategories] = useState<(string | number)[]>([]);
    const [sortField, setSortField] = useState<SortField>('inventoryValue');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    
    // Fullscreen modal states
    const [tableExpanded, setTableExpanded] = useState(false);
    const [chartExpanded, setChartExpanded] = useState(false);
    
    // Chart visibility toggles
    const [showStock, setShowStock] = useState(true);
    const [showPrice, setShowPrice] = useState(true);
    const [showAvgPrice, setShowAvgPrice] = useState(true);
    
    // Reference lines state
    const [referenceLines, setReferenceLines] = useState<ReferenceLineData[]>([]);

    const handleAddReferenceLine = (line: ReferenceLineData) => {
        setReferenceLines(prev => [...prev, line]);
    };

    const handleRemoveReferenceLine = (id: string) => {
        setReferenceLines(prev => prev.filter(l => l.id !== id));
    };

    // Update product type options with translations
    const productTypeOptions = useMemo(() => [
        { id: 'jewelry', name: t('products.jewelry') },
        { id: 'centerstone', name: t('products.centerStone') }
    ], [t]);

    // Combine categories and data based on selected product types
    // Prefix category IDs with product type to ensure uniqueness
    const { currentCategories, currentData } = useMemo(() => {
        let categories: Category[] = [];
        let data: CategoryData[] = [];

        const includeJewelry = selectedProductTypes.includes('jewelry');
        const includeCenterstone = selectedProductTypes.includes('centerstone');

        if (includeJewelry) {
            // Add color to jewelry categories with prefixed IDs
            categories = [...categories, ...jewelryCategories.map((c, i) => ({
                ...c,
                id: `jewelry_${c.id}`, // Prefix with product type
                color: CHART_COLORS[i % CHART_COLORS.length]
            }))];
            data = [...data, ...jewelryData.map(d => ({ 
                ...d, 
                categoryId: `jewelry_${d.categoryId}`, // Prefix with product type
                productType: 'jewelry' as const 
            }))];
        }

        if (includeCenterstone) {
            // Add color to centerstone categories (offset the color index) with prefixed IDs
            const offset = includeJewelry ? jewelryCategories.length : 0;
            categories = [...categories, ...centerstoneCategories.map((c, i) => ({
                ...c,
                id: `centerstone_${c.id}`, // Prefix with product type
                color: CHART_COLORS[(i + offset) % CHART_COLORS.length]
            }))];
            data = [...data, ...centerstoneData.map(d => ({ 
                ...d, 
                categoryId: `centerstone_${d.categoryId}`, // Prefix with product type
                productType: 'centerstone' as const 
            }))];
        }

        return { currentCategories: categories, currentData: data };
    }, [selectedProductTypes, jewelryCategories, centerstoneCategories, jewelryData, centerstoneData]);

    // Create a color map for quick lookup
    const categoryColorMap = useMemo(() => {
        const map: Record<string | number, string> = {};
        currentCategories.forEach((cat, index) => {
            map[cat.id] = cat.color || CHART_COLORS[index % CHART_COLORS.length];
        });
        // Also map by name for data lookup
        currentCategories.forEach((cat, index) => {
            map[cat.name] = cat.color || CHART_COLORS[index % CHART_COLORS.length];
        });
        return map;
    }, [currentCategories]);

    // Initialize/update selectedCategories when categories change
    useEffect(() => {
        if (currentCategories.length > 0) {
            setSelectedCategories(currentCategories.map(c => c.id));
        }
    }, [currentCategories]);

    // Filter data based on selected categories
    const filteredData = useMemo(() => {
        if (selectedCategories.length === 0) {
            return []; // No categories selected = no data
        }
        return currentData.filter(d => selectedCategories.includes(d.categoryId));
    }, [currentData, selectedCategories]);

    // Recalculate proportions for filtered data
    const recalculatedData = useMemo(() => {
        const totalStock = filteredData.reduce((sum, d) => sum + d.totalStock, 0);
        const totalValue = filteredData.reduce((sum, d) => sum + d.inventoryValue, 0);

        return filteredData.map(d => ({
            ...d,
            stockProportion: totalStock > 0 ? (d.totalStock / totalStock) * 100 : 0,
            valueProportion: totalValue > 0 ? (d.inventoryValue / totalValue) * 100 : 0,
            color: categoryColorMap[d.categoryId] || categoryColorMap[d.categoryName] || CHART_COLORS[0]
        }));
    }, [filteredData, categoryColorMap]);

    // Sort data for table
    const sortedData = useMemo(() => {
        return [...recalculatedData].sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = (bVal as string).toLowerCase();
            }
            
            if (sortDirection === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            }
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        });
    }, [recalculatedData, sortField, sortDirection]);

    // Format currency (VND)
    const formatCurrency = (amount: number): string => {
        if (amount >= 1000000000) {
            return `${(amount / 1000000000).toFixed(1)}B ₫`;
        }
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M ₫`;
        }
        if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K ₫`;
        }
        return `${amount.toLocaleString('vi-VN')} ₫`;
    };

    // Format number with commas
    const formatNumber = (num: number): string => {
        return num.toLocaleString('vi-VN');
    };

    // Handle sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Handle product type change
    const handleProductTypeChange = (types: (string | number)[]) => {
        setSelectedProductTypes(types);
        // Categories will auto-update via useEffect when currentCategories changes
    };

    // Prepare chart data with all three metrics
    const chartData = sortedData.map(d => ({
        name: d.categoryName,
        Stock: d.totalStock,
        'Total Price': d.inventoryValue,
        'Avg Price': d.averagePrice,
        color: d.color
    }));

    if (loading) {
        return (
            <div className="inventory-section">
                <div className="inventory-section-header">
                    <div className="inventory-section-title">
                        <h2>{t('businessAnalytics.inventoryStructure')}</h2>
                        <p>{t('businessAnalytics.inventoryStructureDesc')}</p>
                    </div>
                </div>
                <div className="skeleton skeleton-table" style={{ marginBottom: '24px' }} />
                <div className="skeleton skeleton-chart" style={{ height: '350px' }} />
            </div>
        );
    }

    return (
        <div className="inventory-section">
            <div className="inventory-section-header">
                <div className="inventory-section-title">
                    <h2>{t('businessAnalytics.inventoryStructure')}</h2>
                    <p>{t('businessAnalytics.inventoryStructureDesc')}</p>
                </div>
            </div>

            {/* Filters - Right above the table */}
            <div className="inventory-filters">
                <CategoryFilterDropdown
                    categories={productTypeOptions}
                    selectedCategories={selectedProductTypes}
                    onChange={handleProductTypeChange}
                    label={t('businessAnalytics.selectProductType')}
                    hideSelectAll={true}
                />
                <CategoryFilterDropdown
                    categories={currentCategories}
                    selectedCategories={selectedCategories}
                    onChange={setSelectedCategories}
                    label={t('businessAnalytics.selectCategories')}
                    showColors={true}
                    colorMap={categoryColorMap}
                />
            </div>

            {/* Summary Table */}
            <div className="metric-card metric-table" style={{ marginBottom: '24px' }}>
                <div className="widget-header">
                    <h3>{t('businessAnalytics.summaryTable')}</h3>
                    <button 
                        className="expand-btn" 
                        onClick={() => setTableExpanded(true)}
                        title={t('businessAnalytics.expand')}
                    >
                        <IconMaximize />
                    </button>
                </div>
                <div className="table-container table-container-fixed">
                    <table className="inventory-summary-table">
                        <thead>
                            <tr>
                                <th 
                                    className={`sortable ${sortField === 'categoryName' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('categoryName')}
                                >
                                    {t('businessAnalytics.category')}
                                </th>
                                <th 
                                    className={`sortable text-center ${sortField === 'totalStock' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('totalStock')}
                                >
                                    {t('businessAnalytics.totalStock')}
                                </th>
                                <th 
                                    className={`sortable ${sortField === 'stockProportion' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('stockProportion')}
                                >
                                    {t('businessAnalytics.stockPercent')}
                                </th>
                                <th 
                                    className={`sortable text-right ${sortField === 'inventoryValue' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('inventoryValue')}
                                >
                                    {t('businessAnalytics.inventoryValue')}
                                </th>
                                <th 
                                    className={`sortable ${sortField === 'valueProportion' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('valueProportion')}
                                >
                                    {t('businessAnalytics.valuePercent')}
                                </th>
                                <th 
                                    className={`sortable text-right ${sortField === 'averagePrice' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('averagePrice')}
                                >
                                    {t('businessAnalytics.averagePrice')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                                        {t('common.noData') || 'No data available'}
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row) => (
                                    <tr key={`${row.productType}-${row.categoryId}`}>
                                        <td className="category-name">
                                            <span 
                                                className="category-color-dot" 
                                                style={{ background: row.color }}
                                            />
                                            <span style={{ color: row.color, fontWeight: 500 }}>
                                                {row.categoryName}
                                            </span>
                                        </td>
                                        <td className="text-center">{formatNumber(row.totalStock)}</td>
                                        <td>
                                            <div className="percentage-bar">
                                                <div 
                                                    className="percentage-bar-fill" 
                                                    style={{ 
                                                        width: `${Math.min(row.stockProportion, 100)}%`,
                                                        background: row.color
                                                    }} 
                                                />
                                                <span className="percentage-value">{row.stockProportion.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="text-right">{formatCurrency(row.inventoryValue)}</td>
                                        <td>
                                            <div className="percentage-bar">
                                                <div 
                                                    className="percentage-bar-fill" 
                                                    style={{ 
                                                        width: `${Math.min(row.valueProportion, 100)}%`,
                                                        background: row.color
                                                    }} 
                                                />
                                                <span className="percentage-value">{row.valueProportion.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="text-right">{formatCurrency(row.averagePrice)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Chart - Stock, Price, and Average Price */}
            <div className="metric-card">
                <div className="widget-header widget-header-wrap">
                    <h3>{t('businessAnalytics.stockVsValue')}</h3>
                    <div className="chart-header-controls">
                        {/* Reference Line Input */}
                        <ReferenceLineInput
                            onAddLine={handleAddReferenceLine}
                            linesCount={referenceLines.length}
                            maxLines={10}
                        />
                        <div className="chart-controls">
                            <label className={`chart-toggle stock ${!showStock ? 'unchecked' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    checked={showStock} 
                                    onChange={(e) => setShowStock(e.target.checked)} 
                                />
                                <span className="toggle-indicator">
                                    {showStock && <IconCheck />}
                                </span>
                                <span>{t('businessAnalytics.showStock')}</span>
                            </label>
                            <label className={`chart-toggle price ${!showPrice ? 'unchecked' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    checked={showPrice} 
                                    onChange={(e) => setShowPrice(e.target.checked)} 
                                />
                                <span className="toggle-indicator">
                                    {showPrice && <IconCheck />}
                                </span>
                                <span>{t('businessAnalytics.showPrice')}</span>
                            </label>
                            <label className={`chart-toggle avg-price ${!showAvgPrice ? 'unchecked' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    checked={showAvgPrice} 
                                    onChange={(e) => setShowAvgPrice(e.target.checked)} 
                                />
                                <span className="toggle-indicator">
                                    {showAvgPrice && <IconCheck />}
                                </span>
                                <span>{t('businessAnalytics.showAvgPrice')}</span>
                            </label>
                            <button 
                                className="expand-btn" 
                                onClick={() => setChartExpanded(true)}
                                title={t('businessAnalytics.expand')}
                            >
                                <IconMaximize />
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="chart-container" style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis 
                                dataKey="name"
                                stroke="var(--muted)"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                                yAxisId="left"
                                stroke="#3b82f6"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => formatNumber(value)}
                            />
                            <YAxis 
                                yAxisId="right"
                                orientation="right"
                                stroke="#10b981"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => formatCurrency(value)}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'var(--panel)', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
                                }}
                                formatter={(value, name) => {
                                    if (value === undefined) return ['', name || ''];
                                    if (name === 'Stock') return [formatNumber(value as number), name];
                                    return [formatCurrency(value as number), name || ''];
                                }}
                            />
                            {showStock && (
                                <Bar 
                                    yAxisId="left"
                                    dataKey="Stock" 
                                    fill="#3b82f6" 
                                    radius={[4, 4, 0, 0]}
                                    name="Stock"
                                />
                            )}
                            {showPrice && (
                                <Bar 
                                    yAxisId="right"
                                    dataKey="Total Price" 
                                    fill="#f59e0b" 
                                    radius={[4, 4, 0, 0]}
                                    name="Total Price"
                                />
                            )}
                            {showAvgPrice && (
                                <Line 
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="Avg Price"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ fill: '#10b981', r: 5 }}
                                    name="Avg Price"
                                />
                            )}
                            {/* Reference Lines */}
                            {referenceLines.filter(l => l.metric === 'stock').map(line => (
                                <ReferenceLine
                                    key={line.id}
                                    yAxisId="left"
                                    y={line.value}
                                    stroke={getReferenceLineStyle(line.metric).stroke}
                                    strokeDasharray={getReferenceLineStyle(line.metric).strokeDasharray}
                                    strokeWidth={getReferenceLineStyle(line.metric).strokeWidth}
                                />
                            ))}
                            {referenceLines.filter(l => l.metric === 'price' || l.metric === 'avgPrice').map(line => (
                                <ReferenceLine
                                    key={line.id}
                                    yAxisId="right"
                                    y={line.value}
                                    stroke={getReferenceLineStyle(line.metric).stroke}
                                    strokeDasharray={getReferenceLineStyle(line.metric).strokeDasharray}
                                    strokeWidth={getReferenceLineStyle(line.metric).strokeWidth}
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                
                {/* Reference Lines List */}
                <ReferenceLineList
                    lines={referenceLines}
                    onRemoveLine={handleRemoveReferenceLine}
                />
            </div>

            {/* Fullscreen Table Modal */}
            <FullscreenModal 
                isOpen={tableExpanded} 
                onClose={() => setTableExpanded(false)}
                title={t('businessAnalytics.summaryTable')}
            >
                <div className="table-container" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
                    <table className="inventory-summary-table">
                        <thead>
                            <tr>
                                <th 
                                    className={`sortable ${sortField === 'categoryName' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('categoryName')}
                                >
                                    {t('businessAnalytics.category')}
                                </th>
                                <th 
                                    className={`sortable text-center ${sortField === 'totalStock' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('totalStock')}
                                >
                                    {t('businessAnalytics.totalStock')}
                                </th>
                                <th 
                                    className={`sortable ${sortField === 'stockProportion' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('stockProportion')}
                                >
                                    {t('businessAnalytics.stockPercent')}
                                </th>
                                <th 
                                    className={`sortable text-right ${sortField === 'inventoryValue' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('inventoryValue')}
                                >
                                    {t('businessAnalytics.inventoryValue')}
                                </th>
                                <th 
                                    className={`sortable ${sortField === 'valueProportion' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('valueProportion')}
                                >
                                    {t('businessAnalytics.valuePercent')}
                                </th>
                                <th 
                                    className={`sortable text-right ${sortField === 'averagePrice' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('averagePrice')}
                                >
                                    {t('businessAnalytics.averagePrice')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                                        {t('common.noData') || 'No data available'}
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row) => (
                                    <tr key={`modal-${row.productType}-${row.categoryId}`}>
                                        <td className="category-name">
                                            <span 
                                                className="category-color-dot" 
                                                style={{ background: row.color }}
                                            />
                                            <span style={{ color: row.color, fontWeight: 500 }}>
                                                {row.categoryName}
                                            </span>
                                        </td>
                                        <td className="text-center">{formatNumber(row.totalStock)}</td>
                                        <td>
                                            <div className="percentage-bar">
                                                <div 
                                                    className="percentage-bar-fill" 
                                                    style={{ 
                                                        width: `${Math.min(row.stockProportion, 100)}%`,
                                                        background: row.color
                                                    }} 
                                                />
                                                <span className="percentage-value">{row.stockProportion.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="text-right">{formatCurrency(row.inventoryValue)}</td>
                                        <td>
                                            <div className="percentage-bar">
                                                <div 
                                                    className="percentage-bar-fill" 
                                                    style={{ 
                                                        width: `${Math.min(row.valueProportion, 100)}%`,
                                                        background: row.color
                                                    }} 
                                                />
                                                <span className="percentage-value">{row.valueProportion.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="text-right">{formatCurrency(row.averagePrice)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </FullscreenModal>

            {/* Fullscreen Chart Modal */}
            <FullscreenModal 
                isOpen={chartExpanded} 
                onClose={() => setChartExpanded(false)}
                title={t('businessAnalytics.stockVsValue')}
            >
                <div className="chart-modal-controls">
                    <ReferenceLineInput
                        onAddLine={handleAddReferenceLine}
                        linesCount={referenceLines.length}
                        maxLines={10}
                    />
                    <label className={`chart-toggle stock ${!showStock ? 'unchecked' : ''}`}>
                        <input 
                            type="checkbox" 
                            checked={showStock} 
                            onChange={(e) => setShowStock(e.target.checked)} 
                        />
                        <span className="toggle-indicator">
                            {showStock && <IconCheck />}
                        </span>
                        <span>{t('businessAnalytics.showStock')}</span>
                    </label>
                    <label className={`chart-toggle price ${!showPrice ? 'unchecked' : ''}`}>
                        <input 
                            type="checkbox" 
                            checked={showPrice} 
                            onChange={(e) => setShowPrice(e.target.checked)} 
                        />
                        <span className="toggle-indicator">
                            {showPrice && <IconCheck />}
                        </span>
                        <span>{t('businessAnalytics.showPrice')}</span>
                    </label>
                    <label className={`chart-toggle avg-price ${!showAvgPrice ? 'unchecked' : ''}`}>
                        <input 
                            type="checkbox" 
                            checked={showAvgPrice} 
                            onChange={(e) => setShowAvgPrice(e.target.checked)} 
                        />
                        <span className="toggle-indicator">
                            {showAvgPrice && <IconCheck />}
                        </span>
                        <span>{t('businessAnalytics.showAvgPrice')}</span>
                    </label>
                </div>
                <div style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis 
                                dataKey="name"
                                stroke="var(--muted)"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                                yAxisId="left"
                                stroke="#3b82f6"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => formatNumber(value)}
                            />
                            <YAxis 
                                yAxisId="right"
                                orientation="right"
                                stroke="#10b981"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => formatCurrency(value)}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'var(--panel)', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
                                }}
                                formatter={(value, name) => {
                                    if (value === undefined) return ['', name || ''];
                                    if (name === 'Stock') return [formatNumber(value as number), name];
                                    return [formatCurrency(value as number), name || ''];
                                }}
                            />
                            {showStock && (
                                <Bar 
                                    yAxisId="left"
                                    dataKey="Stock" 
                                    fill="#3b82f6" 
                                    radius={[4, 4, 0, 0]}
                                    name="Stock"
                                />
                            )}
                            {showPrice && (
                                <Bar 
                                    yAxisId="right"
                                    dataKey="Total Price" 
                                    fill="#f59e0b" 
                                    radius={[4, 4, 0, 0]}
                                    name="Total Price"
                                />
                            )}
                            {showAvgPrice && (
                                <Line 
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="Avg Price"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ fill: '#10b981', r: 5 }}
                                    name="Avg Price"
                                />
                            )}
                            {/* Reference Lines */}
                            {referenceLines.filter(l => l.metric === 'stock').map(line => (
                                <ReferenceLine
                                    key={line.id}
                                    yAxisId="left"
                                    y={line.value}
                                    stroke={getReferenceLineStyle(line.metric).stroke}
                                    strokeDasharray={getReferenceLineStyle(line.metric).strokeDasharray}
                                    strokeWidth={getReferenceLineStyle(line.metric).strokeWidth}
                                />
                            ))}
                            {referenceLines.filter(l => l.metric === 'price' || l.metric === 'avgPrice').map(line => (
                                <ReferenceLine
                                    key={line.id}
                                    yAxisId="right"
                                    y={line.value}
                                    stroke={getReferenceLineStyle(line.metric).stroke}
                                    strokeDasharray={getReferenceLineStyle(line.metric).strokeDasharray}
                                    strokeWidth={getReferenceLineStyle(line.metric).strokeWidth}
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <ReferenceLineList
                    lines={referenceLines}
                    onRemoveLine={handleRemoveReferenceLine}
                />
            </FullscreenModal>
        </div>
    );
}
