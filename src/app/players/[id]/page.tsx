'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Player, Team } from '@/types';
import { Button } from '@/components/ui';
import { EditPlayerModal } from '@/components/player';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function PlayerProfilePage() {
    const [player, setPlayer] = useState<Player | null>(null);
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const playerId = params.id as string;

    // 선수 정보 조회
    const fetchPlayer = useCallback(async () => {
        try {
            setLoading(true);
            
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .select(`
                    *,
                    team:teams(*)
                `)
                .eq('id', playerId)
                .single();

            if (playerError) {
                if (playerError.code === 'PGRST116') {
                    setError('선수를 찾을 수 없습니다.');
                } else {
                    console.error('Player fetch error:', playerError);
                    setError('선수 정보를 불러오는데 실패했습니다.');
                }
                return;
            }

            setPlayer({
                ...playerData,
                email: playerData.email || undefined,
                avatar_url: playerData.avatar_url || undefined,
                team_id: playerData.team_id || undefined,
                position: playerData.position || undefined,
                jersey_number: playerData.jersey_number || undefined,
                stats: (playerData.stats as Record<string, any>) || undefined,
            });
            
            if (playerData.team) {
                setTeam({
                    ...playerData.team,
                    logo_url: playerData.team.logo_url || undefined,
                    description: playerData.team.description || undefined,
                    captain_id: playerData.team.captain_id || undefined,
                    match_id: undefined, // teams 테이블에는 tournament_id가 없음
                });
            }
            
            setError(null);
        } catch (err) {
            console.error('Player fetch error:', err);
            setError('선수 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [playerId]);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (playerId) {
            fetchPlayer();
        }
    }, [playerId, fetchPlayer]);

    // 선수 정보 수정
    const handleEdit = () => {
        if (!isOwner) {
            alert('팀 캡틴만 선수 정보를 수정할 수 있습니다.');
            return;
        }
        setIsEditModalOpen(true);
    };

    // 선수 수정 완료 처리
    const handlePlayerUpdated = (updatedPlayer: Player) => {
        setPlayer(updatedPlayer);
        setIsEditModalOpen(false);
    };

    // 선수 삭제
    const handleDelete = async () => {
        if (!isOwner) {
            alert('팀 캡틴만 선수를 삭제할 수 있습니다.');
            return;
        }

        if (!player) return;

        const confirmDelete = window.confirm(
            `정말로 "${player.name}" 선수를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
        );

        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', playerId);

            if (error) {
                console.error('Player deletion error:', error);
                alert('선수 삭제에 실패했습니다: ' + error.message);
                return;
            }

            alert(`${player.name} 선수가 성공적으로 삭제되었습니다.`);
            
            // 팀 페이지로 이동
            if (team) {
                router.push(`/teams/${team.id}`);
            } else {
                router.push('/teams');
            }
        } catch (error) {
            console.error('Player deletion error:', error);
            alert('선수 삭제 중 오류가 발생했습니다.');
        }
    };

    // 권한 확인 (팀 캡틴인지)
    const isOwner = user && team && team.captain_id === user.id;

    // 로딩 상태
    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
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
                        <div className="space-x-4">
                            <Button
                                onClick={fetchPlayer}
                                variant="primary"
                                size="md"
                            >
                                다시 시도
                            </Button>
                            <Button
                                onClick={() => router.push('/teams')}
                                variant="secondary"
                                size="md"
                            >
                                팀 목록으로 돌아가기
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 선수를 찾을 수 없는 경우
    if (!player) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto max-w-md">
                        <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            선수를 찾을 수 없습니다
                        </h3>
                        <p className="text-gray-600 mb-6">
                            요청하신 선수가 존재하지 않거나 삭제되었습니다.
                        </p>
                        <Button
                            onClick={() => router.push('/teams')}
                            variant="primary"
                            size="md"
                        >
                            팀 목록으로 돌아가기
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 브레드크럼 네비게이션 */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
                    <button
                        onClick={() => router.push('/teams')}
                        className="hover:text-gray-700 transition-colors"
                    >
                        팀 목록
                    </button>
                    {team && (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <button
                                onClick={() => router.push(`/teams/${team.id}`)}
                                className="hover:text-gray-700 transition-colors truncate"
                            >
                                {team.name}
                            </button>
                        </>
                    )}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-900 font-medium truncate">
                        {player.name}
                    </span>
                </nav>

                {/* 선수 프로필 카드 */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {/* 헤더 배경 */}
                    <div className="h-32 bg-gradient-to-r from-match-blue to-blue-600"></div>
                    
                    {/* 프로필 정보 */}
                    <div className="px-6 pb-6">
                        <div className="flex items-end -mt-16 mb-4">
                            <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                {player.avatar_url ? (
                                    <Image
                                        src={player.avatar_url}
                                        alt={player.name}
                                        width={128}
                                        height={128}
                                        className="w-full h-full rounded-full object-cover"
                                        unoptimized={true}
                                    />
                                ) : (
                                    <svg className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>
                            
                            {isOwner && (
                                <div className="ml-auto space-x-2">
                                    <Button
                                        onClick={handleEdit}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        수정
                                    </Button>
                                    <Button
                                        onClick={handleDelete}
                                        variant="secondary"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        삭제
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* 기본 정보 */}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                    {player.name}
                                    {player.jersey_number && (
                                        <span className="ml-2 text-lg font-normal text-gray-600">
                                            #{player.jersey_number}
                                        </span>
                                    )}
                                </h1>
                                {team && (
                                    <p className="text-gray-600">
                                        <button
                                            onClick={() => router.push(`/teams/${team.id}`)}
                                            className="hover:text-match-blue transition-colors"
                                        >
                                            {team.name}
                                        </button>
                                        {player.position && (
                                            <span className="ml-2">• {player.position}</span>
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* 연락처 정보 */}
                            {player.email && (
                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">연락처</h3>
                                    <p className="text-gray-900">
                                        <a
                                            href={`mailto:${player.email}`}
                                            className="hover:text-match-blue transition-colors"
                                        >
                                            {player.email}
                                        </a>
                                    </p>
                                </div>
                            )}

                            {/* 통계 정보 (추후 구현) */}
                            {player.stats && Object.keys(player.stats).length > 0 && (
                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">통계</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {Object.entries(player.stats).map(([key, value]) => (
                                            <div key={key} className="text-center">
                                                <p className="text-2xl font-bold text-gray-900">{value as string}</p>
                                                <p className="text-sm text-gray-500">{key}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 등록 정보 */}
                            <div className="pt-4 border-t">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">등록 정보</h3>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-600">
                                        등록일: {new Date(player.created_at).toLocaleDateString('ko-KR')}
                                    </p>
                                    {player.updated_at && player.updated_at !== player.created_at && (
                                        <p className="text-gray-600">
                                            최종 수정일: {new Date(player.updated_at).toLocaleDateString('ko-KR')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 추가 정보 섹션 (추후 구현) */}
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {/* 최근 경기 기록 */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 경기 기록</h2>
                        <p className="text-gray-500 text-sm">아직 경기 기록이 없습니다.</p>
                    </div>

                    {/* 수상 내역 */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">수상 내역</h2>
                        <p className="text-gray-500 text-sm">아직 수상 내역이 없습니다.</p>
                    </div>
                </div>
            </div>

            {/* 선수 수정 모달 */}
            <EditPlayerModal
                player={player}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onPlayerUpdated={handlePlayerUpdated}
            />
        </div>
    );
}