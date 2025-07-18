import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/teams - 팀 목록 조회
export async function GET(request: NextRequest) {
    try {
        // URL 파라미터 파싱
        const { searchParams } = new URL(request.url);
        const tournamentId = searchParams.get('tournament_id');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search');

        // 쿼리 빌딩
        let query = supabase
            .from('teams')
            .select(`
                *,
                players:players(*)
            `)
            .order('created_at', { ascending: false });

        // 토너먼트별 필터링
        if (tournamentId) {
            query = query.eq('tournament_id', tournamentId);
        }

        // 검색 필터링
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        // 페이지네이션
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data: teams, error, count } = await query;

        if (error) {
            console.error('Teams fetch error:', error);
            return NextResponse.json(
                { error: '팀 목록을 불러오는데 실패했습니다.' },
                { status: 500 }
            );
        }

        // 페이지네이션 정보 계산
        const totalPages = Math.ceil((count || 0) / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return NextResponse.json({
            success: true,
            data: teams,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages,
                hasNext,
                hasPrev,
            },
        });
    } catch (error) {
        console.error('Teams API error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST /api/teams - 팀 생성
export async function POST(request: NextRequest) {
    try {
        // 요청 본문 파싱
        const body = await request.json();
        const { name, description, logo_url, tournament_id, captain_id } = body;

        // 필수 필드 검증
        if (!name) {
            return NextResponse.json(
                { error: '팀 이름은 필수입니다.' },
                { status: 400 }
            );
        }

        // 현재 사용자 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 동일한 토너먼트 내에서 팀 이름 중복 체크
        if (tournament_id) {
            const { data: existingTeams } = await supabase
                .from('teams')
                .select('id')
                .eq('tournament_id', tournament_id)
                .eq('name', name)
                .limit(1);

            if (existingTeams && existingTeams.length > 0) {
                return NextResponse.json(
                    { error: '이미 동일한 이름의 팀이 해당 토너먼트에 존재합니다.' },
                    { status: 409 }
                );
            }
        }

        // 팀 생성
        const { data: team, error: insertError } = await supabase
            .from('teams')
            .insert({
                name,
                description,
                logo_url,
                tournament_id,
                captain_id: captain_id || user.id,
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