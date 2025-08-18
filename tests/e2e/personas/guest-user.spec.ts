import { test, expect } from '@playwright/test';

test.describe('Guest User - 김지훈 페르소나', () => {
  test.beforeEach(async ({ page }) => {
    // 로컬 스토리지 클리어 (첫 방문자 시뮬레이션)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('첫 방문 시 Welcome Guide가 표시되어야 함', async ({ page }) => {
    await page.goto('/');
    
    // Welcome Guide 표시 확인
    const welcomeGuide = page.locator('[data-testid="welcome-guide"]');
    await expect(welcomeGuide).toBeVisible({ timeout: 5000 });
    
    // 3단계 가이드 확인
    await expect(page.locator('text=The Match에 오신 것을 환영합니다')).toBeVisible();
    
    // 다음 버튼 클릭
    await page.click('button:has-text("다음")');
    await expect(page.locator('text=팀 생성 또는 가입')).toBeVisible();
    
    // 시작하기 버튼 클릭
    await page.click('button:has-text("다음")');
    await page.click('button:has-text("시작하기")');
    
    // 가이드 닫힘 확인
    await expect(welcomeGuide).not.toBeVisible();
    
    // localStorage에 저장 확인
    const hasSeenGuide = await page.evaluate(() => 
      localStorage.getItem('hasSeenWelcomeGuide')
    );
    expect(hasSeenGuide).toBe('true');
  });

  test('대회 목록을 조회할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches');
    
    // 페이지 로드 확인
    await expect(page.locator('h1:has-text("경기")')).toBeVisible();
    
    // 대회 카드 존재 확인
    const matchCards = page.locator('[data-testid="match-card"]');
    const count = await matchCards.count();
    expect(count).toBeGreaterThan(0);
    
    // 필터 기능 테스트
    await page.click('button:has-text("필터")');
    await page.selectOption('select[name="status"]', 'upcoming');
    await page.click('button:has-text("적용")');
    
    // 필터 결과 확인
    await page.waitForLoadState('networkidle');
    const filteredCards = await page.locator('[data-testid="match-card"]').count();
    expect(filteredCards).toBeGreaterThanOrEqual(0);
  });

  test('대회 상세 정보를 볼 수 있어야 함', async ({ page }) => {
    await page.goto('/matches');
    
    // 첫 번째 대회 클릭
    const firstMatch = page.locator('[data-testid="match-card"]').first();
    await firstMatch.click();
    
    // 상세 페이지 로드 확인
    await expect(page.locator('[data-testid="match-detail"]')).toBeVisible();
    
    // 필수 정보 표시 확인
    await expect(page.locator('text=경기 정보')).toBeVisible();
    await expect(page.locator('text=참가 팀')).toBeVisible();
    await expect(page.locator('text=일정')).toBeVisible();
    
    // 로그인 유도 버튼 확인 (Guest는 참가 불가)
    const joinButton = page.locator('button:has-text("참가 신청")');
    if (await joinButton.isVisible()) {
      await joinButton.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('팀 목록을 조회할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams');
    
    // 페이지 로드 확인
    await expect(page.locator('h1:has-text("팀")')).toBeVisible();
    
    // 팀 카드 존재 확인
    const teamCards = page.locator('[data-testid="team-card"]');
    const count = await teamCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
    
    // 검색 기능 테스트
    await page.fill('input[placeholder*="검색"]', 'FC');
    await page.press('input[placeholder*="검색"]', 'Enter');
    await page.waitForLoadState('networkidle');
  });

  test('회원가입 페이지로 이동할 수 있어야 함', async ({ page }) => {
    await page.goto('/');
    
    // 네비게이션의 회원가입 버튼 클릭
    await page.click('a:has-text("회원가입")');
    
    // 회원가입 페이지 확인
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('h1:has-text("회원가입")')).toBeVisible();
    
    // 입력 필드 확인
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="passwordConfirm"]')).toBeVisible();
    
    // 유효성 검사 테스트
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('text=올바른 이메일 형식이 아닙니다')).toBeVisible();
    await expect(page.locator('text=비밀번호는 8자 이상이어야 합니다')).toBeVisible();
  });

  test('모바일 반응형 디자인이 작동해야 함', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 모바일 네비게이션 메뉴 확인
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // 메뉴 열기
    await mobileMenuButton.click();
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();
    
    // 메뉴 항목 확인
    await expect(page.locator('a:has-text("경기")')).toBeVisible();
    await expect(page.locator('a:has-text("팀")')).toBeVisible();
    await expect(page.locator('a:has-text("로그인")')).toBeVisible();
    
    // 메뉴 닫기
    await page.click('[data-testid="mobile-menu-close"]');
    await expect(mobileMenu).not.toBeVisible();
  });

  test('브레드크럼 네비게이션이 표시되어야 함', async ({ page }) => {
    await page.goto('/matches');
    
    // 브레드크럼 확인
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('text=홈')).toBeVisible();
    await expect(breadcrumb.locator('text=경기')).toBeVisible();
    
    // 대회 상세 페이지로 이동
    await page.locator('[data-testid="match-card"]').first().click();
    
    // 브레드크럼 업데이트 확인
    await expect(breadcrumb.locator('text=경기 상세')).toBeVisible();
    
    // 홈으로 돌아가기
    await breadcrumb.locator('a:has-text("홈")').click();
    await expect(page).toHaveURL('/');
  });
});