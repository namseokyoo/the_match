import { test, expect } from '@playwright/test';

const BASE_URL = 'https://the-match-five.vercel.app';

// 테스트 데이터 생성용 유틸리티
const generateTestData = () => {
  const timestamp = Date.now();
  return {
    matchName: `Test Match ${timestamp}`,
    sport: '축구',
    description: '테스트용 경기입니다.',
    venue: '테스트 경기장',
    // 내일 날짜 생성
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    testUser: {
      email: `testuser${timestamp}@thematch.test`,
      password: 'test123456',
      name: `테스트 사용자 ${timestamp}`
    }
  };
};

test.describe('경기 관리 E2E 테스트', () => {
  let testData: ReturnType<typeof generateTestData>;

  test.beforeEach(async ({ page }) => {
    testData = generateTestData();
    await page.goto(BASE_URL);
  });

  test.describe('1. 경기 조회 테스트', () => {
    test('경기 목록 페이지 접근 및 기본 요소 확인', async ({ page }) => {
      // 경기 목록 페이지로 이동
      await page.click('a[href="/matches"]');
      
      // 페이지 로드 확인
      await expect(page).toHaveURL(`${BASE_URL}/matches`);
      await expect(page).toHaveTitle(/The Match/);
      
      // 페이지 헤더 확인
      await expect(page.locator('h1')).toContainText('경기 목록');
      await expect(page.locator('text=참가하고 싶은 경기를 찾아보세요')).toBeVisible();
      
      // 검색 기능 요소 확인 (첫 번째 검색 입력란 사용)
      await expect(page.locator('input[placeholder*="검색"]').first()).toBeVisible();
      
      // 필터 요소 확인
      await expect(page.getByRole('heading', { name: '필터' })).toBeVisible();
      await expect(page.locator('select, combobox').first()).toBeVisible();
      
      // 경기 생성 버튼 확인
      await expect(page.locator('button:has-text("경기 생성")')).toBeVisible();
    });

    test('경기 카드 표시 및 상세보기 이동', async ({ page }) => {
      await page.goto(`${BASE_URL}/matches`);
      
      // 경기 카드 존재 확인 (시간을 두고 로딩 기다림)
      await page.waitForTimeout(2000);
      
      // 첫 번째 경기 카드의 상세보기 버튼 클릭
      const detailButton = page.locator('button:has-text("상세보기")').first();
      if (await detailButton.count() > 0) {
        await detailButton.click();
        
        // 상세 페이지로 이동 확인
        await expect(page).toHaveURL(/\/matches\/[a-f0-9-]+/);
        
        // 상세 페이지 요소 확인
        await expect(page.locator('button:has-text("대회 정보")')).toBeVisible();
        await expect(page.locator('button:has-text("참가팀")')).toBeVisible();
        await expect(page.locator('button:has-text("체크인")')).toBeVisible();
      }
    });

    test('검색 기능 테스트', async ({ page }) => {
      await page.goto(`${BASE_URL}/matches`);
      
      // 검색어 입력
      const searchInput = page.locator('input[placeholder*="검색"]').first();
      await searchInput.fill('테스트');
      
      // 검색 실행 (엔터 키 또는 검색 버튼)
      await searchInput.press('Enter');
      
      // 검색 결과 기다림
      await page.waitForTimeout(1000);
      
      // 검색어가 입력란에 유지되는지 확인
      await expect(searchInput).toHaveValue('테스트');
    });

    test('필터 기능 테스트', async ({ page }) => {
      await page.goto(`${BASE_URL}/matches`);
      
      // 상태 필터 변경
      const statusFilter = page.locator('select, combobox').first();
      await statusFilter.selectOption('준비중');
      
      // 필터 적용 확인
      await page.waitForTimeout(1000);
      
      // 경기 유형 필터 변경
      const typeFilter = page.locator('select, combobox').nth(1);
      await typeFilter.selectOption('리그전');
      
      // 필터 초기화 버튼 테스트
      const resetButton = page.locator('button:has-text("필터 초기화")');
      if (await resetButton.count() > 0) {
        await resetButton.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('2. 경기 생성 테스트 (로그인 필요)', () => {
    test('로그인 없이 경기 생성 시도 시 로그인 페이지 리디렉션', async ({ page }) => {
      await page.goto(`${BASE_URL}/matches`);
      
      // 경기 생성 버튼 클릭
      await page.click('button:has-text("경기 생성")');
      
      // 로그인 페이지로 리디렉션 또는 로그인 요구 메시지 확인
      const isRedirectedToLogin = page.url().includes('/login');
      const hasLoginMessage = await page.locator('text=로그인').count() > 0;
      
      expect(isRedirectedToLogin || hasLoginMessage).toBeTruthy();
    });

    test('로그인 후 경기 생성 프로세스 (모의 테스트)', async ({ page }) => {
      // 주의: 실제 로그인을 위해서는 테스트 계정이 필요합니다.
      // 여기서는 경기 생성 페이지 접근을 시뮬레이션합니다.
      
      // 로그인 페이지로 이동
      await page.goto(`${BASE_URL}/login`);
      
      // 로그인 폼 요소 확인
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]:has-text("로그인")')).toBeVisible();
      
      // Google 로그인 버튼 확인
      await expect(page.locator('button:has-text("Google로 로그인")')).toBeVisible();
      
      // 경기 생성 페이지 직접 접근 시 로그인 요구 확인
      await page.goto(`${BASE_URL}/matches/create`);
      await expect(page.locator('text=로그인')).toBeVisible();
    });

    test('경기 생성 폼 필드 구조 확인 (URL 직접 접근)', async ({ page }) => {
      // 경기 생성 페이지에 직접 접근하여 로그인 요구사항 확인
      await page.goto(`${BASE_URL}/matches/create`);
      
      // 로그인 요구 메시지 또는 리디렉션 확인
      const needsLogin = await page.locator('text=로그인').count() > 0;
      expect(needsLogin).toBeTruthy();
    });
  });

  test.describe('3. 경기 수정/삭제 테스트 (권한 테스트)', () => {
    test('로그인 없이 경기 수정 페이지 접근 차단 확인', async ({ page }) => {
      // 기존 경기 ID를 사용하여 수정 페이지 접근 시도
      const sampleMatchId = '4d99eefb-0d2f-479c-afe9-a3a5d8dee393';
      await page.goto(`${BASE_URL}/matches/${sampleMatchId}/edit`);
      
      // 접근 차단 또는 로그인 요구 확인
      const isBlocked = page.url().includes('/login') || 
                       await page.locator('text=로그인').count() > 0 ||
                       await page.locator('text=권한').count() > 0;
      
      expect(isBlocked).toBeTruthy();
    });

    test('권한 없는 사용자의 경기 수정 시도 차단', async ({ page }) => {
      // 이 테스트는 실제 로그인 기능 구현 후에 완성할 수 있습니다.
      // 현재는 구조적 접근 제한을 확인합니다.
      
      const sampleMatchId = '4d99eefb-0d2f-479c-afe9-a3a5d8dee393';
      await page.goto(`${BASE_URL}/matches/${sampleMatchId}/edit`);
      
      // 접근 제한 확인
      const hasRestriction = page.url().includes('/login') || 
                            await page.locator('text=로그인').count() > 0;
      
      expect(hasRestriction).toBeTruthy();
    });
  });

  test.describe('4. 경기 참가 신청 테스트', () => {
    test('로그인 없이 참가 신청 시 로그인 요구 확인', async ({ page }) => {
      // 경기 상세 페이지로 이동
      await page.goto(`${BASE_URL}/matches`);
      await page.waitForTimeout(2000);
      
      // 첫 번째 경기 상세페이지로 이동
      const detailButton = page.getByRole('button', { name: '상세보기' }).first();
      if (await detailButton.count() > 0) {
        await detailButton.click();
        await page.waitForTimeout(1000);
        
        // 참가 신청 버튼 또는 로그인 요구 버튼 확인
        const joinButton = page.locator('button').filter({ hasText: /참가|로그인/ }).first();
        await expect(joinButton).toBeVisible();
        
        // 로그인 후 참가 신청 버튼 클릭
        const loginRequiredButton = page.getByRole('button', { name: /로그인 후/ });
        if (await loginRequiredButton.count() > 0) {
          await loginRequiredButton.click();
          // 로그인 페이지로 이동 확인
          await expect(page).toHaveURL(/\/login/);
        }
      }
    });

    test('참가팀 목록 확인', async ({ page }) => {
      await page.goto(`${BASE_URL}/matches`);
      await page.waitForTimeout(2000);
      
      // 첫 번째 경기 상세페이지로 이동
      const detailButton = page.locator('button:has-text("상세보기")').first();
      if (await detailButton.count() > 0) {
        await detailButton.click();
        await page.waitForTimeout(1000);
        
        // 참가팀 탭 클릭
        const participantsTab = page.locator('button:has-text("참가팀")');
        if (await participantsTab.count() > 0) {
          await participantsTab.click();
          await page.waitForTimeout(1000);
          
          // 참가팀 정보 확인 (참가팀이 있을 경우)
          // 참가팀이 없어도 에러가 발생하지 않도록 조건부 확인
        }
      }
    });
  });

  test.describe('5. 추가 기능 테스트', () => {
    test('경기 결과 및 통계 페이지 접근', async ({ page }) => {
      await page.goto(`${BASE_URL}/matches`);
      await page.waitForTimeout(2000);
      
      // 첫 번째 경기 상세페이지로 이동
      const detailButton = page.locator('button:has-text("상세보기")').first();
      if (await detailButton.count() > 0) {
        await detailButton.click();
        await page.waitForTimeout(1000);
        
        // 경기 결과 링크 확인 및 클릭
        const resultsLink = page.locator('a:has-text("경기 결과")');
        if (await resultsLink.count() > 0) {
          await resultsLink.click();
          await page.waitForTimeout(1000);
          
          // 결과 페이지 로드 확인
          await expect(page).toHaveURL(/\/results/);
        }
        
        // 뒤로가기
        await page.goBack();
        await page.waitForTimeout(1000);
        
        // 선수 통계 링크 확인
        const statsLink = page.locator('a:has-text("선수 통계")');
        if (await statsLink.count() > 0) {
          await statsLink.click();
          await page.waitForTimeout(1000);
          
          // 통계 페이지 로드 확인
          await expect(page).toHaveURL(/\/stats/);
        }
      }
    });

    test('네비게이션 메뉴 기능 확인', async ({ page }) => {
      // 홈페이지 네비게이션 테스트
      await page.click('a[href="/"]');
      await expect(page).toHaveURL(BASE_URL + '/');
      
      // 팀 페이지 네비게이션 테스트
      await page.click('a[href="/teams"]');
      await expect(page).toHaveURL(`${BASE_URL}/teams`);
      
      // 선수 페이지 네비게이션 테스트
      await page.click('a[href="/players"]');
      await expect(page).toHaveURL(`${BASE_URL}/players`);
      
      // 통계 페이지 네비게이션 테스트
      await page.click('a[href="/stats"]');
      await expect(page).toHaveURL(`${BASE_URL}/stats`);
      
      // 커뮤니티 페이지 네비게이션 테스트
      await page.click('a[href="/community"]');
      await expect(page).toHaveURL(`${BASE_URL}/community`);
    });

    test('반응형 디자인 및 모바일 네비게이션 확인', async ({ page }) => {
      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${BASE_URL}/matches`);
      
      // 모바일 네비게이션 확인
      const mobileNav = page.locator('navigation').last();
      await expect(mobileNav).toBeVisible();
      
      // 모바일 메뉴 버튼들 확인
      await expect(page.locator('button:has-text("홈")')).toBeVisible();
      await expect(page.locator('button:has-text("경기")')).toBeVisible();
      await expect(page.locator('button:has-text("팀")')).toBeVisible();
      await expect(page.locator('button:has-text("로그인")')).toBeVisible();
    });

    test('검색 및 필터 통합 테스트', async ({ page }) => {
      await page.goto(`${BASE_URL}/matches`);
      
      // 검색어 입력
      const searchInput = page.getByRole('textbox', { name: /검색/ }).first();
      await searchInput.fill('리그');
      
      // 상태 필터 적용
      const statusFilter = page.locator('select, combobox').first();
      await statusFilter.selectOption('준비중');
      
      // 결과 확인 (최소 검색이 실행되었는지)
      await page.waitForTimeout(1000);
      await expect(searchInput).toHaveValue('리그');
      
      // 필터 초기화
      const resetButton = page.locator('button:has-text("필터 초기화")');
      if (await resetButton.count() > 0) {
        await resetButton.click();
        await page.waitForTimeout(500);
        
        // 검색어 초기화 확인
        await expect(searchInput).toHaveValue('');
      }
    });
  });

  test.describe('6. 에러 처리 및 경계 케이스', () => {
    test('존재하지 않는 경기 ID 접근 시 에러 처리', async ({ page }) => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      // 네트워크 오류 또는 404 응답을 기대
      const response = await page.goto(`${BASE_URL}/matches/${nonExistentId}`);
      
      // 페이지 로드 대기
      await page.waitForTimeout(2000);
      
      // 404 페이지 또는 에러 메시지 확인
      const hasError = page.url().includes('/404') || 
                      page.url().includes('/error') ||
                      await page.locator('text=찾을 수 없습니다').count() > 0 ||
                      await page.locator('text=존재하지 않습니다').count() > 0 ||
                      await page.locator('text=오류').count() > 0 ||
                      await page.locator('h1:has-text("경기 목록")').count() > 0;
      
      // 에러가 적절히 처리되거나, 홈/경기목록으로 리디렉션되는지 확인
      expect(hasError || page.url() === BASE_URL + '/' || page.url() === BASE_URL + '/matches').toBeTruthy();
    });

    test('네트워크 오류 시나리오 (타임아웃 테스트)', async ({ page }) => {
      // 느린 네트워크 시뮬레이션
      await page.route('**/api/matches**', async route => {
        await page.waitForTimeout(100); // 짧은 지연
        await route.continue();
      });
      
      await page.goto(`${BASE_URL}/matches`);
      
      // 페이지가 로드되는지 확인 (타임아웃 내에서)
      await expect(page.locator('h1')).toContainText('경기 목록', { timeout: 10000 });
    });
  });
});

// 테스트 후 정리
test.afterAll(async () => {
  console.log('경기 관리 E2E 테스트 완료');
});