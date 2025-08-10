'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Match } from '@/types';
import { Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import JoinMatchButton from './JoinMatchButton';
import { MapPin } from 'lucide-react';
import { calculateMatchStatus, getMatchStatusLabel, getMatchStatusColor } from '@/lib/match-utils';

// 네이버 지도는 클라이언트 사이드에서만 로드
const NaverMap = dynamic(() => import('@/components/map/NaverMap'), {
    ssr: false,
    loading: () => (
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">지도를 불러오는 중...</p>
            </div>
        </div>
    )
});

interface MatchDetailProps {
    match: Match;
    onJoined?: () => void;
}

const MatchDetail: React.FC<MatchDetailProps> = ({ match, onJoined }) => {
    // 날짜 기반으로 상태 자동 계산
    const calculatedStatus = calculateMatchStatus(
        match.registration_start_date,
        match.registration_deadline,
        match.start_date,
        match.end_date,
        match.status
    );
    
    const getStatusBadge = (status: string) => {
        const statusText = getMatchStatusLabel(status);
        const statusColor = getMatchStatusColor(status);

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {statusText}
            </span>
        );
    };

    const getTypeIcon = (type: string) => {
        const typeIcons = {
            tournament: '🏆',
            league: '🏟️',
            friendly: '⚽',
            championship: '👑',
        };
        return typeIcons[type as keyof typeof typeIcons] || '🎮';
    };

    return (
        <div className="space-y-6">
            {/* 메인 정보 카드 */}
            <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{getTypeIcon(match.type)}</span>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{match.title}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusBadge(calculatedStatus)}
                                    <span className="text-sm text-gray-500">
                                        {match.type.charAt(0).toUpperCase() + match.type.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {match.description && (
                            <p className="text-gray-600 mb-4">{match.description}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {match.start_date && (
                                <div>
                                    <span className="font-medium text-gray-700 whitespace-nowrap">📅 시작일:</span>
                                    <p className="text-gray-600 whitespace-nowrap">{formatDate(match.start_date)}</p>
                                </div>
                            )}

                            {match.end_date && (
                                <div>
                                    <span className="font-medium text-gray-700 whitespace-nowrap">📅 종료일:</span>
                                    <p className="text-gray-600 whitespace-nowrap">{formatDate(match.end_date)}</p>
                                </div>
                            )}

                            {match.registration_deadline && (
                                <div>
                                    <span className="font-medium text-gray-700 whitespace-nowrap">⏰ 등록 마감:</span>
                                    <p className="text-gray-600 whitespace-nowrap">{formatDate(match.registration_deadline)}</p>
                                </div>
                            )}

                            {match.max_participants && (
                                <div>
                                    <span className="font-medium text-gray-700 whitespace-nowrap">👥 최대 참가팀:</span>
                                    <p className="text-gray-600 whitespace-nowrap">{match.max_participants}팀</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 참가 신청 버튼 */}
                    <div className="flex-shrink-0 space-y-2">
                        <JoinMatchButton
                            match={match}
                            onJoined={onJoined}
                            className="w-full md:w-auto"
                        />
                        {match.type === 'single_elimination' && (
                            <a
                                href={`/matches/${match.id}/bracket`}
                                className="block w-full md:w-auto px-4 py-2 bg-purple-600 text-white text-center rounded-md hover:bg-purple-700 transition-colors"
                            >
                                🏆 토너먼트 브라켓 보기
                            </a>
                        )}
                        <a
                            href={`/matches/${match.id}/results`}
                            className="block w-full md:w-auto px-4 py-2 bg-indigo-600 text-white text-center rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            📊 경기 결과 및 통계
                        </a>
                        <a
                            href={`/stats?matchId=${match.id}`}
                            className="block w-full md:w-auto px-4 py-2 bg-purple-600 text-white text-center rounded-md hover:bg-purple-700 transition-colors"
                        >
                            📈 선수 통계 보기
                        </a>
                    </div>
                </div>
            </Card>

            {/* 경기 규칙 */}
            {match.rules && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">📋 경기 규칙</h2>
                    <div className="text-gray-600 whitespace-pre-line">
                        {typeof match.rules === 'string' ? match.rules : JSON.stringify(match.rules, null, 2)}
                    </div>
                </Card>
            )}

            {/* 경기장 위치 */}
            {(match.venue || match.venue_address) && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        경기장 위치
                    </h2>
                    <NaverMap
                        address={match.venue_address || match.venue || ''}
                        title={match.title}
                        phoneNumber={match.venue_phone}
                        openingHours={match.venue_hours}
                        additionalInfo={match.venue_info}
                        editable={false}
                        showInfo={true}
                        height="400px"
                    />
                </Card>
            )}

            {/* 추가 정보 */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">ℹ️ 경기 정보</h2>
                <div className="text-sm text-gray-600 space-y-2">
                    <p className="whitespace-nowrap">
                        <span className="font-medium">생성일:</span> {formatDate(match.created_at)}
                    </p>
                    {match.updated_at !== match.created_at && (
                        <p className="whitespace-nowrap">
                            <span className="font-medium">수정일:</span> {formatDate(match.updated_at)}
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default MatchDetail; 