import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API Route에서 인증된 사용자 정보를 가져오는 헬퍼 함수
export async function getAuthUser(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        return { user: null, error: 'Supabase configuration missing' };
    }

    // 1. Authorization 헤더 확인 (우선)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user) {
            return { user, error: null };
        }
    }

    // 2. 쿠키에서 액세스 토큰 가져오기
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
        return { user: null, error: 'No authentication cookie' };
    }

    // Supabase 세션 쿠키 파싱 - 다양한 쿠키 이름 확인
    const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(cookie => {
            const [key, ...values] = cookie.split('=');
            return [key, values.join('=')];
        })
    );

    // Supabase 액세스 토큰 찾기 - 다양한 패턴 확인
    let accessToken = null;
    
    // sb-[project-ref]-auth-token 패턴 확인 (Vercel 배포 환경)
    for (const [key, value] of Object.entries(cookies)) {
        if (key.startsWith('sb-') && key.includes('-auth-token')) {
            try {
                const parsed = JSON.parse(decodeURIComponent(value));
                accessToken = parsed.access_token || parsed[0]?.access_token;
                if (accessToken) break;
            } catch {
                // 파싱 실패 시 계속
            }
        }
    }

    // 다른 패턴들도 확인
    if (!accessToken) {
        for (const [key, value] of Object.entries(cookies)) {
            if (key.includes('supabase-auth-token') || key.includes('sb-access-token')) {
                try {
                    const parsed = JSON.parse(decodeURIComponent(value));
                    accessToken = parsed[0] || parsed.access_token;
                    if (accessToken) break;
                } catch {
                    // 파싱 실패 시 계속
                }
            }
        }
    }

    if (!accessToken) {
        console.error('Available cookies:', Object.keys(cookies));
        return { user: null, error: 'No valid authentication token found in cookies' };
    }

    // 토큰으로 사용자 정보 가져오기
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
        console.error('Auth error:', error);
        return { user: null, error: error?.message || 'Authentication failed' };
    }

    return { user, error: null };
}