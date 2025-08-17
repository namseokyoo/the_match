import { NextRequest, NextResponse } from 'next/server';
import { MatchType, type CreateMatchForm } from '@/types';
import { verifyAuth, requireEmailVerified } from '@/lib/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { calculateMatchStatus } from '@/lib/match-utils';

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

        const supabaseAdmin = getSupabaseAdmin();
        
        let query = supabaseAdmin
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
                { 
                    error: '경기 목록을 불러오는 중 오류가 발생했습니다.',
                    success: false,
                    data: []
                },
                { status: 500 }
            );
        }

        // 전체 개수 조회 (페이지네이션용)
        let countQuery = supabaseAdmin
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
        // 인증 헤더에서 사용자 정보 추출
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }
        
        // 보안 강화된 인증 검증 미들웨어 사용
        const authResult = await verifyAuth(request);
        
        if ('error' in authResult) {
            return authResult.error;
        }
        
        const { user } = authResult;
        
        // 이메일 인증 여부 확인
        const emailError = requireEmailVerified(user);
        if (emailError) {
            return emailError;
        }
        
        const userId = user.id;

        const body = await request.json();

        // 입력값 검증
        const validationErrors = validateMatchData(body);
        if (validationErrors.length > 0) {
            return NextResponse.json(
                { error: '입력값이 올바르지 않습니다.', details: validationErrors },
                { status: 400 }
            );
        }

        // 상태 자동 계산
        const calculatedStatus = calculateMatchStatus(
            body.registration_start_date,
            body.registration_deadline,
            body.start_date,
            body.end_date
        );

        // 경기 생성 데이터 준비
        const matchData = {
            title: body.title.trim(),
            description: body.description?.trim() || null,
            type: body.type,
            status: calculatedStatus, // 자동 계산된 상태 사용
            creator_id: userId, // 인증된 사용자 ID 사용
            max_participants: body.max_participants || null,
            registration_start_date: body.registration_start_date || null,
            registration_deadline: body.registration_deadline || null,
            start_date: body.start_date || null,
            end_date: body.end_date || null,
            venue: body.venue?.trim() || null,
            rules: body.rules || {},
            prizes: body.prizes?.trim() || null,
            settings: {},
        };

        const supabaseAdmin = getSupabaseAdmin();
        const { data: match, error } = await supabaseAdmin
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
function validateMatchData(data: Partial<CreateMatchForm>): string[] {
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
    
    // 등록 시작일 검증
    if (data.registration_start_date) {
        const regStartDate = new Date(data.registration_start_date);
        if (isNaN(regStartDate.getTime())) {
            errors.push('올바른 등록 시작일을 입력해주세요.');
        }
    }

    if (data.registration_deadline) {
        const regDeadline = new Date(data.registration_deadline);
        if (isNaN(regDeadline.getTime())) {
            errors.push('올바른 등록 마감일을 입력해주세요.');
        } else if (regDeadline < now) {
            errors.push('등록 마감일은 현재 시간 이후여야 합니다.');
        }
        
        // 등록 시작일과 마감일 비교
        if (data.registration_start_date) {
            const regStartDate = new Date(data.registration_start_date);
            if (regStartDate > regDeadline) {
                errors.push('등록 마감일은 등록 시작일 이후여야 합니다.');
            }
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
    
    // 장소 검증
    if (data.venue && data.venue.length > 200) {
        errors.push('장소는 200글자를 초과할 수 없습니다.');
    }
    
    // 상품 검증
    if (data.prizes && data.prizes.length > 1000) {
        errors.push('시상 내역은 1000글자를 초과할 수 없습니다.');
    }

    return errors;
} 