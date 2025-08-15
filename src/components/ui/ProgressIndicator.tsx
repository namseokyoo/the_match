'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
    id: string;
    label: string;
    description?: string;
}

interface ProgressIndicatorProps {
    steps: Step[];
    currentStep: number;
    className?: string;
    variant?: 'linear' | 'circular';
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
    clickable?: boolean;
    onStepClick?: (_index: number) => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    steps,
    currentStep,
    className = '',
    variant = 'linear',
    size = 'md',
    showLabels = true,
    clickable = false,
    onStepClick,
}) => {
    const sizes = {
        sm: {
            circle: 'w-8 h-8',
            text: 'text-xs',
            line: 'h-0.5',
        },
        md: {
            circle: 'w-10 h-10',
            text: 'text-sm',
            line: 'h-1',
        },
        lg: {
            circle: 'w-12 h-12',
            text: 'text-base',
            line: 'h-1.5',
        },
    };

    const currentSize = sizes[size];

    const handleStepClick = (index: number) => {
        if (clickable && onStepClick) {
            onStepClick(index);
        }
    };

    if (variant === 'circular') {
        const percentage = ((currentStep + 1) / steps.length) * 100;
        const circumference = 2 * Math.PI * 45; // radius = 45
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div className={`relative inline-flex items-center justify-center ${className}`}>
                <svg className="w-32 h-32 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-200"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="text-blue-600 transition-all duration-500"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-bold text-gray-900">
                        {currentStep + 1}/{steps.length}
                    </span>
                    <span className="text-sm text-gray-500">
                        {steps[currentStep]?.label}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            <div className="relative flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isClickable = clickable && (isCompleted || isCurrent);

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step */}
                            <div
                                className={`relative flex flex-col items-center ${
                                    isClickable ? 'cursor-pointer' : ''
                                }`}
                                onClick={() => handleStepClick(index)}
                            >
                                {/* Circle */}
                                <div
                                    className={`
                                        ${currentSize.circle} rounded-full flex items-center justify-center
                                        transition-all duration-300
                                        ${
                                            isCompleted
                                                ? 'bg-blue-600 text-white'
                                                : isCurrent
                                                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                : 'bg-gray-200 text-gray-500'
                                        }
                                        ${isClickable ? 'hover:ring-4 hover:ring-blue-100' : ''}
                                    `}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span className="font-semibold">{index + 1}</span>
                                    )}
                                </div>

                                {/* Label */}
                                {showLabels && (
                                    <div className="absolute top-full mt-2 text-center">
                                        <p
                                            className={`
                                                ${currentSize.text} font-medium whitespace-nowrap
                                                ${
                                                    isCompleted || isCurrent
                                                        ? 'text-gray-900'
                                                        : 'text-gray-500'
                                                }
                                            `}
                                        >
                                            {step.label}
                                        </p>
                                        {step.description && isCurrent && (
                                            <p className="text-xs text-gray-500 mt-1 max-w-[120px]">
                                                {step.description}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`
                                        flex-1 ${currentSize.line} mx-2
                                        ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                                        transition-all duration-500
                                    `}
                                    style={{
                                        marginTop: showLabels ? `-${currentSize.circle.split(' ')[0].slice(2)}px` : '0',
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

// Simplified version for forms
export const FormProgress: React.FC<{
    totalSteps: number;
    currentStep: number;
    labels?: string[];
}> = ({ totalSteps, currentStep, labels }) => {
    const steps = Array.from({ length: totalSteps }, (_, i) => ({
        id: `step-${i}`,
        label: labels?.[i] || `Step ${i + 1}`,
    }));

    return <ProgressIndicator steps={steps} currentStep={currentStep} size="sm" />;
};

export default ProgressIndicator;