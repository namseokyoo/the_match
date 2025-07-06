import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { Match, MatchType, MatchStatus, Team } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';

interface MatchDetailProps {
    match: Match;
    teams?: Team[];
    currentUserId?: string;
    loading?: boolean;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onJoinMatch?: (id: string) => void;
    onLeaveMatch?: (id: string) => void;
    isParticipant?: boolean;
    canJoin?: boolean;
}

// 경기 타입 표시 텍스트
const getMatchTypeText = (type: MatchType): string => {
    const typeMap = {
        [MatchType.SINGLE_ELIMINATION]: '단일 토너먼트',
        [MatchType.DOUBLE_ELIMINATION]: '더블 토너먼트',
        [MatchType.ROUND_ROBIN]: '리그전',
        [MatchType.SWISS]: '스위스',
        [MatchType.LEAGUE]: '리그',
    };
    return typeMap[type] || type;
};

// 경기 상태 표시 텍스트와 색상
const getMatchStatusInfo = (status: MatchStatus) => {
    const statusMap = {
        [MatchStatus.DRAFT]: { text: '준비중', color: 'bg-gray-100 text-gray-800' },
        [MatchStatus.REGISTRATION]: { text: '등록중', color: 'bg-blue-100 text-blue-800' },
        [MatchStatus.IN_PROGRESS]: { text: '진행중', color: 'bg-green-100 text-green-800' },
        [MatchStatus.COMPLETED]: { text: '완료', color: 'bg-purple-100 text-purple-800' },
        [MatchStatus.CANCELLED]: { text: '취소', color: 'bg-red-100 text-red-800' },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
};

export const MatchDetail: React.FC<MatchDetailProps> = ({
    match,
    teams = [],
    currentUserId,
    loading = false,
    onEdit,
    onDelete,
    onJoinMatch,
    onLeaveMatch,
    isParticipant = false,
    canJoin = false,
}) => {
    const statusInfo = getMatchStatusInfo(match.status);
    const typeText = getMatchTypeText(match.type);
    const isOwner = currentUserId === match.creator_id;

    // 등록 마감일 체크
    const isRegistrationOpen = match.status === MatchStatus.REGISTRATION;
    const isRegistrationDeadlinePassed = match.registration_deadline
        ? new Date(match.registration_deadline) < new Date()
        : false;

    // 참가팀 수 체크
    const currentParticipants = teams.length;
    const maxParticipants = match.max_participants;
    const isFull = maxParticipants ? currentParticipants >= maxParticipants : false;

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 경기 헤더 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{match.title}</h1>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                            </span>
                            <span className="text-sm text-gray-600">{typeText}</span>
                        </div>
                        {match.description && (
                            <p className="text-gray-700 whitespace-pre-wrap">{match.description}</p>
                        )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 ml-4">
                        {isOwner && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit?.(match.id)}
                                    disabled={loading}
                                >
                                    수정
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDelete?.(match.id)}
                                    disabled={loading}
                                >
                                    삭제
                                </Button>
                            </>
                        )}

                        {!isOwner && isRegistrationOpen && !isRegistrationDeadlinePassed && (
                            <>
                                {isParticipant ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onLeaveMatch?.(match.id)}
                                        disabled={loading}
                                    >
                                        참가 취소
                                    </Button>
                                ) : canJoin && !isFull ? (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => onJoinMatch?.(match.id)}
                                        disabled={loading}
                                    >
                                        참가 신청
                                    </Button>
                                ) : isFull ? (
                                    <Button variant="outline" size="sm" disabled>
                                        참가 마감
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>
                                        참가 불가
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 경기 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <Card>
                    <CardHeader>
                        <CardTitle>기본 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">경기 유형</span>
                            <span className="font-medium">{typeText}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">상태</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">참가팀 수</span>
                            <span className="font-medium">
                                {currentParticipants}
                                {maxParticipants && `/${maxParticipants}`}팀
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">생성일</span>
                            <span className="font-medium">{formatDate(match.created_at)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 일정 정보 */}
                <Card>
                    <CardHeader>
                        <CardTitle>일정 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {match.registration_deadline && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">등록 마감</span>
                                <span className={`font-medium ${isRegistrationDeadlinePassed ? 'text-red-600' : ''}`}>
                                    {formatDateTime(match.registration_deadline)}
                                </span>
                            </div>
                        )}
                        {match.start_date && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">시작일</span>
                                <span className="font-medium">{formatDateTime(match.start_date)}</span>
                            </div>
                        )}
                        {match.end_date && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">종료일</span>
                                <span className="font-medium">{formatDateTime(match.end_date)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 참가팀 목록 */}
            <Card>
                <CardHeader>
                    <CardTitle>참가팀 목록 ({currentParticipants}팀)</CardTitle>
                </CardHeader>
                <CardContent>
                    {teams.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>아직 참가한 팀이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teams.map((team) => (
                                <div
                                    key={team.id}
                                    className="flex items-center space-x-3 p-3 border rounded-lg"
                                >
                                    {team.logo_url && (
                                        <img
                                            src={team.logo_url}
                                            alt={`${team.name} 로고`}
                                            className="w-8 h-8 rounded object-cover"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{team.name}</p>
                                        <p className="text-sm text-gray-600">{team.captain_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MatchDetail; 