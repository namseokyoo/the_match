'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { showToast } from '@/components/ui/Toast';
import type { Match, Team, Player, MatchParticipant } from '@/types';

interface RealtimePayload<T = Record<string, unknown>> {
  new: T;
  old: T;
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE';
}

interface RealtimeConfig<T = Record<string, unknown>> {
    channel: string;
    event?: string;
    table?: string;
    filter?: string;
    onMessage?: (payload: RealtimePayload<T> & Record<string, unknown>) => void;
    onInsert?: (payload: { new: T }) => void;
    onUpdate?: (payload: { new: T; old: T }) => void;
    onDelete?: (payload: { old: T }) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
}

export function useRealtimeUpdates(config: RealtimeConfig) {
    const supabase = createClientComponentClient();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<RealtimePayload | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);

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
            // Call connect directly without dependency
            connectChannel();
        }, delay);
    }, [disconnect]);

    const connectChannel = useCallback(() => {
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
            channel.on(
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
                const broadcastPayload = {
                    ...payload,
                    new: payload as Record<string, unknown>,
                    old: {} as Record<string, unknown>
                };
                setLastMessage(broadcastPayload);
                config.onMessage?.(broadcastPayload);
            });
        }

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
            } else if (status === 'CHANNEL_ERROR') {
                setIsConnected(false);
                const errorWithType = new Error('Channel error') as Error & { type: string; status: string };
                errorWithType.type = 'CHANNEL_ERROR';
                errorWithType.status = status;
                config.onError?.(errorWithType);
                handleReconnect();
            } else if (status === 'TIMED_OUT') {
                setIsConnected(false);
                const errorWithType = new Error('Timeout') as Error & { type: string; status: string };
                errorWithType.type = 'TIMEOUT';
                errorWithType.status = status;
                config.onError?.(errorWithType);
                handleReconnect();
            } else if (status === 'CLOSED') {
                setIsConnected(false);
                config.onDisconnect?.();
            }
        });

        channelRef.current = channel;
    }, [config, supabase, handleReconnect]);

    const connect = connectChannel;

    const sendMessage = useCallback(async (event: string, payload: Record<string, unknown>) => {
        if (!channelRef.current) {
            const errorWithType = new Error('Not connected') as Error & { type: string };
            errorWithType.type = 'NOT_CONNECTED';
            config.onError?.(errorWithType);
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
    const [matchData, setMatchData] = useState<Match | null>(null);
    const [participants, setParticipants] = useState<MatchParticipant[]>([]);
    const [scores, setScores] = useState<Array<Record<string, unknown>>>([]);

    const { isConnected } = useRealtimeUpdates({
        channel: `match:${matchId}`,
        table: 'matches',
        filter: `id=eq.${matchId}`,
        onUpdate: (payload) => {
            setMatchData(payload.new as unknown as Match);
            showToast('경기 정보가 업데이트되었습니다', 'info');
        },
    });

    useRealtimeUpdates({
        channel: `match-participants:${matchId}`,
        table: 'match_participants',
        filter: `match_id=eq.${matchId}`,
        onInsert: (payload) => {
            setParticipants(prev => [...prev, payload.new as unknown as MatchParticipant]);
            showToast('새로운 참가팀이 추가되었습니다', 'info');
        },
        onUpdate: (payload) => {
            setParticipants(prev =>
                prev.map(p => p.id === (payload.new as any).id ? payload.new as unknown as MatchParticipant : p)
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
            setScores((payload as any).scores || []);
            const payloadData = payload as any;
            showToast(`점수 업데이트: ${payloadData.team1} ${payloadData.score1} - ${payloadData.score2} ${payloadData.team2}`, 'info');
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
    const [teamData, setTeamData] = useState<Team | null>(null);
    const [members, setMembers] = useState<Player[]>([]);

    const { isConnected } = useRealtimeUpdates({
        channel: `team:${teamId}`,
        table: 'teams',
        filter: `id=eq.${teamId}`,
        onUpdate: (payload) => {
            setTeamData(payload.new as unknown as Team);
        },
    });

    useRealtimeUpdates({
        channel: `team-members:${teamId}`,
        table: 'team_members',
        filter: `team_id=eq.${teamId}`,
        onInsert: (payload) => {
            setMembers(prev => [...prev, payload.new as unknown as Player]);
            showToast('새로운 팀원이 추가되었습니다', 'info');
        },
        onUpdate: (payload) => {
            setMembers(prev =>
                prev.map(m => m.id === (payload.new as any).id ? payload.new as unknown as Player : m)
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
interface Notification {
    id: string;
    user_id: string;
    title: string;
    message?: string;
    read: boolean;
    created_at: string;
}

export function useNotifications(userId: string) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const { isConnected } = useRealtimeUpdates({
        channel: `notifications:${userId}`,
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
        onInsert: (payload) => {
            const newNotification = payload.new as unknown as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            if (!newNotification.read) {
                setUnreadCount(prev => prev + 1);
                showToast(newNotification.title || 'New notification', 'info');
            }
        },
        onUpdate: (payload) => {
            const newNotification = payload.new as unknown as Notification;
            const oldNotification = payload.old as unknown as Notification;
            setNotifications(prev =>
                prev.map(n => n.id === newNotification.id ? newNotification : n)
            );
            if (oldNotification.read !== newNotification.read) {
                setUnreadCount(prev => newNotification.read ? prev - 1 : prev + 1);
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