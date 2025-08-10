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

export default function MatchDetailClient({ match: initialMatch }: MatchDetailClientProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const [match, setMatch] = useState(initialMatch);
    const [activeTab, setActiveTab] = useState<'overview' | 'bracket' | 'participants' | 'settings'>('overview');
    const [teams, setTeams] = useState<Team[]>([]);

    // 실시간 업데이트 구독
    useMatchRealtime(match.id, {
        onUpdate: useCallback((payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Match updated:', payload);
            const updatedMatch = payload.new as Match;
            setMatch(updatedMatch);
            
            // 다른 사용자가 업데이트한 경우 알림 표시
            if (payload.new && user && (payload.new as any).updated_by !== user.id) {
                showToast('경기 정보가 업데이트되었습니다', 'info');
            }
        }, [user]),
    });

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
            alert('로그인이 필요합니다.');
            return;
        }
    
        const confirmDelete = window.confirm('정말로 이 경기를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
        if (!confirmDelete) return;
    
        try {
            const response = await fetch(`/api/matches/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || '경기 삭제에 실패했습니다.');
            }
    
            alert('경기가 성공적으로 삭제되었습니다.');
            router.push('/matches');
        } catch (err) {
            console.error('경기 삭제 오류:', err);
            alert(err instanceof Error ? err.message : '경기 삭제 중 오류가 발생했습니다.');
        }
    };

    const isOwner = user?.id === match.creator_id;

    // 대회 타입에 따라 대진표 탭 표시 여부 결정
    const showBracket = ['single_elimination', 'double_elimination', 'round_robin'].includes((match as any).match_type || '');

    // 참가 팀 조회
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                // 참가 승인된 팀 목록 조회
                const response = await fetch(`/api/matches/${match.id}/participants`);
                if (response.ok) {
                    const data = await response.json();
                    const approvedTeams = data.participants
                        ?.filter((p: any) => p.status === 'approved')
                        ?.map((p: any) => p.team) || [];
                    setTeams(approvedTeams);
                }
            } catch (error) {
                console.error('Failed to fetch teams:', error);
            }
        };
        
        fetchTeams();
    }, [match.id, refreshKey]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* 생성자 액션 버튼 */}
            {isOwner && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => handleEdit(match.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            대회 수정
                        </button>
                        <button
                            onClick={() => handleDelete(match.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            대회 삭제
                        </button>
                    </div>
                </div>
            )}

            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'overview'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                대회 정보
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
                        
                        <button
                            onClick={() => setActiveTab('participants')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'participants'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                참가팀
                            </div>
                        </button>
                        
                        <button
                            onClick={() => router.push(`/matches/${match.id}/checkin`)}
                            className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <QrCode className="w-4 h-4" />
                                체크인
                            </div>
                        </button>
                        
                        {isOwner && (
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'settings'
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
                    </nav>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <MatchDetail
                                match={match}
                                onJoined={handleJoined}
                            />
                        </div>
                    )}
                    
                    {activeTab === 'bracket' && showBracket && (
                        <TournamentManager
                            matchId={match.id}
                            matchData={match}
                            teams={teams}
                            isCreator={isOwner}
                        />
                    )}
                    
                    {activeTab === 'participants' && (
                        <div>
                            <div className="mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {isOwner ? '참가 신청 관리' : '참가 신청 현황'}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {isOwner
                                        ? '참가 신청을 검토하고 승인/거부할 수 있습니다.'
                                        : '현재 이 대회에 참가 신청한 팀들을 확인할 수 있습니다.'
                                    }
                                </p>
                            </div>
                            <ParticipantManagement
                                matchId={match.id}
                                isCreator={isOwner}
                                onUpdate={() => setRefreshKey(prev => prev + 1)}
                                key={refreshKey}
                            />
                        </div>
                    )}
                    
                    {activeTab === 'settings' && isOwner && (
                        <div className="space-y-6">
                            <MatchStatusManager
                                match={match}
                                isCreator={isOwner}
                                onStatusChange={handleStatusChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}