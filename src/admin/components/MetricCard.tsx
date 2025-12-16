import React from 'react';

type StatTrend = 'up' | 'down' | 'neutral';

interface MetricCardProps {
    title: string;
    value: string | number;
    trend?: StatTrend;
    change?: number;
    icon?: React.ReactNode;
    width?: 1 | 2;
    height?: 1 | 2 | 3;
    className?: string;
}

export default function MetricCard({ 
    title, 
    value, 
    trend, 
    change, 
    icon, 
    width = 1, 
    height = 1,
    className = '' 
}: MetricCardProps) {
    const getTrendIcon = (trend: StatTrend) => {
        if (trend === 'up') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                </svg>
            );
        }
        if (trend === 'down') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                    <polyline points="17 18 23 18 23 12" />
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        );
    };

    const formatValue = (val: string | number): string => {
        if (typeof val === 'number') {
            if (val >= 1000000) {
                return `${(val / 1000000).toFixed(1)}M`;
            }
            if (val >= 1000) {
                return `${(val / 1000).toFixed(1)}k`;
            }
            return val.toLocaleString();
        }
        return val;
    };

    return (
        <div 
            className={`metric-card metric-box ${className}`}
            data-width={width}
            data-height={height}
        >
            <div className="stat-header">
                {icon && (
                    <div className="stat-icon" style={{ 
                        background: 'var(--info-light)', 
                        color: 'var(--primary)' 
                    }}>
                        {icon}
                    </div>
                )}
                {trend !== undefined && change !== undefined && (
                    <div className="stat-trend">
                        {getTrendIcon(trend)}
                        <span className={`trend-${trend}`}>
                            {change > 0 ? '+' : ''}{change}%
                        </span>
                    </div>
                )}
            </div>
            <div className="stat-body">
                <div className="stat-value">{formatValue(value)}</div>
                <div className="stat-label">{title}</div>
            </div>
        </div>
    );
}

