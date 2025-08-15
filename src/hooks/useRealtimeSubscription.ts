'use client';

import { useEffect, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions {
    event?: PostgresChangeEvent;
    schema?: string;
    table: string;
    filter?: string;
    onInsert?: (_data: RealtimePostgresChangesPayload<any>) => void;
    onUpdate?: (_data: RealtimePostgresChangesPayload<any>) => void;
    onDelete?: (_data: RealtimePostgresChangesPayload<any>) => void;
    onChange?: (_data: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtimeSubscription({
    event = '*',
    schema = 'public',
    table,
    filter,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
}: UseRealtimeSubscriptionOptions) {
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        // 구독 채널 생성
        const channelName = `${schema}:${table}:${filter || 'all'}`;
        const channel = supabase.channel(channelName);

        // 이벤트별 핸들러 설정
        channel.on(
            'postgres_changes' as any,
            {
                event,
                schema,
                table,
                filter,
            },
            (data: RealtimePostgresChangesPayload<any>) => {
                // 공통 onChange 핸들러
                if (onChange) {
                    onChange(data);
                }

                // 이벤트별 핸들러
                switch (data.eventType) {
                    case 'INSERT':
                        if (onInsert) onInsert(data);
                        break;
                    case 'UPDATE':
                        if (onUpdate) onUpdate(data);
                        break;
                    case 'DELETE':
                        if (onDelete) onDelete(data);
                        break;
                }
            }
        );

        // 구독 시작
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Subscribed to ${channelName}`);
            } else if (status === 'CHANNEL_ERROR') {
                console.error(`Error subscribing to ${channelName}`);
            }
        });

        channelRef.current = channel;

        // 클린업
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [event, schema, table, filter, onInsert, onUpdate, onDelete, onChange]);

    return channelRef.current;
}

// 특정 테이블용 커스텀 훅들
export function useMatchRealtime(
    matchId: string,
    handlers: {
        onUpdate?: (_data: RealtimePostgresChangesPayload<any>) => void;
    }
) {
    return useRealtimeSubscription({
        table: 'tournaments',
        filter: `id=eq.${matchId}`,
        ...handlers,
    });
}

export function useTeamRealtime(
    teamId: string,
    handlers: {
        onUpdate?: (_data: RealtimePostgresChangesPayload<any>) => void;
        onDelete?: (_data: RealtimePostgresChangesPayload<any>) => void;
    }
) {
    return useRealtimeSubscription({
        table: 'teams',
        filter: `id=eq.${teamId}`,
        ...handlers,
    });
}

export function usePlayersRealtime(
    teamId: string,
    handlers: {
        onInsert?: (_data: RealtimePostgresChangesPayload<any>) => void;
        onUpdate?: (_data: RealtimePostgresChangesPayload<any>) => void;
        onDelete?: (_data: RealtimePostgresChangesPayload<any>) => void;
    }
) {
    return useRealtimeSubscription({
        table: 'players',
        filter: `team_id=eq.${teamId}`,
        ...handlers,
    });
}