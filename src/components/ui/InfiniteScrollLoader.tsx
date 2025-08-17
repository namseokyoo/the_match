'use client';

import React from 'react';

interface InfiniteScrollLoaderProps {
    isLoading: boolean;
    hasMore: boolean;
}

export default function InfiniteScrollLoader({ 
    isLoading, 
    hasMore 
}: InfiniteScrollLoaderProps) {
    if (!hasMore) {
        return (
            <div className="py-8 text-center text-gray-500 text-sm">
                더 이상 불러올 내용이 없습니다
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="py-8 flex justify-center">
                <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        );
    }

    return null;
}