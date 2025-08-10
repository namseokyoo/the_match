'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { showToast } from '@/components/ui/Toast';

interface RealtimeConfig {
    channel: string;
    event?: string;
    table?: string;
    filter?: string;
    onMessage?: (payload: any) => void;
    onInsert?: (payload: any) => void;
    onUpdate?: (payload: any) => void;
    onDelete?: (payload: any) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: any) => void;
}

export function useRealtimeUpdates(config: RealtimeConfig) {
    const supabase = createClientComponentClient();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const channelRef = useRef<any>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);

    const connect = useCallback(() => {
        if (channelRef.current) return;

        const channel = supabase
            .channel(config.channel)
            .on('presence', { event: 'sync' }, () => {
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
                config.onConnect?.();
            });

        // Database changes subscription
        if (config.table) {
            let subscription = channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: config.table,
                    filter: config.filter,
                },
                (payload) => {
                    setLastMessage(payload);
                    
                    switch (payload.eventType) {
                        case 'INSERT':
                            config.onInsert?.(payload);
                            break;
                        case 'UPDATE':
                            config.onUpdate?.(payload);
                            break;
                        case 'DELETE':
                            config.onDelete?.(payload);
                            break;
                    }
                    
                    config.onMessage?.(payload);
                }
            );
        }

        // Broadcast subscription
        if (config.event) {
            channel.on('broadcast', { event: config.event }, (payload) => {
                setLastMessage(payload);
                config.onMessage?.(payload);
            });
        }

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
            } else if (status === 'CHANNEL_ERROR') {
                setIsConnected(false);
                config.onError?.({ type: 'CHANNEL_ERROR', status });
                handleReconnect();
            } else if (status === 'TIMED_OUT') {
                setIsConnected(false);
                config.onError?.({ type: 'TIMEOUT', status });
                handleReconnect();
            } else if (status === 'CLOSED') {
                setIsConnected(false);
                config.onDisconnect?.();
            }
        });

        channelRef.current = channel;
    }, [config, supabase]);

    const disconnect = useCallback(() => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
            setIsConnected(false);
            config.onDisconnect?.();
        }
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
    }, [supabase, config]);

    const handleReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current >= 5) {
            showToast('실시간 연결이 끊어졌습니다. 페이지를 새로고침해주세요.', 'error');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
            disconnect();
            connect();
        }, delay);
    }, [connect, disconnect]);

    const sendMessage = useCallback(async (event: string, payload: any) => {
        if (!channelRef.current) {
            config.onError?.({ type: 'NOT_CONNECTED' });
            return false;
        }

        const result = await channelRef.current.send({
            type: 'broadcast',
            event,
            payload,
        });

        return result === 'ok';
    }, [config]);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    // Handle page visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                disconnect();
            } else {
                connect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [connect, disconnect]);

    return {
        isConnected,
        lastMessage,
        sendMessage,
        reconnect: () => {
            disconnect();
            connect();
        },
    };
}

// 특화된 실시간 훅들

// 경기 실시간 업데이트
export function useMatchRealtime(matchId: string) {
    const [matchData, setMatchData] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [scores, setScores] = useState<any[]>([]);

    const { isConnected } = useRealtimeUpdates({
        channel: `match:${matchId}`,
        table: 'matches',
        filter: `id=eq.${matchId}`,
        onUpdate: (payload) => {
            setMatchData(payload.new);
            showToast('경기 정보가 업데이트되었습니다', 'info');
        },
    });

    useRealtimeUpdates({
        channel: `match-participants:${matchId}`,
        table: 'match_participants',
        filter: `match_id=eq.${matchId}`,
        onInsert: (payload) => {
            setParticipants(prev => [...prev, payload.new]);
            showToast('새로운 참가팀이 추가되었습니다', 'info');
        },
        onUpdate: (payload) => {
            setParticipants(prev =>
                prev.map(p => p.id === payload.new.id ? payload.new : p)
            );
        },
        onDelete: (payload) => {
            setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        },
    });

    useRealtimeUpdates({
        channel: `match-scores:${matchId}`,
        event: 'score-update',
        onMessage: (payload) => {
            setScores(payload.scores);
            showToast(`점수 업데이트: ${payload.team1} ${payload.score1} - ${payload.score2} ${payload.team2}`, 'info');
        },
    });

    return {
        isConnected,
        matchData,
        participants,
        scores,
    };
}

// 팀 실시간 업데이트
export function useTeamRealtime(teamId: string) {
    const [teamData, setTeamData] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);

    const { isConnected } = useRealtimeUpdates({
        channel: `team:${teamId}`,
        table: 'teams',
        filter: `id=eq.${teamId}`,
        onUpdate: (payload) => {
            setTeamData(payload.new);
        },
    });

    useRealtimeUpdates({
        channel: `team-members:${teamId}`,
        table: 'team_members',
        filter: `team_id=eq.${teamId}`,
        onInsert: (payload) => {
            setMembers(prev => [...prev, payload.new]);
            showToast('새로운 팀원이 추가되었습니다', 'info');
        },
        onUpdate: (payload) => {
            setMembers(prev =>
                prev.map(m => m.id === payload.new.id ? payload.new : m)
            );
        },
        onDelete: (payload) => {
            setMembers(prev => prev.filter(m => m.id !== payload.old.id));
            showToast('팀원이 제거되었습니다', 'info');
        },
    });

    return {
        isConnected,
        teamData,
        members,
    };
}

// 알림 실시간 수신
export function useNotifications(userId: string) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const { isConnected } = useRealtimeUpdates({
        channel: `notifications:${userId}`,
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
        onInsert: (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
            if (!payload.new.read) {
                setUnreadCount(prev => prev + 1);
                showToast(payload.new.title, 'info');
            }
        },
        onUpdate: (payload) => {
            setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? payload.new : n)
            );
            if (payload.old.read !== payload.new.read) {
                setUnreadCount(prev => payload.new.read ? prev - 1 : prev + 1);
            }
        },
        onDelete: (payload) => {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            if (!payload.old.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        },
    });

    const markAsRead = useCallback(async (notificationId: string) => {
        // API call to mark as read
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
        return response.ok;
    }, []);

    const markAllAsRead = useCallback(async () => {
        const response = await fetch('/api/notifications/read-all', {
            method: 'PUT',
        });
        if (response.ok) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        }
        return response.ok;
    }, []);

    return {
        isConnected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
    };
}

export default useRealtimeUpdates;