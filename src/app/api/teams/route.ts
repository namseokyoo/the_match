import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 (Service Role Key 또는 Anon Key 사용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/teams - 팀 목록 조회
export async function GET() {
    try {
        console.log('Teams API called');
        
        // 환경변수 확인
        const envCheck = {
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
            SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
        };
        
        console.log('Environment check:', envCheck);

        // 가장 간단한 쿼리부터 시작
        console.log('Executing basic teams query...');
        const { data: teams, error } = await supabaseAdmin
            .from('teams')
            .select('*')
            .limit(10);

        if (error) {
            console.error('Teams fetch error:', error);
            return NextResponse.json({
                success: false,
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                envCheck
            }, { status: 500 });
        }

        console.log('Teams query successful, found:', teams?.length || 0, 'teams');

        return NextResponse.json({
            success: true,
            data: teams || [],
            count: teams?.length || 0,
            envCheck
        });
    } catch (error) {
        console.error('Teams API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

// POST /api/teams - 팀 생성
export async function POST(request: NextRequest) {
    try {
        // 요청 본문 파싱
        const body = await request.json();
        const { name, description, logo_url, match_id, captain_id } = body;

        // 필수 필드 검증
        if (!name) {
            return NextResponse.json(
                { error: '팀 이름은 필수입니다.' },
                { status: 400 }
            );
        }

        // Service Role 클라이언트는 서버 사이드에서 실행되므로 인증 확인 불필요
        // 클라이언트에서 인증된 사용자만 이 API를 호출할 수 있도록 별도 처리 필요

        // 동일한 매치 내에서 팀 이름 중복 체크
        if (match_id) {
            const { data: existingTeams } = await supabaseAdmin
                .from('teams')
                .select('id')
                .eq('match_id', match_id)
                .eq('name', name)
                .limit(1);

            if (existingTeams && existingTeams.length > 0) {
                return NextResponse.json(
                    { error: '이미 동일한 이름의 팀이 해당 매치에 존재합니다.' },
                    { status: 409 }
                );
            }
        }

        // 팀 생성
        const { data: team, error: insertError } = await supabaseAdmin
            .from('teams')
            .insert({
                name,
                description,
                logo_url,
                match_id,
                captain_id: captain_id,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Team creation error:', insertError);
            return NextResponse.json(
                { error: '팀 생성에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: team,
            message: '팀이 성공적으로 생성되었습니다.',
        });
    } catch (error) {
        console.error('Team creation API error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}