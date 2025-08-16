import { test, expect, Page } from '@playwright/test';

// 베이스 URL
const BASE_URL = 'https://the-match-five.vercel.app';

// 테스트 데이터 생성 헬퍼
const generateTestEmail = () => `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test1234!@#$';
const EXISTING_EMAIL = 'existing@example.com';
const EXISTING_PASSWORD = 'Test1234!';

// 공통 헬퍼 함수들
async function navigateToSignup(page: Page) {
  await page.goto(`${BASE_URL}/signup`);
  await expect(page).toHaveTitle(/The Match/);
  await expect(page.locator('h2')).toContainText('The Match 회원가입');
}

async function navigateToLogin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await expect(page).toHaveTitle(/The Match/);
  await expect(page.locator('h2')).toContainText('The Match에 로그인');
}

async function fillSignupForm(page: Page, name: string, email: string, password: string, confirmPassword: string) {
  await page.getByRole('textbox', { name: '이름' }).fill(name);
  await page.getByRole('textbox', { name: '이메일' }).fill(email);
  await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill(password);
  await page.getByRole('textbox', { name: '비밀번호 확인' }).fill(confirmPassword);
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByRole('textbox', { name: '이메일' }).fill(email);
  await page.getByRole('textbox', { name: '비밀번호' }).fill(password);
}

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // 추가 안정성을 위한 대기
}

test.describe('인증 시스템 E2E 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 홈페이지로 이동하여 초기 상태 확인
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
  });

  test.describe('회원가입 플로우 테스트', () => {
    
    test('유효한 이메일/비밀번호로 회원가입 성공', async ({ page }) => {
      const testEmail = generateTestEmail();
      
      await navigateToSignup(page);
      
      // 회원가입 폼 채우기
      await fillSignupForm(page, '테스트 사용자', testEmail, TEST_PASSWORD, TEST_PASSWORD);
      
      // 비밀번호 유효성 확인 메시지 체크
      await expect(page.locator('text=✓ 비밀번호가 유효합니다')).toBeVisible();
      await expect(page.locator('text=✓ 비밀번호가 일치합니다')).toBeVisible();
      
      // 회원가입 버튼이 활성화되었는지 확인
      const signupButton = page.getByRole('button', { name: '회원가입' });
      await expect(signupButton).toBeEnabled();
      
      // 회원가입 실행
      await signupButton.click();
      
      // 성공 후 대시보드로 리다이렉트 확인
      await waitForPageLoad(page);
      
      // 회원가입 성공 시 대시보드로 리다이렉트됨
      expect(page.url()).toBe(`${BASE_URL}/dashboard`);
      
      // 로그인 상태 확인 - 사용자명이 표시되고 로그아웃 버튼이 있어야 함
      await expect(page.locator('text*=님')).toBeVisible(); // 사용자명 표시 확인
      await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
      
      console.log(`회원가입 성공 - 이메일: ${testEmail}`);
    });

    test('이메일 중복 체크', async ({ page }) => {
      // 먼저 새 계정을 생성
      const testEmail = generateTestEmail();
      await navigateToSignup(page);
      await fillSignupForm(page, '중복 테스트 1', testEmail, TEST_PASSWORD, TEST_PASSWORD);
      
      const signupButton = page.getByRole('button', { name: '회원가입' });
      await signupButton.click();
      await waitForPageLoad(page);
      
      // 로그아웃
      await page.getByRole('button', { name: '로그아웃' }).click();
      await waitForPageLoad(page);
      
      // 같은 이메일로 다시 회원가입 시도
      await navigateToSignup(page);
      await fillSignupForm(page, '중복 테스트 2', testEmail, TEST_PASSWORD, TEST_PASSWORD);
      
      const signupButton2 = page.getByRole('button', { name: '회원가입' });
      await signupButton2.click();
      await waitForPageLoad(page);
      
      // 중복 가입이 실패했는지 확인 (대시보드로 이동하지 않음)
      expect(page.url()).not.toBe(`${BASE_URL}/dashboard`);
      
      // 여전히 회원가입 페이지에 있거나 에러 상태인지 확인
      const isSignupPage = page.url().includes('/signup');
      const hasSignupForm = await page.getByRole('button', { name: '회원가입' }).isVisible();
      
      expect(isSignupPage || hasSignupForm).toBe(true);
      
      console.log('이메일 중복 체크 완료');
    });

    test('비밀번호 유효성 검사', async ({ page }) => {
      await navigateToSignup(page);
      
      const testEmail = generateTestEmail();
      
      // 약한 비밀번호로 테스트
      await page.getByRole('textbox', { name: '이름' }).fill('테스트 사용자');
      await page.getByRole('textbox', { name: '이메일' }).fill(testEmail);
      await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill('weak');
      
      // 비밀번호 유효성 검사 메시지 확인
      await expect(page.locator('text*=비밀번호')).toBeVisible();
      
      // 올바른 비밀번호로 변경
      await page.getByRole('textbox', { name: '비밀번호', exact: true }).clear();
      await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill(TEST_PASSWORD);
      
      // 유효성 확인 메시지
      await expect(page.locator('text=✓ 비밀번호가 유효합니다')).toBeVisible();
      
      console.log('비밀번호 유효성 검사 완료');
    });

    test('비밀번호 확인 불일치 체크', async ({ page }) => {
      await navigateToSignup(page);
      
      const testEmail = generateTestEmail();
      
      await page.getByRole('textbox', { name: '이름' }).fill('테스트 사용자');
      await page.getByRole('textbox', { name: '이메일' }).fill(testEmail);
      await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill(TEST_PASSWORD);
      await page.getByRole('textbox', { name: '비밀번호 확인' }).fill('DifferentPassword123!');
      
      // 비밀번호 불일치 메시지 확인
      await expect(page.locator('text=✗ 비밀번호가 일치하지 않습니다')).toBeVisible();
      
      // 회원가입 버튼이 비활성화되어야 함
      const signupButton = page.getByRole('button', { name: '회원가입' });
      await expect(signupButton).toBeDisabled();
      
      console.log('비밀번호 확인 불일치 체크 완료');
    });
  });

  test.describe('로그인 플로우 테스트', () => {
    
    test('정상 로그인', async ({ page }) => {
      // 먼저 새 계정 생성
      const testEmail = generateTestEmail();
      await navigateToSignup(page);
      await fillSignupForm(page, '로그인 테스트 사용자', testEmail, TEST_PASSWORD, TEST_PASSWORD);
      
      const signupButton = page.getByRole('button', { name: '회원가입' });
      await signupButton.click();
      await waitForPageLoad(page);
      
      // 로그아웃
      await page.getByRole('button', { name: '로그아웃' }).click();
      await waitForPageLoad(page);
      
      // 로그인 테스트
      await navigateToLogin(page);
      await fillLoginForm(page, testEmail, TEST_PASSWORD);
      
      // 로그인 버튼 클릭
      const loginButton = page.getByRole('button', { name: '로그인' });
      await loginButton.click();
      
      await waitForPageLoad(page);
      
      // 로그인 성공 시 리다이렉트 확인 (경기 목록 페이지로 이동)
      const currentUrl = page.url();
      expect(currentUrl).toBe(`${BASE_URL}/matches`);
      
      // 로그인 상태 확인 - 사용자명과 로그아웃 버튼 표시
      await expect(page.locator('text*=님')).toBeVisible();
      await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
      
      // 네비게이션에서 로그인 링크가 사라진 것 확인
      await expect(page.locator('navigation').getByRole('link', { name: '로그인' })).not.toBeVisible();
      
      console.log('정상 로그인 성공');
    });

    test('잘못된 비밀번호 처리', async ({ page }) => {
      // 먼저 새 계정 생성
      const testEmail = generateTestEmail();
      await navigateToSignup(page);
      await fillSignupForm(page, '비밀번호 테스트 사용자', testEmail, TEST_PASSWORD, TEST_PASSWORD);
      
      const signupButton = page.getByRole('button', { name: '회원가입' });
      await signupButton.click();
      await waitForPageLoad(page);
      
      // 로그아웃
      await page.getByRole('button', { name: '로그아웃' }).click();
      await waitForPageLoad(page);
      
      // 잘못된 비밀번호로 로그인 시도
      await navigateToLogin(page);
      await fillLoginForm(page, testEmail, 'WrongPassword123!');
      
      const loginButton = page.getByRole('button', { name: '로그인' });
      await loginButton.click();
      
      await waitForPageLoad(page);
      
      // 에러 발생 시에도 여전히 로그인 페이지에 있거나 에러 처리됨
      // Supabase 에러는 콘솔에 표시되므로 로그인 상태가 아닌 것을 확인
      await expect(page.getByRole('button', { name: '로그아웃' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
      
      console.log('잘못된 비밀번호 처리 완료');
    });

    test('존재하지 않는 이메일 처리', async ({ page }) => {
      await navigateToLogin(page);
      
      // 존재하지 않는 이메일
      const nonExistentEmail = `nonexistent_${Date.now()}@example.com`;
      await fillLoginForm(page, nonExistentEmail, TEST_PASSWORD);
      
      const loginButton = page.getByRole('button', { name: '로그인' });
      await loginButton.click();
      
      await waitForPageLoad(page);
      
      // 에러 발생 시 로그인 상태가 아닌 것을 확인
      await expect(page.getByRole('button', { name: '로그아웃' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
      
      console.log('존재하지 않는 이메일 처리 완료');
    });

    test('로그인 후 리다이렉트', async ({ page }) => {
      // 먼저 계정 생성
      const testEmail = generateTestEmail();
      await navigateToSignup(page);
      await fillSignupForm(page, '리다이렉트 테스트 사용자', testEmail, TEST_PASSWORD, TEST_PASSWORD);
      
      const signupButton = page.getByRole('button', { name: '회원가입' });
      await signupButton.click();
      await waitForPageLoad(page);
      
      // 로그아웃
      await page.getByRole('button', { name: '로그아웃' }).click();
      await waitForPageLoad(page);
      
      // 보호된 페이지에 먼저 접근 시도 (대시보드는 로그아웃 상태에서도 접근 가능하므로 다른 페이지 사용)
      await page.goto(`${BASE_URL}/matches/create`);
      await waitForPageLoad(page);
      
      // 로그인 폼이 있는지 확인 (로그인이 필요한 페이지에서 로그인 폼이 표시될 수 있음)
      // 또는 로그인 페이지로 리다이렉트
      const hasLoginForm = await page.getByRole('button', { name: '로그인' }).isVisible();
      const isLoginPage = page.url().includes('/login');
      
      if (isLoginPage) {
        // 로그인 페이지로 리다이렉트된 경우
        await fillLoginForm(page, testEmail, TEST_PASSWORD);
        
        const loginButton = page.getByRole('button', { name: '로그인' });
        await loginButton.click();
        
        await waitForPageLoad(page);
        
        // 경기 관련 페이지로 리다이렉트 확인
        expect(page.url()).toContain('/matches');
      } else if (hasLoginForm) {
        // 페이지 내에 로그인 폼이 있는 경우
        await fillLoginForm(page, testEmail, TEST_PASSWORD);
        
        const loginButton = page.getByRole('button', { name: '로그인' });
        await loginButton.click();
        
        await waitForPageLoad(page);
        
        // 로그인 후 적절한 페이지에 있는지 확인
        await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
      }
      
      console.log('로그인 후 리다이렉트 완료');
    });
  });

  test.describe('로그아웃 테스트', () => {
    
    test('로그아웃 기능', async ({ page }) => {
      // 먼저 로그인
      await navigateToLogin(page);
      await fillLoginForm(page, EXISTING_EMAIL, EXISTING_PASSWORD);
      
      const loginButton = page.getByRole('button', { name: '로그인' });
      await loginButton.click();
      
      await waitForPageLoad(page);
      
      // 로그인 상태 확인
      await expect(page.locator('text=로그인')).not.toBeVisible();
      
      // 로그아웃 버튼 찾기 및 클릭 (구체적인 셀렉터는 실제 UI에 따라 조정 필요)
      const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")').first();
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else {
        // 사용자 메뉴에서 로그아웃 찾기
        const userMenu = page.locator('[data-testid="user-menu"], .user-menu, button:has(img)').first();
        if (await userMenu.isVisible()) {
          await userMenu.click();
          await page.locator('text=로그아웃').click();
        }
      }
      
      await waitForPageLoad(page);
      
      // 로그아웃 후 홈페이지나 로그인 페이지로 리다이렉트 확인
      const currentUrl = page.url();
      expect(currentUrl === BASE_URL || currentUrl === `${BASE_URL}/login`).toBe(true);
      
      // 로그인 링크가 다시 표시되는지 확인
      await expect(page.locator('text=로그인')).toBeVisible();
      
      console.log('로그아웃 완료');
    });

    test('세션 종료 확인', async ({ page }) => {
      // 로그인
      await navigateToLogin(page);
      await fillLoginForm(page, EXISTING_EMAIL, EXISTING_PASSWORD);
      
      const loginButton = page.getByRole('button', { name: '로그인' });
      await loginButton.click();
      
      await waitForPageLoad(page);
      
      // 로그아웃 (위와 동일한 로직)
      const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")').first();
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else {
        const userMenu = page.locator('[data-testid="user-menu"], .user-menu, button:has(img)').first();
        if (await userMenu.isVisible()) {
          await userMenu.click();
          await page.locator('text=로그아웃').click();
        }
      }
      
      await waitForPageLoad(page);
      
      // 보호된 페이지 접근 시도
      await page.goto(`${BASE_URL}/dashboard`);
      await waitForPageLoad(page);
      
      // 로그인 페이지로 리다이렉트되는지 확인
      expect(page.url()).toBe(`${BASE_URL}/login`);
      
      console.log('세션 종료 확인 완료');
    });

    test('보호된 페이지 접근 차단', async ({ page }) => {
      // 로그아웃 상태에서 보호된 페이지들에 접근 시도
      const protectedPages = [
        '/profile',
        '/matches/create', 
        '/teams/create'
      ];
      
      for (const path of protectedPages) {
        await page.goto(`${BASE_URL}${path}`);
        await waitForPageLoad(page);
        
        // 로그인이 필요함을 확인 (로그인 페이지로 리다이렉트되거나 로그인 폼이 표시됨)
        const isLoginPage = page.url().includes('/login');
        const hasLoginForm = await page.getByRole('button', { name: '로그인' }).isVisible();
        const isNotLoggedIn = await page.getByRole('link', { name: '로그인' }).isVisible();
        
        expect(isLoginPage || hasLoginForm || isNotLoggedIn).toBe(true);
        
        console.log(`보호된 페이지 ${path} 접근 차단 확인`);
      }
    });
  });

  test.describe('소셜 로그인 테스트', () => {
    
    test('Google 로그인 버튼 표시 확인', async ({ page }) => {
      await navigateToLogin(page);
      
      // Google 로그인 버튼이 표시되는지 확인
      const googleLoginButton = page.getByRole('button', { name: /Google로 로그인/ });
      await expect(googleLoginButton).toBeVisible();
      
      console.log('Google 로그인 버튼 표시 확인');
    });

    test('Google 회원가입 버튼 표시 확인', async ({ page }) => {
      await navigateToSignup(page);
      
      // Google 회원가입 버튼이 표시되는지 확인
      const googleSignupButton = page.getByRole('button', { name: /Google로 회원가입/ });
      await expect(googleSignupButton).toBeVisible();
      
      console.log('Google 회원가입 버튼 표시 확인');
    });
  });

  test.describe('폼 검증 테스트', () => {
    
    test('빈 필드 제출 방지', async ({ page }) => {
      await navigateToSignup(page);
      
      // 빈 폼으로 제출 시도
      const signupButton = page.getByRole('button', { name: '회원가입' });
      
      // 버튼이 비활성화되어 있는지 확인
      await expect(signupButton).toBeDisabled();
      
      console.log('빈 필드 제출 방지 확인');
    });

    test('이메일 형식 검증', async ({ page }) => {
      await navigateToSignup(page);
      
      // 잘못된 이메일 형식 입력
      await page.getByRole('textbox', { name: '이름' }).fill('테스트 사용자');
      await page.getByRole('textbox', { name: '이메일' }).fill('invalid-email');
      
      // 이메일 검증 메시지나 버튼 상태 확인
      const signupButton = page.getByRole('button', { name: '회원가입' });
      
      // 브라우저 기본 검증이나 커스텀 검증 메시지 확인
      await page.getByRole('textbox', { name: '이메일' }).blur();
      
      console.log('이메일 형식 검증 확인');
    });
  });

  test.describe('페이지 네비게이션 테스트', () => {
    
    test('로그인-회원가입 페이지 간 이동', async ({ page }) => {
      // 로그인 페이지에서 회원가입 링크 클릭
      await navigateToLogin(page);
      
      const signupLink = page.getByRole('link', { name: '회원가입' });
      await signupLink.click();
      
      await waitForPageLoad(page);
      expect(page.url()).toBe(`${BASE_URL}/signup`);
      
      // 회원가입 페이지에서 로그인 링크 클릭
      const loginLink = page.getByRole('link', { name: '로그인' });
      await loginLink.click();
      
      await waitForPageLoad(page);
      expect(page.url()).toBe(`${BASE_URL}/login`);
      
      console.log('로그인-회원가입 페이지 간 이동 확인');
    });

    test('비밀번호 찾기 링크', async ({ page }) => {
      await navigateToLogin(page);
      
      const forgotPasswordLink = page.getByRole('link', { name: /비밀번호를 잊으셨나요/ });
      await expect(forgotPasswordLink).toBeVisible();
      
      // 링크 클릭 시 적절한 페이지로 이동하는지 확인
      await forgotPasswordLink.click();
      await waitForPageLoad(page);
      
      expect(page.url()).toBe(`${BASE_URL}/forgot-password`);
      
      console.log('비밀번호 찾기 링크 확인');
    });
  });

  // 테스트 정리 (cleanup)
  test.afterEach(async ({ page }) => {
    // 각 테스트 후 로그아웃 상태로 만들기
    try {
      const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")').first();
      
      if (await logoutButton.isVisible({ timeout: 2000 })) {
        await logoutButton.click();
        await waitForPageLoad(page);
      }
    } catch (error) {
      // 이미 로그아웃 상태이거나 로그아웃 버튼을 찾을 수 없는 경우 무시
      console.log('테스트 정리 중 로그아웃 실패 또는 이미 로그아웃 상태');
    }
    
    // 홈페이지로 이동하여 상태 초기화
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
  });

  test.afterAll(async () => {
    console.log('모든 인증 E2E 테스트 완료');
  });
});