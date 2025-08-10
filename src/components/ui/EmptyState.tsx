'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import Button from './Button';
import Link from 'next/link';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    secondaryAction?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
            <div className="bg-gray-100 rounded-full p-6 mb-4">
                <Icon className="w-12 h-12 text-gray-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                {title}
            </h3>
            
            {description && (
                <p className="text-sm text-gray-600 mb-6 text-center max-w-sm">
                    {description}
                </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
                {action && (
                    action.href ? (
                        <Link href={action.href}>
                            <Button variant="primary" size="md">
                                {action.label}
                            </Button>
                        </Link>
                    ) : (
                        <Button 
                            variant="primary" 
                            size="md"
                            onClick={action.onClick}
                        >
                            {action.label}
                        </Button>
                    )
                )}
                
                {secondaryAction && (
                    secondaryAction.href ? (
                        <Link href={secondaryAction.href}>
                            <Button variant="outline" size="md">
                                {secondaryAction.label}
                            </Button>
                        </Link>
                    ) : (
                        <Button 
                            variant="outline" 
                            size="md"
                            onClick={secondaryAction.onClick}
                        >
                            {secondaryAction.label}
                        </Button>
                    )
                )}
            </div>
        </div>
    );
};

export default EmptyState;