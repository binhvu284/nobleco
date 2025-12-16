import React from 'react';

interface ListItem {
    id?: string | number;
    label: string;
    value?: string | number;
    [key: string]: any;
}

interface MetricListProps {
    title: string;
    items: ListItem[];
    width?: 1 | 2;
    height?: 1 | 2 | 3;
    className?: string;
    renderItem?: (item: ListItem, index: number) => React.ReactNode;
}

export default function MetricList({
    title,
    items,
    width = 1,
    height = 2,
    className = '',
    renderItem
}: MetricListProps) {
    const defaultRenderItem = (item: ListItem, index: number) => (
        <div key={item.id || index} className="list-item">
            <span className="list-item-label">{item.label}</span>
            {item.value !== undefined && (
                <span className="list-item-value">{item.value}</span>
            )}
        </div>
    );

    return (
        <div 
            className={`metric-card metric-list ${className}`}
            data-width={width}
            data-height={height}
        >
            <div className="widget-header">
                <h3>{title}</h3>
            </div>
            <div className="list-container">
                {items.length === 0 ? (
                    <div className="empty-state">No items available</div>
                ) : (
                    items.map((item, index) => 
                        renderItem ? renderItem(item, index) : defaultRenderItem(item, index)
                    )
                )}
            </div>
        </div>
    );
}

