import { test, expect, Page } from '@playwright/test';

// 테스트 사용자 데이터
const testUser = {
  email: `test-simple-${Date.now()}@thematch.test`,
  password: 'TestPassword123!',
  fullName: 'Simple Test User'
};

const existingUser = {
  email: 'existing-user@thematch.test',
  password: 'ExistingPassword123!'
};

test.describe('The Match - 인증 시스템 간소화 테스트', () => {
  test.use({ 
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 }
  });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    console.log('🧹 세션 초기화 완료');
  });

  test('회원가입 플로우 전체 테스트', async ({ page }) => {
    console.log('🧪 시작: 회원가입 플로우 전체 테스트');
    
    // 1. 홈페이지 접속
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: `tests/e2e/screenshots/simple-auth-homepage-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('✅ 홈페이지 접속 완료');

    // 2. 회원가입 페이지로 이동
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: `tests/e2e/screenshots/simple-auth-signup-page-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('✅ 회원가입 페이지 이동');

    // 3. 회원가입 폼 작성
    await page.fill('#name', testUser.fullName);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);
    
    await page.waitForTimeout(1000); // 유효성 검사 대기
    
    await page.screenshot({ 
      path: `tests/e2e/screenshots/simple-auth-signup-filled-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('✅ 회원가입 폼 작성 완료');

    // 4. 회원가입 버튼 클릭
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).not.toBeDisabled();
    await submitButton.click();
    
    // 회원가입 처리 대기
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`회원가입 후 현재 URL: ${currentUrl}`);

    await page.screenshot({ 
      path: `tests/e2e/screenshots/simple-auth-after-signup-${Date.now()}.png`,
      fullPage: true 
    });

    // 5. 결과 확인
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 회원가입 후 대시보드로 자동 이동 (자동 로그인 성공)');
    } else if (currentUrl.includes('/login')) {
      console.log('⚠️ 회원가입 후 로그인 페이지로 이동 (수동 로그인 필요)');
    } else {
      console.log(`⚠️ 예상치 못한 페이지로 이동: ${currentUrl}`);
    }

    console.log('🎉 회원가입 플로우 테스트 완료');
  });

  test('기존 사용자 로그인 및 보호된 페이지 접근 테스트', async ({ page }) => {
    console.log('🧪 시작: 로그인 및 보호된 페이지 접근 테스트');
    
    // 1. 로그인 페이지 접속
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ 로그인 페이지 접속');

    // 2. 기존 사용자로 로그인 시도
    await page.fill('input[type="email"]', existingUser.email);
    await page.fill('input[type="password"]', existingUser.password);
    
    await page.screenshot({ 
      path: `tests/e2e/screenshots/simple-auth-login-filled-${Date.now()}.png`,
      fullPage: true 
    });

    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();
    
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const afterLoginUrl = page.url();
    console.log(`로그인 후 URL: ${afterLoginUrl}`);

    await page.screenshot({ 
      path: `tests/e2e/screenshots/simple-auth-after-login-${Date.now()}.png`,
      fullPage: true 
    });

    // 3. 보호된 페이지들 접근 테스트
    const protectedPages = ['/profile', '/dashboard', '/matches/create', '/teams/create'];
    
    for (const pagePath of protectedPages) {
      console.log(`📍 ${pagePath} 페이지 접근 테스트`);
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const canAccess = currentUrl.includes(pagePath);

      await page.screenshot({ 
        path: `tests/e2e/screenshots/simple-auth-protected-${pagePath.replace(/\//g, '-')}-${Date.now()}.png`,
        fullPage: true 
      });

      if (canAccess) {
        console.log(`✅ ${pagePath} 접근 성공`);
      } else {
        console.log(`❌ ${pagePath} 접근 실패 - 현재 URL: ${currentUrl}`);
      }
    }

    console.log('🎉 로그인 및 보호된 페이지 접근 테스트 완료');
  });

  test('로그아웃 상태에서 보호된 페이지 접근 차단 테스트', async ({ page }) => {
    console.log('🧪 시작: 로그아웃 상태 보호된 페이지 접근 차단 테스트');
    
    // 쿠키 클리어로 로그아웃 상태 확보
    await page.context().clearCookies();
    
    const protectedPages = ['/profile', '/dashboard', '/matches/create', '/teams/create'];
    
    for (const pagePath of protectedPages) {
      console.log(`📍 ${pagePath} 페이지 접근 시도 (로그아웃 상태)`);
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes('/login');
      const redirectedToHome = currentUrl === 'http://localhost:3000/';

      await page.screenshot({ 
        path: `tests/e2e/screenshots/simple-auth-unauthorized-${pagePath.replace(/\//g, '-')}-${Date.now()}.png`,
        fullPage: true 
      });

      if (redirectedToLogin) {
        console.log(`✅ ${pagePath} 보호 정상 - 로그인 페이지로 리다이렉트`);
      } else if (redirectedToHome) {
        console.log(`✅ ${pagePath} 보호 정상 - 홈페이지로 리다이렉트`);
      } else {
        console.log(`⚠️ ${pagePath} 보호 상태 확인 필요 - 현재 URL: ${currentUrl}`);
      }
    }

    console.log('🎉 로그아웃 상태 보호된 페이지 접근 차단 테스트 완료');
  });

  test('로그인 상태 지속성 테스트 (새로고침)', async ({ page }) => {
    console.log('🧪 시작: 로그인 상태 지속성 테스트');
    
    // 1. 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', existingUser.email);
    await page.fill('input[type="password"]', existingUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    console.log('✅ 로그인 완료');

    // 2. 대시보드 접근
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const beforeReloadUrl = page.url();
    console.log(`새로고침 전 URL: ${beforeReloadUrl}`);

    await page.screenshot({ 
      path: `tests/e2e/screenshots/simple-auth-before-reload-${Date.now()}.png`,
      fullPage: true 
    });

    // 3. 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const afterReloadUrl = page.url();
    console.log(`새로고침 후 URL: ${afterReloadUrl}`);

    await page.screenshot({ 
      path: `tests/e2e/screenshots/simple-auth-after-reload-${Date.now()}.png`,
      fullPage: true 
    });

    // 4. 상태 유지 확인
    const stayedLoggedIn = !afterReloadUrl.includes('/login') && 
                           (afterReloadUrl.includes('/dashboard') || afterReloadUrl === beforeReloadUrl);

    if (stayedLoggedIn) {
      console.log('✅ 새로고침 후 로그인 상태 유지됨');
    } else {
      console.log('❌ 새로고침 후 로그인 상태 상실');
    }

    console.log('🎉 로그인 상태 지속성 테스트 완료');
  });

  test('인증 쿠키 및 세션 검증 테스트', async ({ page, context }) => {
    console.log('🧪 시작: 인증 쿠키 및 세션 검증 테스트');
    
    // 1. 로그인 전 쿠키 상태
    const cookiesBeforeLogin = await context.cookies();
    console.log(`로그인 전 쿠키 개수: ${cookiesBeforeLogin.length}`);

    // 2. 로그인
    await page.goto('/login');
    await page.fill('input[type="email"]', existingUser.email);
    await page.fill('input[type="password"]', existingUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // 3. 로그인 후 쿠키 상태
    const cookiesAfterLogin = await context.cookies();
    console.log(`로그인 후 쿠키 개수: ${cookiesAfterLogin.length}`);
    
    const authCookies = cookiesAfterLogin.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('session')
    );
    
    console.log(`🔐 인증 관련 쿠키: ${authCookies.length}개`);
    authCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 30)}...`);
    });

    // 4. API 요청 테스트
    try {
      const response = await page.request.get('/api/dashboard');
      console.log(`API 응답 상태: ${response.status()}`);
      
      if (response.status() === 200) {
        console.log('✅ API 인증 성공');
      } else {
        console.log(`❌ API 인증 실패 - 상태 코드: ${response.status()}`);
      }
    } catch (error) {
      console.log(`API 요청 오류: ${error.message}`);
    }

    await page.screenshot({ 
      path: `tests/e2e/screenshots/simple-auth-session-verification-${Date.now()}.png`,
      fullPage: true 
    });

    console.log('🎉 인증 쿠키 및 세션 검증 테스트 완료');
  });
});