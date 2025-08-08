'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/types';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', disabled, loading, children, onClick, ...props }, ref) => {
        // Clean, professional base styles with subtle shadows
        const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        // Updated variants with new color system - more subtle and professional
        const variants = {
            primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm hover:shadow-md',
            secondary: 'bg-gray-50 text-gray-700 hover:bg-gray-100 focus:ring-gray-400 border border-gray-200',
            outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500 bg-white',
            ghost: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-400',
            destructive: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-sm hover:shadow-md',
            danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 shadow-sm hover:shadow-md',
        };

        // Updated sizes with better proportions
        const sizes = {
            sm: 'text-sm px-3 py-1.5 rounded-md',
            md: 'text-base px-4 py-2 rounded-lg',
            lg: 'text-lg px-6 py-2.5 rounded-lg',
        };

        const handleClick = () => {
            if (disabled || loading) return;
            onClick?.();
        };

        return (
            <button
                className={cn(
                    baseClasses,
                    variants[variant],
                    sizes[size],
                    loading && 'pointer-events-none',
                    className
                )}
                disabled={disabled || loading}
                onClick={handleClick}
                ref={ref}
                {...props}
            >
                {loading && (
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button; 