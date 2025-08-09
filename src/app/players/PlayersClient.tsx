'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Player, Team } from '@/types';
import { Button } from '@/components/ui';
import { SearchBar } from '@/components/search';
import { supabase } from '@/lib/supabase';

export default function PlayersClient() {
    const [players, setPlayers] = useState<(Player & { team?: Team })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    // 선수 목록 조회
    const fetchPlayers = async () => {
        try {
            setLoading(true);
            
            const { data, error: fetchError } = await supabase
                .from('players')
                .select(`
                    *,
                    team:teams(*)
                `)
                .order('name', { ascending: true });

            if (fetchError) {
                console.error('Players fetch error:', fetchError);
                setError('선수 목록을 불러오는데 실패했습니다.');
                return;
            }

            const formattedPlayers = (data || []).map((player: any) => ({
                ...player,
                email: player.email || undefined,
                avatar_url: player.avatar_url || undefined,
                team_id: player.team_id || undefined,
                position: player.position || undefined,
                jersey_number: player.jersey_number || undefined,
                stats: (player.stats as Record<string, any>) || undefined,
                team: player.team ? {
                    ...player.team,
                    logo_url: player.team.logo_url || undefined,
                    description: player.team.description || undefined,
                    captain_id: player.team.captain_id || undefined,
                    match_id: undefined, // teams 테이블에는 tournament_id가 없음
                } : undefined,
            }));

            setPlayers(formattedPlayers);
            setError(null);
        } catch (err) {
            console.error('Players fetch error:', err);
            setError('선수 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchPlayers();
    }, []);

    // 검색 필터링
    const filteredPlayers = useMemo(() => {
        if (!searchQuery) return players;
        
        const searchLower = searchQuery.toLowerCase();
        return players.filter(player => 
            player.name.toLowerCase().includes(searchLower) ||
            (player.team?.name?.toLowerCase().includes(searchLower)) ||
            (player.position?.toLowerCase().includes(searchLower)) ||
            (player.jersey_number?.toString().includes(searchQuery))
        );
    }, [players, searchQuery]);

    // 로딩 상태
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // 오류 발생 시
    if (error) {
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
                        <Button
                            onClick={fetchPlayers}
                            variant="primary"
                            size="md"
                        >
                            다시 시도
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">전체 선수</h1>
                    <p className="mt-2 text-gray-600">
                        등록된 모든 선수를 확인할 수 있습니다.
                    </p>
                </div>

                {/* 검색 바 */}
                <div className="mb-6">
                    <SearchBar
                        placeholder="선수명, 팀명, 포지션, 등번호로 검색..."
                        searchType="players"
                    />
                </div>

                {/* 검색 결과 요약 */}
                {searchQuery && (
                    <div className="mb-4 text-sm text-gray-600">
                        <span>"{searchQuery}" 검색 결과: </span>
                        <span className="font-medium">{filteredPlayers.length}명</span>의 선수를 찾았습니다.
                    </div>
                )}

                {/* 선수 목록 */}
                {filteredPlayers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchQuery ? '검색 결과가 없습니다' : '등록된 선수가 없습니다'}
                        </h3>
                        <p className="text-gray-600">
                            {searchQuery ? '다른 검색어로 시도해보세요.' : '팀에서 선수를 등록해주세요.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPlayers.map((player) => (
                            <div
                                key={player.id}
                                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/players/${player.id}`)}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                {player.avatar_url ? (
                                                    <Image
                                                        src={player.avatar_url}
                                                        alt={player.name}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full rounded-full object-cover"
                                                        unoptimized={true}
                                                    />
                                                ) : (
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {player.name}
                                                    {player.jersey_number && (
                                                        <span className="ml-2 text-sm font-normal text-gray-600">
                                                            #{player.jersey_number}
                                                        </span>
                                                    )}
                                                </h3>
                                                {player.team && (
                                                    <p className="text-sm text-gray-600">
                                                        {player.team.name}
                                                        {player.position && (
                                                            <span className="ml-2">• {player.position}</span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {player.email && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm text-gray-500 truncate">
                                                {player.email}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 통계 정보 */}
                <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">통계</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{players.length}</p>
                            <p className="text-sm text-gray-500">전체 선수</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                {new Set(players.map(p => p.team_id).filter(Boolean)).size}
                            </p>
                            <p className="text-sm text-gray-500">참가 팀</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                {new Set(players.map(p => p.position).filter(Boolean)).size}
                            </p>
                            <p className="text-sm text-gray-500">포지션 종류</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                {players.filter(p => p.jersey_number).length}
                            </p>
                            <p className="text-sm text-gray-500">등번호 보유</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}