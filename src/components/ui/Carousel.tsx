'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
    children: React.ReactNode[];
    autoPlay?: boolean;
    autoPlayInterval?: number;
    showIndicators?: boolean;
    showArrows?: boolean;
    className?: string;
}

export default function Carousel({
    children,
    autoPlay = true,
    autoPlayInterval = 5000,
    showIndicators = true,
    showArrows = true,
    className = ''
}: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);

    const totalSlides = children.length;

    const goToSlide = useCallback((index: number) => {
        if (isTransitioning || totalSlides === 0) return;
        
        setIsTransitioning(true);
        setCurrentIndex(index);
        
        setTimeout(() => {
            setIsTransitioning(false);
        }, 300);
    }, [isTransitioning, totalSlides]);

    const goToPrevious = useCallback(() => {
        const newIndex = currentIndex === 0 ? totalSlides - 1 : currentIndex - 1;
        goToSlide(newIndex);
    }, [currentIndex, totalSlides, goToSlide]);

    const goToNext = useCallback(() => {
        const newIndex = currentIndex === totalSlides - 1 ? 0 : currentIndex + 1;
        goToSlide(newIndex);
    }, [currentIndex, totalSlides, goToSlide]);

    // Auto play
    useEffect(() => {
        if (autoPlay && totalSlides > 1) {
            intervalRef.current = setInterval(() => {
                goToNext();
            }, autoPlayInterval);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [autoPlay, autoPlayInterval, goToNext, totalSlides]);

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;

        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            goToNext();
        }
        if (isRightSwipe) {
            goToPrevious();
        }

        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    if (totalSlides === 0) {
        return null;
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children.map((child, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                        {child}
                    </div>
                ))}
            </div>

            {/* Arrows */}
            {showArrows && totalSlides > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-800" />
                    </button>
                </>
            )}

            {/* Indicators */}
            {showIndicators && totalSlides > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {children.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2 rounded-full transition-all ${
                                index === currentIndex
                                    ? 'w-8 bg-white'
                                    : 'w-2 bg-white/50 hover:bg-white/70'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}