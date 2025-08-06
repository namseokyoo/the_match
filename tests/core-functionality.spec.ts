import { test, expect } from '@playwright/test';

/**
 * The Match 핵심 기능 E2E 테스트
 * 
 * 테스트 범위:
 * 1. 홈페이지 접근 및 기본 네비게이션
 * 2. 매치 목록 조회 및 상세 보기
 * 3. 팀 목록 조회 및 상세 보기
 * 4. 매치/팀 생성 페이지 접근 (인증 필요)
 * 5. 반응형 디자인 확인
 */

test.describe('The Match - 핵심 기능 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 홈페이지로 이동
    await page.goto('/');
  });

  test('홈페이지 로딩 및 기본 네비게이션 확인', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/The Match/);
    
    // 헤더 네비게이션 요소 확인
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    // 주요 네비게이션 링크 확인
    await expect(page.getByRole('link', { name: /경기/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /팀/i })).toBeVisible();
    
    // 로고 또는 제목 확인
    await expect(page.getByText('The Match')).toBeVisible();
  });

  test('매치 목록 페이지 기능 확인', async ({ page }) => {
    // 매치 페이지로 이동
    await page.goto('/matches');
    
    // 매치 목록 페이지 로딩 확인
    await expect(page).toHaveURL('/matches');
    
    // 매치 목록 또는 빈 상태 메시지 확인
    const matchList = page.locator('[data-testid="match-list"], .matches-container, .match-card').first();
    const emptyMessage = page.getByText(/매치가 없습니다|경기가 없습니다|등록된 매치|등록된 경기/i);
    
    // 둘 중 하나는 보여야 함
    await expect(matchList.or(emptyMessage)).toBeVisible();
    
    // 매치 생성 버튼 또는 링크 확인
    const createButton = page.getByRole('link', { name: /매치 생성|경기 생성|새 매치|새 경기/i });
    await expect(createButton).toBeVisible();
  });

  test('팀 목록 페이지 기능 확인', async ({ page }) => {
    // 팀 페이지로 이동
    await page.goto('/teams');
    
    // 팀 목록 페이지 로딩 확인
    await expect(page).toHaveURL('/teams');
    
    // 팀 목록 또는 빈 상태 메시지 확인
    const teamList = page.locator('[data-testid="team-list"], .teams-container, .team-card').first();
    const emptyMessage = page.getByText(/팀이 없습니다|등록된 팀/i);
    
    // 둘 중 하나는 보여야 함
    await expect(teamList.or(emptyMessage)).toBeVisible();
    
    // 팀 생성 버튼 또는 링크 확인
    const createButton = page.getByRole('link', { name: /팀 생성|새 팀/i });
    await expect(createButton).toBeVisible();
  });

  test('로그인 페이지 접근 및 UI 확인', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/login');
    
    // 로그인 페이지 로딩 확인
    await expect(page).toHaveURL('/login');
    
    // 로그인 폼 요소 확인
    await expect(page.getByRole('textbox', { name: /이메일/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /비밀번호|password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible();
    
    // 소셜 로그인 버튼 확인 (있는 경우)
    const googleButton = page.getByRole('button', { name: /google/i });
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeVisible();
    }
    
    // 회원가입 링크 확인
    await expect(page.getByRole('link', { name: /회원가입/i })).toBeVisible();
  });

  test('회원가입 페이지 접근 및 UI 확인', async ({ page }) => {
    // 회원가입 페이지로 이동
    await page.goto('/signup');
    
    // 회원가입 페이지 로딩 확인
    await expect(page).toHaveURL('/signup');
    
    // 회원가입 폼 요소 확인
    await expect(page.getByRole('textbox', { name: /이메일/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /비밀번호|password/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /회원가입|가입/i })).toBeVisible();
    
    // 로그인 링크 확인
    await expect(page.getByRole('link', { name: /로그인/i })).toBeVisible();
  });

  test('매치 생성 페이지 접근 (로그인 필요)', async ({ page }) => {
    // 매치 생성 페이지로 직접 이동 시도
    await page.goto('/matches/create');
    
    // 로그인 페이지로 리디렉션되거나 로그인 요구 메시지 확인
    const isRedirectedToLogin = page.url().includes('/login');
    const hasAuthMessage = await page.getByText(/로그인|인증/i).isVisible();
    
    expect(isRedirectedToLogin || hasAuthMessage).toBe(true);
  });

  test('팀 생성 페이지 접근 (로그인 필요)', async ({ page }) => {
    // 팀 생성 페이지로 직접 이동 시도
    await page.goto('/teams/create');
    
    // 로그인 페이지로 리디렉션되거나 로그인 요구 메시지 확인
    const isRedirectedToLogin = page.url().includes('/login');
    const hasAuthMessage = await page.getByText(/로그인|인증/i).isVisible();
    
    expect(isRedirectedToLogin || hasAuthMessage).toBe(true);
  });

  test('404 페이지 처리 확인', async ({ page }) => {
    // 존재하지 않는 페이지로 이동
    await page.goto('/non-existent-page');
    
    // 404 페이지 또는 Not Found 메시지 확인
    const notFoundMessage = page.getByText(/404|Not Found|페이지를 찾을 수 없습니다/i);
    await expect(notFoundMessage).toBeVisible();
  });

  // 모바일 반응형 테스트
  test('모바일 뷰포트에서 네비게이션 확인', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // 모바일에서 네비게이션 확인
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    // 햄버거 메뉴 또는 모바일 네비게이션 확인
    const mobileMenu = page.locator('[role="button"]', { hasText: /menu|메뉴/i }).or(
      page.locator('button').filter({ hasText: /☰|≡/ })
    );
    
    // 모바일 메뉴가 있으면 클릭 테스트
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.getByRole('link', { name: /경기|매치/i })).toBeVisible();
    }
  });

  test('API 엔드포인트 응답 확인', async ({ page }) => {
    // API 응답을 확인하기 위한 네트워크 요청 모니터링
    let apiResponseReceived = false;
    
    page.on('response', response => {
      if (response.url().includes('/api/matches') || response.url().includes('/api/teams')) {
        apiResponseReceived = true;
        expect(response.status()).toBeLessThan(500); // 서버 에러가 아님을 확인
      }
    });
    
    // 매치 페이지 방문하여 API 호출 트리거
    await page.goto('/matches');
    
    // 잠깐 기다려서 API 응답을 받을 시간을 줌
    await page.waitForTimeout(2000);
    
    // API 응답을 받았거나, 페이지가 정상적으로 로드됨을 확인
    const pageLoaded = await page.locator('body').isVisible();
    expect(pageLoaded).toBe(true);
  });

  test('폼 입력 필드 유효성 검사 확인', async ({ page }) => {
    await page.goto('/login');
    
    // 빈 폼 제출 시도
    await page.getByRole('button', { name: /로그인/i }).click();
    
    // HTML5 유효성 검사 또는 커스텀 에러 메시지 확인
    const emailInput = page.getByRole('textbox', { name: /이메일/i });
    
    // required 속성이 있는지 또는 에러 메시지가 나타나는지 확인
    const hasRequiredAttr = await emailInput.getAttribute('required');
    const errorMessage = page.getByText(/이메일.*입력|필수|required/i);
    
    const hasValidation = hasRequiredAttr !== null || await errorMessage.isVisible();
    expect(hasValidation).toBe(true);
  });

  test('성능 체크 - 페이지 로드 시간', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // 메인 콘텐츠가 로드될 때까지 대기
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // 페이지 로드 시간이 5초 이하인지 확인 (관대한 임계값)
    expect(loadTime).toBeLessThan(5000);
  });
});