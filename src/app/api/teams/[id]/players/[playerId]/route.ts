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

// DELETE: 팀에서 선수 제거 (팀 주장 또는 선수 본인)
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string; playerId: string }> }
) {
    try {
        const params = await context.params;
        const { id: teamId, playerId } = params;
        
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

        // 선수 정보 확인
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .eq('team_id', teamId)
            .single();

        if (playerError || !player) {
            return NextResponse.json(
                { error: 'Player not found in this team' },
                { status: 404 }
            );
        }

        // 권한 확인: 팀 주장이거나 선수 본인만 제거 가능
        const isTeamCaptain = team.captain_id === user.id;
        const isPlayerSelf = player.user_id === user.id || player.email === user.email;

        if (!isTeamCaptain && !isPlayerSelf) {
            return NextResponse.json(
                { error: 'Only team captain or the player themselves can remove from team' },
                { status: 403 }
            );
        }

        // 진행 중인 경기에 참가 중인지 확인
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
                    { error: `Cannot remove player while participating in active matches: ${activeMatches}` },
                    { status: 400 }
                );
            }
        }

        // 선수 제거
        const { error: deleteError } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId)
            .eq('team_id', teamId);

        if (deleteError) {
            console.error('Error removing player from team:', deleteError);
            return NextResponse.json(
                { error: 'Failed to remove player from team' },
                { status: 500 }
            );
        }

        // 관련된 팀 가입 요청도 정리 (있는 경우)
        if (player.user_id) {
            await supabase
                .from('team_join_requests')
                .update({ 
                    status: 'left_team',
                    responded_at: new Date().toISOString(),
                    response_message: isPlayerSelf ? 'Player left the team' : 'Player removed by captain'
                })
                .eq('team_id', teamId)
                .eq('user_id', player.user_id)
                .eq('status', 'approved');
        }

        return NextResponse.json({ 
            message: isPlayerSelf 
                ? 'Successfully left the team' 
                : `Player ${player.name} has been removed from the team`,
            player: {
                id: player.id,
                name: player.name
            }
        });
    } catch (error) {
        console.error('Error in DELETE /api/teams/[id]/players/[playerId]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET: 특정 선수 정보 조회
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string; playerId: string }> }
) {
    try {
        const params = await context.params;
        const { id: teamId, playerId } = params;
        
        const supabase = createSupabaseClient(request);

        // 선수 정보 조회
        const { data: player, error } = await supabase
            .from('players')
            .select(`
                *,
                team:teams!team_id (
                    id,
                    name,
                    captain_id
                )
            `)
            .eq('id', playerId)
            .eq('team_id', teamId)
            .single();

        if (error || !player) {
            return NextResponse.json(
                { error: 'Player not found in this team' },
                { status: 404 }
            );
        }

        return NextResponse.json({ player });
    } catch (error) {
        console.error('Error in GET /api/teams/[id]/players/[playerId]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}