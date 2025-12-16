import React from 'react';

interface ProgressItem {
    label: string;
    value: number;
    percentage: number;
    color?: string;
}

interface MetricProgressProps {
    title: string;
    items: ProgressItem[];
    width?: 1 | 2;
    height?: 1 | 2 | 3;
    className?: string;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

export default function MetricProgress({
    title,
    items,
    width = 2,
    height = 2,
    className = ''
}: MetricProgressProps) {
    return (
        <div 
            className={`metric-card metric-progress ${className}`}
            data-width={width}
            data-height={height}
        >
            <div className="widget-header">
                <h3>{title}</h3>
            </div>
            <div className="progress-container">
                {items.map((item, index) => {
                    const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                    return (
                        <div key={index} className="progress-item">
                            <div className="progress-info">
                                <span className="progress-label">{item.label}</span>
                                <div className="progress-stats">
                                    <span className="progress-value">{item.value.toLocaleString()}</span>
                                    <span className="progress-percentage">{item.percentage}%</span>
                                </div>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-bar-fill"
                                    style={{ 
                                        width: `${item.percentage}%`, 
                                        backgroundColor: color 
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

