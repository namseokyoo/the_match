import { createClient, type PostgrestError } from '@supabase/supabase-js';

// 서버 사이드용 Supabase 클라이언트
// Connection pooling과 더 나은 에러 처리를 포함

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

// 서버용 클라이언트 (Service Role Key 우선 사용)
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseKey) {
    console.error('Missing Supabase keys');
}

// 싱글톤 패턴으로 클라이언트 재사용
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
    if (!supabaseAdmin && supabaseUrl && supabaseKey) {
        supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            global: {
                // 헤더 설정
                headers: {
                    'x-application-name': 'the-match-api',
                },
            },
        });
    }
    
    if (!supabaseAdmin) {
        throw new Error('Supabase client could not be initialized');
    }
    
    return supabaseAdmin;
}

// 재시도 로직이 있는 쿼리 함수
export async function executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    retries = 3
): Promise<{ data: T | null; error: PostgrestError | Error | null }> {
    let lastError = null;
    
    for (let i = 0; i < retries; i++) {
        try {
            const result = await queryFn();
            
            if (!result.error) {
                return result;
            }
            
            // 재시도 가능한 에러인지 확인
            if (result.error.code === 'PGRST301' || // JWT expired
                result.error.code === '500' || // Internal server error
                result.error.message?.includes('fetch failed')) {
                lastError = result.error;
                // 지수 백오프로 대기
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                continue;
            }
            
            // 재시도 불가능한 에러는 즉시 반환
            return result;
        } catch (error) {
            lastError = error as PostgrestError | Error;
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }
    
    return { data: null, error: lastError };
}

// 헬스 체크 함수
export async function checkSupabaseHealth(): Promise<boolean> {
    try {
        const client = getSupabaseAdmin();
        const { error } = await client
            .from('matches')
            .select('id')
            .limit(1);
        
        return !error;
    } catch {
        return false;
    }
}

// API Routes에서 사용할 createClient export
export { createClient } from '@supabase/supabase-js';