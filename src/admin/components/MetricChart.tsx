import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

type ChartType = 'line' | 'bar' | 'pie' | 'combo' | 'horizontalBar';

interface ChartDataPoint {
    [key: string]: string | number;
}

interface MetricChartProps {
    title: string;
    data: ChartDataPoint[];
    type: ChartType;
    dataKey: string;
    secondaryDataKey?: string; // For combo chart - the line data
    nameKey?: string;
    width?: 1 | 2 | 3 | 4;
    height?: 1 | 2 | 3;
    className?: string;
    colors?: string[];
    formatValue?: (value: number) => string;
    formatSecondaryValue?: (value: number) => string;
    bare?: boolean; // If true, renders just the chart without wrapper
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MetricChart({
    title,
    data,
    type,
    dataKey,
    secondaryDataKey,
    nameKey = 'name',
    width = 2,
    height = 2,
    className = '',
    colors = DEFAULT_COLORS,
    formatValue,
    formatSecondaryValue,
    bare = false
}: MetricChartProps) {
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
    const renderChart = () => {
        switch (type) {
            case 'line':
                // Check if we need multiple lines (for User Level Distribution)
                const hasMultipleSeries = data.length > 0 && Object.keys(data[0]).filter(k => k !== nameKey).length > 1;
                
                if (hasMultipleSeries) {
                    // Multiple lines - one per level
                    const seriesKeys = Object.keys(data[0]).filter(k => k !== nameKey);
                    return (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis 
                                    dataKey={nameKey} 
                                    stroke="var(--muted)"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    stroke="var(--muted)"
                                    style={{ fontSize: '12px' }}
                                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--panel)', 
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value: any) => `${value}%`}
                                />
                                <Legend />
                                {seriesKeys.map((key, index) => (
                                    <Line 
                                        key={key}
                                        type="monotone" 
                                        dataKey={key} 
                                        stroke={colors[index % colors.length]} 
                                        strokeWidth={2}
                                        dot={{ fill: colors[index % colors.length], r: 4 }}
                                        name={key}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    );
                } else {
                    // Single line - check if we need custom colors per data point (for User Level Distribution)
                    const needsCustomColors = colors.length === data.length && data.length > 1;
                    
                    if (needsCustomColors) {
                        // User Level Distribution - simple line with colored dots per level
                        return (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis 
                                        dataKey={nameKey} 
                                        stroke="var(--muted)"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis 
                                        stroke="var(--muted)"
                                        style={{ fontSize: '12px' }}
                                        label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'var(--panel)', 
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value: any) => `${value}%`}
                                    />
                                    <Legend />
                                    {/* Single line connecting all points */}
                                    <Line 
                                        type="monotone" 
                                        dataKey={dataKey} 
                                        stroke={colors[0]} 
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    {/* Colored dots for each level */}
                                    {data.map((point, index) => (
                                        <Line 
                                            key={`dot-${index}`}
                                            type="monotone" 
                                            dataKey={dataKey}
                                            stroke="transparent"
                                            strokeWidth={0}
                                            dot={{ fill: colors[index], r: 6, strokeWidth: 2, stroke: colors[index] }}
                                            data={[point]}
                                            name={String(point[nameKey] || '')}
                                            isAnimationActive={false}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        );
                    } else {
                        // Standard single line
                        return (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis 
                                        dataKey={nameKey} 
                                        stroke="var(--muted)"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis 
                                        stroke="var(--muted)"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'var(--panel)', 
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey={dataKey} 
                                        stroke={colors[0]} 
                                        strokeWidth={2}
                                        dot={{ fill: colors[0], r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        );
                    }
                }
            
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis 
                                dataKey={nameKey} 
                                stroke="var(--muted)"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                                stroke="var(--muted)"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'var(--panel)', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            
            case 'pie':
                // Filter out entries with 0 values for pie chart (Recharts doesn't render 0 slices well)
                const pieData = data.filter(d => {
                    const value = d[dataKey];
                    return typeof value === 'number' && value > 0;
                });
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                startAngle={90}
                                endAngle={-270}
                                labelLine={true}
                                label={({ name, percent, value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                                    const numValue = typeof value === 'number' ? value : 0;
                                    const percentValue = percent ? (percent * 100).toFixed(1) : 0;
                                    if (midAngle === undefined || innerRadius === undefined || outerRadius === undefined) {
                                        return `${name}\n${numValue} (${percentValue}%)`;
                                    }
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    
                                    return (
                                        <text 
                                            x={x} 
                                            y={y} 
                                            fill="var(--text)" 
                                            textAnchor={x > cx ? 'start' : 'end'} 
                                            dominantBaseline="central"
                                            style={{ fontSize: '12px', fontWeight: 500 }}
                                        >
                                            <tspan x={x} dy="-6">{name}</tspan>
                                            <tspan x={x} dy="12">{formatValue ? formatValue(numValue) : numValue} ({percentValue}%)</tspan>
                                        </text>
                                    );
                                }}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey={dataKey}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'var(--panel)', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
                                }}
                                formatter={(value: any) => {
                                    const total = pieData.reduce((sum, d) => sum + (typeof d[dataKey] === 'number' ? d[dataKey] : 0), 0);
                                    const percent = total > 0 ? ((typeof value === 'number' ? value : 0) / total * 100).toFixed(1) : 0;
                                    const formattedValue = formatValue ? formatValue(value) : value;
                                    return `${formattedValue} (${percent}%)`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'horizontalBar':
                // Horizontal bar chart - good for comparing categories with long names
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={data} 
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis 
                                type="number"
                                stroke="var(--muted)"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => formatValue ? formatValue(value) : value.toLocaleString()}
                            />
                            <YAxis 
                                type="category"
                                dataKey={nameKey}
                                stroke="var(--muted)"
                                style={{ fontSize: '12px' }}
                                width={75}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'var(--panel)', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
                                }}
                                formatter={(value: any, name: string) => {
                                    if (name === dataKey && formatValue) {
                                        return [formatValue(value), name];
                                    }
                                    if (name === secondaryDataKey && formatSecondaryValue) {
                                        return [formatSecondaryValue(value), name];
                                    }
                                    return [value.toLocaleString(), name];
                                }}
                            />
                            <Legend />
                            <Bar 
                                dataKey={dataKey} 
                                fill={colors[0]} 
                                radius={[0, 4, 4, 0]}
                                name={dataKey}
                            />
                            {secondaryDataKey && (
                                <Bar 
                                    dataKey={secondaryDataKey} 
                                    fill={colors[1]} 
                                    radius={[0, 4, 4, 0]}
                                    name={secondaryDataKey}
                                />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'combo':
                // Combo chart - Column (bar) + Line with dual Y-axis
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                            data={data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis 
                                dataKey={nameKey}
                                stroke="var(--muted)"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                                yAxisId="left"
                                stroke={colors[0]}
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => formatValue ? formatValue(value) : value.toLocaleString()}
                            />
                            <YAxis 
                                yAxisId="right"
                                orientation="right"
                                stroke={colors[1]}
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => formatSecondaryValue ? formatSecondaryValue(value) : formatCurrency(value)}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'var(--panel)', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
                                }}
                                formatter={(value: any, name: string) => {
                                    if (name === dataKey && formatValue) {
                                        return [formatValue(value), name];
                                    }
                                    if (name === secondaryDataKey && formatSecondaryValue) {
                                        return [formatSecondaryValue(value), name];
                                    }
                                    return [formatCurrency(value), name];
                                }}
                            />
                            <Legend />
                            <Bar 
                                yAxisId="left"
                                dataKey={dataKey} 
                                fill={colors[0]} 
                                radius={[4, 4, 0, 0]}
                                name={dataKey}
                            />
                            {secondaryDataKey && (
                                <Line 
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey={secondaryDataKey}
                                    stroke={colors[1]}
                                    strokeWidth={3}
                                    dot={{ fill: colors[1], r: 5 }}
                                    name={secondaryDataKey}
                                />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                );
            
            default:
                return null;
        }
    };

    // Bare mode - just render the chart without wrapper
    if (bare) {
        return renderChart();
    }

    return (
        <div 
            className={`metric-card metric-chart ${className}`}
            data-width={width}
            data-height={height}
        >
            {title && (
                <div className="widget-header">
                    <h3>{title}</h3>
                </div>
            )}
            <div className="chart-container" style={{ height: height === 1 ? '200px' : height === 2 ? '300px' : '400px' }}>
                {renderChart()}
            </div>
        </div>
    );
}

