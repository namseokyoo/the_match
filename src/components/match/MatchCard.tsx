/* eslint-disable no-unused-vars */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { Match } from '@/types';
import { formatDate } from '@/lib/utils';

interface MatchCardProps {
    match: Match;
    onView?: (matchId: string) => void;
    onEdit?: (matchId: string) => void;
    onDelete?: (matchId: string) => void;
    showActions?: boolean;
    isOwner?: boolean;
}

// 경기 타입 표시 텍스트
const getMatchTypeText = (type: string): string => {
    const typeMap: Record<string, string> = {
        'single_elimination': '단일 토너먼트',
        'double_elimination': '더블 토너먼트',
        'round_robin': '리그전',
        'swiss': '스위스',
        'league': '리그',
    };
    return typeMap[type] || type;
};

// 경기 상태 표시 텍스트와 색상
const getMatchStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
        'draft': { text: '준비중', color: 'bg-gray-100 text-gray-800' },
        'registration': { text: '등록중', color: 'bg-blue-100 text-blue-800' },
        'recruiting': { text: '모집중', color: 'bg-blue-100 text-blue-800' },
        'in_progress': { text: '진행중', color: 'bg-green-100 text-green-800' },
        'active': { text: '진행중', color: 'bg-green-100 text-green-800' },
        'completed': { text: '완료', color: 'bg-purple-100 text-purple-800' },
        'cancelled': { text: '취소', color: 'bg-red-100 text-red-800' },
        'upcoming': { text: '예정', color: 'bg-yellow-100 text-yellow-800' },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
};

export const MatchCard: React.FC<MatchCardProps> = ({
    match,
    onView,
    onEdit,
    onDelete,
    showActions = true,
    isOwner = false,
}) => {
    const statusInfo = getMatchStatusInfo(match.status);
    const typeText = getMatchTypeText(match.type);

    return (
        <Card className="w-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate text-gray-900">
                            {match.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                            </span>
                            <span className="text-sm text-gray-500">{typeText}</span>
                        </div>
                    </div>
                </div>
                {match.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {match.description}
                    </p>
                )}
            </CardHeader>

            <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {match.max_participants && (
                        <div className="text-sm">
                            <span className="text-gray-500">최대 참가:</span>
                            <span className="font-medium ml-1">{match.max_participants}팀</span>
                        </div>
                    )}
                    {match.start_date && (
                        <div className="text-sm">
                            <span className="text-gray-500">시작일:</span>
                            <span className="font-medium ml-1">{formatDate(match.start_date)}</span>
                        </div>
                    )}
                    {match.registration_deadline && (
                        <div className="text-sm">
                            <span className="text-gray-500">등록 마감:</span>
                            <span className="font-medium ml-1">{formatDate(match.registration_deadline)}</span>
                        </div>
                    )}
                    <div className="text-sm">
                        <span className="text-gray-500">생성일:</span>
                        <span className="font-medium ml-1">{formatDate(match.created_at)}</span>
                    </div>
                </div>

                {showActions && (
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView?.(match.id)}
                            className="flex-1 min-w-0"
                        >
                            상세보기
                        </Button>

                        {isOwner && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit?.(match.id)}
                                    className="flex-1 min-w-0"
                                >
                                    수정
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDelete?.(match.id)}
                                    className="flex-1 min-w-0"
                                >
                                    삭제
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MatchCard; 