import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서버 전용 Supabase 클라이언트
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthUser {
    id: string;
    email?: string;
    email_confirmed_at?: string;
    role?: string;
    app_metadata?: Record<string, any>;
    user_metadata?: Record<string, any>;
}

/**
 * JWT 토큰을 안전하게 검증하고 사용자 정보를 반환합니다.
 * 
 * 보안 체크리스트:
 * ✅ JWT 서명 검증
 * ✅ 토큰 만료 시간 확인
 * ✅ 발급자(Supabase) 확인
 * ✅ 토큰 형식 검증
 * ✅ 사용자 존재 여부 확인
 * 
 * @param request - Next.js 요청 객체
 * @returns 검증된 사용자 정보 또는 에러 응답
 */
export async function verifyAuth(
    request: NextRequest
): Promise<{ user: AuthUser } | { error: NextResponse }> {
    try {
        // 1. Authorization 헤더 확인
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return {
                error: NextResponse.json(
                    { error: '인증 헤더가 없습니다.' },
                    { status: 401 }
                )
            };
        }

        // 2. Bearer 토큰 형식 확인
        if (!authHeader.startsWith('Bearer ')) {
            return {
                error: NextResponse.json(
                    { error: '잘못된 인증 헤더 형식입니다.' },
                    { status: 401 }
                )
            };
        }

        const token = authHeader.substring(7);

        // 3. 토큰 빈 값 체크
        if (!token || token.trim() === '') {
            return {
                error: NextResponse.json(
                    { error: '토큰이 비어있습니다.' },
                    { status: 401 }
                )
            };
        }

        // 4. Supabase를 통한 안전한 토큰 검증
        // 이 메서드는 자동으로:
        // - JWT 서명을 검증합니다
        // - 만료 시간(exp)을 확인합니다
        // - 발급자(iss)를 확인합니다
        // - 토큰의 유효성을 검증합니다
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError) {
            // 토큰 만료 또는 무효 토큰 구분
            if (authError.message?.includes('expired')) {
                return {
                    error: NextResponse.json(
                        { error: '토큰이 만료되었습니다. 다시 로그인해주세요.' },
                        { status: 401 }
                    )
                };
            }

            console.error('토큰 검증 실패:', authError);
            return {
                error: NextResponse.json(
                    { error: '유효하지 않은 인증 토큰입니다.' },
                    { status: 401 }
                )
            };
        }

        // 5. 사용자 존재 여부 확인
        if (!user) {
            return {
                error: NextResponse.json(
                    { error: '사용자를 찾을 수 없습니다.' },
                    { status: 401 }
                )
            };
        }

        // 6. 성공: 검증된 사용자 정보 반환
        return { user: user as AuthUser };

    } catch (error) {
        console.error('인증 미들웨어 오류:', error);
        return {
            error: NextResponse.json(
                { error: '인증 처리 중 오류가 발생했습니다.' },
                { status: 500 }
            )
        };
    }
}

/**
 * 이메일 인증 여부를 확인합니다.
 */
export function requireEmailVerified(user: AuthUser): NextResponse | null {
    if (!user.email_confirmed_at) {
        return NextResponse.json(
            { error: '이메일 인증이 필요합니다.' },
            { status: 403 }
        );
    }
    return null;
}

/**
 * 특정 역할을 요구하는 권한 체크
 */
export function requireRole(user: AuthUser, allowedRoles: string[]): NextResponse | null {
    const userRole = user.app_metadata?.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
            { error: '권한이 없습니다.' },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Rate limiting을 위한 토큰 해시 생성 (선택적 보안 기능)
 * 실제 토큰 값을 노출하지 않고 식별자로 사용
 */
export async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}