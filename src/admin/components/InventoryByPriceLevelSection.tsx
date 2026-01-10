import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import CategoryFilterDropdown from './CategoryFilterDropdown';
import { ReferenceLineInput, ReferenceLineList, ReferenceLine as ReferenceLineData, getReferenceLineStyle } from './ChartReferenceLines';
import { useTranslation } from '../../shared/contexts/TranslationContext';
import { IconMaximize, IconX, IconCheck } from './icons';

// Price level definitions with sort order
const PRICE_LEVELS = [
    { id: 'level1', name: '< 10M', minPrice: 0, maxPrice: 10000000, color: '#3b82f6', order: 1 },
    { id: 'level2', name: '10M - 20M', minPrice: 10000000, maxPrice: 20000000, color: '#10b981', order: 2 },
    { id: 'level3', name: '20M - 30M', minPrice: 20000000, maxPrice: 30000000, color: '#f59e0b', order: 3 },
    { id: 'level4', name: '30M - 50M', minPrice: 30000000, maxPrice: 50000000, color: '#ef4444', order: 4 },
    { id: 'level5', name: '50M - 70M', minPrice: 50000000, maxPrice: 70000000, color: '#8b5cf6', order: 5 },
    { id: 'level6', name: '70M - 100M', minPrice: 70000000, maxPrice: 100000000, color: '#ec4899', order: 6 },
    { id: 'level7', name: '> 100M', minPrice: 100000000, maxPrice: Infinity, color: '#06b6d4', order: 7 }
];

// Mock data for development
const MOCK_JEWELRY_PRICE_DATA = [
    { levelId: 'level1', totalStock: 45, inventoryValue: 315000000 },
    { levelId: 'level2', totalStock: 38, inventoryValue: 570000000 },
    { levelId: 'level3', totalStock: 32, inventoryValue: 800000000 },
    { levelId: 'level4', totalStock: 28, inventoryValue: 1120000000 },
    { levelId: 'level5', totalStock: 18, inventoryValue: 1080000000 },
    { levelId: 'level6', totalStock: 12, inventoryValue: 1020000000 },
    { levelId: 'level7', totalStock: 8, inventoryValue: 1200000000 }
];

const MOCK_CENTERSTONE_PRICE_DATA = [
    { levelId: 'level1', totalStock: 25, inventoryValue: 175000000 },
    { levelId: 'level2', totalStock: 20, inventoryValue: 300000000 },
    { levelId: 'level3', totalStock: 18, inventoryValue: 450000000 },
    { levelId: 'level4', totalStock: 22, inventoryValue: 880000000 },
    { levelId: 'level5', totalStock: 15, inventoryValue: 900000000 },
    { levelId: 'level6', totalStock: 10, inventoryValue: 850000000 },
    { levelId: 'level7', totalStock: 5, inventoryValue: 750000000 }
];

interface PriceLevelData {
    levelId: string;
    levelName: string;
    totalStock: number;
    stockProportion: number;
    inventoryValue: number;
    valueProportion: number;
    color: string;
    order: number;
    productType?: 'jewelry' | 'centerstone';
}

interface InventoryByPriceLevelSectionProps {
    loading?: boolean;
}

type SortField = 'levelName' | 'totalStock' | 'stockProportion' | 'inventoryValue' | 'valueProportion';
type SortDirection = 'asc' | 'desc';

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

export default function InventoryByPriceLevelSection({
    loading = false
}: InventoryByPriceLevelSectionProps) {
    const { t } = useTranslation();
    const [selectedProductTypes, setSelectedProductTypes] = useState<(string | number)[]>(['jewelry', 'centerstone']);
    const [selectedPriceLevels, setSelectedPriceLevels] = useState<(string | number)[]>([]);
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

    // Product type options
    const productTypeOptions = useMemo(() => [
        { id: 'jewelry', name: t('products.jewelry') },
        { id: 'centerstone', name: t('products.centerStone') }
    ], [t]);

    // Price level options for dropdown
    const priceLevelOptions = useMemo(() => 
        PRICE_LEVELS.map(level => ({
            id: level.id,
            name: level.name,
            color: level.color
        }))
    , []);

    // Combine and calculate data based on selected product types
    const combinedData = useMemo(() => {
        const includeJewelry = selectedProductTypes.includes('jewelry');
        const includeCenterstone = selectedProductTypes.includes('centerstone');

        // Aggregate data by price level
        const aggregated: Record<string, { totalStock: number; inventoryValue: number }> = {};

        PRICE_LEVELS.forEach(level => {
            aggregated[level.id] = { totalStock: 0, inventoryValue: 0 };
        });

        if (includeJewelry) {
            MOCK_JEWELRY_PRICE_DATA.forEach(d => {
                aggregated[d.levelId].totalStock += d.totalStock;
                aggregated[d.levelId].inventoryValue += d.inventoryValue;
            });
        }

        if (includeCenterstone) {
            MOCK_CENTERSTONE_PRICE_DATA.forEach(d => {
                aggregated[d.levelId].totalStock += d.totalStock;
                aggregated[d.levelId].inventoryValue += d.inventoryValue;
            });
        }

        // Calculate totals for proportions
        const totalStock = Object.values(aggregated).reduce((sum, d) => sum + d.totalStock, 0);
        const totalValue = Object.values(aggregated).reduce((sum, d) => sum + d.inventoryValue, 0);

        // Create final data array
        return PRICE_LEVELS.map(level => ({
            levelId: level.id,
            levelName: level.name,
            totalStock: aggregated[level.id].totalStock,
            stockProportion: totalStock > 0 ? (aggregated[level.id].totalStock / totalStock) * 100 : 0,
            inventoryValue: aggregated[level.id].inventoryValue,
            valueProportion: totalValue > 0 ? (aggregated[level.id].inventoryValue / totalValue) * 100 : 0,
            color: level.color,
            order: level.order
        }));
    }, [selectedProductTypes]);

    // Initialize selected price levels
    useEffect(() => {
        if (priceLevelOptions.length > 0 && selectedPriceLevels.length === 0) {
            setSelectedPriceLevels(priceLevelOptions.map(l => l.id));
        }
    }, [priceLevelOptions]);

    // Filter data based on selected price levels
    const filteredData = useMemo(() => {
        if (selectedPriceLevels.length === 0) {
            return [];
        }
        return combinedData.filter(d => selectedPriceLevels.includes(d.levelId));
    }, [combinedData, selectedPriceLevels]);

    // Recalculate proportions for filtered data
    const recalculatedData = useMemo(() => {
        const totalStock = filteredData.reduce((sum, d) => sum + d.totalStock, 0);
        const totalValue = filteredData.reduce((sum, d) => sum + d.inventoryValue, 0);

        return filteredData.map(d => ({
            ...d,
            stockProportion: totalStock > 0 ? (d.totalStock / totalStock) * 100 : 0,
            valueProportion: totalValue > 0 ? (d.inventoryValue / totalValue) * 100 : 0,
            averagePrice: d.totalStock > 0 ? d.inventoryValue / d.totalStock : 0
        }));
    }, [filteredData]);

    // Sort data for table
    const sortedData = useMemo(() => {
        return [...recalculatedData].sort((a, b) => {
            // For levelName, use the order property instead of alphabetical
            if (sortField === 'levelName') {
                if (sortDirection === 'asc') {
                    return a.order - b.order;
                }
                return b.order - a.order;
            }
            
            let aVal: any = a[sortField];
            let bVal: any = b[sortField];
            
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
    };

    // Prepare chart data - always sorted by price level order for the chart
    const chartData = [...recalculatedData]
        .sort((a, b) => a.order - b.order)
        .map(d => ({
            name: d.levelName,
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
                        <h2>Current Inventory Structure by Price Level</h2>
                        <p>Analyze product distribution and inventory value across price ranges</p>
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
                    <h2>Current Inventory Structure by Price Level</h2>
                    <p>Analyze product distribution and inventory value across price ranges</p>
                </div>
            </div>

            {/* Filters */}
            <div className="inventory-filters">
                <CategoryFilterDropdown
                    categories={productTypeOptions}
                    selectedCategories={selectedProductTypes}
                    onChange={handleProductTypeChange}
                    label="Select Product Type"
                    hideSelectAll={true}
                />
                <CategoryFilterDropdown
                    categories={priceLevelOptions}
                    selectedCategories={selectedPriceLevels}
                    onChange={setSelectedPriceLevels}
                    label="Select Price Level"
                    showColors={true}
                />
            </div>

            {/* Summary Table */}
            <div className="metric-card metric-table" style={{ marginBottom: '24px' }}>
                <div className="widget-header">
                    <h3>Summary Table</h3>
                    <button 
                        className="expand-btn" 
                        onClick={() => setTableExpanded(true)}
                        title="Expand"
                    >
                        <IconMaximize />
                    </button>
                </div>
                <div className="table-container table-container-fixed">
                    <table className="inventory-summary-table">
                        <thead>
                            <tr>
                                <th 
                                    className={`sortable ${sortField === 'levelName' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('levelName')}
                                >
                                    Price Level
                                </th>
                                <th 
                                    className={`sortable text-center ${sortField === 'totalStock' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('totalStock')}
                                >
                                    Total Stock
                                </th>
                                <th 
                                    className={`sortable ${sortField === 'stockProportion' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('stockProportion')}
                                >
                                    Stock %
                                </th>
                                <th 
                                    className={`sortable text-right ${sortField === 'inventoryValue' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('inventoryValue')}
                                >
                                    Inventory Value
                                </th>
                                <th 
                                    className={`sortable ${sortField === 'valueProportion' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('valueProportion')}
                                >
                                    Value %
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row) => (
                                    <tr key={row.levelId}>
                                        <td className="category-name">
                                            <span 
                                                className="category-color-dot" 
                                                style={{ background: row.color }}
                                            />
                                            <span style={{ color: row.color, fontWeight: 500 }}>
                                                {row.levelName}
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Chart */}
            <div className="metric-card">
                <div className="widget-header widget-header-wrap">
                    <h3>Stock vs Inventory Value by Price Level</h3>
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
                                <span>Stock</span>
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
                                <span>Price</span>
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
                                <span>Avg Price</span>
                            </label>
                            <button 
                                className="expand-btn" 
                                onClick={() => setChartExpanded(true)}
                                title="Expand"
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
                title="Summary Table - Price Level"
            >
                <div className="table-container" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
                    <table className="inventory-summary-table">
                        <thead>
                            <tr>
                                <th 
                                    className={`sortable ${sortField === 'levelName' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('levelName')}
                                >
                                    Price Level
                                </th>
                                <th 
                                    className={`sortable text-center ${sortField === 'totalStock' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('totalStock')}
                                >
                                    Total Stock
                                </th>
                                <th 
                                    className={`sortable ${sortField === 'stockProportion' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('stockProportion')}
                                >
                                    Stock %
                                </th>
                                <th 
                                    className={`sortable text-right ${sortField === 'inventoryValue' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('inventoryValue')}
                                >
                                    Inventory Value
                                </th>
                                <th 
                                    className={`sortable ${sortField === 'valueProportion' ? `sorted-${sortDirection}` : ''}`}
                                    onClick={() => handleSort('valueProportion')}
                                >
                                    Value %
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row) => (
                                    <tr key={`modal-${row.levelId}`}>
                                        <td className="category-name">
                                            <span 
                                                className="category-color-dot" 
                                                style={{ background: row.color }}
                                            />
                                            <span style={{ color: row.color, fontWeight: 500 }}>
                                                {row.levelName}
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
                title="Stock vs Inventory Value by Price Level"
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
                        <span>Stock</span>
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
                        <span>Price</span>
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
                        <span>Avg Price</span>
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

