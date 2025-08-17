'use client';

import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'list' | 'table' | 'post';
  count?: number;
  className?: string;
  height?: string | number;
  width?: string | number;
}

export default function SkeletonLoader({
  variant = 'rect',
  count = 1,
  className = '',
  height,
  width
}: SkeletonLoaderProps) {
  const baseClass = 'animate-pulse bg-gray-200 rounded';
  
  // 변형별 스타일
  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return `h-4 ${width ? `w-[${width}]` : 'w-full'} ${baseClass}`;
      case 'circle':
        return `rounded-full ${height ? `h-[${height}]` : 'h-12'} ${width ? `w-[${width}]` : 'w-12'} ${baseClass}`;
      case 'card':
        return `h-48 w-full ${baseClass} p-4`;
      case 'list':
        return `h-16 w-full ${baseClass} mb-2`;
      case 'table':
        return `h-12 w-full ${baseClass} mb-1`;
      case 'post':
        return `h-32 w-full ${baseClass} p-4 mb-4`;
      default:
        return `${height ? `h-[${height}]` : 'h-20'} ${width ? `w-[${width}]` : 'w-full'} ${baseClass}`;
    }
  };
  
  // 복잡한 레이아웃을 위한 프리셋
  const renderPreset = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`${baseClass} p-4 ${className}`}>
            <div className="h-32 bg-gray-300 rounded mb-4" />
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
          </div>
        );
      
      case 'list':
        return (
          <div className={`flex items-center gap-4 p-4 ${baseClass} ${className}`}>
            <div className="h-12 w-12 bg-gray-300 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className={`${className}`}>
            {/* 테이블 헤더 */}
            <div className={`flex gap-4 p-3 ${baseClass} mb-2`}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-gray-300 rounded flex-1" />
              ))}
            </div>
            {/* 테이블 로우 */}
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className={`flex gap-4 p-3 ${baseClass} mb-1`}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-gray-300 rounded flex-1" />
                ))}
              </div>
            ))}
          </div>
        );
      
      case 'post':
        return (
          <div className={`${baseClass} p-4 ${className}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-gray-300 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-300 rounded w-1/6" />
              </div>
            </div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2" />
            <div className="h-4 bg-gray-300 rounded w-5/6 mb-2" />
            <div className="h-4 bg-gray-300 rounded w-3/4" />
          </div>
        );
      
      default:
        return <div className={`${getVariantClass()} ${className}`} />;
    }
  };
  
  // 반복 렌더링
  if (['card', 'list', 'post'].includes(variant) || variant === 'table') {
    if (variant === 'table') {
      return renderPreset();
    }
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>{renderPreset()}</div>
        ))}
      </>
    );
  }
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${getVariantClass()} ${className}`} />
      ))}
    </>
  );
}

// 특화된 스켈레톤 컴포넌트들
export function MatchCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-6 bg-gray-200 rounded w-2/3" />
        <div className="h-6 w-20 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded flex-1" />
        <div className="h-8 bg-gray-200 rounded flex-1" />
      </div>
    </div>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-4 mb-3">
        <div className="h-16 w-16 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-8 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div>
        <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
        <div className="h-10 bg-gray-200 rounded w-full" />
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-10 bg-gray-200 rounded w-full" />
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
        <div className="h-24 bg-gray-200 rounded w-full" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 bg-gray-200 rounded flex-1" />
        <div className="h-10 bg-gray-200 rounded flex-1" />
      </div>
    </div>
  );
}