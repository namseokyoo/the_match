import { createServerClient } from '@supabase/ssr';
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
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
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
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // 먼저 request headers에서 cookie를 확인
          const cookieHeader = request.headers.get('cookie');
          if (cookieHeader) {
            const cookies = Object.fromEntries(
              cookieHeader.split('; ').map(cookie => {
                const [key, ...values] = cookie.split('=');
                return [key, values.join('=')];
              })
            );
            if (cookies[name]) {
              return cookies[name];
            }
          }
          // 그 다음 cookieStore 확인
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
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