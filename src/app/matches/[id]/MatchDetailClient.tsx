/* eslint-disable no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Match, Team } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useMatchRealtime } from '@/hooks/useRealtimeSubscription';
import { MatchDetail } from '@/components/match';
import ParticipantManagement from '@/components/match/ParticipantManagement';
import MatchStatusManager from '@/components/match/MatchStatusManager';
import TournamentManager from '@/components/match/TournamentManager';
import { showToast } from '@/components/ui/Toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Trophy, Users, Calendar, Settings, QrCode } from 'lucide-react';

interface MatchDetailClientProps {
    match: Match;
}

// Match 데이터 유효성 검증 함수
function validateMatchData(match: Match): boolean {
    return !!(match && match.id && match.title && match.creator_id);
}

export default function MatchDetailClient({ match: initialMatch }: MatchDetailClientProps) {
    const router = useRouter();
    const { user, getAccessToken } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const [match, setMatch] = useState(initialMatch);
    const [activeTab, setActiveTab] = useState<'info' | 'bracket' | 'manage'>('info');
    const [teams, setTeams] = useState<Team[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 실시간 업데이트 구독 - 항상 호출하되 match.id가 없으면 빈 문자열 전달
    useMatchRealtime(match?.id || '', {
        onUpdate: useCallback((payload: RealtimePostgresChangesPayload<any>) => {
            try {
                if (!match?.id) return; // 유효한 match ID가 없으면 무시
                
                console.log('Match updated:', payload);
                const updatedMatch = payload.new as Match;
                
                // 업데이트된 데이터 유효성 검증
                if (validateMatchData(updatedMatch)) {
                    setMatch(updatedMatch);
                    
                    // 다른 사용자가 업데이트한 경우 알림 표시
                    if (payload.new && user && (payload.new as any).updated_by !== user.id) {
                        showToast('경기 정보가 업데이트되었습니다', 'info');
                    }
                } else {
                    console.error('Invalid match data received from realtime update:', updatedMatch);
                    setError('경기 정보 업데이트 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('Error processing realtime update:', error);
                setError('실시간 업데이트 처리 중 오류가 발생했습니다.');
            }
        }, [user, match?.id]),
    });

    // 참가 팀 조회 - 항상 호출하되 조건을 내부에서 처리
    useEffect(() => {
        if (!match?.id) {
            console.warn('Match ID is not available for fetching teams');
            return;
        }

        const fetchTeams = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/matches/${encodeURIComponent(match.id)}/participants`);
                
                if (response.ok) {
                    const data = await response.json();
                    const approvedTeams = data.participants
                        ?.filter((p: any) => p && p.status === 'approved' && p.team)
                        ?.map((p: any) => p.team)
                        ?.filter((team: any) => team && team.id) || [];
                    setTeams(approvedTeams);
                } else {
                    console.error('Failed to fetch participants:', response.status, response.statusText);
                    if (response.status !== 404) {
                        setError('참가팀 목록을 불러오는 중 오류가 발생했습니다.');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch teams:', error);
                setError('참가팀 정보를 불러오는 중 네트워크 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchTeams();
    }, [match?.id, refreshKey]);

    const handleJoined = () => {
        // 참가 신청 후 페이지 새로고침
        setRefreshKey(prev => prev + 1);
        showToast('참가 신청이 완료되었습니다', 'success');
    };

    const handleStatusChange = (newStatus: any) => {
        // 상태 변경 후 match 업데이트
        setMatch(prev => ({ ...prev, status: newStatus }));
        setRefreshKey(prev => prev + 1);
        showToast('경기 상태가 변경되었습니다', 'info');
    };

    const handleEdit = (id: string) => {
        router.push(`/matches/${id}/edit`);
    };

    const handleDelete = async (id: string) => {
        if (!user) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }

        if (!id || typeof id !== 'string') {
            showToast('잘못된 경기 ID입니다.', 'error');
            return;
        }
    
        const confirmDelete = window.confirm('정말로 이 경기를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
        if (!confirmDelete) return;

        const token = getAccessToken();
        if (!token) {
            showToast('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.', 'error');
            router.push('/login');
            return;
        }
    
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/matches/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || '경기 삭제에 실패했습니다.');
            }
    
            showToast('경기가 성공적으로 삭제되었습니다.', 'success');
            router.push('/matches');
        } catch (err) {
            console.error('경기 삭제 오류:', err);
            const errorMessage = err instanceof Error ? err.message : '경기 삭제 중 오류가 발생했습니다.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const isOwner = user?.id === match?.creator_id;
    
    // 데이터가 유효하지 않은 경우 에러 표시
    if (!validateMatchData(match)) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">경기 데이터 오류</h2>
                    <p className="text-red-700">경기 정보를 불러오는 중 오류가 발생했습니다. 필수 정보가 누락되었거나 손상된 것 같습니다.</p>
                    <button
                        onClick={() => router.push('/matches')}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        경기 목록으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    // 에러 상태 표시
    if (error) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h2>
                    <p className="text-red-700 mb-4">{error}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setError(null);
                                setRefreshKey(prev => prev + 1);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={() => router.push('/matches')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            경기 목록으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 대회 타입에 따라 대진표 탭 표시 여부 결정
    const showBracket = match?.type && ['single_elimination', 'double_elimination', 'round_robin'].includes(match.type);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* 생성자 액션 버튼 */}
            {isOwner && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => match?.id && handleEdit(match.id)}
                            disabled={!match?.id || isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '처리 중...' : '대회 수정'}
                        </button>
                        <button
                            onClick={() => match?.id && handleDelete(match.id)}
                            disabled={!match?.id || isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '처리 중...' : '대회 삭제'}
                        </button>
                    </div>
                </div>
            )}

            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'info'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                정보
                            </div>
                        </button>
                        
                        {showBracket && (
                            <button
                                onClick={() => setActiveTab('bracket')}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'bracket'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    대진표
                                </div>
                            </button>
                        )}
                        
                        {isOwner && (
                            <button
                                onClick={() => setActiveTab('manage')}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'manage'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    관리
                                </div>
                            </button>
                        )}
                        
                        {/* 체크인은 별도 링크로 이동 */}
                        <div className="ml-auto flex items-center px-4">
                            <button
                                onClick={() => match?.id && router.push(`/matches/${match.id}/checkin`)}
                                disabled={!match?.id}
                                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-2">
                                    <QrCode className="w-4 h-4" />
                                    체크인
                                </div>
                            </button>
                        </div>
                    </nav>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="p-6">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            {/* 경기 상세 정보 */}
                            <MatchDetail
                                match={match}
                                onJoined={handleJoined}
                            />
                            
                            {/* 참가팀 목록 */}
                            <div className="border-t pt-6">
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">참가팀</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        현재 이 경기에 참가 중인 팀들입니다.
                                    </p>
                                </div>
                                {match?.id ? (
                                    <ParticipantManagement
                                        matchId={match.id}
                                        isCreator={false}
                                        onUpdate={() => setRefreshKey(prev => prev + 1)}
                                        key={`info-${refreshKey}`}
                                    />
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">참가팀 정보를 불러오는 중입니다...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'bracket' && showBracket && match?.id && (
                        <TournamentManager
                            matchId={match.id}
                            matchData={match}
                            teams={teams}
                            isCreator={isOwner}
                        />
                    )}
                    
                    {activeTab === 'manage' && isOwner && (
                        <div className="space-y-6">
                            {/* 참가 신청 관리 */}
                            <div>
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">참가 신청 관리</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        참가 신청을 검토하고 승인/거부할 수 있습니다.
                                    </p>
                                </div>
                                {match?.id ? (
                                    <ParticipantManagement
                                        matchId={match.id}
                                        isCreator={true}
                                        onUpdate={() => setRefreshKey(prev => prev + 1)}
                                        key={`manage-${refreshKey}`}
                                    />
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">참가 신청 정보를 불러오는 중입니다...</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* 경기 상태 관리 */}
                            <div className="border-t pt-6">
                                {match?.id ? (
                                    <MatchStatusManager
                                        match={match}
                                        isCreator={isOwner}
                                        onStatusChange={handleStatusChange}
                                    />
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">경기 정보를 불러오는 중입니다...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}