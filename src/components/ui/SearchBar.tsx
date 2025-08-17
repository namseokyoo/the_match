'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    onFilterClick?: () => void;
    debounceMs?: number;
    className?: string;
    showFilter?: boolean;
    autoFocus?: boolean;
}

export default function SearchBar({
    placeholder = '검색어를 입력하세요',
    onSearch,
    onFilterClick,
    debounceMs = 300,
    className = '',
    showFilter = false,
    autoFocus = false
}: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout>();

    // 디바운스된 검색
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            onSearch(query);
        }, debounceMs);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [query, debounceMs, onSearch]);

    const handleClear = useCallback(() => {
        setQuery('');
        inputRef.current?.focus();
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        // 즉시 검색 실행
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        onSearch(query);
    }, [query, onSearch]);

    return (
        <form 
            onSubmit={handleSubmit}
            className={`relative ${className}`}
        >
            <div className={`
                flex items-center gap-2 bg-white rounded-lg border transition-all duration-200
                ${isFocused 
                    ? 'border-blue-500 shadow-lg ring-2 ring-blue-100' 
                    : 'border-gray-300 shadow-sm'
                }
            `}>
                <div className="pl-3">
                    <Search className="w-5 h-5 text-gray-400" />
                </div>
                
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="flex-1 px-2 py-3 text-sm focus:outline-none bg-transparent"
                />
                
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                )}
                
                {showFilter && onFilterClick && (
                    <button
                        type="button"
                        onClick={onFilterClick}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors mr-1"
                    >
                        <Filter className="w-4 h-4 text-gray-600" />
                    </button>
                )}
            </div>
        </form>
    );
}

// 검색 결과 하이라이트 컴포넌트
export function HighlightText({ 
    text, 
    highlight 
}: { 
    text: string; 
    highlight: string;
}) {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }

    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) =>
                regex.test(part) ? (
                    <mark key={index} className="bg-yellow-200 text-gray-900 font-medium">
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </span>
    );
}

// 검색 제안 컴포넌트
export function SearchSuggestions({
    suggestions,
    onSelect,
    query
}: {
    suggestions: string[];
    onSelect: (suggestion: string) => void;
    query: string;
}) {
    if (suggestions.length === 0) return null;

    return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
            <div className="py-2">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                        <HighlightText text={suggestion} highlight={query} />
                    </button>
                ))}
            </div>
        </div>
    );
}