/* eslint-disable no-unused-vars */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Match } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { MatchDetail } from '@/components/match';
import ParticipantManagement from '@/components/match/ParticipantManagement';
import MatchStatusManager from '@/components/match/MatchStatusManager';

interface MatchDetailClientProps {
    match: Match;
}

export default function MatchDetailClient({ match: initialMatch }: MatchDetailClientProps) {
    const router = useRouter();
    const { user, getAccessToken } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const [match, setMatch] = useState(initialMatch);

    const handleJoined = () => {
        // 참가 신청 후 페이지 새로고침
        setRefreshKey(prev => prev + 1);
    };

    const handleStatusChange = (newStatus: any) => {
        // 상태 변경 후 match 업데이트
        setMatch(prev => ({ ...prev, status: newStatus }));
        setRefreshKey(prev => prev + 1);
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
    
            alert('경기가 성공적으로 삭제되었습니다.');
            router.push('/matches');
        } catch (err) {
            console.error('경기 삭제 오류:', err);
            alert(err instanceof Error ? err.message : '경기 삭제 중 오류가 발생했습니다.');
        }
    };

    const isOwner = user?.id === match.creator_id;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* 생성자 액션 버튼 */}
            {isOwner && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => handleEdit(match.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            경기 수정
                        </button>
                        <button
                            onClick={() => handleDelete(match.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            경기 삭제
                        </button>
                    </div>
                </div>
            )}

            {/* 경기 상세 정보 */}
            <MatchDetail
                match={match}
                onJoined={handleJoined}
            />

            {/* 경기 상태 관리 (생성자만 표시) */}
            {isOwner && (
                <MatchStatusManager
                    match={match}
                    isCreator={isOwner}
                    onStatusChange={handleStatusChange}
                />
            )}

            {/* 참가자 목록 */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isOwner ? '참가 신청 관리' : '참가 신청 현황'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {isOwner
                            ? '참가 신청을 검토하고 승인/거부할 수 있습니다.'
                            : '현재 이 경기에 참가 신청한 팀들을 확인할 수 있습니다.'
                        }
                    </p>
                </div>
                <div className="p-6">
                    <ParticipantManagement
                        matchId={match.id}
                        isCreator={isOwner}
                        onUpdate={() => setRefreshKey(prev => prev + 1)}
                        key={refreshKey}
                    />
                </div>
            </div>
        </div>
    );
}