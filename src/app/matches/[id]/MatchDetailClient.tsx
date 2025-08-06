/* eslint-disable no-unused-vars */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Match } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { MatchDetail, ParticipantList } from '@/components/match';

interface MatchDetailClientProps {
    match: Match;
}

export default function MatchDetailClient({ match }: MatchDetailClientProps) {
    const router = useRouter(); // TODO: 경기 수정/삭제 기능에서 사용 예정
    const { user, getAccessToken } = useAuth(); // TODO: 경기 삭제 기능에서 사용 예정
    const [refreshKey, setRefreshKey] = useState(0);

    const handleJoined = () => {
        // 참가 신청 후 페이지 새로고침
        setRefreshKey(prev => prev + 1);
    };

    // TODO: 경기 수정/삭제 기능은 향후 구현 예정
    // const handleEdit = (id: string) => {
    //     router.push(`/matches/${id}/edit`);
    // };

    // const handleDelete = async (id: string) => {
    //     if (!user) {
    //         alert('로그인이 필요합니다.');
    //         return;
    //     }
    // 
    //     const confirmDelete = window.confirm('정말로 이 경기를 삭제하시겠습니까?\\n이 작업은 되돌릴 수 없습니다.');
    //     if (!confirmDelete) return;
    // 
    //     try {
    //         const token = await getAccessToken();
    //         if (!token) {
    //             alert('인증 토큰을 가져올 수 없습니다.');
    //             return;
    //         }
    // 
    //         const response = await fetch(`/api/matches/${id}`, {
    //             method: 'DELETE',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //             },
    //         });
    // 
    //         const data = await response.json();
    // 
    //         if (!response.ok) {
    //             throw new Error(data.error || '경기 삭제에 실패했습니다.');
    //         }
    // 
    //         alert('경기가 성공적으로 삭제되었습니다.');
    //         router.push('/matches');
    //     } catch (err) {
    //         console.error('경기 삭제 오류:', err);
    //         alert(err instanceof Error ? err.message : '경기 삭제 중 오류가 발생했습니다.');
    //     }
    // };

    const isOwner = user?.id === match.creator_id;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* 경기 상세 정보 */}
            <MatchDetail
                match={match}
                onJoined={handleJoined}
            />

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
                    <ParticipantList
                        matchId={match.id}
                        isOwner={isOwner}
                        key={refreshKey}
                    />
                </div>
            </div>
        </div>
    );
}