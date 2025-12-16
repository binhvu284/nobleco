import React from 'react';

interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface MetricTableProps {
    title: string;
    columns: Column[];
    data: any[];
    width?: 1 | 2;
    height?: 1 | 2 | 3;
    className?: string;
    onRowClick?: (row: any) => void;
}

export default function MetricTable({
    title,
    columns,
    data,
    width = 2,
    height = 2,
    className = '',
    onRowClick
}: MetricTableProps) {
    return (
        <div 
            className={`metric-card metric-table ${className}`}
            data-width={width}
            data-height={height}
        >
            <div className="widget-header">
                <h3>{title}</h3>
            </div>
            <div className="table-container">
                <table className="metric-table-content">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="empty-state">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr 
                                    key={index} 
                                    className={onRowClick ? 'clickable' : ''}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key}>
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

