'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items?: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
    const pathname = usePathname();
    
    // 자동 생성 로직 (items가 제공되지 않은 경우)
    const generateItems = (): BreadcrumbItem[] => {
        const paths = pathname.split('/').filter(Boolean);
        const generated: BreadcrumbItem[] = [
            { label: '홈', href: '/' }
        ];
        
        const pathMap: { [key: string]: string } = {
            'matches': '경기',
            'teams': '팀',
            'community': '커뮤니티',
            'posts': '게시글',
            'profile': '프로필',
            'dashboard': '대시보드',
            'create': '생성',
            'edit': '수정',
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
    if (pathname === '/') {
        return null;
    }
    
    return (
        <nav aria-label="Breadcrumb" className={`bg-white border-b border-gray-200 ${className}`}>
            <div className="px-4 py-2">
                <ol className="flex items-center space-x-2 text-sm">
                    {breadcrumbItems.map((item, index) => {
                        const isLast = index === breadcrumbItems.length - 1;
                        const isFirst = index === 0;
                        
                        return (
                            <li key={index} className="flex items-center">
                                {!isFirst && (
                                    <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                                )}
                                
                                {isLast || !item.href ? (
                                    <span className="text-gray-900 font-medium flex items-center">
                                        {isFirst && <Home className="w-4 h-4 mr-1" />}
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link 
                                        href={item.href}
                                        className="text-gray-500 hover:text-gray-700 transition-colors flex items-center"
                                    >
                                        {isFirst && <Home className="w-4 h-4 mr-1" />}
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