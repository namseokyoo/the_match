'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { debounce } from '@/lib/utils';

interface SearchResult {
    id: string;
    type: 'match' | 'team' | 'player';
    title: string;
    subtitle?: string;
    url: string;
    highlight?: string;
}

interface SearchHistory {
    query: string;
    timestamp: number;
}

interface EnhancedSearchProps {
    placeholder?: string;
    autoFocus?: boolean;
    showHistory?: boolean;
    showTrending?: boolean;
    onSearch?: (query: string) => void;
    className?: string;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
    placeholder = '경기, 팀, 선수를 검색하세요...',
    autoFocus = false,
    showHistory = true,
    showTrending = true,
    onSearch,
    className = '',
}) => {
    const [query, setQuery] = useState('');
    // Note: query variable used for search functionality
    const [results, setResults] = useState<SearchResult[]>([]);
    const [history, setHistory] = useState<SearchHistory[]>([]);
    const [trending, setTrending] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // 검색 히스토리 로드
    useEffect(() => {
        if (showHistory) {
            const savedHistory = localStorage.getItem('searchHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        }
        
        if (showTrending) {
            // TODO: API에서 트렌딩 검색어 가져오기
            setTrending(['챔피언스 리그', '축구', '토너먼트', '서울FC']);
        }
    }, [showHistory, showTrending]);

    // 실시간 검색
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            // 병렬로 여러 엔드포인트 검색
            const [matchesRes, teamsRes, playersRes] = await Promise.all([
                fetch(`/api/matches?search=${encodeURIComponent(searchQuery)}&limit=3`),
                fetch(`/api/teams?search=${encodeURIComponent(searchQuery)}&limit=3`),
                fetch(`/api/players?search=${encodeURIComponent(searchQuery)}&limit=3`),
            ]);

            const [matches, teams, players] = await Promise.all([
                matchesRes.json(),
                teamsRes.json(),
                playersRes.json(),
            ]);

            const searchResults: SearchResult[] = [];

            // 경기 결과
            if (matches.data) {
                matches.data.forEach((match: any) => {
                    searchResults.push({
                        id: match.id,
                        type: 'match',
                        title: match.title,
                        subtitle: `${match.type} • ${match.status}`,
                        url: `/matches/${match.id}`,
                        highlight: match.description,
                    });
                });
            }

            // 팀 결과
            if (teams.data) {
                teams.data.forEach((team: any) => {
                    searchResults.push({
                        id: team.id,
                        type: 'team',
                        title: team.name,
                        subtitle: `팀 • ${team.members_count || 0}명`,
                        url: `/teams/${team.id}`,
                        highlight: team.description,
                    });
                });
            }

            // 선수 결과
            if (players.data) {
                players.data.forEach((player: any) => {
                    searchResults.push({
                        id: player.id,
                        type: 'player',
                        title: player.name,
                        subtitle: player.team ? `${player.team.name} • ${player.position}` : player.position,
                        url: `/players/${player.id}`,
                    });
                });
            }

            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search
    const debouncedSearch = useMemo(
        () => debounce((searchQuery: string) => {
            performSearch(searchQuery);
        }, 300),
        [performSearch]
    );

    // 검색어 변경 처리
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(true);
        setSelectedIndex(-1);
        debouncedSearch(value);
    };

    // 검색 실행
    const handleSearch = (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        // 히스토리에 추가
        if (showHistory) {
            const newHistory: SearchHistory = {
                query: searchQuery,
                timestamp: Date.now(),
            };
            const updatedHistory = [newHistory, ...history.filter(h => h.query !== searchQuery)].slice(0, 10);
            setHistory(updatedHistory);
            localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        }

        // 검색 실행
        if (onSearch) {
            onSearch(searchQuery);
        } else {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
        
        setIsOpen(false);
        inputRef.current?.blur();
    };

    // 결과 선택
    const handleResultClick = (result: SearchResult) => {
        // 히스토리에 추가
        if (showHistory) {
            const newHistory: SearchHistory = {
                query: result.title,
                timestamp: Date.now(),
            };
            const updatedHistory = [newHistory, ...history.filter(h => h.query !== result.title)].slice(0, 10);
            setHistory(updatedHistory);
            localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        }

        router.push(result.url);
        setIsOpen(false);
    };

    // 키보드 네비게이션
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && results[selectedIndex]) {
                handleResultClick(results[selectedIndex]);
            } else {
                handleSearch(query);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 검색 히스토리 삭제
    const removeFromHistory = (queryToRemove: string) => {
        const updatedHistory = history.filter(h => h.query !== queryToRemove);
        setHistory(updatedHistory);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'match':
                return '🏆';
            case 'team':
                return '👥';
            case 'player':
                return '👤';
            default:
                return '🔍';
        }
    };

    return (
        <div className={`relative ${className}`}>
            {/* 검색 입력 */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
                )}
            </div>

            {/* 검색 드롭다운 */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
                >
                    {/* 검색 결과 */}
                    {results.length > 0 && (
                        <div className="p-2">
                            <div className="text-xs font-semibold text-gray-500 px-3 py-2">검색 결과</div>
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleResultClick(result)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full text-left px-3 py-2 rounded-md flex items-start space-x-3 transition-colors ${
                                        selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-xl mt-0.5">{getIcon(result.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">
                                            {result.title}
                                        </div>
                                        {result.subtitle && (
                                            <div className="text-sm text-gray-500 truncate">
                                                {result.subtitle}
                                            </div>
                                        )}
                                        {result.highlight && (
                                            <div className="text-xs text-gray-400 truncate mt-1">
                                                {result.highlight}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 검색 히스토리 */}
                    {showHistory && history.length > 0 && !query && (
                        <div className="p-2 border-t border-gray-100">
                            <div className="text-xs font-semibold text-gray-500 px-3 py-2 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                최근 검색
                            </div>
                            {history.slice(0, 5).map((item) => (
                                <div
                                    key={item.timestamp}
                                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-md group"
                                >
                                    <button
                                        onClick={() => {
                                            setQuery(item.query);
                                            handleSearch(item.query);
                                        }}
                                        className="flex-1 text-left text-sm text-gray-700"
                                    >
                                        {item.query}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromHistory(item.query);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 트렌딩 검색어 */}
                    {showTrending && trending.length > 0 && !query && (
                        <div className="p-2 border-t border-gray-100">
                            <div className="text-xs font-semibold text-gray-500 px-3 py-2 flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                인기 검색어
                            </div>
                            <div className="flex flex-wrap gap-2 px-3">
                                {trending.map((trend) => (
                                    <button
                                        key={trend}
                                        onClick={() => {
                                            setQuery(trend);
                                            handleSearch(trend);
                                        }}
                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                                    >
                                        {trend}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 검색 결과 없음 */}
                    {query && !isLoading && results.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <div className="text-sm">"{query}"에 대한 검색 결과가 없습니다</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EnhancedSearch;