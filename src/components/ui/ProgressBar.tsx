'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showPercentage?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    animated?: boolean;
    indeterminate?: boolean;
    className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    label,
    showPercentage = false,
    size = 'md',
    variant = 'default',
    animated = true,
    indeterminate = false,
    className
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    // Animated value update
    useEffect(() => {
        if (!indeterminate && animated) {
            const timer = setTimeout(() => {
                setDisplayValue(percentage);
            }, 100);
            return () => clearTimeout(timer);
        } else if (!indeterminate) {
            setDisplayValue(percentage);
        }
    }, [percentage, animated, indeterminate]);

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'h-1';
            case 'lg':
                return 'h-3';
            case 'md':
            default:
                return 'h-2';
        }
    };

    const getVariantClasses = () => {
        switch (variant) {
            case 'success':
                return 'bg-green-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'error':
                return 'bg-red-500';
            case 'info':
                return 'bg-blue-500';
            case 'default':
            default:
                return 'bg-blue-600';
        }
    };

    return (
        <div className={cn('w-full', className)}>
            {(label || showPercentage) && (
                <div className="flex justify-between items-center mb-1">
                    {label && (
                        <span className="text-sm font-medium text-gray-700">
                            {label}
                        </span>
                    )}
                    {showPercentage && !indeterminate && (
                        <span className="text-sm text-gray-500">
                            {Math.round(displayValue)}%
                        </span>
                    )}
                </div>
            )}
            <div className={cn(
                'w-full bg-gray-200 rounded-full overflow-hidden',
                getSizeClasses()
            )}>
                {indeterminate ? (
                    <div className={cn(
                        'h-full rounded-full animate-progress-indeterminate',
                        getVariantClasses()
                    )} />
                ) : (
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-500 ease-out',
                            getVariantClasses(),
                            animated && 'animate-progress-pulse'
                        )}
                        style={{ width: `${displayValue}%` }}
                        role="progressbar"
                        aria-valuenow={value}
                        aria-valuemin={0}
                        aria-valuemax={max}
                    />
                )}
            </div>
        </div>
    );
};

// 다단계 진행률 표시 컴포넌트
export const StepProgress: React.FC<{
    currentStep: number;
    totalSteps: number;
    labels?: string[];
    className?: string;
}> = ({ currentStep, totalSteps, labels, className }) => {
    return (
        <div className={cn('w-full', className)}>
            <div className="flex justify-between mb-2">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const isActive = index < currentStep;
                    const isCurrent = index === currentStep - 1;
                    
                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center flex-1"
                        >
                            <div className="relative w-full flex items-center">
                                {index > 0 && (
                                    <div className={cn(
                                        'absolute left-0 w-full h-0.5 -translate-x-1/2',
                                        isActive ? 'bg-blue-600' : 'bg-gray-300'
                                    )} />
                                )}
                                <div className={cn(
                                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto',
                                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500',
                                    isCurrent && 'ring-2 ring-blue-600 ring-offset-2'
                                )}>
                                    {index + 1}
                                </div>
                            </div>
                            {labels && labels[index] && (
                                <span className={cn(
                                    'text-xs mt-2',
                                    isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                                )}>
                                    {labels[index]}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 원형 진행률 표시 컴포넌트
export const CircularProgress: React.FC<{
    value: number;
    size?: number;
    strokeWidth?: number;
    showPercentage?: boolean;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    className?: string;
}> = ({
    value,
    size = 120,
    strokeWidth = 8,
    showPercentage = true,
    variant = 'default',
    className
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    const getStrokeColor = () => {
        switch (variant) {
            case 'success':
                return 'stroke-green-500';
            case 'warning':
                return 'stroke-yellow-500';
            case 'error':
                return 'stroke-red-500';
            case 'info':
                return 'stroke-blue-500';
            case 'default':
            default:
                return 'stroke-blue-600';
        }
    };

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-gray-200"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn('transition-all duration-500 ease-out', getStrokeColor())}
                />
            </svg>
            {showPercentage && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">
                        {Math.round(value)}%
                    </span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;