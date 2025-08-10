'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Team, Player } from '@/types';
import { TeamDetail } from '@/components/team';
import TeamJoinRequests from '@/components/team/TeamJoinRequests';
import { Button } from '@/components/ui';
import { AddPlayerModal, EditPlayerModal } from '@/components/player';
import { useAuth } from '@/hooks/useAuth';
import { useTeamRealtime, usePlayersRealtime } from '@/hooks/useRealtimeSubscription';
import { showToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export default function TeamDetailPage() {
    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
    const [isEditPlayerModalOpen, setIsEditPlayerModalOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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
                match_id: undefined, // teams 테이블에는 tournament_id가 없음
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

    // 팀 실시간 업데이트 구독
    useTeamRealtime(teamId, {
        onUpdate: useCallback((payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Team updated:', payload);
            const updatedTeam = payload.new as Team;
            setTeam(updatedTeam);
            
            if (user && payload.new && (payload.new as any).updated_by !== user.id) {
                showToast('팀 정보가 업데이트되었습니다', 'info');
            }
        }, [user]),
        onDelete: useCallback(() => {
            showToast('팀이 삭제되었습니다', 'warning');
            router.push('/teams');
        }, [router]),
    });

    // 선수 실시간 업데이트 구독
    usePlayersRealtime(teamId, {
        onInsert: useCallback((payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Player added:', payload);
            const newPlayer = payload.new as Player;
            setPlayers(prev => [...prev, newPlayer]);
            
            if (user && (payload.new as any).created_by !== user.id) {
                showToast(`새로운 선수 ${newPlayer.name}이(가) 추가되었습니다`, 'info');
            }
        }, [user]),
        onUpdate: useCallback((payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Player updated:', payload);
            const updatedPlayer = payload.new as Player;
            setPlayers(prev => prev.map(p => 
                p.id === updatedPlayer.id ? updatedPlayer : p
            ));
            
            if (user && (payload.new as any).updated_by !== user.id) {
                showToast('선수 정보가 업데이트되었습니다', 'info');
            }
        }, [user]),
        onDelete: useCallback((payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Player deleted:', payload);
            const deletedPlayer = payload.old as Player;
            setPlayers(prev => prev.filter(p => p.id !== deletedPlayer.id));
            
            if (user && (payload.old as any).deleted_by !== user.id) {
                showToast(`선수 ${deletedPlayer.name}이(가) 제거되었습니다`, 'warning');
            }
        }, [user]),
    });

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

    // 선수 추가
    const handleAddPlayer = () => {
        if (!isOwner) {
            alert('팀 캡틴만 선수를 추가할 수 있습니다.');
            return;
        }
        setIsAddPlayerModalOpen(true);
    };

    // 선수 수정
    const handleEditPlayer = (player: Player) => {
        if (!isOwner) {
            alert('팀 캡틴만 선수 정보를 수정할 수 있습니다.');
            return;
        }
        setSelectedPlayer(player);
        setIsEditPlayerModalOpen(true);
    };

    // 선수 추가 완료 처리
    const handlePlayerAdded = (newPlayer: Player) => {
        setPlayers(prev => [...prev, newPlayer]);
        setIsAddPlayerModalOpen(false);
    };

    // 선수 수정 완료 처리
    const handlePlayerUpdated = (updatedPlayer: Player) => {
        setPlayers(prev => prev.map(p => 
            p.id === updatedPlayer.id ? updatedPlayer : p
        ));
        setIsEditPlayerModalOpen(false);
        setSelectedPlayer(null);
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

    // 팀 가입 신청
    const handleJoinTeam = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (!team) return;

        try {
            const response = await fetch(`/api/teams/${team.id}/join-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: user.user_metadata?.name || user.email?.split('@')[0] || '익명',
                    player_email: user.email,
                    message: '팀에 가입하고 싶습니다!'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '팀 가입 신청에 실패했습니다.');
            }

            alert(`${team.name} 팀에 가입 신청을 완료했습니다! 팀 주장의 승인을 기다려주세요.`);
            // 데이터 새로고침
            fetchTeam();
        } catch (error: any) {
            console.error('Team join error:', error);
            alert(error.message || '팀 가입 신청에 실패했습니다.');
        }
    };

    // 권한 및 멤버십 확인
    const isOwner = user && team && team.captain_id === user.id;
    const isMember = user && players.some(player => player.email === user.email);

    // 로딩 상태 (인증 확인 중 또는 데이터 로딩 중)
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
                    onJoinTeam={handleJoinTeam}
                    isOwner={isOwner || false}
                    isMember={isMember || false}
                />
                
                {/* 팀 가입 신청 관리 */}
                {(isOwner || !isMember) && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold mb-4">
                            {isOwner ? '팀 가입 신청 관리' : '가입 신청 현황'}
                        </h2>
                        <TeamJoinRequests 
                            teamId={teamId}
                            isCaptain={isOwner || false}
                            onRequestUpdate={fetchTeam}
                        />
                    </div>
                )}
            </div>

            {/* 선수 추가 모달 */}
            <AddPlayerModal
                teamId={teamId}
                isOpen={isAddPlayerModalOpen}
                onClose={() => setIsAddPlayerModalOpen(false)}
                onPlayerAdded={handlePlayerAdded}
            />

            {/* 선수 수정 모달 */}
            <EditPlayerModal
                player={selectedPlayer}
                isOpen={isEditPlayerModalOpen}
                onClose={() => {
                    setIsEditPlayerModalOpen(false);
                    setSelectedPlayer(null);
                }}
                onPlayerUpdated={handlePlayerUpdated}
            />
        </div>
    );
}