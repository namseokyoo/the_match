'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    className?: string;
    disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    placement = 'top',
    delay = 200,
    className = '',
    disabled = false,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const targetRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const updatePosition = () => {
            if (!targetRef.current || !tooltipRef.current) return;

            const targetRect = targetRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            
            let top = 0;
            let left = 0;

            switch (placement) {
                case 'top':
                    top = targetRect.top - tooltipRect.height - 8;
                    left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                    break;
                case 'bottom':
                    top = targetRect.bottom + 8;
                    left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                    break;
                case 'left':
                    top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                    left = targetRect.left - tooltipRect.width - 8;
                    break;
                case 'right':
                    top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                    left = targetRect.right + 8;
                    break;
            }

            // Viewport boundaries
            const padding = 10;
            top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
            left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

            setPosition({ top, left });
        };

        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible, placement]);

    const handleMouseEnter = () => {
        if (disabled) return;
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    const handleFocus = () => {
        if (disabled) return;
        setIsVisible(true);
    };

    const handleBlur = () => {
        setIsVisible(false);
    };

    // Clone child element and add event handlers
    const childWithProps = React.cloneElement(children, {
        ref: targetRef,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        'aria-describedby': isVisible ? 'tooltip' : undefined,
    });

    return (
        <>
            {childWithProps}
            {isVisible && !disabled && createPortal(
                <div
                    ref={tooltipRef}
                    id="tooltip"
                    role="tooltip"
                    className={`
                        fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg
                        animate-fadeIn pointer-events-none
                        ${className}
                    `}
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                    }}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        className={`
                            absolute w-2 h-2 bg-gray-900 transform rotate-45
                            ${placement === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
                            ${placement === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
                            ${placement === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
                            ${placement === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
                        `}
                    />
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;