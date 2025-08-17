'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

interface BreadcrumbProps {
    items?: BreadcrumbItem[];
    className?: string;
    separator?: React.ReactNode;
    showHome?: boolean;
    variant?: 'default' | 'minimal' | 'mobile';
}

export default function Breadcrumb({ 
    items, 
    className,
    separator = <ChevronRight className="w-4 h-4 text-gray-400" />,
    showHome = true,
    variant = 'default'
}: BreadcrumbProps) {
    const pathname = usePathname();
    
    // 자동 생성 로직 (items가 제공되지 않은 경우)
    const generateItems = (): BreadcrumbItem[] => {
        const paths = pathname.split('/').filter(Boolean);
        const generated: BreadcrumbItem[] = [];
        
        if (showHome) {
            generated.push({ 
                label: '홈', 
                href: '/',
                icon: <Home className="w-4 h-4" />
            });
        }
        
        const pathMap: { [key: string]: string } = {
            'matches': '경기',
            'teams': '팀',
            'community': '커뮤니티',
            'posts': '게시글',
            'profile': '프로필',
            'dashboard': '대시보드',
            'create': '생성',
            'edit': '수정',
            'bracket': '대진표',
            'results': '결과',
            'checkin': '체크인',
            'calendar': '캘린더',
            'templates': '템플릿',
            'chat': '채팅',
            'stats': '통계',
            'players': '선수'
        };
        
        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            const isLast = index === paths.length - 1;
            
            // UUID 패턴 체크 (상세 페이지)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path);
            
            if (isUUID) {
                generated.push({
                    label: '상세',
                    href: isLast ? undefined : currentPath
                });
            } else {
                generated.push({
                    label: pathMap[path] || path,
                    href: isLast ? undefined : currentPath
                });
            }
        });
        
        return generated;
    };
    
    const breadcrumbItems = items || generateItems();
    
    // 홈 페이지에서는 브레드크럼 표시하지 않음
    if (pathname === '/' || breadcrumbItems.length === 0) {
        return null;
    }
    
    // 모바일 모드: 이전 페이지와 현재 페이지만 표시
    if (variant === 'mobile' && breadcrumbItems.length > 2) {
        const prevItem = breadcrumbItems[breadcrumbItems.length - 2];
        const currentItem = breadcrumbItems[breadcrumbItems.length - 1];
        
        return (
            <nav aria-label="Breadcrumb" className={cn('bg-white border-b border-gray-200', className)}>
                <div className="px-4 py-2">
                    <div className="flex items-center space-x-2 text-sm">
                        {prevItem.href && (
                            <Link
                                href={prevItem.href}
                                className="text-gray-500 hover:text-gray-900 transition-colors flex items-center"
                            >
                                ← {prevItem.label}
                            </Link>
                        )}
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900 font-medium">
                            {currentItem.label}
                        </span>
                    </div>
                </div>
            </nav>
        );
    }
    
    // 미니멀 모드
    if (variant === 'minimal') {
        return (
            <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
                <div className="flex items-center space-x-1">
                    {breadcrumbItems.map((item, index) => {
                        const isLast = index === breadcrumbItems.length - 1;
                        
                        return (
                            <React.Fragment key={index}>
                                {index > 0 && (
                                    <span className="text-gray-400">/</span>
                                )}
                                {isLast || !item.href ? (
                                    <span className="text-gray-900 font-medium">
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link 
                                        href={item.href}
                                        className="text-gray-500 hover:text-gray-900 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </nav>
        );
    }
    
    // 기본 모드
    return (
        <nav aria-label="Breadcrumb" className={cn('bg-white border-b border-gray-200', className)}>
            <div className="px-4 py-2">
                <ol className="flex items-center space-x-2 text-sm">
                    {breadcrumbItems.map((item, index) => {
                        const isLast = index === breadcrumbItems.length - 1;
                        
                        return (
                            <li key={index} className="flex items-center">
                                {index > 0 && (
                                    <span className="mx-2">
                                        {separator}
                                    </span>
                                )}
                                
                                {isLast || !item.href ? (
                                    <span className={cn(
                                        'flex items-center gap-1',
                                        isLast ? 'text-gray-900 font-medium' : 'text-gray-500'
                                    )}>
                                        {item.icon}
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link 
                                        href={item.href}
                                        className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    );
}

// 커스텀 브레드크럼 훅
export function useBreadcrumb() {
    const pathname = usePathname();
    
    const setBreadcrumb = (items: BreadcrumbItem[]) => {
        // 브레드크럼 데이터를 전역 상태로 관리할 수 있도록 확장 가능
        return items;
    };
    
    return { pathname, setBreadcrumb };
}