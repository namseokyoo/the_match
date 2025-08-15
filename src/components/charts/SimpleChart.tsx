'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Bar Chart Component
interface BarChartData {
    label: string;
    value: number;
    color?: string;
}

interface BarChartProps {
    data: BarChartData[];
    height?: number;
    showValues?: boolean;
    className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
    data,
    height = 200,
    showValues = true,
    className = '',
}) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = 100 / data.length;

    return (
        <div className={`w-full ${className}`}>
            <div className="relative" style={{ height }}>
                <div className="absolute inset-0 flex items-end justify-between">
                    {data.map((item, index) => {
                        const barHeight = (item.value / maxValue) * 100;
                        return (
                            <div
                                key={index}
                                className="flex-1 flex flex-col items-center justify-end px-1"
                                style={{ width: `${barWidth}%` }}
                            >
                                {showValues && (
                                    <span className="text-xs font-semibold text-gray-700 mb-1">
                                        {item.value.toLocaleString()}
                                    </span>
                                )}
                                <div
                                    className="w-full rounded-t transition-all duration-500 hover:opacity-80"
                                    style={{
                                        height: `${barHeight}%`,
                                        backgroundColor: item.color || '#3B82F6',
                                        minHeight: '4px',
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="border-b border-gray-100" />
                    ))}
                </div>
            </div>
            {/* Labels */}
            <div className="flex justify-between mt-2">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className="flex-1 text-center px-1"
                        style={{ width: `${barWidth}%` }}
                    >
                        <span className="text-xs text-gray-600 truncate block">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Line Chart Component
interface LineChartData {
    label: string;
    values: number[];
}

interface LineChartProps {
    data: LineChartData[];
    labels: string[];
    height?: number;
    showDots?: boolean;
    className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
    data,
    labels,
    height = 200,
    showDots = true,
    className = '',
}) => {
    const maxValue = Math.max(...data.flatMap(d => d.values));
    const minValue = Math.min(...data.flatMap(d => d.values));
    const range = maxValue - minValue;
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const getPoint = (value: number, index: number) => {
        const x = (index / (labels.length - 1)) * 100;
        const y = 100 - ((value - minValue) / range) * 100;
        return { x, y };
    };

    return (
        <div className={`w-full ${className}`}>
            <div className="relative" style={{ height }}>
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map(y => (
                        <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2="100"
                            y2={y}
                            stroke="#E5E7EB"
                            strokeWidth="0.5"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    
                    {/* Lines */}
                    {data.map((series, seriesIndex) => {
                        const points = series.values.map((value, index) => getPoint(value, index));
                        const pathData = points
                            .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                            .join(' ');
                        
                        return (
                            <g key={seriesIndex}>
                                <path
                                    d={pathData}
                                    fill="none"
                                    stroke={colors[seriesIndex % colors.length]}
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {showDots && points.map((point, index) => (
                                    <circle
                                        key={index}
                                        cx={point.x}
                                        cy={point.y}
                                        r="3"
                                        fill={colors[seriesIndex % colors.length]}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                ))}
                            </g>
                        );
                    })}
                </svg>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
                    <span>{maxValue}</span>
                    <span>{Math.round((maxValue + minValue) / 2)}</span>
                    <span>{minValue}</span>
                </div>
            </div>
            
            {/* X-axis labels */}
            <div className="flex justify-between mt-2">
                {labels.map((label, index) => (
                    <span key={index} className="text-xs text-gray-600">
                        {label}
                    </span>
                ))}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4">
                {data.map((series, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="text-xs text-gray-600">{series.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Pie Chart Component
interface PieChartData {
    label: string;
    value: number;
    color?: string;
}

interface PieChartProps {
    data: PieChartData[];
    size?: number;
    showLabels?: boolean;
    className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
    data,
    size = 200,
    showLabels = true,
    className = '',
}) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
    
    let currentAngle = -90; // Start at top
    
    const createPath = (value: number, _index: number) => {
        const percentage = value / total;
        const angle = percentage * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        
        const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
        const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
        const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
        const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
        
        const largeArc = angle > 180 ? 1 : 0;
        
        return `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`;
    };
    
    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <svg width={size} height={size} viewBox="0 0 100 100">
                {data.map((item, index) => (
                    <path
                        key={index}
                        d={createPath(item.value, index)}
                        fill={item.color || colors[index % colors.length]}
                        className="hover:opacity-80 transition-opacity"
                    />
                ))}
            </svg>
            
            {showLabels && (
                <div className="flex flex-col gap-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: item.color || colors[index % colors.length],
                                }}
                            />
                            <span className="text-sm text-gray-700">
                                {item.label}: {item.value} ({Math.round((item.value / total) * 100)}%)
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Stat Card Component
interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    change,
    changeLabel,
    icon,
    className = '',
}) => {
    const getTrendIcon = () => {
        if (change === undefined) return null;
        if (change > 0) return <TrendingUp className="w-4 h-4" />;
        if (change < 0) return <TrendingDown className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };
    
    const getTrendColor = () => {
        if (change === undefined) return '';
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-600';
    };
    
    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                    {change !== undefined && (
                        <div className={`mt-2 flex items-center gap-1 text-sm ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span className="font-medium">
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                            {changeLabel && (
                                <span className="text-gray-500">{changeLabel}</span>
                            )}
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="ml-4 flex-shrink-0">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

const SimpleChart = {
    BarChart,
    LineChart,
    PieChart,
    StatCard,
};

export default SimpleChart;