'use client';

import React, { useState, useEffect } from 'react';
import Input from './Input';
import { cn } from '@/lib/utils';

interface FormFieldProps {
    label: string;
    name: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'time';
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    error?: string;
    required?: boolean;
    placeholder?: string;
    helpText?: string;
    disabled?: boolean;
    autoComplete?: string;
    maxLength?: number;
    showCharCount?: boolean;
    validate?: (value: string) => { isValid: boolean; message?: string };
    validateOnBlur?: boolean;
    validateOnChange?: boolean;
    className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    onBlur,
    error: externalError,
    required = false,
    placeholder,
    helpText,
    disabled = false,
    autoComplete,
    maxLength,
    showCharCount = false,
    validate,
    validateOnBlur = true,
    validateOnChange = false,
    className
}) => {
    const [internalError, setInternalError] = useState<string>('');
    const [touched, setTouched] = useState(false);
    
    const error = externalError || internalError;
    
    // 실시간 검증 (onChange)
    useEffect(() => {
        if (validateOnChange && touched && validate) {
            const result = validate(value);
            setInternalError(result.message || '');
        }
    }, [value, validate, validateOnChange, touched]);
    
    const handleBlur = () => {
        setTouched(true);
        
        // onBlur 검증
        if (validateOnBlur && validate) {
            const result = validate(value);
            setInternalError(result.message || '');
        }
        
        onBlur?.();
    };
    
    const handleChange = (newValue: string) => {
        onChange(newValue);
        
        // 에러가 있었다면 입력 시작하면 초기화
        if (error && !validateOnChange) {
            setInternalError('');
        }
    };
    
    return (
        <div className={cn('space-y-1', className)}>
            {/* Label */}
            <label 
                htmlFor={name} 
                className="block text-sm font-medium text-gray-700"
            >
                {label}
                {required && (
                    <span className="text-red-500 ml-1" aria-label="필수">
                        *
                    </span>
                )}
            </label>
            
            {/* Input Field */}
            <div className="relative">
                <Input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    maxLength={maxLength}
                    className={cn(
                        error && 'border-red-500 focus:ring-red-500',
                        'w-full'
                    )}
                    aria-invalid={!!error}
                    aria-describedby={
                        error ? `${name}-error` : 
                        helpText ? `${name}-help` : 
                        undefined
                    }
                />
                
                {/* Character Count */}
                {showCharCount && maxLength && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className={cn(
                            'text-xs',
                            value.length >= maxLength ? 'text-red-500' : 'text-gray-400'
                        )}>
                            {value.length}/{maxLength}
                        </span>
                    </div>
                )}
            </div>
            
            {/* Error Message */}
            {error && touched && (
                <p 
                    id={`${name}-error`} 
                    className="text-sm text-red-600 flex items-center gap-1"
                    role="alert"
                >
                    <svg 
                        className="w-4 h-4" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                    >
                        <path 
                            fillRule="evenodd" 
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                            clipRule="evenodd" 
                        />
                    </svg>
                    {error}
                </p>
            )}
            
            {/* Help Text */}
            {helpText && !error && (
                <p 
                    id={`${name}-help`} 
                    className="text-sm text-gray-500"
                >
                    {helpText}
                </p>
            )}
        </div>
    );
};

export default FormField;