import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// API Route용 Supabase 클라이언트 생성 (쿠키 기반 인증)
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// API Route용 인증된 사용자 가져오기 (새로운 방식)
export async function getAuthUserFromRequest() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('Auth error:', error?.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

// Request 객체에서 직접 쿠키를 읽는 방식 (API Route Handler용)
export function createSupabaseServerClientFromRequest(request: NextRequest) {
  // cookies() 함수를 직접 사용
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // cookieStore에서 직접 가져오기
          const value = cookieStore.get(name)?.value;
          if (value) {
            return value;
          }
          
          // Authorization 헤더에서 토큰 확인 (폴백)
          const auth = request.headers.get('authorization');
          if (auth && name === 'sb-access-token') {
            return auth.replace('Bearer ', '');
          }
          
          return undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// Request 객체를 받아서 인증된 사용자를 가져오는 함수
export async function getAuthUserFromRequestObject(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClientFromRequest(request);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('Auth error:', error?.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}