'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';

interface SearchBarProps {
    placeholder?: string;
    defaultValue?: string;
    onSearch?: (query: string) => void;
    className?: string;
    searchType?: 'matches' | 'teams' | 'players';
}

export const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = '검색어를 입력하세요...',
    defaultValue = '',
    onSearch,
    className = '',
    searchType = 'matches',
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(defaultValue || searchParams.get('q') || '');
    // Note: query variable used throughout component
    const [isSearching, setIsSearching] = useState(false);

    // URL 파라미터 변경 감지
    useEffect(() => {
        const urlQuery = searchParams.get('q');
        if (urlQuery) {
            setQuery(urlQuery);
        }
    }, [searchParams]);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        
        if (onSearch) {
            // 커스텀 검색 핸들러가 있으면 사용
            onSearch(query);
        } else {
            // 기본 동작: URL 파라미터 업데이트
            const params = new URLSearchParams(searchParams.toString());
            params.set('q', query);
            
            // 검색 타입에 따라 적절한 페이지로 이동
            const basePath = searchType === 'teams' ? '/teams' : 
                           searchType === 'players' ? '/players' : 
                           '/matches';
            
            router.push(`${basePath}?${params.toString()}`);
        }
        
        setIsSearching(false);
    }, [query, onSearch, router, searchParams, searchType]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClear = () => {
        setQuery('');
        
        // URL 파라미터에서 검색어 제거
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        
        const basePath = searchType === 'teams' ? '/teams' : 
                       searchType === 'players' ? '/players' : 
                       '/matches';
        
        router.push(params.toString() ? `${basePath}?${params.toString()}` : basePath);
        
        if (onSearch) {
            onSearch('');
        }
    };

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <div className="relative flex-1">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm placeholder:text-gray-400"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <Button
                onClick={handleSearch}
                variant="primary"
                disabled={!query.trim() || isSearching}
                loading={isSearching}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="ml-2 hidden sm:inline">검색</span>
            </Button>
        </div>
    );
};