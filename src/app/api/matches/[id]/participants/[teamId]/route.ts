import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ParticipantStatus, ParticipantResponse } from '@/types';

// Supabase 클라이언트 생성 (서버용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// PUT /api/matches/[id]/participants/[teamId] - 참가 신청 승인/거부 (경기 주최자만)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string; teamId: string } }
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

        const { id: matchId, teamId } = params;
        const body: ParticipantResponse = await request.json();

        if (!matchId || !teamId) {
            return NextResponse.json(
                { error: '경기 ID와 팀 ID가 필요합니다.' },
                { status: 400 }
            );
        }

        if (!body.status || ![ParticipantStatus.APPROVED, ParticipantStatus.REJECTED].includes(body.status)) {
            return NextResponse.json(
                { error: '유효하지 않은 상태입니다. (approved 또는 rejected만 가능)' },
                { status: 400 }
            );
        }

        // 경기 주최자 권한 확인
        const { data: match, error: matchError } = await supabaseAdmin
            .from('tournaments') // DB 테이블명은 일단 유지
            .select('id, title, creator_id')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        if (match.creator_id !== user.id) {
            return NextResponse.json(
                { error: '경기 주최자만 참가 신청을 승인/거부할 수 있습니다.' },
                { status: 403 }
            );
        }

        // 참가 신청 조회
        const { data: participant, error: participantError } = await supabaseAdmin
            .from('match_participants')
            .select(`
                *,
                team:teams (
                    id,
                    name,
                    captain_name
                )
            `)
            .eq('match_id', matchId)
            .eq('team_id', teamId)
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                { error: '참가 신청을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 이미 처리된 신청인지 확인
        if (participant.status !== 'pending') {
            const statusText = {
                approved: '승인됨',
                rejected: '거부됨',
            }[participant.status as 'approved' | 'rejected'] || participant.status;

            return NextResponse.json(
                { error: `이미 처리된 신청입니다. (현재 상태: ${statusText})` },
                { status: 400 }
            );
        }

        // 참가 신청 상태 업데이트
        const updateData = {
            status: body.status,
            responded_at: new Date().toISOString(),
            response_by: user.id,
            notes: body.notes?.trim() || participant.notes || null,
        };

        const { data: updatedParticipant, error: updateError } = await supabaseAdmin
            .from('match_participants')
            .update(updateData)
            .eq('id', participant.id)
            .select(`
                *,
                team:teams (
                    id,
                    name,
                    logo_url,
                    captain_name
                ),
                responder:auth.users (
                    id,
                    email
                )
            `)
            .single();

        if (updateError) {
            console.error('참가 신청 업데이트 오류:', updateError);
            return NextResponse.json(
                { error: '참가 신청 처리 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        const actionText = body.status === ParticipantStatus.APPROVED ? '승인' : '거부';
        const message = `${participant.team?.name} 팀의 참가 신청을 ${actionText}했습니다.`;

        return NextResponse.json({
            success: true,
            data: updatedParticipant,
            message,
        });

    } catch (error) {
        console.error('참가 신청 처리 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/matches/[id]/participants/[teamId] - 참가 신청 취소 (팀 주장만, pending 상태만)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; teamId: string } }
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

        const { id: matchId, teamId } = params;

        if (!matchId || !teamId) {
            return NextResponse.json(
                { error: '경기 ID와 팀 ID가 필요합니다.' },
                { status: 400 }
            );
        }

        // 팀 주장 권한 확인
        const { data: team, error: teamError } = await supabaseAdmin
            .from('teams')
            .select('id, name, captain_id')
            .eq('id', teamId)
            .single();

        if (teamError || !team) {
            return NextResponse.json(
                { error: '팀을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        if (team.captain_id !== user.id) {
            return NextResponse.json(
                { error: '팀 주장만 참가 신청을 취소할 수 있습니다.' },
                { status: 403 }
            );
        }

        // 참가 신청 조회
        const { data: participant, error: participantError } = await supabaseAdmin
            .from('match_participants')
            .select('*')
            .eq('match_id', matchId)
            .eq('team_id', teamId)
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                { error: '참가 신청을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // pending 상태일 때만 취소 가능
        if (participant.status !== 'pending') {
            const statusText = {
                approved: '승인됨',
                rejected: '거부됨',
            }[participant.status as 'approved' | 'rejected'] || participant.status;

            return NextResponse.json(
                { error: `${statusText} 상태의 참가 신청은 취소할 수 없습니다.` },
                { status: 400 }
            );
        }

        // 참가 신청 삭제
        const { error: deleteError } = await supabaseAdmin
            .from('match_participants')
            .delete()
            .eq('id', participant.id);

        if (deleteError) {
            console.error('참가 신청 삭제 오류:', deleteError);
            return NextResponse.json(
                { error: '참가 신청 취소 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${team.name} 팀의 참가 신청을 취소했습니다.`,
        });

    } catch (error) {
        console.error('참가 신청 취소 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
} 