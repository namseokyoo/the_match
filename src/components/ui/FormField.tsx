'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface ValidationRule {
    test: (value: unknown) => boolean;
    message: string;
}

interface FormFieldProps {
    label: string;
    name: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'textarea' | 'select';
    value: string | number;
    onChange: (value: string | number) => void;
    onBlur?: () => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    error?: string;
    helperText?: string;
    validationRules?: ValidationRule[];
    showValidation?: boolean;
    options?: { value: string; label: string }[]; // for select
    rows?: number; // for textarea
    min?: string | number; // for number, date inputs
    max?: string | number; // for number, date inputs
    autoComplete?: string;
    className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    onBlur,
    placeholder,
    required = false,
    disabled = false,
    readOnly = false,
    error,
    helperText,
    validationRules = [],
    showValidation = true,
    options = [],
    rows = 3,
    min,
    max,
    autoComplete,
    className = '',
}) => {
    const [touched, setTouched] = useState(false);
    const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [validationMessage, setValidationMessage] = useState('');

    // 유효성 검사 실행
    useEffect(() => {
        if (!showValidation || !touched) {
            setValidationState('idle');
            return;
        }

        // 외부에서 전달된 에러가 있으면 우선 표시
        if (error) {
            setValidationState('invalid');
            setValidationMessage(error);
            return;
        }

        // 필수 필드 검사
        if (required && !value) {
            setValidationState('invalid');
            setValidationMessage(`${label}은(는) 필수 입력 항목입니다.`);
            return;
        }

        // 커스텀 유효성 규칙 검사
        for (const rule of validationRules) {
            if (!rule.test(value)) {
                setValidationState('invalid');
                setValidationMessage(rule.message);
                return;
            }
        }

        // 모든 검사 통과
        if (value) {
            setValidationState('valid');
            setValidationMessage('');
        } else {
            setValidationState('idle');
            setValidationMessage('');
        }
    }, [value, touched, error, required, validationRules, label, showValidation]);

    const handleBlur = () => {
        setTouched(true);
        onBlur?.();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
        onChange(newValue);
    };

    const fieldId = `field-${name}`;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;

    const inputClasses = `
        w-full px-3 py-2 border rounded-md transition-all
        ${validationState === 'valid' ? 'border-green-500 focus:ring-green-500' : ''}
        ${validationState === 'invalid' ? 'border-red-500 focus:ring-red-500' : ''}
        ${validationState === 'idle' ? 'border-gray-300 focus:ring-blue-500' : ''}
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        focus:outline-none focus:ring-2 focus:ring-opacity-50
        ${className}
    `.trim();

    const renderValidationIcon = () => {
        if (!showValidation || !touched) return null;

        switch (validationState) {
            case 'valid':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'invalid':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return null;
        }
    };

    const renderField = () => {
        const commonProps = {
            id: fieldId,
            name,
            value: value || '',
            onChange: handleChange,
            onBlur: handleBlur,
            disabled,
            readOnly,
            placeholder,
            required,
            autoComplete,
            'aria-invalid': validationState === 'invalid',
            'aria-describedby': validationMessage ? errorId : helperText ? helperId : undefined,
            className: inputClasses,
        };

        if (type === 'textarea') {
            return (
                <textarea
                    {...commonProps}
                    rows={rows}
                />
            );
        }

        if (type === 'select') {
            return (
                <select {...commonProps}>
                    <option value="">선택하세요</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <input
                {...commonProps}
                type={type}
                min={min}
                max={max}
            />
        );
    };

    return (
        <div className="mb-4">
            <label htmlFor={fieldId} className="block mb-2">
                <span className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </span>
            </label>

            <div className="relative">
                {renderField()}
                {renderValidationIcon() && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {renderValidationIcon()}
                    </div>
                )}
            </div>

            {/* 유효성 검사 메시지 */}
            {validationState === 'invalid' && validationMessage && (
                <p id={errorId} className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationMessage}
                </p>
            )}

            {/* 도움말 텍스트 */}
            {helperText && validationState !== 'invalid' && (
                <p id={helperId} className="mt-1 text-sm text-gray-500 flex items-center">
                    <Info className="w-4 h-4 mr-1" />
                    {helperText}
                </p>
            )}

            {/* 성공 메시지 */}
            {validationState === 'valid' && showValidation && (
                <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    올바른 입력입니다
                </p>
            )}
        </div>
    );
};

// 일반적으로 사용되는 유효성 검사 규칙들
export const validationRules = {
    email: {
        test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: '올바른 이메일 형식이 아닙니다',
    },
    minLength: (min: number) => ({
        test: (value: string) => value.length >= min,
        message: `최소 ${min}자 이상 입력해주세요`,
    }),
    maxLength: (max: number) => ({
        test: (value: string) => value.length <= max,
        message: `최대 ${max}자까지 입력 가능합니다`,
    }),
    pattern: (pattern: RegExp, message: string) => ({
        test: (value: string) => pattern.test(value),
        message,
    }),
    phone: {
        test: (value: string) => /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/.test(value),
        message: '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)',
    },
    url: {
        test: (value: string) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        message: '올바른 URL 형식이 아닙니다',
    },
    number: {
        test: (value: unknown) => !isNaN(Number(value)),
        message: '숫자만 입력 가능합니다',
    },
    min: (min: number) => ({
        test: (value: number) => value >= min,
        message: `${min} 이상의 값을 입력해주세요`,
    }),
    max: (max: number) => ({
        test: (value: number) => value <= max,
        message: `${max} 이하의 값을 입력해주세요`,
    }),
};

export default FormField;