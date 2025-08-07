import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth-middleware';
import { ParticipantStatus } from '@/types';

// Supabase 클라이언트 생성 (서버용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// PATCH /api/matches/[id]/participants/[participantId] - 참가자 상태 업데이트 (승인/거부)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; participantId: string } }
) {
    try {
        // 인증 확인
        const authResult = await verifyAuth(request);
        if ('error' in authResult) {
            return authResult.error;
        }

        const { id: matchId, participantId } = params;
        const body = await request.json();
        const { status, reason } = body;

        // 유효한 상태값인지 확인
        const validStatuses = [ParticipantStatus.APPROVED, ParticipantStatus.REJECTED];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: '유효한 상태값을 제공해주세요. (approved 또는 rejected)' },
                { status: 400 }
            );
        }

        // 경기 정보 조회 (생성자 확인)
        const { data: match, error: matchError } = await supabaseAdmin
            .from('matches')
            .select('id, title, creator_id, status')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 경기 생성자만 참가자 상태를 변경할 수 있음
        if (match.creator_id !== authResult.user.id) {
            return NextResponse.json(
                { error: '경기 생성자만 참가자 상태를 변경할 수 있습니다.' },
                { status: 403 }
            );
        }

        // 참가자 정보 조회
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
            .eq('id', participantId)
            .eq('match_id', matchId)
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                { error: '참가자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 이미 처리된 신청인지 확인
        if (participant.status !== ParticipantStatus.PENDING) {
            const statusText = {
                approved: '승인됨',
                rejected: '거부됨',
            }[participant.status as 'approved' | 'rejected'] || participant.status;

            return NextResponse.json(
                { error: `이미 처리된 신청입니다. (현재 상태: ${statusText})` },
                { status: 400 }
            );
        }

        // 상태 업데이트
        const updateData: any = {
            status,
            reviewed_at: new Date().toISOString(),
            reviewed_by: authResult.user.id,
        };

        // 거부 사유가 있는 경우 추가
        if (status === ParticipantStatus.REJECTED && reason) {
            updateData.rejection_reason = reason.trim();
        }

        const { data: updatedParticipant, error: updateError } = await supabaseAdmin
            .from('match_participants')
            .update(updateData)
            .eq('id', participantId)
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

        if (updateError) {
            console.error('참가자 상태 업데이트 오류:', updateError);
            return NextResponse.json(
                { error: '참가자 상태 업데이트 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // 알림 생성 (선택적 - 추후 구현 가능)
        // await createNotification({
        //     user_id: participant.team.captain_id,
        //     type: status === 'approved' ? 'match_approved' : 'match_rejected',
        //     match_id: matchId,
        //     message: `'${match.title}' 경기 참가 신청이 ${status === 'approved' ? '승인' : '거부'}되었습니다.`,
        // });

        const statusText = status === ParticipantStatus.APPROVED ? '승인' : '거부';
        
        return NextResponse.json({
            success: true,
            data: updatedParticipant,
            message: `팀 '${participant.team.name}'의 참가 신청이 ${statusText}되었습니다.`,
        });

    } catch (error) {
        console.error('참가자 상태 업데이트 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/matches/[id]/participants/[participantId] - 참가 신청 취소
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; participantId: string } }
) {
    try {
        // 인증 확인
        const authResult = await verifyAuth(request);
        if ('error' in authResult) {
            return authResult.error;
        }

        const { id: matchId, participantId } = params;

        // 참가자 정보 조회
        const { data: participant, error: participantError } = await supabaseAdmin
            .from('match_participants')
            .select(`
                *,
                team:teams (
                    id,
                    name,
                    captain_id
                ),
                match:tournaments!match_id (
                    id,
                    title,
                    creator_id,
                    status
                )
            `)
            .eq('id', participantId)
            .eq('match_id', matchId)
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                { error: '참가 신청을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 삭제 권한 확인 (팀 주장 또는 경기 생성자)
        const isTeamCaptain = participant.team.captain_id === authResult.user.id;
        const isMatchCreator = participant.match.creator_id === authResult.user.id;

        if (!isTeamCaptain && !isMatchCreator) {
            return NextResponse.json(
                { error: '참가 신청을 취소할 권한이 없습니다.' },
                { status: 403 }
            );
        }

        // 경기가 이미 시작된 경우 취소 불가
        if (participant.match.status === 'in_progress' || participant.match.status === 'completed') {
            return NextResponse.json(
                { error: '이미 시작되거나 완료된 경기의 참가 신청은 취소할 수 없습니다.' },
                { status: 400 }
            );
        }

        // 승인된 참가 신청은 경기 시작 전까지만 취소 가능
        if (participant.status === ParticipantStatus.APPROVED && participant.match.status !== 'registration') {
            return NextResponse.json(
                { error: '경기 준비가 시작된 후에는 참가를 취소할 수 없습니다.' },
                { status: 400 }
            );
        }

        // 참가 신청 삭제
        const { error: deleteError } = await supabaseAdmin
            .from('match_participants')
            .delete()
            .eq('id', participantId);

        if (deleteError) {
            console.error('참가 신청 삭제 오류:', deleteError);
            return NextResponse.json(
                { error: '참가 신청 취소 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '참가 신청이 취소되었습니다.',
        });

    } catch (error) {
        console.error('참가 신청 취소 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// GET /api/matches/[id]/participants/[participantId] - 특정 참가자 정보 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; participantId: string } }
) {
    try {
        const { id: matchId, participantId } = params;

        // 참가자 정보 조회
        const { data: participant, error } = await supabaseAdmin
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
                ),
                match:tournaments!match_id (
                    id,
                    title,
                    status,
                    creator_id
                )
            `)
            .eq('id', participantId)
            .eq('match_id', matchId)
            .single();

        if (error || !participant) {
            return NextResponse.json(
                { error: '참가자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: participant,
        });

    } catch (error) {
        console.error('참가자 정보 조회 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}