import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { TournamentType, TournamentStatus, CreateTournamentForm } from '@/types';

// Supabase 클라이언트 생성 (서버용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/tournaments - 토너먼트 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') as TournamentStatus | null;
        const type = searchParams.get('type') as TournamentType | null;
        const search = searchParams.get('search');
        const creatorId = searchParams.get('creator_id');

        let query = supabaseAdmin
            .from('tournaments')
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

        const { data: tournaments, error, count } = await query;

        if (error) {
            console.error('토너먼트 목록 조회 오류:', error);
            return NextResponse.json(
                { error: '토너먼트 목록을 불러오는 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // 전체 개수 조회 (페이지네이션용)
        let countQuery = supabaseAdmin
            .from('tournaments')
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
            data: tournaments,
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
        console.error('토너먼트 목록 조회 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST /api/tournaments - 토너먼트 생성
export async function POST(request: NextRequest) {
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

        const body: CreateTournamentForm = await request.json();

        // 입력값 검증
        const validationErrors = validateTournamentData(body);
        if (validationErrors.length > 0) {
            return NextResponse.json(
                { error: '입력값이 올바르지 않습니다.', details: validationErrors },
                { status: 400 }
            );
        }

        // 토너먼트 생성 데이터 준비
        const tournamentData = {
            title: body.title.trim(),
            description: body.description?.trim() || null,
            type: body.type,
            status: TournamentStatus.DRAFT,
            creator_id: user.id,
            max_participants: body.max_participants || null,
            registration_deadline: body.registration_deadline || null,
            start_date: body.start_date || null,
            end_date: body.end_date || null,
            rules: {},
            settings: {},
        };

        const { data: tournament, error } = await supabaseAdmin
            .from('tournaments')
            .insert([tournamentData])
            .select()
            .single();

        if (error) {
            console.error('토너먼트 생성 오류:', error);
            return NextResponse.json(
                { error: '토너먼트 생성 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: tournament,
            message: '토너먼트가 성공적으로 생성되었습니다.',
        }, { status: 201 });

    } catch (error) {
        console.error('토너먼트 생성 오류:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 토너먼트 데이터 검증 함수
function validateTournamentData(data: CreateTournamentForm): string[] {
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

    // 토너먼트 타입 검증
    if (!data.type || !Object.values(TournamentType).includes(data.type)) {
        errors.push('올바른 토너먼트 유형을 선택해주세요.');
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