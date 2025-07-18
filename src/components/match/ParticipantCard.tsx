'use client';

import React from 'react';
import Image from 'next/image';
import { MatchParticipant, ParticipantStatus } from '@/types';
import { Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface ParticipantCardProps {
    participant: MatchParticipant;
    isOwner?: boolean;
    onApprove?: (teamId: string) => void;
    onReject?: (teamId: string) => void;
    onCancel?: (teamId: string) => void;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
    participant,
    isOwner = false,
    onApprove,
    onReject,
    onCancel,
}) => {
    const getStatusBadge = (status: ParticipantStatus) => {
        const statusConfig = {
            pending: { text: '대기중', className: 'bg-yellow-100 text-yellow-800' },
            approved: { text: '승인됨', className: 'bg-green-100 text-green-800' },
            rejected: { text: '거부됨', className: 'bg-red-100 text-red-800' },
        };

        const config = statusConfig[status];
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                {config.text}
            </span>
        );
    };

    const getStatusIcon = (status: ParticipantStatus) => {
        switch (status) {
            case ParticipantStatus.PENDING:
                return '⏳';
            case ParticipantStatus.APPROVED:
                return '✅';
            case ParticipantStatus.REJECTED:
                return '❌';
            default:
                return '❓';
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                {/* 팀 정보 */}
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {participant.team?.logo_url ? (
                            <Image
                                src={participant.team.logo_url}
                                alt={`${participant.team.name} 로고`}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-gray-500 text-xl">👥</span>
                        )}
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {participant.team?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                            주장 ID: {participant.team?.captain_id || '미지정'}
                        </p>
                        <p className="text-xs text-gray-500">
                            신청일: {formatDate(participant.applied_at)}
                        </p>
                        {participant.responded_at && (
                            <p className="text-xs text-gray-500">
                                응답일: {formatDate(participant.responded_at)}
                            </p>
                        )}
                    </div>
                </div>

                {/* 상태 및 액션 */}
                <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStatusIcon(participant.status)}</span>
                        {getStatusBadge(participant.status)}
                    </div>

                    {/* 액션 버튼들 */}
                    {isOwner && participant.status === ParticipantStatus.PENDING && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onApprove?.(participant.team_id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                                승인
                            </button>
                            <button
                                onClick={() => onReject?.(participant.team_id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                                거부
                            </button>
                        </div>
                    )}

                    {!isOwner && participant.status === ParticipantStatus.PENDING && onCancel && (
                        <button
                            onClick={() => onCancel(participant.team_id)}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                        >
                            신청 취소
                        </button>
                    )}
                </div>
            </div>

            {/* 메모 */}
            {participant.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">메모:</span> {participant.notes}
                    </p>
                </div>
            )}
        </Card>
    );
};

export default ParticipantCard; 