import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    try {
        // 각 테이블의 데이터 수와 샘플 데이터 확인
        const results: any = {};

        // matches 테이블 체크
        const { data: matches, error: matchError, count: matchCount } = await supabaseAdmin
            .from('matches')
            .select('*', { count: 'exact' })
            .limit(3);

        results.matches = {
            count: matchCount,
            error: matchError?.message,
            sample: matches,
            columns: matches && matches.length > 0 ? Object.keys(matches[0]) : []
        };

        // teams 테이블 체크
        const { data: teams, error: teamError, count: teamCount } = await supabaseAdmin
            .from('teams')
            .select('*', { count: 'exact' })
            .limit(3);

        results.teams = {
            count: teamCount,
            error: teamError?.message,
            sample: teams,
            columns: teams && teams.length > 0 ? Object.keys(teams[0]) : []
        };

        // players 테이블 체크
        const { data: players, error: playerError, count: playerCount } = await supabaseAdmin
            .from('players')
            .select('*', { count: 'exact' })
            .limit(3);

        results.players = {
            count: playerCount,
            error: playerError?.message,
            sample: players,
            columns: players && players.length > 0 ? Object.keys(players[0]) : []
        };

        // games 테이블 체크
        const { data: games, error: gameError, count: gameCount } = await supabaseAdmin
            .from('games')
            .select('*', { count: 'exact' })
            .limit(3);

        results.games = {
            count: gameCount,
            error: gameError?.message,
            sample: games,
            columns: games && games.length > 0 ? Object.keys(games[0]) : []
        };

        // match_participants 테이블 체크
        const { data: participants, error: participantError, count: participantCount } = await supabaseAdmin
            .from('match_participants')
            .select('*', { count: 'exact' })
            .limit(3);

        results.match_participants = {
            count: participantCount,
            error: participantError?.message,
            sample: participants,
            columns: participants && participants.length > 0 ? Object.keys(participants[0]) : []
        };

        // 환경변수 체크
        results.environment = {
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
            SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
            SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
        };

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error) {
        console.error('Database check error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}