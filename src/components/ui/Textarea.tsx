'use client';

import React from 'react';

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value?: string;
    onChange?: (value: string) => void;
    error?: boolean;
    helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
    value = '',
    onChange,
    error = false,
    helperText,
    disabled = false,
    className = '',
    rows = 4,
    ...props
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    return (
        <div className="w-full">
            <textarea
                value={value}
                onChange={handleChange}
                disabled={disabled}
                rows={rows}
                className={`
                    w-full px-3 py-2 
                    border rounded-md 
                    transition-colors duration-200
                    resize-vertical
                    ${error 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-match-blue focus:ring-match-blue'
                    }
                    ${disabled 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-white text-gray-900'
                    }
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                    ${className}
                `}
                {...props}
            />
            {helperText && (
                <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Textarea;