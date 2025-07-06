import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tournament, TournamentType, TournamentStatus, Team } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';

interface TournamentDetailProps {
    tournament: Tournament;
    teams?: Team[];
    currentUserId?: string;
    loading?: boolean;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onJoinTournament?: (id: string) => void;
    onLeaveTournament?: (id: string) => void;
    isParticipant?: boolean;
    canJoin?: boolean;
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

export const TournamentDetail: React.FC<TournamentDetailProps> = ({
    tournament,
    teams = [],
    currentUserId,
    loading = false,
    onEdit,
    onDelete,
    onJoinTournament,
    onLeaveTournament,
    isParticipant = false,
    canJoin = false,
}) => {
    const statusInfo = getTournamentStatusInfo(tournament.status);
    const typeText = getTournamentTypeText(tournament.type);
    const isOwner = currentUserId === tournament.creator_id;

    // 등록 마감일 체크
    const isRegistrationOpen = tournament.status === TournamentStatus.REGISTRATION;
    const isRegistrationDeadlinePassed = tournament.registration_deadline
        ? new Date(tournament.registration_deadline) < new Date()
        : false;

    // 참가팀 수 체크
    const currentParticipants = teams.length;
    const maxParticipants = tournament.max_participants;
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
            {/* 토너먼트 헤더 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{tournament.title}</h1>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                            </span>
                            <span className="text-sm text-gray-600">{typeText}</span>
                        </div>
                        {tournament.description && (
                            <p className="text-gray-700 whitespace-pre-wrap">{tournament.description}</p>
                        )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 ml-4">
                        {isOwner && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit?.(tournament.id)}
                                    disabled={loading}
                                >
                                    수정
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDelete?.(tournament.id)}
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
                                        onClick={() => onLeaveTournament?.(tournament.id)}
                                        disabled={loading}
                                    >
                                        참가 취소
                                    </Button>
                                ) : canJoin && !isFull ? (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => onJoinTournament?.(tournament.id)}
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

            {/* 토너먼트 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <Card>
                    <CardHeader>
                        <CardTitle>기본 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">토너먼트 유형</span>
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
                            <span className="font-medium">{formatDate(tournament.created_at)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 일정 정보 */}
                <Card>
                    <CardHeader>
                        <CardTitle>일정 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tournament.registration_deadline && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">등록 마감</span>
                                <span className={`font-medium ${isRegistrationDeadlinePassed ? 'text-red-600' : ''}`}>
                                    {formatDateTime(tournament.registration_deadline)}
                                </span>
                            </div>
                        )}
                        {tournament.start_date && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">시작일</span>
                                <span className="font-medium">{formatDateTime(tournament.start_date)}</span>
                            </div>
                        )}
                        {tournament.end_date && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">종료일</span>
                                <span className="font-medium">{formatDateTime(tournament.end_date)}</span>
                            </div>
                        )}
                        {!tournament.start_date && !tournament.end_date && !tournament.registration_deadline && (
                            <div className="text-gray-500 text-sm">일정이 설정되지 않았습니다.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 참가팀 목록 */}
            <Card>
                <CardHeader>
                    <CardTitle>참가팀 목록</CardTitle>
                </CardHeader>
                <CardContent>
                    {teams.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-500 mb-2">
                                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 3a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold">참가팀이 없습니다</p>
                            <p className="text-gray-600">아직 참가 신청한 팀이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teams.map((team, index) => (
                                <div key={team.id} className="flex items-center p-3 border rounded-lg">
                                    <div className="flex-shrink-0 w-8 h-8 bg-match-blue rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h4 className="font-medium text-gray-900">{team.name}</h4>
                                        {team.description && (
                                            <p className="text-sm text-gray-600 truncate">{team.description}</p>
                                        )}
                                    </div>
                                    {team.logo_url && (
                                        <img
                                            src={team.logo_url}
                                            alt={`${team.name} 로고`}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 대진표 및 경기 (추후 구현) */}
            {tournament.status === TournamentStatus.IN_PROGRESS || tournament.status === TournamentStatus.COMPLETED ? (
                <Card>
                    <CardHeader>
                        <CardTitle>대진표</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <div className="text-gray-500 mb-2">
                                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold">대진표 기능 준비중</p>
                            <p className="text-gray-600">곧 대진표와 경기 결과를 확인하실 수 있습니다.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
};

export default TournamentDetail; 