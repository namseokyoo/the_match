import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // API 라우트, 정적 파일은 건너뛰기
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 인증이 필수인 라우트만 정의
  const protectedRoutes = [
    '/matches/create',
    '/teams/create',
    '/community/write',
    '/community/posts/create',
    '/profile',
    '/dashboard',
  ];

  // 로그인한 사용자가 접근하면 안 되는 라우트
  const authOnlyRoutes = ['/login', '/signup'];

  // Response를 먼저 생성
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Supabase 클라이언트 생성 (SSR용)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // 세션 확인
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  // 보호된 라우트 확인
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // 인증 전용 페이지 확인
  const isAuthOnlyRoute = authOnlyRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // 보호된 라우트인데 로그인하지 않은 경우
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 로그인/회원가입 페이지인데 이미 로그인한 경우
  if (isAuthOnlyRoute && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    return NextResponse.redirect(new URL(redirectTo || '/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};