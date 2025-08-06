'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Team, Player } from '@/types';
import { TeamDetail } from '@/components/team';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function TeamDetailPage() {
    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const teamId = params.id as string;

    // 팀 상세 정보 조회
    const fetchTeam = useCallback(async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('teams')
                .select(`
                    *,
                    players:players(*)
                `)
                .eq('id', teamId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    setError('팀을 찾을 수 없습니다.');
                } else {
                    console.error('Team fetch error:', error);
                    setError('팀 정보를 불러오는데 실패했습니다.');
                }
                return;
            }

            setTeam({
                ...data,
                logo_url: data.logo_url || undefined,
                description: data.description || undefined,
                captain_id: data.captain_id || undefined,
                match_id: data.tournament_id || undefined, // tournament_id를 match_id로 매핑
            });
            setPlayers((data.players || []).map((player: any) => ({
                ...player,
                email: player.email || undefined,
                avatar_url: player.avatar_url || undefined,
                team_id: player.team_id || undefined,
                position: player.position || undefined,
                jersey_number: player.jersey_number || undefined,
                stats: (player.stats as Record<string, any>) || undefined,
            })));
            setError(null);
        } catch (err) {
            console.error('Team fetch error:', err);
            setError('팀 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (teamId) {
            fetchTeam();
        }
    }, [teamId, fetchTeam]);

    // 팀 수정 페이지로 이동
    const handleEdit = () => {
        router.push(`/teams/${teamId}/edit`);
    };

    // 팀 삭제
    const handleDelete = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!team) return;

        const confirmDelete = window.confirm(
            `정말로 "${team.name}" 팀을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 팀의 모든 선수 정보도 함께 삭제됩니다.`
        );

        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId);

            if (error) {
                console.error('Team deletion error:', error);
                alert('팀 삭제에 실패했습니다: ' + error.message);
                return;
            }

            alert(`${team.name} 팀이 성공적으로 삭제되었습니다.`);
            router.push('/teams');
        } catch (error) {
            console.error('Team deletion error:', error);
            alert('팀 삭제 중 오류가 발생했습니다.');
        }
    };

    // 선수 추가 (임시 - 추후 구현)
    const handleAddPlayer = () => {
        // TODO: 선수 추가 모달 또는 페이지로 이동
        alert('선수 추가 기능은 곧 구현됩니다.');
    };

    // 선수 수정 (임시 - 추후 구현)
    const handleEditPlayer = () => {
        // TODO: 선수 수정 모달 또는 페이지로 이동
        alert('선수 수정 기능은 곧 구현됩니다.');
    };

    // 선수 제거
    const handleRemovePlayer = async (playerId: string) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const player = players.find(p => p.id === playerId);
        if (!player) return;

        const confirmRemove = window.confirm(
            `정말로 "${player.name}" 선수를 팀에서 제거하시겠습니까?`
        );

        if (!confirmRemove) return;

        try {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', playerId);

            if (error) {
                console.error('Player removal error:', error);
                alert('선수 제거에 실패했습니다: ' + error.message);
                return;
            }

            // 로컬 상태 업데이트
            setPlayers(prev => prev.filter(p => p.id !== playerId));
            alert(`${player.name} 선수가 팀에서 제거되었습니다.`);
        } catch (error) {
            console.error('Player removal error:', error);
            alert('선수 제거 중 오류가 발생했습니다.');
        }
    };

    // 권한 확인
    const isOwner = user && team && team.captain_id === user.id;

    // 로딩 상태 (인증 확인 중 또는 데이터 로딩 중)
    if (loading || (authLoading && typeof window !== 'undefined' && !sessionStorage.getItem('auth_initialized'))) {
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
                                onClick={fetchTeam}
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

    // 팀을 찾을 수 없는 경우
    if (!team) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto max-w-md">
                        <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 3a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            팀을 찾을 수 없습니다
                        </h3>
                        <p className="text-gray-600 mb-6">
                            요청하신 팀이 존재하지 않거나 삭제되었습니다.
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 브레드크럼 네비게이션 */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
                    <button
                        onClick={() => router.push('/teams')}
                        className="hover:text-gray-700 transition-colors"
                    >
                        팀 목록
                    </button>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-900 font-medium truncate">
                        {team.name}
                    </span>
                </nav>

                {/* 팀 상세 정보 */}
                <TeamDetail
                    team={team}
                    players={players}
                    currentUserId={user?.id}
                    loading={false}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddPlayer={handleAddPlayer}
                    onEditPlayer={handleEditPlayer}
                    onRemovePlayer={handleRemovePlayer}
                    isOwner={isOwner || false}
                />
            </div>
        </div>
    );
}