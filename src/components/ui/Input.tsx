'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { InputProps } from '@/types';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', placeholder, value, defaultValue, disabled, required, onChange, ...props }, ref) => {
        // Clean, professional input design with subtle focus states
        const baseClasses = 'flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200';

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e.target.value);
        };

        return (
            <input
                type={type}
                className={cn(baseClasses, className)}
                placeholder={placeholder}
                value={value}
                defaultValue={defaultValue}
                disabled={disabled}
                required={required}
                onChange={handleChange}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';

export default Input; 