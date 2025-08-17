import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증이 필수인 라우트만 정의 (프로필 제외)
const strictProtectedRoutes = [
  '/matches/create',
  '/teams/create',
  '/community/posts/create',
];

// 로그인한 사용자가 접근하면 안 되는 라우트
const authOnlyRoutes = ['/login', '/signup'];

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

  // Supabase 세션 쿠키 확인 - 정확한 프로젝트 ID 사용
  const hasAuthCookie = 
    request.cookies.has('sb-pkeycuoaeddmblcwzhpo-auth-token') ||
    request.cookies.has('sb-pkeycuoaeddmblcwzhpo-auth-token-code-verifier') ||
    // 쿠키 목록에서 Supabase 관련 토큰 찾기
    Array.from(request.cookies.getAll()).some(cookie => 
      cookie.name.startsWith('sb-pkeycuoaeddmblcwzhpo-auth-token')
    );
  
  // 디버그 로깅
  if (pathname === '/profile') {
    console.log(`[Middleware] Profile access - Cookies: ${Array.from(request.cookies.getAll()).map(c => c.name).join(', ')}`);
    console.log(`[Middleware] HasAuth: ${hasAuthCookie}`);
  }
  
  // 생성/작성 페이지만 엄격하게 보호
  const isStrictProtected = strictProtectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // 인증 전용 페이지 확인
  const isAuthOnly = authOnlyRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // 생성/작성 페이지는 쿠키가 없으면 로그인으로
  if (isStrictProtected && !hasAuthCookie) {
    console.log(`[Middleware] Redirecting to login from: ${pathname}`);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 로그인/회원가입은 쿠키가 있으면 대시보드로
  if (isAuthOnly && hasAuthCookie) {
    console.log(`[Middleware] Redirecting to dashboard from: ${pathname}`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 나머지는 모두 통과 (프로필, 대시보드 등은 클라이언트에서 처리)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};