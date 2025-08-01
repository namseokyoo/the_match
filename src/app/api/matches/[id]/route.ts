import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MatchType, MatchStatus, CreateMatchForm } from '@/types';

// Supabase 클라이언트 생성 (서버용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/matches/[id] - 특정 경기 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id || id === 'undefined') {
            return NextResponse.json(
                { error: '경기 ID가 필요합니다.' },
                { status: 400 }
            );
        }

        const { data: match, error } = await supabaseAdmin
            .from('tournaments') // DB 테이블명은 일단 유지 (추후 마이그레이션)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: '경기를 찾을 수 없습니다.' },
                    { status: 404 }
                );
            }
            console.error('경기 조회 오류:', error);
            return NextResponse.json(
                { error: '경기를 불러오는 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // 참가팀 목록도 함께 조회 (tournament_id는 일단 match_id로 취급)
        const { data: teams, error: teamsError } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('tournament_id', id); // 필드명은 일단 유지

        if (teamsError) {
            console.error('참가팀 목록 조회 오류:', teamsError);
            // 참가팀 조회 실패는 전체 요청 실패로 처리하지 않음
        }

        return NextResponse.json({
            success: true,
            data: {
                match,
                teams: teams || [],
            },
        });

    } catch (error) {
        console.error('경기 조회 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// PUT /api/matches/[id] - 경기 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id || id === 'undefined') {
            return NextResponse.json(
                { error: '경기 ID가 필요합니다.' },
                { status: 400 }
            );
        }

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

        // 기존 경기 조회 (권한 확인)
        const { data: existingMatch, error: fetchError } = await supabaseAdmin
            .from('tournaments') // DB 테이블명은 일단 유지
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: '경기를 찾을 수 없습니다.' },
                    { status: 404 }
                );
            }
            console.error('경기 조회 오류:', fetchError);
            return NextResponse.json(
                { error: '경기를 불러오는 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // 권한 확인 (경기 생성자만 수정 가능)
        if (existingMatch.creator_id !== user.id) {
            return NextResponse.json(
                { error: '경기를 수정할 권한이 없습니다.' },
                { status: 403 }
            );
        }

        const body: CreateMatchForm = await request.json();

        // 입력값 검증
        const validationErrors = validateMatchData(body);
        if (validationErrors.length > 0) {
            return NextResponse.json(
                { error: '입력값이 올바르지 않습니다.', details: validationErrors },
                { status: 400 }
            );
        }

        // 경기 수정 데이터 준비
        const updateData = {
            title: body.title.trim(),
            description: body.description?.trim() || null,
            type: body.type,
            max_participants: body.max_participants || null,
            registration_deadline: body.registration_deadline || null,
            start_date: body.start_date || null,
            end_date: body.end_date || null,
            updated_at: new Date().toISOString(),
        };

        const { data: match, error } = await supabaseAdmin
            .from('tournaments') // DB 테이블명은 일단 유지
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('경기 수정 오류:', error);
            return NextResponse.json(
                { error: '경기 수정 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: match,
            message: '경기가 성공적으로 수정되었습니다.',
        });

    } catch (error) {
        console.error('경기 수정 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/matches/[id] - 경기 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id || id === 'undefined') {
            return NextResponse.json(
                { error: '경기 ID가 필요합니다.' },
                { status: 400 }
            );
        }

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

        // 기존 경기 조회 (권한 확인)
        const { data: existingMatch, error: fetchError } = await supabaseAdmin
            .from('tournaments') // DB 테이블명은 일단 유지
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: '경기를 찾을 수 없습니다.' },
                    { status: 404 }
                );
            }
            console.error('경기 조회 오류:', fetchError);
            return NextResponse.json(
                { error: '경기를 불러오는 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // 권한 확인 (경기 생성자만 삭제 가능)
        if (existingMatch.creator_id !== user.id) {
            return NextResponse.json(
                { error: '경기를 삭제할 권한이 없습니다.' },
                { status: 403 }
            );
        }

        // 경기 진행 상태 확인
        if (existingMatch.status === MatchStatus.IN_PROGRESS) {
            return NextResponse.json(
                { error: '진행 중인 경기는 삭제할 수 없습니다.' },
                { status: 400 }
            );
        }

        // 참가팀이 있는 경우 확인
        const { data: teams, error: teamsError } = await supabaseAdmin
            .from('teams')
            .select('id')
            .eq('tournament_id', id); // 필드명은 일단 유지

        if (teamsError) {
            console.error('참가팀 확인 오류:', teamsError);
            return NextResponse.json(
                { error: '참가팀 확인 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        if (teams && teams.length > 0) {
            return NextResponse.json(
                { error: '참가팀이 있는 경기는 삭제할 수 없습니다. 먼저 모든 참가팀을 제거해주세요.' },
                { status: 400 }
            );
        }

        // 경기 삭제
        const { error: deleteError } = await supabaseAdmin
            .from('tournaments') // DB 테이블명은 일단 유지
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('경기 삭제 오류:', deleteError);
            return NextResponse.json(
                { error: '경기 삭제 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '경기가 성공적으로 삭제되었습니다.',
        });

    } catch (error) {
        console.error('경기 삭제 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 경기 데이터 검증 함수
function validateMatchData(data: CreateMatchForm): string[] {
    const errors: string[] = [];

    // 제목 검증
    if (!data.title || typeof data.title !== 'string') {
        errors.push('제목은 필수입니다.');
    } else if (data.title.trim().length < 2) {
        errors.push('제목은 최소 2글자 이상이어야 합니다.');
    } else if (data.title.length > 100) {
        errors.push('제목은 100글자를 초과할 수 없습니다.');
    }

    // 설명 검증
    if (data.description && data.description.length > 500) {
        errors.push('설명은 500글자를 초과할 수 없습니다.');
    }

    // 경기 타입 검증
    if (!data.type || !Object.values(MatchType).includes(data.type)) {
        errors.push('올바른 경기 유형을 선택해주세요.');
    }

    // 최대 참가팀 수 검증
    if (data.max_participants !== undefined && data.max_participants !== null) {
        if (typeof data.max_participants !== 'number' || data.max_participants < 2) {
            errors.push('최대 참가팀 수는 2팀 이상이어야 합니다.');
        } else if (data.max_participants > 1000) {
            errors.push('최대 참가팀 수는 1000팀을 초과할 수 없습니다.');
        }
    }

    // 날짜 검증
    const now = new Date();

    if (data.registration_deadline) {
        const regDeadline = new Date(data.registration_deadline);
        if (isNaN(regDeadline.getTime())) {
            errors.push('올바른 등록 마감일을 입력해주세요.');
        } else if (regDeadline < now) {
            errors.push('등록 마감일은 현재 시간 이후여야 합니다.');
        }
    }

    if (data.start_date) {
        const startDate = new Date(data.start_date);
        if (isNaN(startDate.getTime())) {
            errors.push('올바른 시작일을 입력해주세요.');
        } else if (startDate < now) {
            errors.push('시작일은 현재 시간 이후여야 합니다.');
        }

        if (data.registration_deadline) {
            const regDeadline = new Date(data.registration_deadline);
            if (regDeadline > startDate) {
                errors.push('등록 마감일은 시작일 이전이어야 합니다.');
            }
        }
    }

    if (data.end_date) {
        const endDate = new Date(data.end_date);
        if (isNaN(endDate.getTime())) {
            errors.push('올바른 종료일을 입력해주세요.');
        }

        if (data.start_date) {
            const startDate = new Date(data.start_date);
            if (startDate > endDate) {
                errors.push('종료일은 시작일 이후여야 합니다.');
            }
        }
    }

    return errors;
} 