/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Match, MatchType, MatchStatus } from '@/types';
import { CompactMatchCard } from './CompactMatchCard';
import { Button, Input, EmptyState } from '@/components/ui';
import { Trophy } from 'lucide-react';
import { debounce } from '@/lib/utils';

interface MatchListProps {
    matches: Match[];
    loading?: boolean;
    error?: string | null;
    currentUserId?: string;
    onView?: (matchId: string) => void;
    onEdit?: (matchId: string) => void;
    onDelete?: (matchId: string) => void;
    onRefresh?: () => void;
}

interface FilterOptions {
    search: string;
    type: MatchType | 'all';
    status: MatchStatus | 'all';
    myMatches: boolean;
}

const statusOptions = [
    { value: 'all', label: '전체 상태' },
    { value: MatchStatus.DRAFT, label: '준비중' },
    { value: MatchStatus.REGISTRATION, label: '등록중' },
    { value: MatchStatus.IN_PROGRESS, label: '진행중' },
    { value: MatchStatus.COMPLETED, label: '완료' },
    { value: MatchStatus.CANCELLED, label: '취소' },
];

const typeOptions = [
    { value: 'all', label: '전체 유형' },
    { value: MatchType.SINGLE_ELIMINATION, label: '단일 토너먼트' },
    { value: MatchType.DOUBLE_ELIMINATION, label: '더블 토너먼트' },
    { value: MatchType.ROUND_ROBIN, label: '리그전' },
    { value: MatchType.SWISS, label: '스위스' },
    { value: MatchType.LEAGUE, label: '리그' },
];

export const MatchList: React.FC<MatchListProps> = ({
    matches,
    loading = false,
    error = null,
    currentUserId,
    onView,
    onEdit,
    onDelete,
    onRefresh,
}) => {
    const [filters, setFilters] = useState<FilterOptions>({
        search: '',
        type: 'all',
        status: 'all',
        myMatches: false,
    });

    const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
    const [sortBy] = useState<'created_at' | 'start_date' | 'title'>('created_at');
    const [sortOrder] = useState<'asc' | 'desc'>('desc');

    // 경기 필터링 및 정렬
    useEffect(() => {
        let filtered = [...matches];

        // 검색 필터
        if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(match =>
                match.title.toLowerCase().includes(searchTerm) ||
                match.description?.toLowerCase().includes(searchTerm)
            );
        }

        // 타입 필터
        if (filters.type !== 'all') {
            filtered = filtered.filter(match => match.type === filters.type);
        }

        // 상태 필터
        if (filters.status !== 'all') {
            filtered = filtered.filter(match => match.status === filters.status);
        }

        // 내 경기 필터
        if (filters.myMatches && currentUserId) {
            filtered = filtered.filter(match => match.creator_id === currentUserId);
        }

        // 정렬
        filtered.sort((a, b) => {
            let aValue: any = a[sortBy];
            let bValue: any = b[sortBy];

            if (sortBy === 'title') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            } else if (sortBy === 'created_at' || sortBy === 'start_date') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredMatches(filtered);
    }, [matches, filters, sortBy, sortOrder, currentUserId]);

    // 검색 디바운스
    const debouncedSearchChange = debounce((...args: unknown[]) => {
        const value = args[0] as string;
        setFilters(prev => ({ ...prev, search: value }));
    }, 300);

    const handleFilterChange = (key: keyof FilterOptions, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            type: 'all',
            status: 'all',
            myMatches: false,
        });
    };

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-lg font-semibold">오류가 발생했습니다</p>
                    <p className="text-gray-600">{error}</p>
                </div>
                {onRefresh && (
                    <Button onClick={onRefresh} variant="outline">
                        다시 시도
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div>
            {/* 경기 목록 - 필터 UI 제거하고 목록만 표시 */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 rounded-lg h-64"></div>
                        </div>
                    ))}
                </div>
            ) : filteredMatches.length === 0 ? (
                <EmptyState
                    icon={Trophy}
                    title={matches.length === 0 ? "아직 경기가 없습니다" : "검색 결과가 없습니다"}
                    description={
                        matches.length === 0
                            ? "새로운 경기를 생성하거나 다른 경기에 참가해보세요"
                            : "다른 검색 조건으로 다시 시도해보세요"
                    }
                    action={
                        matches.length === 0
                            ? { label: "경기 생성하기", href: "/matches/create" }
                            : undefined
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredMatches.map((match) => (
                        <CompactMatchCard
                            key={match.id}
                            match={match}
                            onView={onView}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MatchList; 