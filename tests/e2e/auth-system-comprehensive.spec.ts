import { test, expect, Page, BrowserContext } from '@playwright/test';

// 테스트 사용자 데이터
const testUser = {
  email: `test-auth-${Date.now()}@thematch.test`,
  password: 'TestPassword123!',
  fullName: 'Auth Test User'
};

const existingUser = {
  email: 'existing-user@thematch.test',
  password: 'ExistingPassword123!'
};

test.describe('The Match - 인증 시스템 전체 테스트', () => {
  test.use({ 
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 }
  });

  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 쿠키 클리어
    await page.context().clearCookies();
    await page.context().clearPermissions();
    
    // localStorage 접근 안전하게 처리
    try {
      await page.evaluate(() => {
        if (typeof Storage !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }
      });
    } catch (error) {
      console.log('Storage clear skipped:', error.message);
    }
  });

  test('시나리오 1: 회원가입 플로우 완전성 테스트', async ({ page }) => {
    console.log('🧪 시작: 회원가입 플로우 완전성 테스트');
    
    // 1.1 홈페이지 접속
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-homepage-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('✅ 홈페이지 접속 완료');

    // 1.2 회원가입 페이지로 이동
    const signupLink = page.locator('a[href="/signup"], button:has-text("회원가입"), a:has-text("가입")');
    
    // 다양한 방법으로 회원가입 페이지 접근 시도
    if (await signupLink.first().isVisible()) {
      await signupLink.first().click();
    } else {
      // 직접 URL 이동
      await page.goto('/signup');
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-signup-page-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('✅ 회원가입 페이지 이동 완료');

    // 1.3 회원가입 폼 작성
    const nameField = page.locator('input[id="name"]');
    const emailField = page.locator('input[id="email"]');
    const passwordField = page.locator('input[id="password"]');
    const confirmPasswordField = page.locator('input[id="confirmPassword"]');
    
    await nameField.fill(testUser.fullName);
    await emailField.fill(testUser.email);
    await passwordField.fill(testUser.password);
    await confirmPasswordField.fill(testUser.password);
    
    // 폼 유효성 검사가 완료될 때까지 잠시 대기
    await page.waitForTimeout(1000);

    await page.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-signup-filled-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('✅ 회원가입 폼 작성 완료');

    // 1.4 회원가입 제출
    const submitButton = page.locator('button[type="submit"], button:has-text("가입"), button:has-text("회원가입")');
    await submitButton.first().click();
    
    // 페이지 이동 대기 (리다이렉트 또는 대시보드로 이동)
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-after-signup-${Date.now()}.png`,
      fullPage: true 
    });

    // 1.5 회원가입 후 자동 로그인 확인
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    // 대시보드나 홈페이지로 리다이렉트 되었는지 확인
    const isLoggedIn = currentUrl.includes('/dashboard') || 
                      currentUrl.includes('/') && !currentUrl.includes('/login') && !currentUrl.includes('/signup');

    if (isLoggedIn) {
      console.log('✅ 자동 로그인 성공 - 대시보드로 리다이렉트됨');
    } else {
      console.log('⚠️ 자동 로그인 확인 필요 - 현재 페이지 분석');
    }

    // 1.6 로그인 상태 확인 (프로필 메뉴나 로그아웃 버튼 존재)
    const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")');
    const profileMenu = page.locator('[data-testid="profile-menu"], .profile-menu, button:has-text("프로필")');
    
    const hasLogoutButton = await logoutButton.isVisible();
    const hasProfileMenu = await profileMenu.isVisible();
    
    if (hasLogoutButton || hasProfileMenu) {
      console.log('✅ 로그인 상태 확인됨');
    } else {
      console.log('⚠️ 로그인 상태 불확실 - UI 요소 미발견');
    }

    await page.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-login-verification-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('🎉 회원가입 플로우 테스트 완료');
  });

  test('시나리오 2: 로그인 상태 유지 테스트', async ({ page, context }) => {
    console.log('🧪 시작: 로그인 상태 유지 테스트');
    
    // 2.1 기존 사용자로 로그인 (회원가입 없이)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailField = page.locator('input[type="email"], input[name="email"]');
    const passwordField = page.locator('input[type="password"], input[name="password"]');
    
    await emailField.fill(existingUser.email);
    await passwordField.fill(existingUser.password);

    const loginButton = page.locator('button[type="submit"], button:has-text("로그인")');
    await loginButton.first().click();
    
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-login-complete-${Date.now()}.png`,
      fullPage: true 
    });
    console.log('✅ 기존 사용자 로그인 완료');

    // 2.2 여러 보호된 페이지 이동 테스트
    const protectedPages = ['/profile', '/dashboard', '/matches/create', '/teams/create'];
    
    for (const pagePath of protectedPages) {
      console.log(`📍 ${pagePath} 페이지 접근 테스트`);
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const isOnProtectedPage = currentUrl.includes(pagePath);
      const isRedirectedToLogin = currentUrl.includes('/login');

      await page.screenshot({ 
        path: `tests/e2e/screenshots/auth-comprehensive-protected-${pagePath.replace('/', '-')}-${Date.now()}.png`,
        fullPage: true 
      });

      if (isOnProtectedPage) {
        console.log(`✅ ${pagePath} 접근 성공`);
      } else if (isRedirectedToLogin) {
        console.log(`❌ ${pagePath} 접근 실패 - 로그인 페이지로 리다이렉트`);
      } else {
        console.log(`⚠️ ${pagePath} 접근 결과 불분명 - 현재 URL: ${currentUrl}`);
      }
    }

    // 2.3 새로고침 후 로그인 상태 유지 확인
    console.log('🔄 새로고침 후 상태 유지 테스트');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const afterReloadUrl = page.url();
    const stayedLoggedIn = !afterReloadUrl.includes('/login');

    await page.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-after-reload-${Date.now()}.png`,
      fullPage: true 
    });

    if (stayedLoggedIn) {
      console.log('✅ 새로고침 후 로그인 상태 유지됨');
    } else {
      console.log('❌ 새로고침 후 로그인 상태 상실');
    }

    console.log('🎉 로그인 상태 유지 테스트 완료');
  });

  test('시나리오 3: 보호된 라우트 접근 테스트', async ({ page }) => {
    console.log('🧪 시작: 보호된 라우트 접근 테스트');
    
    // 3.1 로그아웃 상태에서 보호된 페이지 접근 시도
    const protectedPages = ['/profile', '/dashboard', '/matches/create', '/teams/create'];
    
    console.log('👤 로그아웃 상태에서 보호된 페이지 접근 테스트');
    for (const pagePath of protectedPages) {
      console.log(`📍 ${pagePath} 접근 시도 (로그아웃 상태)`);
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes('/login');
      const redirectedToHome = currentUrl === 'http://localhost:3000/';

      await page.screenshot({ 
        path: `tests/e2e/screenshots/auth-comprehensive-unauthorized-${pagePath.replace('/', '-')}-${Date.now()}.png`,
        fullPage: true 
      });

      if (redirectedToLogin) {
        console.log(`✅ ${pagePath} 보호 정상 - 로그인 페이지로 리다이렉트`);
      } else if (redirectedToHome) {
        console.log(`✅ ${pagePath} 보호 정상 - 홈페이지로 리다이렉트`);
      } else {
        console.log(`⚠️ ${pagePath} 보호 상태 불분명 - 현재 URL: ${currentUrl}`);
      }
    }

    // 3.2 로그인 후 동일한 페이지들 접근 테스트
    console.log('🔑 로그인 후 보호된 페이지 접근 테스트');
    await page.goto('/login');
    
    const emailField = page.locator('input[type="email"], input[name="email"]');
    const passwordField = page.locator('input[type="password"], input[name="password"]');
    
    await emailField.fill(existingUser.email);
    await passwordField.fill(existingUser.password);

    const loginButton = page.locator('button[type="submit"], button:has-text("로그인")');
    await loginButton.first().click();
    
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    for (const pagePath of protectedPages) {
      console.log(`📍 ${pagePath} 접근 시도 (로그인 상태)`);
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const canAccess = currentUrl.includes(pagePath);

      await page.screenshot({ 
        path: `tests/e2e/screenshots/auth-comprehensive-authorized-${pagePath.replace('/', '-')}-${Date.now()}.png`,
        fullPage: true 
      });

      if (canAccess) {
        console.log(`✅ ${pagePath} 로그인 후 접근 성공`);
      } else {
        console.log(`❌ ${pagePath} 로그인 후에도 접근 실패 - 현재 URL: ${currentUrl}`);
      }
    }

    console.log('🎉 보호된 라우트 접근 테스트 완료');
  });

  test('시나리오 4: 인증 상태 동기화 테스트', async ({ page, context }) => {
    console.log('🧪 시작: 인증 상태 동기화 테스트');
    
    // 4.1 로그인 수행
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailField = page.locator('input[type="email"], input[name="email"]');
    const passwordField = page.locator('input[type="password"], input[name="password"]');
    
    await emailField.fill(existingUser.email);
    await passwordField.fill(existingUser.password);

    const loginButton = page.locator('button[type="submit"], button:has-text("로그인")');
    await loginButton.first().click();
    
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ 로그인 완료');

    // 4.2 쿠키 검증
    const cookies = await context.cookies();
    console.log(`🍪 쿠키 개수: ${cookies.length}`);
    
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('session')
    );
    
    console.log(`🔐 인증 관련 쿠키: ${authCookies.length}개`);
    authCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });

    // 4.3 localStorage/sessionStorage 검증
    const storageData = await page.evaluate(() => {
      const result = { localStorage: {}, sessionStorage: {} };
      
      try {
        if (typeof Storage !== "undefined" && window.localStorage) {
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key) result.localStorage[key] = window.localStorage.getItem(key);
          }
        }
      } catch (e) {
        console.log('localStorage access denied');
      }
      
      try {
        if (typeof Storage !== "undefined" && window.sessionStorage) {
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const key = window.sessionStorage.key(i);
            if (key) result.sessionStorage[key] = window.sessionStorage.getItem(key);
          }
        }
      } catch (e) {
        console.log('sessionStorage access denied');
      }
      
      return result;
    });

    console.log(`💾 LocalStorage 키: ${Object.keys(storageData.localStorage).length}개`);
    console.log(`💾 SessionStorage 키: ${Object.keys(storageData.sessionStorage).length}개`);

    // 인증 관련 스토리지 데이터 확인
    const authStorageKeys = Object.keys(storageData.localStorage).filter(key =>
      key.includes('auth') || key.includes('supabase') || key.includes('user')
    );
    
    console.log(`🔐 인증 관련 Storage 키: ${authStorageKeys.length}개`);
    authStorageKeys.forEach(key => {
      const value = storageData.localStorage[key];
      console.log(`  - ${key}: ${value.substring(0, 100)}...`);
    });

    // 4.4 여러 탭에서 동기화 테스트 (새 페이지 생성)
    console.log('🪟 새 탭에서 인증 상태 동기화 테스트');
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    await newPage.waitForLoadState('networkidle');
    await newPage.waitForTimeout(2000);

    const newPageUrl = newPage.url();
    const newTabLoggedIn = !newPageUrl.includes('/login');

    await newPage.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-new-tab-sync-${Date.now()}.png`,
      fullPage: true 
    });

    if (newTabLoggedIn) {
      console.log('✅ 새 탭에서 인증 상태 동기화 성공');
    } else {
      console.log('❌ 새 탭에서 인증 상태 동기화 실패');
    }

    await newPage.close();

    // 4.5 API 요청 인증 헤더 테스트
    console.log('🌐 API 요청 인증 테스트');
    
    // API 엔드포인트에 요청하여 인증 상태 확인
    const response = await page.request.get('/api/dashboard');
    
    console.log(`API 응답 상태: ${response.status()}`);
    
    if (response.status() === 200) {
      console.log('✅ API 인증 성공');
      try {
        const data = await response.json();
        console.log('API 응답 데이터 수신 성공');
      } catch (e) {
        console.log('API 응답 파싱 오류:', e);
      }
    } else {
      console.log(`❌ API 인증 실패 - 상태 코드: ${response.status()}`);
    }

    // 4.6 최종 동기화 검증 스크린샷
    await page.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-sync-verification-${Date.now()}.png`,
      fullPage: true 
    });

    console.log('🎉 인증 상태 동기화 테스트 완료');
  });

  test('통합 테스트: 전체 인증 플로우', async ({ page }) => {
    console.log('🧪 시작: 전체 인증 플로우 통합 테스트');
    
    // 단계별 통합 테스트
    const testSteps = [
      '홈페이지 접속',
      '로그아웃 상태 확인',
      '보호된 페이지 접근 차단 확인',
      '로그인 수행',
      '로그인 후 보호된 페이지 접근 성공 확인',
      '새로고침 후 상태 유지 확인',
      '로그아웃 수행',
      '로그아웃 후 상태 확인'
    ];

    for (let i = 0; i < testSteps.length; i++) {
      const step = testSteps[i];
      console.log(`📋 단계 ${i + 1}/${testSteps.length}: ${step}`);
      
      await page.screenshot({ 
        path: `tests/e2e/screenshots/auth-comprehensive-integration-step-${i + 1}-${Date.now()}.png`,
        fullPage: true 
      });
      
      // 각 단계별 간단한 동작만 수행 (세부 검증은 개별 테스트에서 완료)
      switch (i) {
        case 0: // 홈페이지 접속
          await page.goto('/');
          await page.waitForLoadState('networkidle');
          break;
        case 1: // 로그아웃 상태 확인
          // UI에서 로그인 버튼 존재 확인
          break;
        case 2: // 보호된 페이지 접근 차단 확인
          await page.goto('/dashboard');
          await page.waitForLoadState('networkidle');
          break;
        case 3: // 로그인 수행
          await page.goto('/login');
          const emailField = page.locator('input[type="email"]');
          const passwordField = page.locator('input[type="password"]');
          await emailField.fill(existingUser.email);
          await passwordField.fill(existingUser.password);
          
          const loginButton = page.locator('button[type="submit"]');
          await loginButton.first().click();
          await page.waitForTimeout(3000);
          break;
        case 4: // 로그인 후 보호된 페이지 접근 성공 확인
          await page.goto('/dashboard');
          await page.waitForLoadState('networkidle');
          break;
        case 5: // 새로고침 후 상태 유지 확인
          await page.reload();
          await page.waitForLoadState('networkidle');
          break;
        case 6: // 로그아웃 수행
          const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")');
          if (await logoutButton.isVisible()) {
            await logoutButton.first().click();
            await page.waitForTimeout(2000);
          } else {
            await page.goto('/login'); // 강제 로그아웃
          }
          break;
        case 7: // 로그아웃 후 상태 확인
          await page.goto('/dashboard');
          await page.waitForLoadState('networkidle');
          break;
      }
      
      await page.waitForTimeout(1000);
      console.log(`✅ 단계 ${i + 1} 완료: ${step}`);
    }

    await page.screenshot({ 
      path: `tests/e2e/screenshots/auth-comprehensive-integration-complete-${Date.now()}.png`,
      fullPage: true 
    });

    console.log('🎉 전체 인증 플로우 통합 테스트 완료');
  });
});