import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MatchParticipant, ParticipantStatus, ApplyToMatchForm } from '@/types';

// Supabase 클라이언트 생성 (서버용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/matches/[id]/participants - 경기 참가자 목록 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id: matchId } = params;

        if (!matchId || matchId === 'undefined') {
            return NextResponse.json(
                { error: '경기 ID가 필요합니다.' },
                { status: 400 }
            );
        }

        // 먼저 경기 존재 확인
        const { data: match, error: matchError } = await supabaseAdmin
            .from('tournaments') // DB 테이블명은 일단 유지
            .select('id, title')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 참가자 목록 조회 (팀 정보 포함)
        const { data: participants, error } = await supabaseAdmin
            .from('match_participants')
            .select(`
                *,
                team:teams (
                    id,
                    name,
                    logo_url,
                    captain_name,
                    description,
                    created_at
                )
            `)
            .eq('match_id', matchId)
            .order('applied_at', { ascending: false });

        if (error) {
            console.error('참가자 조회 오류:', error);
            return NextResponse.json(
                { error: '참가자 목록을 불러오는 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // 상태별 통계
        const stats = {
            total: participants?.length || 0,
            pending: participants?.filter(p => p.status === 'pending').length || 0,
            approved: participants?.filter(p => p.status === 'approved').length || 0,
            rejected: participants?.filter(p => p.status === 'rejected').length || 0,
        };

        return NextResponse.json({
            success: true,
            data: participants || [],
            stats,
            match: {
                id: match.id,
                title: match.title,
            },
        });

    } catch (error) {
        console.error('참가자 목록 조회 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST /api/matches/[id]/participants - 경기 참가 신청
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: '유효하지 않은 인증 토큰입니다.' },
                { status: 401 }
            );
        }

        const { id: matchId } = params;
        const body: ApplyToMatchForm = await request.json();

        if (!matchId || matchId === 'undefined') {
            return NextResponse.json(
                { error: '경기 ID가 필요합니다.' },
                { status: 400 }
            );
        }

        // 경기 존재 및 상태 확인
        const { data: match, error: matchError } = await supabaseAdmin
            .from('tournaments') // DB 테이블명은 일단 유지
            .select('id, title, status, creator_id')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 참가 신청 가능한 상태인지 확인
        if (match.status !== 'registration') {
            return NextResponse.json(
                { error: '현재 참가 신청을 받지 않는 경기입니다.' },
                { status: 400 }
            );
        }

        // 사용자가 주장인 팀 조회
        const { data: teams, error: teamsError } = await supabaseAdmin
            .from('teams')
            .select('id, name, captain_id')
            .eq('captain_id', user.id);

        if (teamsError) {
            console.error('팀 조회 오류:', teamsError);
            return NextResponse.json(
                { error: '팀 정보를 조회하는 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        if (!teams || teams.length === 0) {
            return NextResponse.json(
                { error: '참가 신청하려면 먼저 팀을 생성해야 합니다.' },
                { status: 400 }
            );
        }

        // 여러 팀이 있는 경우 첫 번째 팀 사용 (추후 팀 선택 UI 추가 가능)
        const team = teams[0];

        // 이미 참가 신청했는지 확인
        const { data: existingApplication, error: checkError } = await supabaseAdmin
            .from('match_participants')
            .select('id, status')
            .eq('match_id', matchId)
            .eq('team_id', team.id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('기존 신청 확인 오류:', checkError);
            return NextResponse.json(
                { error: '참가 신청 확인 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        if (existingApplication) {
            const statusText = {
                pending: '대기중',
                approved: '승인됨',
                rejected: '거부됨',
            }[existingApplication.status as 'pending' | 'approved' | 'rejected'] || existingApplication.status;

            return NextResponse.json(
                { error: `이미 참가 신청한 경기입니다. (현재 상태: ${statusText})` },
                { status: 400 }
            );
        }

        // 참가 신청 생성
        const participantData = {
            match_id: matchId,
            team_id: team.id,
            status: ParticipantStatus.PENDING,
            notes: body.notes?.trim() || null,
        };

        const { data: participant, error: insertError } = await supabaseAdmin
            .from('match_participants')
            .insert([participantData])
            .select(`
                *,
                team:teams (
                    id,
                    name,
                    logo_url,
                    captain_name
                )
            `)
            .single();

        if (insertError) {
            console.error('참가 신청 생성 오류:', insertError);
            return NextResponse.json(
                { error: '참가 신청 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: participant,
            message: '참가 신청이 완료되었습니다.',
        }, { status: 201 });

    } catch (error) {
        console.error('참가 신청 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
} 