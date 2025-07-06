import React, { useState, useEffect } from 'react';
import { Tournament, TournamentType, TournamentStatus } from '@/types';
import { TournamentCard } from './TournamentCard';
import { Button, Input } from '@/components/ui';
import { debounce } from '@/lib/utils';

interface TournamentListProps {
    tournaments: Tournament[];
    loading?: boolean;
    error?: string | null;
    currentUserId?: string;
    onView?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onRefresh?: () => void;
}

interface FilterOptions {
    search: string;
    type: TournamentType | 'all';
    status: TournamentStatus | 'all';
    myTournaments: boolean;
}

const statusOptions = [
    { value: 'all', label: '전체 상태' },
    { value: TournamentStatus.DRAFT, label: '준비중' },
    { value: TournamentStatus.REGISTRATION, label: '등록중' },
    { value: TournamentStatus.IN_PROGRESS, label: '진행중' },
    { value: TournamentStatus.COMPLETED, label: '완료' },
    { value: TournamentStatus.CANCELLED, label: '취소' },
];

const typeOptions = [
    { value: 'all', label: '전체 유형' },
    { value: TournamentType.SINGLE_ELIMINATION, label: '단일 토너먼트' },
    { value: TournamentType.DOUBLE_ELIMINATION, label: '더블 토너먼트' },
    { value: TournamentType.ROUND_ROBIN, label: '리그전' },
    { value: TournamentType.SWISS, label: '스위스' },
    { value: TournamentType.LEAGUE, label: '리그' },
];

export const TournamentList: React.FC<TournamentListProps> = ({
    tournaments,
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
        myTournaments: false,
    });

    const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
    const [sortBy, setSortBy] = useState<'created_at' | 'start_date' | 'title'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // 토너먼트 필터링 및 정렬
    useEffect(() => {
        let filtered = [...tournaments];

        // 검색 필터
        if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(tournament =>
                tournament.title.toLowerCase().includes(searchTerm) ||
                tournament.description?.toLowerCase().includes(searchTerm)
            );
        }

        // 타입 필터
        if (filters.type !== 'all') {
            filtered = filtered.filter(tournament => tournament.type === filters.type);
        }

        // 상태 필터
        if (filters.status !== 'all') {
            filtered = filtered.filter(tournament => tournament.status === filters.status);
        }

        // 내 토너먼트 필터
        if (filters.myTournaments && currentUserId) {
            filtered = filtered.filter(tournament => tournament.creator_id === currentUserId);
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

        setFilteredTournaments(filtered);
    }, [tournaments, filters, sortBy, sortOrder, currentUserId]);

    // 검색 디바운스
    const debouncedSearchChange = debounce((value: string) => {
        setFilters(prev => ({ ...prev, search: value }));
    }, 300);

    const handleFilterChange = (key: keyof FilterOptions, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSortChange = (newSortBy: typeof sortBy) => {
        if (newSortBy === sortBy) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('desc');
        }
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            type: 'all',
            status: 'all',
            myTournaments: false,
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
        <div className="space-y-6">
            {/* 필터 및 검색 */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="space-y-4">
                    {/* 검색 */}
                    <div>
                        <Input
                            type="text"
                            placeholder="토너먼트 제목 또는 설명 검색..."
                            defaultValue={filters.search}
                            onChange={(value) => debouncedSearchChange(value)}
                            className="w-full"
                        />
                    </div>

                    {/* 필터 옵션 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* 상태 필터 */}
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {/* 타입 필터 */}
                        <select
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent"
                        >
                            {typeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {/* 내 토너먼트 필터 */}
                        {currentUserId && (
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={filters.myTournaments}
                                    onChange={(e) => handleFilterChange('myTournaments', e.target.checked)}
                                    className="rounded border-gray-300 text-match-blue focus:ring-match-blue"
                                />
                                <span className="text-sm font-medium">내 토너먼트</span>
                            </label>
                        )}

                        {/* 필터 초기화 */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="w-full"
                        >
                            필터 초기화
                        </Button>
                    </div>
                </div>
            </div>

            {/* 정렬 및 결과 카운트 */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    총 {filteredTournaments.length}개의 토너먼트
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">정렬:</span>
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [newSortBy, newSortOrder] = e.target.value.split('-');
                            setSortBy(newSortBy as typeof sortBy);
                            setSortOrder(newSortOrder as typeof sortOrder);
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-match-blue focus:border-transparent"
                    >
                        <option value="created_at-desc">최신 생성순</option>
                        <option value="created_at-asc">오래된 생성순</option>
                        <option value="start_date-desc">시작일 (늦은 순)</option>
                        <option value="start_date-asc">시작일 (빠른 순)</option>
                        <option value="title-asc">제목 (가나다순)</option>
                        <option value="title-desc">제목 (역순)</option>
                    </select>
                </div>
            </div>

            {/* 토너먼트 목록 */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 로딩 스켈레톤 */}
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 rounded-lg h-64"></div>
                        </div>
                    ))}
                </div>
            ) : filteredTournaments.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-lg font-semibold">토너먼트가 없습니다</p>
                        <p className="text-gray-600">
                            {filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.myTournaments
                                ? '검색 조건에 맞는 토너먼트가 없습니다.'
                                : '아직 생성된 토너먼트가 없습니다.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTournaments.map((tournament) => (
                        <TournamentCard
                            key={tournament.id}
                            tournament={tournament}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            showActions={true}
                            isOwner={currentUserId === tournament.creator_id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TournamentList; 