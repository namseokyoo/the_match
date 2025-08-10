import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성 함수
function createSupabaseClient(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Authorization 헤더에서 토큰 가져오기
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: token ? {
                Authorization: `Bearer ${token}`
            } : {}
        },
        auth: {
            persistSession: false
        }
    });
    
    return supabase;
}

// POST: 팀 탈퇴
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const teamId = params.id;
        
        const supabase = createSupabaseClient(request);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 팀 정보 확인
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();

        if (teamError || !team) {
            return NextResponse.json(
                { error: 'Team not found' },
                { status: 404 }
            );
        }

        // 팀 주장은 탈퇴할 수 없음
        if (team.captain_id === user.id) {
            return NextResponse.json(
                { error: 'Team captain cannot leave the team. Please transfer captain role or delete the team.' },
                { status: 400 }
            );
        }

        // 현재 사용자가 팀 멤버인지 확인
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('team_id', teamId)
            .or(`user_id.eq.${user.id},email.eq.${user.email}`)
            .single();

        if (playerError || !player) {
            return NextResponse.json(
                { error: 'You are not a member of this team' },
                { status: 400 }
            );
        }

        // 진행 중인 경기 확인
        const { data: activeParticipations } = await supabase
            .from('match_participants')
            .select(`
                *,
                match:matches!match_id (
                    id,
                    title,
                    status
                )
            `)
            .eq('team_id', teamId)
            .eq('status', 'approved')
            .in('match.status', ['in_progress', 'ready']);

        if (activeParticipations && activeParticipations.length > 0) {
            const activeMatches = activeParticipations
                .filter(p => p.match && (p.match.status === 'in_progress' || p.match.status === 'ready'))
                .map(p => p.match.title)
                .join(', ');

            if (activeMatches) {
                return NextResponse.json(
                    { error: `Cannot leave team while participating in active matches: ${activeMatches}` },
                    { status: 400 }
                );
            }
        }

        // 플레이어 삭제
        const { error: deleteError } = await supabase
            .from('players')
            .delete()
            .eq('id', player.id);

        if (deleteError) {
            console.error('Error leaving team:', deleteError);
            return NextResponse.json(
                { error: 'Failed to leave team' },
                { status: 500 }
            );
        }

        // 팀 가입 요청 상태 업데이트
        await supabase
            .from('team_join_requests')
            .update({ 
                status: 'left_team',
                responded_at: new Date().toISOString(),
                response_message: 'Player left the team voluntarily'
            })
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .eq('status', 'approved');

        return NextResponse.json({ 
            message: `Successfully left team "${team.name}"`,
            team: {
                id: team.id,
                name: team.name
            }
        });
    } catch (error) {
        console.error('Error in POST /api/teams/[id]/leave:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}