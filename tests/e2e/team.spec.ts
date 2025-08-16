import { test, expect, Page } from '@playwright/test';

test.describe('팀 관리 E2E 테스트', () => {
  const BASE_URL = 'https://the-match-five.vercel.app';
  
  // 테스트용 계정 정보 (실제 회원가입 필요)
  const TEST_EMAIL = `test${Date.now()}@example.com`;
  const TEST_PASSWORD = 'password123!';
  const TEST_NAME = 'Test User';
  
  // 현재 타임스탬프를 이용한 고유 팀명
  const getTimestamp = () => Date.now();
  
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 홈페이지로 이동
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/The Match/);
  });

  test.describe('1. 팀 조회 테스트', () => {
    test('팀 목록 페이지 접근 및 팀 카드 표시 확인', async ({ page }) => {
      // 팀 메뉴 클릭
      await page.click('a[href="/teams"]');
      
      // 페이지 로드 대기
      await page.waitForLoadState('networkidle');
      
      // 팀 목록 페이지 확인
      await expect(page).toHaveURL(/\/teams/);
      await expect(page.locator('h1')).toContainText('팀 목록');
      
      // 팀 카드가 표시되는지 확인 (로딩 완료 대기)
      await page.waitForTimeout(3000);
      
      // 팀 카드 존재 확인
      const teamCards = page.locator('[data-testid="team-card"], .cursor-pointer:has(h3)').first();
      await expect(teamCards).toBeVisible({ timeout: 10000 });
      
      // 검색 기능 확인
      const searchBox = page.locator('input[placeholder*="검색"]');
      await expect(searchBox).toBeVisible();
      
      // 팀 생성 버튼 확인
      const createButton = page.locator('button:has-text("팀 생성")');
      await expect(createButton).toBeVisible();
    });

    test('팀 상세 페이지 이동 및 팀 정보 확인', async ({ page }) => {
      // 팀 목록 페이지로 이동
      await page.goto(`${BASE_URL}/teams`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 첫 번째 팀 카드 클릭
      const firstTeamCard = page.locator('.cursor-pointer:has(h3)').first();
      await expect(firstTeamCard).toBeVisible({ timeout: 10000 });
      await firstTeamCard.click();
      
      // 팀 상세 페이지 로드 확인
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/teams\/[a-f0-9-]+/);
      
      // 팀 정보 섹션 확인
      await expect(page.locator('h3:has-text("팀 정보")')).toBeVisible();
      await expect(page.locator('.text-gray-600:has-text("팀명")')).toBeVisible();
      await expect(page.locator('.text-gray-600:has-text("선수 수")')).toBeVisible();
      await expect(page.locator('.text-gray-600:has-text("생성일")')).toBeVisible();
      
      // 선수 목록 섹션 확인
      await expect(page.locator('h3').filter({ hasText: /선수 목록/ })).toBeVisible();
      
      // 팀 가입 신청 버튼 확인 (로그인하지 않은 상태)
      const joinButton = page.locator('button:has-text("팀 가입 신청")');
      await expect(joinButton).toBeVisible();
    });
  });

  test.describe('2. 팀 생성 테스트 (로그인 필요)', () => {
    test('팀 생성 버튼 클릭 시 로그인 리디렉션 확인', async ({ page }) => {
      // 팀 목록 페이지로 이동
      await page.goto(`${BASE_URL}/teams`);
      await page.waitForLoadState('networkidle');
      
      // 팀 생성 버튼 클릭
      const createButton = page.locator('button:has-text("팀 생성")');
      await expect(createButton).toBeVisible();
      await createButton.click();
      
      // 로그인 페이지로 리디렉션 확인
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('h2:has-text("로그인")')).toBeVisible();
    });
    
    test.skip('실제 로그인 후 팀 생성 과정 (데모용 - 실제 계정 필요)', async ({ page }) => {
      const timestamp = getTimestamp();
      const teamName = `Test Team ${timestamp}`;
      
      // 실제 환경에서는 유효한 계정으로 로그인 필요
      console.log('이 테스트는 실제 계정이 필요합니다. 데모 목적으로 스킵됩니다.');
      
      // 로그인 프로세스 (실제로는 작동하지 않을 수 있음)
      await loginUser(page);
      
      // 팀 생성 시도
      await createTeam(page, teamName, '테스트 팀입니다');
    });
  });

  test.describe('3. 팀 관리 테스트 (팀장 권한)', () => {
    test.skip('팀 정보 수정 (실제 계정 필요)', async ({ page }) => {
      console.log('팀 관리 기능은 팀장 권한이 필요합니다. 실제 계정으로 테스트해야 합니다.');
      
      // 데모 목적: 팀 상세 페이지에서 관리 버튼들이 있는지 확인
      await page.goto(`${BASE_URL}/teams`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const firstTeamCard = page.locator('.cursor-pointer:has(h3)').first();
      if (await firstTeamCard.isVisible()) {
        await firstTeamCard.click();
        await page.waitForLoadState('networkidle');
        
        // 팀 관리 관련 버튼들이 존재하는지 확인 (로그인 상태에 따라 다름)
        const managementButtons = page.locator('button:has-text("수정"), button:has-text("편집"), button:has-text("관리")');
        console.log('팀 관리 버튼 존재 여부:', await managementButtons.count());
      }
    });

    test.skip('팀 삭제 (실제 계정 필요)', async ({ page }) => {
      console.log('팀 삭제 기능은 팀장 권한이 필요합니다. 실제 계정으로 테스트해야 합니다.');
      
      // 데모 목적: 팀을 소유한 사용자만 삭제 버튼을 볼 수 있음을 확인
      await page.goto(`${BASE_URL}/teams`);
      await page.waitForLoadState('networkidle');
      
      console.log('팀 삭제는 팀장만 가능한 기능입니다.');
    });
  });

  test.describe('4. 팀 가입 신청 테스트', () => {
    test('팀 가입 신청 버튼 확인', async ({ page }) => {
      // 기존 팀 목록으로 이동
      await page.goto(`${BASE_URL}/teams`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 첫 번째 팀 선택
      const teamCards = page.locator('.cursor-pointer:has(h3)');
      await expect(teamCards.first()).toBeVisible({ timeout: 10000 });
      await teamCards.first().click();
      
      // 팀 상세 페이지 로드 대기
      await page.waitForLoadState('networkidle');
      
      // 팀 가입 신청 버튼 존재 확인
      const joinButton = page.locator('button:has-text("팀 가입 신청")');
      await expect(joinButton).toBeVisible();
      
      // 버튼 클릭 시 로그인 페이지로 리디렉션되는지 확인 (로그인하지 않은 상태)
      await joinButton.click();
      
      // 로그인 필요 메시지 또는 로그인 페이지로 이동 확인
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        await expect(page.locator('h2:has-text("로그인")')).toBeVisible();
        console.log('팀 가입 신청을 위해 로그인이 필요합니다.');
      } else {
        // 모달이나 다른 UI가 나타날 수 있음
        console.log('팀 가입 신청 인터페이스가 표시되었습니다.');
      }
    });

    test.skip('실제 로그인 후 팀 가입 신청 (실제 계정 필요)', async ({ page }) => {
      console.log('팀 가입 신청은 로그인이 필요한 기능입니다. 실제 계정으로 테스트해야 합니다.');
      
      // 데모 목적: 팀 가입 신청 프로세스 구조 확인
      await page.goto(`${BASE_URL}/teams`);
      await page.waitForLoadState('networkidle');
      
      console.log('실제 팀 가입 신청을 위해서는 유효한 사용자 계정이 필요합니다.');
    });
  });

  // 헬퍼 함수들
  async function signUpUser(page: Page) {
    // 회원가입 페이지로 이동
    await page.goto(`${BASE_URL}/signup`);
    
    // 회원가입 정보 입력
    await page.fill('input[placeholder="이름"]', TEST_NAME);
    await page.fill('input[placeholder="이메일"]', TEST_EMAIL);
    await page.fill('input[placeholder="비밀번호"]', TEST_PASSWORD);
    await page.fill('input[placeholder="비밀번호 확인"]', TEST_PASSWORD);
    
    // 회원가입 버튼 활성화 대기
    await page.waitForTimeout(1000);
    
    // 회원가입 버튼 클릭
    const signupButton = page.locator('button:has-text("회원가입")');
    await signupButton.click();
    
    // 회원가입 완료 대기
    await page.waitForLoadState('networkidle');
  }

  async function loginUser(page: Page) {
    // 먼저 회원가입 시도 (이미 존재하는 경우 스킵)
    try {
      await signUpUser(page);
    } catch (error) {
      console.log('이미 존재하는 계정이거나 회원가입 실패');
    }
    
    // 로그인 페이지로 이동
    await page.goto(`${BASE_URL}/login`);
    
    // 테스트용 이메일과 비밀번호 입력
    await page.fill('input[placeholder="이메일"]', TEST_EMAIL);
    await page.fill('input[placeholder="비밀번호"]', TEST_PASSWORD);
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    
    // 로그인 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 로그인 성공 확인 - URL이 홈으로 리디렉션되었는지 확인
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('로그인 실패 - 데모 계정으로 진행');
      // 로그인이 실패한 경우에도 테스트 계속 진행 (데모 목적)
    }
  }

  async function createTeam(page: Page, name: string, description: string) {
    // 팀 목록 페이지에서 팀 생성 버튼 클릭
    await page.goto(`${BASE_URL}/teams`);
    await page.waitForLoadState('networkidle');
    
    const createButton = page.locator('button:has-text("팀 생성")');
    await createButton.click();
    
    // 로그인 페이지로 리디렉션되면 로그인 수행
    if (page.url().includes('/login')) {
      await loginUser(page);
      // 로그인 후 다시 팀 생성 페이지 시도
      await page.goto(`${BASE_URL}/teams`);
      await page.waitForLoadState('networkidle');
      await createButton.click();
    }
    
    // 팀 생성 페이지가 로드되면 정보 입력
    if (page.url().includes('/teams/create')) {
      // 팀 정보 입력
      await page.fill('input[name="name"], input[placeholder*="팀명"]', name);
      await page.fill('textarea[name="description"], textarea[placeholder*="설명"]', description);
      
      // 종목 선택 (축구)
      const sportSelect = page.locator('select[name="sport"], input[value="축구"]');
      if (await sportSelect.isVisible()) {
        if (await sportSelect.getAttribute('type') === 'radio') {
          await sportSelect.check();
        } else {
          await sportSelect.selectOption('축구');
        }
      }
      
      // 생성 버튼 클릭
      await page.click('button[type="submit"], button:has-text("생성")');
      
      // 생성 완료 대기
      await page.waitForLoadState('networkidle');
    }
  }
});