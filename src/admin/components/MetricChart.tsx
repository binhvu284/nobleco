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
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey={dataKey}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'var(--panel)', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
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

