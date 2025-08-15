'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TeamJoinRequest } from '@/types';
import { Button, Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Check, X, Clock } from 'lucide-react';

interface TeamJoinRequestsProps {
    teamId: string;
    isCaptain: boolean;
    onRequestUpdate?: () => void;
}

export const TeamJoinRequests: React.FC<TeamJoinRequestsProps> = ({
    teamId,
    isCaptain,
    onRequestUpdate
}) => {
    const [requests, setRequests] = useState<TeamJoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        try {
            const response = await fetch(`/api/teams/${teamId}/join-requests`);
            const data = await response.json();
            
            if (response.ok) {
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching join requests:', error);
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        fetchRequests();
    }, [teamId, fetchRequests]);

    const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
        setProcessingId(requestId);
        
        try {
            const response = await fetch(`/api/teams/${teamId}/join-requests`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestId,
                    status,
                    response_message: status === 'approved' 
                        ? '가입이 승인되었습니다!' 
                        : '죄송합니다. 가입이 거절되었습니다.'
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`가입 신청이 ${status === 'approved' ? '승인' : '거절'}되었습니다.`);
                await fetchRequests();
                if (onRequestUpdate) {
                    onRequestUpdate();
                }
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            console.error('Error processing request:', error);
            alert(error.message || '요청 처리에 실패했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <div>로딩 중...</div>;
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    if (!isCaptain && requests.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            {isCaptain && pendingRequests.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">대기 중인 가입 신청</h3>
                    <div className="space-y-3">
                        {pendingRequests.map((request) => (
                            <Card key={request.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-yellow-500" />
                                            <span className="font-medium">{request.player_name}</span>
                                            {request.player_email && (
                                                <span className="text-sm text-gray-500">
                                                    ({request.player_email})
                                                </span>
                                            )}
                                        </div>
                                        {request.position && (
                                            <p className="text-sm text-gray-600">
                                                포지션: {request.position}
                                            </p>
                                        )}
                                        {request.jersey_number && (
                                            <p className="text-sm text-gray-600">
                                                등번호: {request.jersey_number}
                                            </p>
                                        )}
                                        {request.message && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                메시지: {request.message}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            신청일: {formatDate(request.created_at)}
                                        </p>
                                    </div>
                                    {isCaptain && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => handleRequestAction(request.id, 'approved')}
                                                disabled={processingId === request.id}
                                            >
                                                <Check className="w-4 h-4" />
                                                승인
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleRequestAction(request.id, 'rejected')}
                                                disabled={processingId === request.id}
                                            >
                                                <X className="w-4 h-4" />
                                                거절
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {!isCaptain && requests.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">내 가입 신청 현황</h3>
                    <div className="space-y-3">
                        {requests.map((request) => (
                            <Card key={request.id} className="p-4">
                                <div className="flex items-center gap-2">
                                    {request.status === 'pending' && (
                                        <Clock className="w-4 h-4 text-yellow-500" />
                                    )}
                                    {request.status === 'approved' && (
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                                    {request.status === 'rejected' && (
                                        <X className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="font-medium">
                                        {request.status === 'pending' && '승인 대기 중'}
                                        {request.status === 'approved' && '승인됨'}
                                        {request.status === 'rejected' && '거절됨'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    신청일: {formatDate(request.created_at)}
                                </p>
                                {request.responded_at && (
                                    <p className="text-sm text-gray-600">
                                        처리일: {formatDate(request.responded_at)}
                                    </p>
                                )}
                                {request.response_message && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        메시지: {request.response_message}
                                    </p>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {isCaptain && processedRequests.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">처리된 가입 신청</h3>
                    <div className="space-y-3">
                        {processedRequests.map((request) => (
                            <Card key={request.id} className="p-4 opacity-75">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {request.status === 'approved' && (
                                                <Check className="w-4 h-4 text-green-500" />
                                            )}
                                            {request.status === 'rejected' && (
                                                <X className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className="font-medium">{request.player_name}</span>
                                            <span className="text-sm text-gray-500">
                                                ({request.status === 'approved' ? '승인됨' : '거절됨'})
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            처리일: {formatDate(request.responded_at || request.updated_at)}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamJoinRequests;