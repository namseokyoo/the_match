import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MatchType, MatchStatus, CreateMatchForm } from '@/types';

// GET /api/matches - 경기 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const creatorId = searchParams.get('creator_id');

        let query = supabase
            .from('matches')
            .select('*');

        // 필터 적용
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (type && type !== 'all') {
            query = query.eq('type', type);
        }

        if (creatorId) {
            query = query.eq('creator_id', creatorId);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%, description.ilike.%${search}%`);
        }

        // 페이지네이션 및 정렬
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query
            .order('created_at', { ascending: false })
            .range(from, to);

        const { data: matches, error } = await query;

        if (error) {
            console.error('경기 목록 조회 오류:', error);
            return NextResponse.json(
                { error: '경기 목록을 불러오는 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // 전체 개수 조회 (페이지네이션용)
        let countQuery = supabase
            .from('matches')
            .select('id', { count: 'exact', head: true });

        if (status && status !== 'all') {
            countQuery = countQuery.eq('status', status);
        }
        if (type && type !== 'all') {
            countQuery = countQuery.eq('type', type);
        }
        if (creatorId) {
            countQuery = countQuery.eq('creator_id', creatorId);
        }
        if (search) {
            countQuery = countQuery.or(`title.ilike.%${search}%, description.ilike.%${search}%`);
        }

        const { count: totalCount } = await countQuery;

        const totalPages = Math.ceil((totalCount || 0) / limit);

        return NextResponse.json({
            success: true,
            data: matches,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });

    } catch (error) {
        console.error('경기 목록 조회 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST /api/matches - 경기 생성
export async function POST(request: NextRequest) {
    try {
        // 현재 사용자 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
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

        // 경기 생성 데이터 준비
        const matchData = {
            title: body.title.trim(),
            description: body.description?.trim() || null,
            type: body.type,
            status: MatchStatus.DRAFT,
            creator_id: user.id,
            max_participants: body.max_participants || null,
            registration_deadline: body.registration_deadline || null,
            start_date: body.start_date || null,
            end_date: body.end_date || null,
            rules: {},
            settings: {},
        };

        const { data: match, error } = await supabase
            .from('matches')
            .insert(matchData)
            .select()
            .single();

        if (error) {
            console.error('경기 생성 오류:', error);
            return NextResponse.json(
                { error: '경기 생성 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: match,
            message: '경기가 성공적으로 생성되었습니다.',
        }, { status: 201 });

    } catch (error) {
        console.error('경기 생성 오류:', error);
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