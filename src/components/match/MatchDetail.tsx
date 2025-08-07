'use client';

import React from 'react';
import { Match } from '@/types';
import { Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import JoinMatchButton from './JoinMatchButton';

interface MatchDetailProps {
    match: Match;
    onJoined?: () => void;
}

const MatchDetail: React.FC<MatchDetailProps> = ({ match, onJoined }) => {
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            planning: { text: '계획 중', className: 'bg-gray-100 text-gray-800' },
            registration: { text: '참가 신청 중', className: 'bg-blue-100 text-blue-800' },
            ongoing: { text: '진행 중', className: 'bg-green-100 text-green-800' },
            completed: { text: '완료', className: 'bg-purple-100 text-purple-800' },
            cancelled: { text: '취소됨', className: 'bg-red-100 text-red-800' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] ||
            { text: status, className: 'bg-gray-100 text-gray-800' };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                {config.text}
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
                                    {getStatusBadge(match.status)}
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
                                    <span className="font-medium text-gray-700">📅 시작일:</span>
                                    <p className="text-gray-600">{formatDate(match.start_date)}</p>
                                </div>
                            )}

                            {match.end_date && (
                                <div>
                                    <span className="font-medium text-gray-700">📅 종료일:</span>
                                    <p className="text-gray-600">{formatDate(match.end_date)}</p>
                                </div>
                            )}

                            {match.registration_deadline && (
                                <div>
                                    <span className="font-medium text-gray-700">⏰ 등록 마감:</span>
                                    <p className="text-gray-600">{formatDate(match.registration_deadline)}</p>
                                </div>
                            )}

                            {match.max_participants && (
                                <div>
                                    <span className="font-medium text-gray-700">👥 최대 참가팀:</span>
                                    <p className="text-gray-600">{match.max_participants}팀</p>
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

            {/* 추가 정보 */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">ℹ️ 경기 정보</h2>
                <div className="text-sm text-gray-600 space-y-2">
                    <p>
                        <span className="font-medium">생성일:</span> {formatDate(match.created_at)}
                    </p>
                    {match.updated_at !== match.created_at && (
                        <p>
                            <span className="font-medium">수정일:</span> {formatDate(match.updated_at)}
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default MatchDetail; 