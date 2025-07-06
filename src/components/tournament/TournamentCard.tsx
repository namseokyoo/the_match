import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { Tournament, TournamentType, TournamentStatus } from '@/types';
import { formatDate } from '@/lib/utils';

interface TournamentCardProps {
    tournament: Tournament;
    onView?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    showActions?: boolean;
    isOwner?: boolean;
}

// 토너먼트 타입 표시 텍스트
const getTournamentTypeText = (type: TournamentType): string => {
    const typeMap = {
        [TournamentType.SINGLE_ELIMINATION]: '단일 토너먼트',
        [TournamentType.DOUBLE_ELIMINATION]: '더블 토너먼트',
        [TournamentType.ROUND_ROBIN]: '리그전',
        [TournamentType.SWISS]: '스위스',
        [TournamentType.LEAGUE]: '리그',
    };
    return typeMap[type] || type;
};

// 토너먼트 상태 표시 텍스트와 색상
const getTournamentStatusInfo = (status: TournamentStatus) => {
    const statusMap = {
        [TournamentStatus.DRAFT]: { text: '준비중', color: 'bg-gray-100 text-gray-800' },
        [TournamentStatus.REGISTRATION]: { text: '등록중', color: 'bg-blue-100 text-blue-800' },
        [TournamentStatus.IN_PROGRESS]: { text: '진행중', color: 'bg-green-100 text-green-800' },
        [TournamentStatus.COMPLETED]: { text: '완료', color: 'bg-purple-100 text-purple-800' },
        [TournamentStatus.CANCELLED]: { text: '취소', color: 'bg-red-100 text-red-800' },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
};

export const TournamentCard: React.FC<TournamentCardProps> = ({
    tournament,
    onView,
    onEdit,
    onDelete,
    showActions = true,
    isOwner = false,
}) => {
    const statusInfo = getTournamentStatusInfo(tournament.status);
    const typeText = getTournamentTypeText(tournament.type);

    return (
        <Card className="w-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate text-gray-900">
                            {tournament.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                            </span>
                            <span className="text-sm text-gray-500">{typeText}</span>
                        </div>
                    </div>
                </div>
                {tournament.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {tournament.description}
                    </p>
                )}
            </CardHeader>

            <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {tournament.max_participants && (
                        <div className="text-sm">
                            <span className="text-gray-500">최대 참가:</span>
                            <span className="font-medium ml-1">{tournament.max_participants}팀</span>
                        </div>
                    )}
                    {tournament.start_date && (
                        <div className="text-sm">
                            <span className="text-gray-500">시작일:</span>
                            <span className="font-medium ml-1">{formatDate(tournament.start_date)}</span>
                        </div>
                    )}
                    {tournament.registration_deadline && (
                        <div className="text-sm">
                            <span className="text-gray-500">등록 마감:</span>
                            <span className="font-medium ml-1">{formatDate(tournament.registration_deadline)}</span>
                        </div>
                    )}
                    <div className="text-sm">
                        <span className="text-gray-500">생성일:</span>
                        <span className="font-medium ml-1">{formatDate(tournament.created_at)}</span>
                    </div>
                </div>

                {showActions && (
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView?.(tournament.id)}
                            className="flex-1 min-w-0"
                        >
                            상세보기
                        </Button>

                        {isOwner && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit?.(tournament.id)}
                                    className="flex-1 min-w-0"
                                >
                                    수정
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDelete?.(tournament.id)}
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

export default TournamentCard; 