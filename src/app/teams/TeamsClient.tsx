'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Team, Player, PaginatedResponse } from '@/types';
import { TeamList } from '@/components/team';
import { Button } from '@/components/ui';
import { SearchBar } from '@/components/search';
import { useAuth } from '@/hooks/useAuth';

export default function TeamsClient() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Record<string, Player[]>>({});
    const [pagination, setPagination] = useState<PaginatedResponse['pagination'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    // 팀 목록 조회
    const fetchTeams = useCallback(async (page = 1, search = '', reset = false) => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '12',
            });

            if (search.trim()) {
                params.append('search', search.trim());
            }

            const response = await fetch(`/api/teams?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '팀 목록을 불러오는데 실패했습니다.');
            }

            if (reset) {
                setTeams(data.data || []);
            } else {
                setTeams(prev => [...prev, ...(data.data || [])]);
            }

            setPagination(data.pagination);

            // 팀별 선수 정보 조회
            const teamIds = data.data?.map((team: Team) => team.id) || [];
            if (teamIds.length > 0) {
                await fetchPlayersForTeams(teamIds, reset);
            }

            setError(null);
        } catch (err) {
            console.error('Teams fetch error:', err);
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    // 팀별 선수 정보 조회
    const fetchPlayersForTeams = async (teamIds: string[], reset = false) => {
        try {
            const playersData: Record<string, Player[]> = {};

            // 각 팀의 선수 정보를 병렬로 조회
            await Promise.all(
                teamIds.map(async (teamId) => {
                    try {
                        const response = await fetch(`/api/teams/${teamId}`);
                        if (response.ok) {
                            const data = await response.json();
                            playersData[teamId] = data.data?.players || [];
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch players for team ${teamId}:`, error);
                        playersData[teamId] = [];
                    }
                })
            );

            if (reset) {
                setPlayers(playersData);
            } else {
                setPlayers(prev => ({ ...prev, ...playersData }));
            }
        } catch (error) {
            console.error('Players fetch error:', error);
        }
    };

    // URL 파라미터 변경 감지
    useEffect(() => {
        fetchTeams(1, searchQuery, true);
    }, [searchQuery]); // fetchTeams를 의존성에서 제거

    // 필터링된 팀 목록 (클라이언트 사이드 필터링)
    const filteredTeams = useMemo(() => {
        if (!searchQuery) return teams;
        
        const query = searchQuery.toLowerCase();
        return teams.filter(team => 
            team.name.toLowerCase().includes(query) ||
            team.description?.toLowerCase().includes(query)
        );
    }, [teams, searchQuery]);

    // 더 보기 핸들러
    const handleLoadMore = async () => {
        if (pagination?.hasNext) {
            await fetchTeams(pagination.page + 1, searchQuery, false);
        }
    };

    // 팀 클릭 핸들러
    const handleTeamClick = (team: Team) => {
        router.push(`/teams/${team.id}`);
    };

    // 팀 생성 페이지로 이동
    const handleCreateTeam = () => {
        if (!user) {
            router.push('/login');
            return;
        }
        router.push('/teams/create');
    };

    // 팀 삭제 핸들러
    const handleDeleteTeam = async (team: Team) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        const confirmDelete = window.confirm(`정말로 "${team.name}" 팀을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
        if (!confirmDelete) return;
        try {
            const response = await fetch(`/api/teams/${team.id}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '팀 삭제에 실패했습니다.');
            }
            alert(`${team.name} 팀이 성공적으로 삭제되었습니다.`);
            await fetchTeams(1, searchQuery, true);
        } catch (error) {
            console.error('팀 삭제 오류:', error);
            alert(error instanceof Error ? error.message : '팀 삭제 중 오류가 발생했습니다.');
        }
    };

    // 팀 수정 핸들러
    const handleEditTeam = (team: Team) => {
        router.push(`/teams/${team.id}/edit`);
    };

    // 초기 인증 로딩 중일 때만 스피너 표시
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // 오류 발생 시
    if (error && teams.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto max-w-md">
                        <svg className="w-20 h-20 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            오류가 발생했습니다
                        </h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="space-x-4">
                            <Button
                                onClick={() => fetchTeams(1, '', true)}
                                variant="primary"
                                size="md"
                            >
                                다시 시도
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 페이지 헤더 - 깔끔한 디자인 */}
                <div className="mb-8">
                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">팀 목록</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                등록된 팀들을 확인하고 관리하세요
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleCreateTeam}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                팀 생성
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 검색 바 */}
                <div className="mb-6">
                    <SearchBar
                        placeholder="팀 이름이나 설명으로 검색..."
                        searchType="teams"
                    />
                </div>

                {/* 검색 결과 요약 */}
                {searchQuery && (
                    <div className="mb-4 text-sm text-gray-600">
                        <span>"{searchQuery}" 검색 결과: </span>
                        <span className="font-medium">{filteredTeams.length}개</span>의 팀을 찾았습니다.
                    </div>
                )}

                {/* 통계 정보 */}
                {pagination && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 3a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            총 팀 수
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {pagination.total}개
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            총 선수 수
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {Object.values(players).reduce((acc, teamPlayers) => acc + teamPlayers.length, 0)}명
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            평균 선수 수
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {teams.length > 0
                                                ? Math.round(Object.values(players).reduce((acc, teamPlayers) => acc + teamPlayers.length, 0) / teams.length * 10) / 10
                                                : 0
                                            }명
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 팀 목록 */}
                <TeamList
                    teams={filteredTeams}
                    players={players}
                    pagination={pagination!}
                    loading={loading}
                    searchable={false}  // SearchBar 컴포넌트를 별도로 사용하므로 false
                    onLoadMore={handleLoadMore}
                    onTeamClick={handleTeamClick}
                    onEdit={handleEditTeam}
                    onDelete={handleDeleteTeam}
                    currentUserId={user?.id}
                    emptyMessage={
                        searchQuery
                            ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                            : '아직 등록된 팀이 없습니다. 첫 번째 팀을 만들어보세요!'
                    }
                />
            </div>
        </div>
    );
}