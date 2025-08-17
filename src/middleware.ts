import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 보호된 라우트 정의
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/matches/create',
  '/teams/create',
  '/teams/*/edit',
  '/matches/*/edit',
  '/community/posts/create',
  '/community/posts/*/edit',
];

// 인증 전용 라우트 (로그인한 사용자는 접근 불가)
const authRoutes = ['/login', '/signup', '/auth/reset-password'];

export async function middleware(request: NextRequest) {
  // 먼저 response 객체를 생성
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  const { pathname } = request.nextUrl;

  // API 라우트는 건너뛰기
  if (pathname.startsWith('/api/')) {
    return response;
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // 쿠키 설정을 response에 추가
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            // 쿠키 제거를 response에 추가
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request,
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // 세션 확인 - getUser를 사용하여 더 정확한 인증 상태 확인
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // 디버깅을 위한 로그 (프로덕션에서는 제거)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] Path: ${pathname}, User: ${user?.email || 'none'}, Error: ${error?.message || 'none'}`);
    }

    // 보호된 라우트 확인
    const isProtectedRoute = protectedRoutes.some(route => {
      if (route.includes('*')) {
        const pattern = route.replace('*', '.*');
        return new RegExp(`^${pattern}$`).test(pathname);
      }
      return pathname === route || pathname.startsWith(route + '/');
    });

    // 인증 전용 라우트 확인
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // 로그인하지 않은 사용자가 보호된 라우트에 접근하려는 경우
    if (isProtectedRoute && (!user || error)) {
      // 개발 환경에서는 경고만 표시하고 통과시킴 (클라이언트에서 리다이렉트 처리)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Middleware] Protected route accessed without auth: ${pathname}`);
        // 헤더에 인증 필요 표시를 추가하고 요청 통과
        response.headers.set('x-auth-required', 'true');
        return response;
      }
      
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 로그인한 사용자가 인증 페이지에 접근하려는 경우
    if (isAuthRoute && user && !error) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 세션 리프레시 헤더 추가
    if (user) {
      response.headers.set('x-session-status', 'active');
      response.headers.set('x-user-email', user.email || '');
    }

    return response;
  } catch (error) {
    // 에러 발생 시 로그
    console.error('[Middleware] Error:', error);
    
    // 에러가 발생해도 일단 요청을 통과시킴
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};