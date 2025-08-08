'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MatchList } from '@/components/match';
import { Button } from '@/components/ui';
import { SearchBar, FilterPanel } from '@/components/search';
import { Match, MatchType, MatchStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function MatchesClient() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        type: [] as MatchType[],
        status: [] as MatchStatus[],
        dateFrom: '',
        dateTo: '',
        sortBy: 'created_at' as 'created_at' | 'start_date' | 'title',
        sortOrder: 'desc' as 'asc' | 'desc',
    });
    
    const { user, getAccessToken, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    // 경기 목록 조회
    const fetchMatches = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/matches');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '경기 목록을 불러오는데 실패했습니다.');
            }

            setMatches(data.data || []);
            setError(null);
        } catch (err) {
            console.error('경기 목록 조회 오류:', err);
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 필터링된 경기 목록
    const filteredMatches = useMemo(() => {
        let result = [...matches];

        // 검색어 필터링
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(match => 
                match.title.toLowerCase().includes(query) ||
                match.description?.toLowerCase().includes(query)
            );
        }

        // 타입 필터링
        if (filters.type.length > 0) {
            result = result.filter(match => filters.type.includes(match.type as MatchType));
        }

        // 상태 필터링
        if (filters.status.length > 0) {
            result = result.filter(match => filters.status.includes(match.status as MatchStatus));
        }

        // 날짜 범위 필터링
        if (filters.dateFrom) {
            result = result.filter(match => 
                match.start_date && new Date(match.start_date) >= new Date(filters.dateFrom)
            );
        }
        if (filters.dateTo) {
            result = result.filter(match => 
                match.end_date && new Date(match.end_date) <= new Date(filters.dateTo)
            );
        }

        // 정렬
        result.sort((a, b) => {
            let compareValue = 0;
            
            switch (filters.sortBy) {
                case 'title':
                    compareValue = a.title.localeCompare(b.title);
                    break;
                case 'start_date':
                    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
                    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
                    compareValue = dateA - dateB;
                    break;
                case 'created_at':
                default:
                    compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }

            return filters.sortOrder === 'asc' ? compareValue : -compareValue;
        });

        return result;
    }, [matches, searchQuery, filters]);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchMatches();
    }, []);

    // 경기 보기
    const handleView = (id: string) => {
        router.push(`/matches/${id}`);
    };

    // 경기 수정
    const handleEdit = (id: string) => {
        router.push(`/matches/${id}/edit`);
    };

    // 경기 삭제
    const handleDelete = async (id: string) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const confirmDelete = window.confirm('정말로 이 경기를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
        if (!confirmDelete) return;

        try {
            const token = await getAccessToken();
            if (!token) {
                alert('인증 토큰을 가져올 수 없습니다.');
                return;
            }

            const response = await fetch(`/api/matches/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '경기 삭제에 실패했습니다.');
            }

            // 성공 시 목록 새로고침
            await fetchMatches();
            alert('경기가 성공적으로 삭제되었습니다.');
        } catch (err) {
            console.error('경기 삭제 오류:', err);
            alert(err instanceof Error ? err.message : '경기 삭제 중 오류가 발생했습니다.');
        }
    };

    // 경기 생성 페이지로 이동
    const handleCreateMatch = () => {
        if (!user) {
            alert('경기를 생성하려면 로그인이 필요합니다.');
            router.push('/login');
            return;
        }
        router.push('/matches/create');
    };

    // 초기 인증 로딩 중일 때만 스피너 표시
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {/* 페이지 헤더 - 반응형 디자인 */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div className="mb-4 sm:mb-0">
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">경기 목록</h1>
                            <p className="mt-1 text-xs sm:text-sm text-gray-600">
                                참가하고 싶은 경기를 찾아보세요
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => router.push('/matches/calendar')}
                                variant="secondary"
                                size="sm"
                                className="text-xs sm:text-sm"
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="hidden xs:inline">캘린더</span>
                            </Button>
                            <Button
                                onClick={() => router.push('/matches/create-recurring')}
                                variant="outline"
                                size="sm"
                                className="text-xs sm:text-sm"
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden xs:inline">반복</span>
                            </Button>
                            <Button
                                onClick={handleCreateMatch}
                                variant="primary"
                                size="sm"
                                className="text-xs sm:text-sm"
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                경기 생성
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 검색 바 */}
                <div className="mb-6">
                    <SearchBar
                        placeholder="경기 제목이나 설명으로 검색..."
                        searchType="matches"
                    />
                </div>

                {/* 필터 패널과 경기 목록 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="lg:col-span-1 order-2 lg:order-1">
                        <FilterPanel
                            filters={filters}
                            onFilterChange={(newFilters) => setFilters({
                                type: newFilters.type || [],
                                status: newFilters.status || [],
                                dateFrom: newFilters.dateFrom || '',
                                dateTo: newFilters.dateTo || '',
                                sortBy: newFilters.sortBy || 'created_at',
                                sortOrder: newFilters.sortOrder || 'desc',
                            })}
                            filterType="matches"
                        />
                    </div>
                    
                    <div className="lg:col-span-3">
                        {/* 검색 결과 요약 */}
                        {(searchQuery || filters.type.length > 0 || filters.status.length > 0) && (
                            <div className="mb-4 text-sm text-gray-600">
                                {searchQuery && (
                                    <span>"{searchQuery}" 검색 결과: </span>
                                )}
                                <span className="font-medium">{filteredMatches.length}개</span>의 경기를 찾았습니다.
                            </div>
                        )}

                        {/* 경기 목록 */}
                        <MatchList
                            matches={filteredMatches}
                            loading={loading}
                            error={error}
                            currentUserId={user?.id}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onRefresh={fetchMatches}
                        />

                        {/* 빈 상태 (경기가 없을 때) */}
                        {!loading && !error && filteredMatches.length === 0 && (
                            <div className="text-center py-12">
                                <div className="mx-auto max-w-md">
                                    {searchQuery || filters.type.length > 0 || filters.status.length > 0 ? (
                                        <>
                                            <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                검색 결과가 없습니다
                                            </h3>
                                            <p className="text-gray-600 mb-6">
                                                다른 검색어나 필터를 시도해보세요.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                아직 경기가 없습니다
                                            </h3>
                                            <p className="text-gray-600 mb-6">
                                                첫 번째 경기를 생성하여 경쟁을 시작해보세요!
                                            </p>
                                            <Button
                                                onClick={handleCreateMatch}
                                                variant="primary"
                                                size="md"
                                            >
                                                첫 경기 만들기
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}