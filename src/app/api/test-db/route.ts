import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 환경변수 확인
        const envCheck = {
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
            SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
        };

        console.log('Environment variables:', envCheck);

        // 1단계: 기본 연결 테스트
        console.log('Testing basic connection...');
        const { data: connectionTest, error: connectionError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (connectionError) {
            console.error('Connection error:', connectionError);
            return NextResponse.json({
                success: false,
                step: 'connection_test',
                error: connectionError.message,
                details: connectionError.details,
                hint: connectionError.hint,
                code: connectionError.code,
                envCheck
            }, { status: 500 });
        }

        // 2단계: 테이블 존재 확인
        console.log('Testing table existence...');
        const { data: tableTest, error: tableError } = await supabase
            .from('matches')
            .select('count')
            .limit(1);

        if (tableError) {
            console.error('Table error:', tableError);
            return NextResponse.json({
                success: false,
                step: 'table_test',
                error: tableError.message,
                details: tableError.details,
                hint: tableError.hint,
                code: tableError.code,
                envCheck
            }, { status: 500 });
        }

        // 3단계: 팀 테이블 확인
        console.log('Testing teams table...');
        const { data: teamsTest, error: teamsError } = await supabase
            .from('teams')
            .select('count')
            .limit(1);

        if (teamsError) {
            console.error('Teams error:', teamsError);
            return NextResponse.json({
                success: false,
                step: 'teams_test',
                error: teamsError.message,
                details: teamsError.details,
                hint: teamsError.hint,
                code: teamsError.code,
                envCheck
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'All database tests passed',
            envCheck,
            tests: {
                connection: 'PASS',
                matches_table: 'PASS',
                teams_table: 'PASS'
            },
            data: {
                connection: connectionTest,
                matches: tableTest,
                teams: teamsTest
            }
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({
            success: false,
            step: 'try_catch',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            envCheck: {
                SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
                SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
            }
        }, { status: 500 });
    }
}