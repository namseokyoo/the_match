'use client';

import React from 'react';

interface PullToRefreshIndicatorProps {
    pullDistance: number;
    threshold: number;
    isRefreshing: boolean;
}

export default function PullToRefreshIndicator({ 
    pullDistance, 
    threshold, 
    isRefreshing 
}: PullToRefreshIndicatorProps) {
    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = progress * 180;
    
    if (pullDistance === 0 && !isRefreshing) return null;
    
    return (
        <div 
            className="absolute top-0 left-0 right-0 flex justify-center items-center transition-all duration-300 ease-out"
            style={{
                height: `${pullDistance}px`,
                transform: `translateY(-${pullDistance}px)`
            }}
        >
            <div className="relative">
                {isRefreshing ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                ) : (
                    <svg
                        className="w-8 h-8 text-blue-600 transition-transform"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                        />
                    </svg>
                )}
                {!isRefreshing && (
                    <div className="text-xs text-gray-500 mt-1 text-center">
                        {progress >= 1 ? '놓아서 새로고침' : '당겨서 새로고침'}
                    </div>
                )}
            </div>
        </div>
    );
}