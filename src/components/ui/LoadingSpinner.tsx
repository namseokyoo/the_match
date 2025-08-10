'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    fullScreen = false,
    className = ''
}) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const spinner = (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
            {text && (
                <p className={`mt-2 text-gray-600 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}`}>
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
};

interface SkeletonProps {
    className?: string;
    lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
    className = '', 
    lines = 1 
}) => {
    return (
        <div className={`animate-pulse ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
                <div 
                    key={index} 
                    className={`h-4 bg-gray-200 rounded ${index > 0 ? 'mt-2' : ''} ${
                        index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
                    }`}
                />
            ))}
        </div>
    );
};

interface CardSkeletonProps {
    count?: number;
    className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
    count = 1,
    className = ''
}) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div 
                    key={index} 
                    className={`bg-white rounded-lg p-6 animate-pulse border border-gray-200 ${className}`}
                >
                    <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="flex gap-4 mt-4">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default LoadingSpinner;