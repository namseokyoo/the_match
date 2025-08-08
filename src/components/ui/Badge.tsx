'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
        // Base styles for all badges
        const baseStyles = 'inline-flex items-center font-medium transition-colors duration-200';
        
        // Variant styles - subtle, professional colors
        const variantStyles = {
            default: 'bg-gray-100 text-gray-700 border border-gray-200',
            primary: 'bg-primary-50 text-primary-700 border border-primary-200',
            success: 'bg-success-50 text-success-700 border border-success-200',
            warning: 'bg-warning-50 text-warning-700 border border-warning-200',
            error: 'bg-error-50 text-error-700 border border-error-200',
            secondary: 'bg-gray-50 text-gray-600 border border-gray-200',
        };
        
        // Size styles
        const sizeStyles = {
            sm: 'text-xs px-2 py-0.5 rounded',
            md: 'text-sm px-2.5 py-1 rounded-md',
            lg: 'text-base px-3 py-1.5 rounded-md',
        };
        
        return (
            <span
                ref={ref}
                className={cn(
                    baseStyles,
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';

export default Badge;