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
    // match 데이터 유효성 검증
    if (!match || !match.id || !match.title) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-800 mb-2">경기 정보 오류</h2>
                <p className="text-red-700">경기 정보가 올바르지 않거나 누락되었습니다.</p>
            </div>
        );
    }

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

    const getTypeIcon = (type: string | undefined) => {
        if (!type || typeof type !== 'string') return '🎮';
        
        const typeIcons = {
            tournament: '🏆',
            league: '🏟️',
            friendly: '⚽',
            championship: '👑',
            single_elimination: '🏆',
            double_elimination: '🏆',
            round_robin: '🏟️',
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
                                <h1 className="text-2xl font-bold text-gray-900">{match.title || '제목 없음'}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusBadge(calculatedStatus)}
                                    <span className="text-sm text-gray-500">
                                        {match.type ? (match.type.charAt(0).toUpperCase() + match.type.slice(1)) : '타입 미지정'}
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
                                    <p className="text-gray-600 whitespace-nowrap">
                                        {formatDate(match.start_date) || '날짜 정보 없음'}
                                    </p>
                                </div>
                            )}

                            {match.end_date && (
                                <div>
                                    <span className="font-medium text-gray-700 whitespace-nowrap">📅 종료일:</span>
                                    <p className="text-gray-600 whitespace-nowrap">
                                        {formatDate(match.end_date) || '날짜 정보 없음'}
                                    </p>
                                </div>
                            )}

                            {match.registration_deadline && (
                                <div>
                                    <span className="font-medium text-gray-700 whitespace-nowrap">⏰ 등록 마감:</span>
                                    <p className="text-gray-600 whitespace-nowrap">
                                        {formatDate(match.registration_deadline) || '날짜 정보 없음'}
                                    </p>
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

                    {/* 참가 신청 버튼만 표시 - 나머지는 탭으로 이동 */}
                    <div className="flex-shrink-0">
                        <JoinMatchButton
                            match={match}
                            onJoined={onJoined}
                            className="w-full md:w-auto"
                        />
                    </div>
                </div>
            </Card>

            {/* 경기 규칙 */}
            {match.rules && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">📋 경기 규칙</h2>
                    <div className="text-gray-600 whitespace-pre-line">
                        {match.rules ? (
                            typeof match.rules === 'string' 
                                ? match.rules 
                                : JSON.stringify(match.rules, null, 2)
                        ) : (
                            '경기 규칙이 설정되지 않았습니다.'
                        )}
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
                        title={match.title || '경기장'}
                        phoneNumber={match.venue_phone || undefined}
                        openingHours={match.venue_hours || undefined}
                        additionalInfo={match.venue_info || undefined}
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
                        <span className="font-medium">생성일:</span> 
                        {match.created_at ? formatDate(match.created_at) : '정보 없음'}
                    </p>
                    {match.updated_at && match.updated_at !== match.created_at && (
                        <p className="whitespace-nowrap">
                            <span className="font-medium">수정일:</span> 
                            {formatDate(match.updated_at) || '정보 없음'}
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default MatchDetail; 