import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ChartType = 'line' | 'bar' | 'pie';

interface ChartDataPoint {
    [key: string]: string | number;
}

interface MetricChartProps {
    title: string;
    data: ChartDataPoint[];
    type: ChartType;
    dataKey: string;
    nameKey?: string;
    width?: 1 | 2;
    height?: 1 | 2 | 3;
    className?: string;
    colors?: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MetricChart({
    title,
    data,
    type,
    dataKey,
    nameKey = 'name',
    width = 2,
    height = 2,
    className = '',
    colors = DEFAULT_COLORS
}: MetricChartProps) {
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
                                        return `${name}\n${numValue} orders (${percentValue}%)`;
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
                                            <tspan x={x} dy="12">{numValue} orders ({percentValue}%)</tspan>
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
                                    return `${value} orders (${percent}%)`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );
            
            default:
                return null;
        }
    };

    return (
        <div 
            className={`metric-card metric-chart ${className}`}
            data-width={width}
            data-height={height}
        >
            <div className="widget-header">
                <h3>{title}</h3>
            </div>
            <div className="chart-container" style={{ height: height === 1 ? '200px' : height === 2 ? '300px' : '400px' }}>
                {renderChart()}
            </div>
        </div>
    );
}

