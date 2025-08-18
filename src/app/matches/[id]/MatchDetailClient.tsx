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
    const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'bracket' | 'manage'>('overview');
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
    
    // 탭 정의 - 조건부로 표시
    const tabs = [
        { id: 'overview', label: '개요', icon: Trophy, show: true },
        { id: 'participants', label: '참가팀', icon: Users, show: true },
        { id: 'bracket', label: '대진표', icon: Calendar, show: showBracket },
        { id: 'manage', label: '관리', icon: Settings, show: isOwner },
    ].filter(tab => tab.show);

    return (
        <div className="space-y-4">
            {/* 헤더 - 제목과 액션 버튼 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{match?.title}</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {match?.description || '설명이 없습니다.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* 체크인 버튼은 항상 표시 */}
                        <button
                            onClick={() => match?.id && router.push(`/matches/${match.id}/checkin`)}
                            disabled={!match?.id}
                            className="px-4 py-2 text-sm bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <QrCode className="w-4 h-4" />
                            체크인
                        </button>
                        {isOwner && (
                            <>
                                <button
                                    onClick={() => match?.id && handleEdit(match.id)}
                                    disabled={!match?.id || isLoading}
                                    className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    수정
                                </button>
                                <button
                                    onClick={() => match?.id && handleDelete(match.id)}
                                    disabled={!match?.id || isLoading}
                                    className="px-4 py-2 text-sm bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    삭제
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 탭 네비게이션 - 모바일 최적화 */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b">
                    <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-b-2 border-primary-500 text-primary-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        <span className="sm:hidden">{tab.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="p-4 sm:p-6">
                    {/* 개요 탭 */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <MatchDetail
                                match={match}
                                onJoined={handleJoined}
                            />
                        </div>
                    )}
                    
                    {/* 참가팀 탭 */}
                    {activeTab === 'participants' && match?.id && (
                        <div>
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">참가팀 목록</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {isOwner 
                                        ? '참가 신청을 검토하고 관리할 수 있습니다.'
                                        : '현재 이 경기에 참가 중인 팀들입니다.'}
                                </p>
                            </div>
                            <ParticipantManagement
                                matchId={match.id}
                                isCreator={isOwner}
                                onUpdate={() => setRefreshKey(prev => prev + 1)}
                                key={`participants-${refreshKey}`}
                            />
                        </div>
                    )}
                    
                    {/* 대진표 탭 */}
                    {activeTab === 'bracket' && showBracket && match?.id && (
                        <TournamentManager
                            matchId={match.id}
                            matchData={match}
                            teams={teams}
                            isCreator={isOwner}
                        />
                    )}
                    
                    {/* 관리 탭 - 경기 상태와 설정 */}
                    {activeTab === 'manage' && isOwner && match?.id && (
                        <div className="space-y-6">
                            {/* 경기 상태 관리 */}
                            <MatchStatusManager
                                match={match}
                                isCreator={isOwner}
                                onStatusChange={handleStatusChange}
                            />
                            
                            {/* 추가 관리 기능 */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => router.push(`/matches/${match.id}/edit`)}
                                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="font-medium text-gray-900">경기 정보 수정</div>
                                        <div className="text-sm text-gray-600 mt-1">날짜, 규칙 등을 변경합니다</div>
                                    </button>
                                    <button
                                        onClick={() => router.push(`/matches/${match.id}/checkin`)}
                                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="font-medium text-gray-900">체크인 관리</div>
                                        <div className="text-sm text-gray-600 mt-1">참가팀 체크인 상태를 확인합니다</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}