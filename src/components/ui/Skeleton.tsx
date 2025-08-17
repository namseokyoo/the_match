'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'text',
    width,
    height,
    animation = 'pulse'
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'circular':
                return 'rounded-full';
            case 'rectangular':
                return 'rounded-none';
            case 'rounded':
                return 'rounded-lg';
            case 'text':
            default:
                return 'rounded h-4';
        }
    };

    const getAnimationClasses = () => {
        switch (animation) {
            case 'wave':
                return 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';
            case 'none':
                return 'bg-gray-200';
            case 'pulse':
            default:
                return 'animate-pulse bg-gray-200';
        }
    };

    const style: React.CSSProperties = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : undefined)
    };

    return (
        <div
            className={cn(
                getVariantClasses(),
                getAnimationClasses(),
                className
            )}
            style={style}
            aria-hidden="true"
        />
    );
};

// 카드 스켈레톤
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('bg-white rounded-lg p-4 border border-gray-200', className)}>
        <div className="space-y-3">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
            <div className="flex gap-2 mt-4">
                <Skeleton variant="rounded" width="80px" height="32px" />
                <Skeleton variant="rounded" width="80px" height="32px" />
            </div>
        </div>
    </div>
);

// 리스트 아이템 스켈레톤
export const ListItemSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('flex items-center space-x-4 p-4', className)}>
        <Skeleton variant="circular" width="48px" height="48px" />
        <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
        </div>
    </div>
);

// 테이블 로우 스켈레톤
export const TableRowSkeleton: React.FC<{ columns?: number; className?: string }> = ({ 
    columns = 4, 
    className 
}) => (
    <tr className={className}>
        {Array.from({ length: columns }).map((_, index) => (
            <td key={index} className="px-4 py-3">
                <Skeleton variant="text" />
            </td>
        ))}
    </tr>
);

// 폼 필드 스켈레톤
export const FormFieldSkeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('space-y-2', className)}>
        <Skeleton variant="text" width="100px" height="14px" />
        <Skeleton variant="rounded" height="40px" />
    </div>
);

// 이미지 스켈레톤
export const ImageSkeleton: React.FC<{ 
    className?: string;
    aspectRatio?: 'square' | '16:9' | '4:3' | '21:9';
}> = ({ className, aspectRatio = '16:9' }) => {
    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case 'square':
                return 'aspect-square';
            case '4:3':
                return 'aspect-[4/3]';
            case '21:9':
                return 'aspect-[21/9]';
            case '16:9':
            default:
                return 'aspect-video';
        }
    };

    return (
        <Skeleton 
            variant="rounded" 
            className={cn(getAspectRatioClass(), className)}
        />
    );
};

export default Skeleton;