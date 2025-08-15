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

// POST: 경기에서 팀 제거 (경기 주최자만 가능)
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string; participantId: string }> }
) {
    try {
        const params = await context.params;
        const { id: matchId, participantId } = params;
        
        const supabase = createSupabaseClient(request);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 경기 정보 확인
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json(
                { error: 'Match not found' },
                { status: 404 }
            );
        }

        // 경기 주최자만 팀 제거 가능
        if (match.creator_id !== user.id) {
            return NextResponse.json(
                { error: 'Only match creator can remove teams' },
                { status: 403 }
            );
        }

        // 참가 팀 정보 확인
        const { data: participant, error: participantError } = await supabase
            .from('match_participants')
            .select(`
                *,
                team:teams (
                    id,
                    name,
                    captain_id
                )
            `)
            .eq('id', participantId)
            .eq('match_id', matchId)
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                { error: 'Participant not found' },
                { status: 404 }
            );
        }

        // 경기가 이미 진행 중이거나 완료된 경우 제거 불가
        if (match.status === 'in_progress' || match.status === 'completed') {
            return NextResponse.json(
                { error: 'Cannot remove team from ongoing or completed match' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { reason: _reason } = body; // Reason for removal (future audit logging)

        // 참가 기록 삭제
        const { error: deleteError } = await supabase
            .from('match_participants')
            .delete()
            .eq('id', participantId)
            .eq('match_id', matchId);

        if (deleteError) {
            console.error('Error removing team from match:', deleteError);
            return NextResponse.json(
                { error: 'Failed to remove team from match' },
                { status: 500 }
            );
        }

        // 알림 생성 (선택적)
        // TODO: 팀 주장에게 알림 전송

        return NextResponse.json({ 
            message: `Team "${participant.team.name}" has been removed from the match`,
            participant: {
                id: participant.id,
                team_id: participant.team_id,
                team_name: participant.team.name
            }
        });
    } catch (error) {
        console.error('Error in POST /api/matches/[id]/participants/[participantId]/remove:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}