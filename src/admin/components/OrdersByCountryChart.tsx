import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface OrdersByCountryChartProps {
    data: Array<{ country: string; orderCount: number; revenue: number; percentage: number; revenuePercentage: number }>;
    width?: 1 | 2;
    height?: 1 | 2 | 3;
    className?: string;
}

export default function OrdersByCountryChart({
    data,
    width = 2,
    height = 2,
    className = ''
}: OrdersByCountryChartProps) {
    const orderData = data.map(item => ({ name: item.country, value: item.orderCount, percentage: item.percentage }));
    const revenueData = data.map(item => ({ name: item.country, value: item.revenue, percentage: item.revenuePercentage }));

    return (
        <div 
            className={`metric-card metric-chart ${className}`}
            data-width={width}
            data-height={height}
        >
            <div className="widget-header">
                <h3>Orders by Country</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: height === 2 ? '300px' : '400px' }}>
                <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center', color: 'var(--muted)' }}>
                        By Order Count
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={orderData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {orderData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
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
                </div>
                <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center', color: 'var(--muted)' }}>
                        By Order Value
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={revenueData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {revenueData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
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
                </div>
            </div>
        </div>
    );
}

