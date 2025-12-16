import React, { useState } from 'react';

interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
    sortable?: boolean;
}

interface SortableTableProps {
    title: string;
    columns: Column[];
    data: any[];
    width?: 1 | 2;
    height?: 1 | 2 | 3;
    className?: string;
    highlightFirst?: string[]; // Column keys to highlight 1st place
    highlightSecond?: string[]; // Column keys to highlight 2nd place
}

type SortDirection = 'asc' | 'desc' | null;

export default function SortableTable({
    title,
    columns,
    data,
    width = 2,
    height = 2,
    className = '',
    highlightFirst = [],
    highlightSecond = []
}: SortableTableProps) {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const handleSort = (columnKey: string) => {
        const column = columns.find(c => c.key === columnKey);
        if (!column?.sortable) return;

        if (sortColumn === columnKey) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortColumn(null);
                setSortDirection(null);
            } else {
                setSortDirection('asc');
            }
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const sortedData = React.useMemo(() => {
        if (!sortColumn || !sortDirection) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            const aStr = String(aVal || '');
            const bStr = String(bVal || '');
            
            if (sortDirection === 'asc') {
                return aStr.localeCompare(bStr);
            } else {
                return bStr.localeCompare(aStr);
            }
        });
    }, [data, sortColumn, sortDirection]);

    const getCellStyle = (columnKey: string, rowIndex: number) => {
        if (rowIndex === 0 && highlightFirst.includes(columnKey)) {
            return { color: '#f59e0b', fontWeight: 'bold' };
        }
        if (rowIndex === 1 && highlightSecond.includes(columnKey)) {
            return { color: '#eab308', fontWeight: 'bold' };
        }
        return {};
    };

    return (
        <div 
            className={`metric-card metric-table ${className}`}
            data-width={width}
            data-height={height}
        >
            <div className="widget-header">
                <h3>{title}</h3>
            </div>
            <div className="table-container" style={{ maxHeight: height === 2 ? '300px' : '400px', overflowY: 'auto' }}>
                <table className="metric-table-content">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th 
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    style={{ 
                                        cursor: col.sortable ? 'pointer' : 'default',
                                        userSelect: 'none'
                                    }}
                                >
                                    {col.label}
                                    {col.sortable && sortColumn === col.key && (
                                        <span style={{ marginLeft: '4px' }}>
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="empty-state">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((row, index) => (
                                <tr key={index}>
                                    {columns.map((col) => (
                                        <td 
                                            key={col.key}
                                            style={getCellStyle(col.key, index)}
                                        >
                                            {col.render 
                                                ? col.render(row[col.key], row)
                                                : row[col.key] ?? '-'
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

