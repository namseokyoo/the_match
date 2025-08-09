import { NextRequest, NextResponse } from 'next/server';
import { configValidator } from './config-validator';

/**
 * API 라우트에서 환경 설정을 검증하는 미들웨어
 * 
 * 필수 환경 변수가 없거나 Supabase 연결이 실패한 경우 
 * 적절한 에러 응답을 반환합니다.
 */
export async function withConfigValidation(
    handler: (req: NextRequest) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        // 환경 설정 검증
        const validation = await configValidator.validateAll();
        
        // 심각한 오류가 있는 경우
        if (!validation.isValid) {
            const criticalErrors = validation.errors.filter(error => 
                error.field.includes('SUPABASE') || 
                error.field.includes('SERVICE_ROLE')
            );

            if (criticalErrors.length > 0) {
                return NextResponse.json(
                    {
                        error: '서버 설정 오류',
                        message: '환경 설정에 문제가 있습니다. 관리자에게 문의하세요.',
                        details: process.env.NODE_ENV === 'development' ? {
                            errors: criticalErrors,
                            hint: '환경 변수를 확인하세요.',
                        } : undefined,
                    },
                    { status: 500 }
                );
            }
        }

        // Supabase 연결 실패
        if (!validation.supabaseStatus.isConnected) {
            return NextResponse.json(
                {
                    error: '데이터베이스 연결 실패',
                    message: '데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도하세요.',
                    details: process.env.NODE_ENV === 'development' ? {
                        error: validation.supabaseStatus.error,
                        hint: 'Supabase 프로젝트가 활성화되어 있는지 확인하세요.',
                    } : undefined,
                },
                { status: 503 }
            );
        }

        // 느린 연결 경고 헤더 추가
        if (!validation.supabaseStatus.isHealthy) {
            const response = await handler(req);
            response.headers.set('X-Database-Health', 'degraded');
            response.headers.set('X-Database-Latency', String(validation.supabaseStatus.latency));
            return response;
        }

        // 정상 처리
        return handler(req);
    };
}

/**
 * 환경 변수가 올바르게 설정되었는지 확인하는 유틸리티 함수
 */
export function assertEnvironmentVariables(): void {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(
            `필수 환경 변수가 설정되지 않았습니다: ${missing.join(', ')}\n` +
            `.env.local 파일을 확인하세요.`
        );
    }
}

/**
 * 서버 사이드에서만 Service Role Key를 확인합니다.
 */
export function assertServiceRoleKey(): void {
    if (typeof window !== 'undefined') {
        throw new Error('Service Role Key는 서버 사이드에서만 사용할 수 있습니다.');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.\n' +
            '관리자 권한이 필요한 작업을 수행할 수 없습니다.'
        );
    }
}