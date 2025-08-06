/* eslint-disable no-unused-vars */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Team, Player, Match } from '@/types';
import { Button, Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface TeamDetailProps {
    team: Team;
    players?: Player[];
    match?: Match;
    currentUserId?: string;
    loading?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onAddPlayer?: () => void;
    onEditPlayer?: (player: Player) => void;
    onRemovePlayer?: (playerId: string) => void;
    isOwner?: boolean;
}

export const TeamDetail: React.FC<TeamDetailProps> = ({
    team,
    players = [],
    match,
    // currentUserId is used for future permission checks
    loading = false,
    onEdit,
    onDelete,
    onAddPlayer,
    onEditPlayer,
    onRemovePlayer,
    isOwner = false,
}) => {
    const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

    const playerCount = players.length;
    const captainInfo = players.find(p => p.id === team.captain_id);

    // 선수 위치별 그룹핑
    const playersByPosition = players.reduce((acc, player) => {
        const position = player.position || '포지션 미정';
        if (!acc[position]) {
            acc[position] = [];
        }
        acc[position].push(player);
        return acc;
    }, {} as Record<string, Player[]>);

    // 선수 세부 정보 토글
    const togglePlayerDetails = (playerId: string) => {
        setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
    };

    return (
        <div className="space-y-6">
            {/* 팀 헤더 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start space-x-4">
                        {/* 팀 로고 */}
                        {team.logo_url ? (
                            <Image
                                src={team.logo_url}
                                alt={`${team.name} 로고`}
                                width={80}
                                height={80}
                                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-match-blue flex items-center justify-center text-white font-bold text-2xl">
                                {team.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {team.name}
                            </h1>
                            {captainInfo && (
                                <p className="text-lg text-gray-600 mb-2">
                                    주장: {captainInfo.name}
                                </p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>선수 {playerCount}명</span>
                                <span>생성일: {formatDate(team.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 액션 버튼 */}
                    {isOwner && (
                        <div className="flex gap-2 mt-4 md:mt-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit?.()}
                                disabled={loading}
                            >
                                팀 수정
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onDelete?.()}
                                disabled={loading}
                            >
                                팀 삭제
                            </Button>
                        </div>
                    )}
                </div>

                {/* 팀 설명 */}
                {team.description && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-700 whitespace-pre-wrap">{team.description}</p>
                    </div>
                )}
            </div>

            {/* 팀 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">팀 정보</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">팀명</span>
                                <span className="font-medium">{team.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">선수 수</span>
                                <span className="font-medium">{playerCount}명</span>
                            </div>
                            {captainInfo && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">주장</span>
                                    <span className="font-medium">{captainInfo.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">생성일</span>
                                <span className="font-medium">{formatDate(team.created_at)}</span>
                            </div>
                            {team.updated_at !== team.created_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">수정일</span>
                                    <span className="font-medium">{formatDate(team.updated_at)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* 매치 정보 */}
                {match && (
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">참가 매치</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">매치명</span>
                                    <span className="font-medium">{match.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">상태</span>
                                    <span className="font-medium">{match.status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">형식</span>
                                    <span className="font-medium">{match.type}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* 선수 목록 */}
            <Card>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            선수 목록 ({playerCount}명)
                        </h3>
                        {isOwner && onAddPlayer && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onAddPlayer()}
                                disabled={loading}
                            >
                                선수 추가
                            </Button>
                        )}
                    </div>

                    {playerCount === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-500 mb-2">
                                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold">선수가 없습니다</p>
                            <p className="text-gray-600">팀에 선수를 추가해보세요.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(playersByPosition).map(([position, positionPlayers]) => (
                                <div key={position} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">
                                        {position} ({positionPlayers.length}명)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {positionPlayers.map((player) => (
                                            <div
                                                key={player.id}
                                                className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        {player.avatar_url ? (
                                                            <Image
                                                                src={player.avatar_url}
                                                                alt={player.name}
                                                                width={32}
                                                                height={32}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                                                                {player.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {player.name}
                                                                {player.id === team.captain_id && (
                                                                    <span className="ml-2 text-xs bg-match-blue text-white px-2 py-1 rounded-full">
                                                                        주장
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {player.jersey_number && (
                                                                <div className="text-sm text-gray-600">
                                                                    #{player.jersey_number}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isOwner && (
                                                        <div className="flex items-center space-x-1">
                                                            <button
                                                                onClick={() => togglePlayerDetails(player.id)}
                                                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                                title="상세 정보"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => onEditPlayer?.(player)}
                                                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                                title="수정"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => onRemovePlayer?.(player.id)}
                                                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                                                title="제거"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 선수 상세 정보 (확장 시) */}
                                                {expandedPlayer === player.id && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                                                        {player.email && (
                                                            <div className="mb-1">
                                                                <span className="text-gray-600">이메일:</span> {player.email}
                                                            </div>
                                                        )}
                                                        <div className="mb-1">
                                                            <span className="text-gray-600">가입일:</span> {formatDate(player.created_at)}
                                                        </div>
                                                        {player.stats && Object.keys(player.stats).length > 0 && (
                                                            <div>
                                                                <span className="text-gray-600">통계:</span>
                                                                <pre className="text-xs text-gray-700 mt-1">
                                                                    {JSON.stringify(player.stats, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TeamDetail;