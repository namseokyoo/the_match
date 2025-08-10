'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    quality?: number;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    className?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    lazy?: boolean;
    onLoad?: () => void;
    onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    width,
    height,
    priority = false,
    quality = 75,
    placeholder = 'blur',
    blurDataURL,
    className = '',
    objectFit = 'cover',
    lazy = true,
    onLoad,
    onError,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(!lazy);
    const imageRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!lazy || !imageRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px',
                threshold: 0.01,
            }
        );

        observer.observe(imageRef.current);

        return () => observer.disconnect();
    }, [lazy]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    // 기본 blur 데이터 URL (회색 placeholder)
    const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

    // 에러 발생 시 표시할 대체 이미지
    if (hasError) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 ${className}`}
                style={{ width, height }}
            >
                <Camera className="w-8 h-8 text-gray-400" />
            </div>
        );
    }

    // Next.js Image 컴포넌트 사용
    if (width && height) {
        return (
            <div ref={imageRef} className={`relative ${className}`}>
                {isInView && (
                    <>
                        {!isLoaded && (
                            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                        )}
                        <Image
                            src={src}
                            alt={alt}
                            width={width}
                            height={height}
                            priority={priority}
                            quality={quality}
                            placeholder={placeholder}
                            blurDataURL={blurDataURL || defaultBlurDataURL}
                            onLoad={handleLoad}
                            onError={handleError}
                            style={{ objectFit }}
                            className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                        />
                    </>
                )}
            </div>
        );
    }

    // fill 모드 (부모 컨테이너 크기에 맞춤)
    return (
        <div ref={imageRef} className={`relative ${className}`}>
            {isInView && (
                <>
                    {!isLoaded && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                    )}
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        priority={priority}
                        quality={quality}
                        placeholder={placeholder}
                        blurDataURL={blurDataURL || defaultBlurDataURL}
                        onLoad={handleLoad}
                        onError={handleError}
                        style={{ objectFit }}
                        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                    />
                </>
            )}
        </div>
    );
};

// 반응형 이미지 컴포넌트
interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
    sizes?: string;
    aspectRatio?: number; // 16/9, 4/3, 1 등
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
    aspectRatio = 16 / 9,
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    ...props
}) => {
    return (
        <div
            className="relative w-full"
            style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
        >
            <OptimizedImage {...props} />
        </div>
    );
};

// 썸네일 이미지 컴포넌트
interface ThumbnailImageProps extends OptimizedImageProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    rounded?: boolean;
}

export const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
    size = 'md',
    rounded = true,
    className = '',
    ...props
}) => {
    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32',
    };

    const dimensions = {
        sm: 48,
        md: 64,
        lg: 96,
        xl: 128,
    };

    return (
        <OptimizedImage
            {...props}
            width={dimensions[size]}
            height={dimensions[size]}
            className={`${sizeClasses[size]} ${rounded ? 'rounded-full' : 'rounded-lg'} overflow-hidden ${className}`}
        />
    );
};

// 갤러리 이미지 컴포넌트
interface GalleryImageProps {
    images: Array<{
        src: string;
        alt: string;
        caption?: string;
    }>;
    columns?: number;
    gap?: number;
}

export const GalleryImages: React.FC<GalleryImageProps> = ({
    images,
    columns = 3,
    gap = 4,
}) => {
    const [selectedImage, setSelectedImage] = useState<number | null>(null);

    return (
        <>
            <div
                className={`grid grid-cols-1 md:grid-cols-${columns} gap-${gap}`}
            >
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="relative cursor-pointer group"
                        onClick={() => setSelectedImage(index)}
                    >
                        <ResponsiveImage
                            src={image.src}
                            alt={image.alt}
                            aspectRatio={1}
                            className="rounded-lg overflow-hidden"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg" />
                        {image.caption && (
                            <p className="mt-2 text-sm text-gray-600">
                                {image.caption}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* 라이트박스 */}
            {selectedImage !== null && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-7xl max-h-full">
                        <OptimizedImage
                            src={images[selectedImage].src}
                            alt={images[selectedImage].alt}
                            width={1920}
                            height={1080}
                            quality={90}
                            priority
                            className="rounded-lg"
                        />
                        <button
                            className="absolute top-4 right-4 text-white hover:text-gray-300"
                            onClick={() => setSelectedImage(null)}
                        >
                            <span className="text-3xl">&times;</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default OptimizedImage;