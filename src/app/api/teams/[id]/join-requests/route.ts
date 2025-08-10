import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: 팀의 가입 신청 목록 조회 (팀 주장용) 또는 내 신청 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const teamId = params.id;

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

        // 팀 주장인 경우 모든 신청 조회, 아닌 경우 자신의 신청만 조회
        let query = supabase
            .from('team_join_requests')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false });

        if (team.captain_id !== user.id) {
            query = query.eq('user_id', user.id);
        }

        const { data: requests, error } = await query;

        if (error) {
            console.error('Error fetching join requests:', error);
            return NextResponse.json(
                { error: 'Failed to fetch join requests' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            requests: requests || [],
            isCaptain: team.captain_id === user.id 
        });
    } catch (error) {
        console.error('Error in GET /api/teams/[id]/join-requests:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: 팀 가입 신청
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const teamId = params.id;
        const body = await request.json();
        const { player_name, player_email, position, jersey_number, message } = body;

        // 이미 팀 멤버인지 확인
        const { data: existingPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('team_id', teamId)
            .eq('email', user.email)
            .single();

        if (existingPlayer) {
            return NextResponse.json(
                { error: 'You are already a member of this team' },
                { status: 400 }
            );
        }

        // 이미 대기중인 신청이 있는지 확인
        const { data: existingRequest } = await supabase
            .from('team_join_requests')
            .select('*')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .single();

        if (existingRequest) {
            return NextResponse.json(
                { error: 'You already have a pending request for this team' },
                { status: 400 }
            );
        }

        // 가입 신청 생성
        const { data: newRequest, error } = await supabase
            .from('team_join_requests')
            .insert([{
                team_id: teamId,
                user_id: user.id,
                player_name: player_name || user.user_metadata?.name || user.email?.split('@')[0] || '익명',
                player_email: player_email || user.email,
                position,
                jersey_number,
                message,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating join request:', error);
            return NextResponse.json(
                { error: 'Failed to create join request' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            request: newRequest,
            message: 'Join request submitted successfully' 
        });
    } catch (error) {
        console.error('Error in POST /api/teams/[id]/join-requests:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH: 가입 신청 승인/거절 (팀 주장용)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const teamId = params.id;
        const body = await request.json();
        const { requestId, status, response_message } = body;

        if (!requestId || !status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid request data' },
                { status: 400 }
            );
        }

        // 팀 주장인지 확인
        const { data: team } = await supabase
            .from('teams')
            .select('captain_id')
            .eq('id', teamId)
            .single();

        if (!team || team.captain_id !== user.id) {
            return NextResponse.json(
                { error: 'Only team captain can approve/reject requests' },
                { status: 403 }
            );
        }

        // 신청 상태 업데이트
        const { data: updatedRequest, error } = await supabase
            .from('team_join_requests')
            .update({
                status,
                responded_by: user.id,
                responded_at: new Date().toISOString(),
                response_message
            })
            .eq('id', requestId)
            .eq('team_id', teamId)
            .eq('status', 'pending')
            .select()
            .single();

        if (error || !updatedRequest) {
            console.error('Error updating join request:', error);
            return NextResponse.json(
                { error: 'Failed to update join request' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            request: updatedRequest,
            message: `Request ${status} successfully` 
        });
    } catch (error) {
        console.error('Error in PATCH /api/teams/[id]/join-requests:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}