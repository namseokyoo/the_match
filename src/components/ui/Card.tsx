'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
    status?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, hover = false, padding = 'md', variant = 'default', status = 'default', ...props }, ref) => {
        // Base classes for all cards
        const baseClasses = 'rounded-lg transition-all duration-200';

        // Variant styles
        const variantClasses = {
            default: 'bg-white border border-gray-200 shadow-sm',
            elevated: 'bg-white shadow-lg hover:shadow-xl',
            outlined: 'bg-white border-2 border-gray-200',
            ghost: 'bg-gray-50 border border-transparent'
        };

        // Status-based border colors
        const statusClasses = {
            default: '',
            success: 'border-l-4 border-l-green-500',
            warning: 'border-l-4 border-l-yellow-500',
            error: 'border-l-4 border-l-red-500',
            info: 'border-l-4 border-l-blue-500'
        };

        // Enhanced hover effects
        const hoverClasses = hover ? 
            'hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 cursor-pointer' : '';

        const paddingClasses = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };

        return (
            <div
                className={cn(
                    baseClasses, 
                    variantClasses[variant], 
                    statusClasses[status],
                    hoverClasses, 
                    paddingClasses[padding], 
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

// Card sub-components
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
        <div
            className={cn('flex flex-col space-y-1.5 pb-4', className)}
            ref={ref}
            {...props}
        >
            {children}
        </div>
    )
);

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, children, ...props }, ref) => (
        <h3
            className={cn('text-lg font-semibold leading-none tracking-tight', className)}
            ref={ref}
            {...props}
        >
            {children}
        </h3>
    )
);

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, children, ...props }, ref) => (
        <p
            className={cn('text-sm text-gray-600', className)}
            ref={ref}
            {...props}
        >
            {children}
        </p>
    )
);

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
        <div
            className={cn('', className)}
            ref={ref}
            {...props}
        >
            {children}
        </div>
    )
);

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
        <div
            className={cn('flex items-center pt-4', className)}
            ref={ref}
            {...props}
        >
            {children}
        </div>
    )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card; 