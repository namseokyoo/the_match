import { NextRequest, NextResponse } from 'next/server';
import { configValidator, formatValidationResult } from '@/lib/config-validator';

/**
 * GET /api/config/validate
 * 
 * 환경 설정을 검증하고 상태를 반환합니다.
 * 개발 환경에서만 상세 정보를 제공합니다.
 */
export async function GET(request: NextRequest) {
    try {
        // 환경 설정 검증
        const result = await configValidator.validateAll();
        
        // 개발 환경에서는 상세 정보 제공
        if (process.env.NODE_ENV === 'development') {
            return NextResponse.json({
                success: result.isValid,
                result,
                formatted: formatValidationResult(result),
            });
        }

        // 프로덕션 환경에서는 최소 정보만 제공
        return NextResponse.json({
            success: result.isValid,
            environment: result.environment,
            supabase: {
                connected: result.supabaseStatus.isConnected,
                healthy: result.supabaseStatus.isHealthy,
            },
            hasErrors: result.errors.length > 0,
            hasWarnings: result.warnings.length > 0,
        });

    } catch (error) {
        console.error('환경 설정 검증 오류:', error);
        
        return NextResponse.json(
            {
                success: false,
                error: '환경 설정 검증 중 오류가 발생했습니다.',
                message: error instanceof Error ? error.message : '알 수 없는 오류',
            },
            { status: 500 }
        );
    }
}