import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth-middleware';
import { MatchStatus } from '@/types';

// Supabase 클라이언트 생성 (서버용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 상태 전환 규칙 정의
const STATUS_TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
    [MatchStatus.DRAFT]: [MatchStatus.REGISTRATION, MatchStatus.CANCELLED],
    [MatchStatus.REGISTRATION]: [MatchStatus.IN_PROGRESS, MatchStatus.CANCELLED],
    [MatchStatus.IN_PROGRESS]: [MatchStatus.COMPLETED, MatchStatus.CANCELLED],
    [MatchStatus.COMPLETED]: [], // 완료된 경기는 상태 변경 불가
    [MatchStatus.CANCELLED]: [], // 취소된 경기는 상태 변경 불가
};

// PATCH /api/matches/[id]/status - 경기 상태 업데이트
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 인증 확인
        const authResult = await verifyAuth(request);
        if ('error' in authResult) {
            return authResult.error;
        }

        const { id: matchId } = params;
        const body = await request.json();
        const { status: newStatus, reason } = body;

        // 유효한 상태값인지 확인
        if (!newStatus || !Object.values(MatchStatus).includes(newStatus)) {
            return NextResponse.json(
                { 
                    error: '유효하지 않은 상태값입니다.',
                    validStatuses: Object.values(MatchStatus)
                },
                { status: 400 }
            );
        }

        // 경기 정보 조회
        const { data: match, error: matchError } = await supabaseAdmin
            .from('matches')
            .select(`
                *,
                participants:match_participants(
                    id,
                    team_id,
                    status
                )
            `)
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 경기 생성자만 상태를 변경할 수 있음
        if (match.creator_id !== authResult.user.id) {
            return NextResponse.json(
                { error: '경기 생성자만 상태를 변경할 수 있습니다.' },
                { status: 403 }
            );
        }

        // 현재 상태 확인
        const currentStatus = match.status as MatchStatus;

        // 이미 같은 상태인 경우
        if (currentStatus === newStatus) {
            return NextResponse.json(
                { error: `경기가 이미 ${newStatus} 상태입니다.` },
                { status: 400 }
            );
        }

        // 상태 전환 규칙 확인
        const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
        if (!allowedTransitions.includes(newStatus)) {
            return NextResponse.json(
                { 
                    error: `${currentStatus}에서 ${newStatus}로 상태를 변경할 수 없습니다.`,
                    currentStatus,
                    allowedTransitions
                },
                { status: 400 }
            );
        }

        // 추가 비즈니스 규칙 검증
        if (newStatus === MatchStatus.IN_PROGRESS) {
            // 시작하려면 최소 2팀 이상 승인된 참가자가 필요
            const approvedParticipants = match.participants?.filter(
                (p: any) => p.status === 'approved'
            ) || [];

            if (approvedParticipants.length < 2) {
                return NextResponse.json(
                    { 
                        error: '경기를 시작하려면 최소 2팀 이상의 승인된 참가자가 필요합니다.',
                        approvedCount: approvedParticipants.length
                    },
                    { status: 400 }
                );
            }

            // 시작 날짜가 설정되지 않은 경우 현재 시간으로 설정
            if (!match.start_date) {
                match.start_date = new Date().toISOString();
            }
        }

        if (newStatus === MatchStatus.COMPLETED) {
            // 종료 날짜가 설정되지 않은 경우 현재 시간으로 설정
            if (!match.end_date) {
                match.end_date = new Date().toISOString();
            }
        }

        // 상태 업데이트 데이터 준비
        const updateData: Record<string, unknown> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        // 시작/종료 날짜 업데이트
        if (newStatus === MatchStatus.IN_PROGRESS && !match.start_date) {
            updateData.start_date = new Date().toISOString();
        }

        if (newStatus === MatchStatus.COMPLETED && !match.end_date) {
            updateData.end_date = new Date().toISOString();
        }

        // 취소 사유 저장
        if (newStatus === MatchStatus.CANCELLED && reason) {
            updateData.settings = {
                ...match.settings,
                cancellation_reason: reason,
                cancelled_at: new Date().toISOString(),
                cancelled_by: authResult.user.id,
            };
        }

        // 상태 업데이트
        const { data: updatedMatch, error: updateError } = await supabaseAdmin
            .from('matches')
            .update(updateData)
            .eq('id', matchId)
            .select()
            .single();

        if (updateError) {
            console.error('경기 상태 업데이트 오류:', updateError);
            return NextResponse.json(
                { error: '경기 상태 업데이트 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // 상태 변경 히스토리 저장 (선택적 - 나중에 구현 가능)
        // await supabaseAdmin.from('match_status_history').insert({
        //     match_id: matchId,
        //     old_status: currentStatus,
        //     new_status: newStatus,
        //     changed_by: authResult.user.id,
        //     reason,
        //     created_at: new Date().toISOString(),
        // });

        return NextResponse.json({
            success: true,
            data: updatedMatch,
            message: `경기 상태가 ${newStatus}로 변경되었습니다.`,
            transition: {
                from: currentStatus,
                to: newStatus,
            },
        });

    } catch (error) {
        console.error('경기 상태 업데이트 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// GET /api/matches/[id]/status - 경기 상태 및 가능한 전환 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id: matchId } = params;

        // 경기 정보 조회
        const { data: match, error } = await supabaseAdmin
            .from('matches')
            .select(`
                id,
                title,
                status,
                creator_id,
                start_date,
                end_date,
                created_at,
                participants:match_participants(
                    id,
                    team_id,
                    status
                )
            `)
            .eq('id', matchId)
            .single();

        if (error || !match) {
            return NextResponse.json(
                { error: '경기를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const currentStatus = match.status as MatchStatus;
        const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

        // 참가자 통계
        const participants = match.participants || [];
        const participantStats = {
            total: participants.length,
            approved: participants.filter((p: any) => p.status === 'approved').length,
            pending: participants.filter((p: any) => p.status === 'pending').length,
            rejected: participants.filter((p: any) => p.status === 'rejected').length,
        };

        // 상태별 요구사항 체크
        const requirements: Record<string, any> = {};
        
        if (allowedTransitions.includes(MatchStatus.IN_PROGRESS)) {
            requirements.toStart = {
                minParticipants: 2,
                currentApproved: participantStats.approved,
                canStart: participantStats.approved >= 2,
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                matchId: match.id,
                title: match.title,
                currentStatus,
                allowedTransitions,
                participantStats,
                requirements,
                timeline: {
                    created: match.created_at,
                    started: match.start_date,
                    ended: match.end_date,
                },
            },
        });

    } catch (error) {
        console.error('경기 상태 조회 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}