import { NextRequest } from 'next/server';

interface RateLimitConfig {
    windowMs: number;  // 시간 윈도우 (밀리초)
    maxRequests: number;  // 최대 요청 수
    message?: string;  // 에러 메시지
}

interface RateLimitStore {
    count: number;
    resetTime: number;
}

// 메모리 기반 스토어 (프로덕션에서는 Redis 사용 권장)
const store = new Map<string, RateLimitStore>();

/**
 * IP 주소 추출
 */
function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    return ip;
}

/**
 * Rate Limiter 클래스
 */
export class RateLimiter {
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = {
            message: 'Too many requests, please try again later.',
            ...config
        };
    }

    /**
     * 요청 체크 및 제한
     */
    async check(request: NextRequest, identifier?: string): Promise<{
        success: boolean;
        remaining: number;
        reset: Date;
        message?: string;
    }> {
        const key = identifier || getClientIp(request);
        const now = Date.now();
        
        // 기존 레코드 확인
        const record = store.get(key);
        
        // 시간 윈도우가 지났거나 레코드가 없으면 초기화
        if (!record || now > record.resetTime) {
            const newRecord: RateLimitStore = {
                count: 1,
                resetTime: now + this.config.windowMs
            };
            store.set(key, newRecord);
            
            return {
                success: true,
                remaining: this.config.maxRequests - 1,
                reset: new Date(newRecord.resetTime)
            };
        }
        
        // 요청 수 증가
        record.count++;
        
        // 제한 초과 확인
        if (record.count > this.config.maxRequests) {
            return {
                success: false,
                remaining: 0,
                reset: new Date(record.resetTime),
                message: this.config.message
            };
        }
        
        store.set(key, record);
        
        return {
            success: true,
            remaining: this.config.maxRequests - record.count,
            reset: new Date(record.resetTime)
        };
    }

    /**
     * 특정 키의 레코드 삭제
     */
    reset(identifier: string): void {
        store.delete(identifier);
    }

    /**
     * 모든 레코드 삭제
     */
    resetAll(): void {
        store.clear();
    }
}

// 사전 정의된 Rate Limiter 인스턴스들
export const rateLimiters = {
    // 일반 API: 분당 60회
    general: new RateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 60,
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    }),
    
    // 인증 API: 5분당 5회
    auth: new RateLimiter({
        windowMs: 5 * 60 * 1000,
        maxRequests: 5,
        message: '로그인 시도가 너무 많습니다. 5분 후 다시 시도해주세요.'
    }),
    
    // 생성 API: 분당 10회
    create: new RateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 10,
        message: '생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    }),
    
    // 파일 업로드: 10분당 5회
    upload: new RateLimiter({
        windowMs: 10 * 60 * 1000,
        maxRequests: 5,
        message: '파일 업로드 제한에 도달했습니다. 10분 후 다시 시도해주세요.'
    })
};

/**
 * Rate Limit 미들웨어 헬퍼
 */
export async function withRateLimit(
    request: NextRequest,
    limiter: RateLimiter = rateLimiters.general
): Promise<Response | null> {
    const result = await limiter.check(request);
    
    if (!result.success) {
        return new Response(
            JSON.stringify({
                success: false,
                error: result.message,
                retryAfter: result.reset
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': String(limiter['config'].maxRequests),
                    'X-RateLimit-Remaining': String(result.remaining),
                    'X-RateLimit-Reset': result.reset.toISOString(),
                    'Retry-After': String(Math.ceil((result.reset.getTime() - Date.now()) / 1000))
                }
            }
        );
    }
    
    return null;
}