import { useState } from 'react';
import { IconX, IconPlus } from './icons';

export interface ReferenceLine {
    id: string;
    value: number;
    metric: 'stock' | 'price' | 'avgPrice';
    label?: string;
}

interface ReferenceLineInputProps {
    onAddLine: (line: ReferenceLine) => void;
    linesCount: number;
    maxLines?: number;
}

interface ReferenceLineListProps {
    lines: ReferenceLine[];
    onRemoveLine: (id: string) => void;
}

const METRIC_OPTIONS = [
    { id: 'stock', name: 'Stock', color: '#3b82f6' },
    { id: 'price', name: 'Price (VND)', color: '#f59e0b' },
    { id: 'avgPrice', name: 'Avg Price (VND)', color: '#10b981' }
] as const;

// Format value for display based on metric type
const formatDisplayValue = (value: number, metric: string): string => {
    if (metric === 'stock') {
        return value.toLocaleString('vi-VN');
    }
    // Format as currency for price metrics
    if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)}B ₫`;
    }
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M ₫`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K ₫`;
    }
    return `${value.toLocaleString('vi-VN')} ₫`;
};

// Get color for metric type (for reference line tags - using distinct colors)
const getMetricColor = (metric: string): string => {
    switch (metric) {
        case 'stock':
            return '#e11d48'; // Rose/Red
        case 'price':
            return '#7c3aed'; // Purple
        case 'avgPrice':
            return '#0891b2'; // Cyan
        default:
            return '#888';
    }
};

// Get metric display name (short version for labels)
const getMetricNameShort = (metric: string): string => {
    switch (metric) {
        case 'stock': return 'Stock';
        case 'price': return 'Price';
        case 'avgPrice': return 'Avg Price';
        default: return metric;
    }
};

// Inline Input Form Component - for placing in header
export function ReferenceLineInput({
    onAddLine,
    linesCount,
    maxLines = 10
}: ReferenceLineInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [selectedMetric, setSelectedMetric] = useState<'stock' | 'price' | 'avgPrice'>('stock');
    const [error, setError] = useState('');

    const handleAdd = () => {
        setError('');

        if (!inputValue.trim()) {
            setError('Enter value');
            return;
        }

        const cleanValue = inputValue.replace(/[,₫\s]/g, '');
        const numValue = parseFloat(cleanValue);

        if (isNaN(numValue) || numValue < 0) {
            setError('Invalid number');
            return;
        }

        if (linesCount >= maxLines) {
            setError(`Max ${maxLines} lines`);
            return;
        }

        const newLine: ReferenceLine = {
            id: `ref-${Date.now()}`,
            value: numValue,
            metric: selectedMetric,
            label: `${getMetricNameShort(selectedMetric)}: ${formatDisplayValue(numValue, selectedMetric)}`
        };

        onAddLine(newLine);
        setInputValue('');
        setError('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    return (
        <div className="reference-input-inline">
            <input
                type="text"
                className="reference-value-input-sm"
                placeholder={selectedMetric === 'stock' ? 'Qty...' : 'Amount...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
            />
            <select
                className="reference-metric-select-sm"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as 'stock' | 'price' | 'avgPrice')}
            >
                {METRIC_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
            <button
                className="reference-add-btn-sm"
                onClick={handleAdd}
                disabled={linesCount >= maxLines}
                title="Add reference line"
            >
                <IconPlus />
            </button>
            <span className="reference-count-sm">{linesCount}/{maxLines}</span>
            {error && <span className="reference-error-sm">{error}</span>}
        </div>
    );
}

// Lines List Component - for displaying below chart
export function ReferenceLineList({
    lines,
    onRemoveLine
}: ReferenceLineListProps) {
    if (lines.length === 0) return null;

    const stockLines = lines.filter(l => l.metric === 'stock');
    const priceLines = lines.filter(l => l.metric === 'price');
    const avgPriceLines = lines.filter(l => l.metric === 'avgPrice');

    return (
        <div className="reference-lines-list">
            {stockLines.length > 0 && (
                <div className="reference-lines-group">
                    <span className="reference-group-label" style={{ color: getMetricColor('stock') }}>
                        Stock:
                    </span>
                    {stockLines.map(line => (
                        <div key={line.id} className="reference-line-tag" style={{ borderColor: getMetricColor('stock') }}>
                            <span style={{ color: getMetricColor('stock') }}>
                                {formatDisplayValue(line.value, line.metric)}
                            </span>
                            <button
                                className="reference-remove-btn"
                                onClick={() => onRemoveLine(line.id)}
                                title="Remove line"
                            >
                                <IconX />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {priceLines.length > 0 && (
                <div className="reference-lines-group">
                    <span className="reference-group-label" style={{ color: getMetricColor('price') }}>
                        Price:
                    </span>
                    {priceLines.map(line => (
                        <div key={line.id} className="reference-line-tag" style={{ borderColor: getMetricColor('price') }}>
                            <span style={{ color: getMetricColor('price') }}>
                                {formatDisplayValue(line.value, line.metric)}
                            </span>
                            <button
                                className="reference-remove-btn"
                                onClick={() => onRemoveLine(line.id)}
                                title="Remove line"
                            >
                                <IconX />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {avgPriceLines.length > 0 && (
                <div className="reference-lines-group">
                    <span className="reference-group-label" style={{ color: getMetricColor('avgPrice') }}>
                        Avg Price:
                    </span>
                    {avgPriceLines.map(line => (
                        <div key={line.id} className="reference-line-tag" style={{ borderColor: getMetricColor('avgPrice') }}>
                            <span style={{ color: getMetricColor('avgPrice') }}>
                                {formatDisplayValue(line.value, line.metric)}
                            </span>
                            <button
                                className="reference-remove-btn"
                                onClick={() => onRemoveLine(line.id)}
                                title="Remove line"
                            >
                                <IconX />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Export helper for getting line styles - using distinct, vivid colors
export const getReferenceLineStyle = (metric: string) => {
    switch (metric) {
        case 'stock':
            return { stroke: '#e11d48', strokeDasharray: '12 6', strokeWidth: 2.5 }; // Rose/Red - distinct from blue bars
        case 'price':
            return { stroke: '#7c3aed', strokeDasharray: '8 4', strokeWidth: 2.5 }; // Purple - distinct from orange bars
        case 'avgPrice':
            return { stroke: '#0891b2', strokeDasharray: '4 2', strokeWidth: 2.5 }; // Cyan - distinct from green line
        default:
            return { stroke: '#888', strokeDasharray: '4 4', strokeWidth: 2 };
    }
};

// Get reference line color for display
export const getReferenceLineColor = (metric: string): string => {
    switch (metric) {
        case 'stock':
            return '#e11d48'; // Rose/Red
        case 'price':
            return '#7c3aed'; // Purple
        case 'avgPrice':
            return '#0891b2'; // Cyan
        default:
            return '#888';
    }
};
