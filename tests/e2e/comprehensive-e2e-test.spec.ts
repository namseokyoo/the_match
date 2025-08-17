import { test, expect } from '@playwright/test';

test.describe('The Match 플랫폼 - 핵심 사용자 시나리오 E2E 테스트', () => {
  const BASE_URL = 'https://the-match-five.vercel.app';

  test.beforeEach(async ({ page }) => {
    // 성능 메트릭 수집을 위한 설정
    await page.addInitScript(() => {
      window.performance.mark('test-start');
    });
  });

  test('1. 홈페이지 로딩 및 기본 UI 테스트', async ({ page }) => {
    // 홈페이지 이동 및 로딩 시간 측정
    const startTime = Date.now();
    await page.goto(BASE_URL);
    const loadTime = Date.now() - startTime;

    // 페이지 제목 확인
    await expect(page).toHaveTitle('The Match - Tournament Management Platform');

    // 기본 네비게이션 요소들 확인
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('The Match')).toBeVisible();

    // Live Now 섹션 확인
    await expect(page.getByRole('heading', { name: 'Live Now' })).toBeVisible();
    await expect(page.getByText('진행중이거나 곧 시작될 경기들')).toBeVisible();

    // 참가 신청 가능한 경기 섹션 확인
    await expect(page.getByRole('heading', { name: '참가 신청 가능한 경기' })).toBeVisible();
    await expect(page.getByText('지금 바로 참가할 수 있는 경기들')).toBeVisible();

    // 팀원 모집 섹션 확인
    await expect(page.getByRole('heading', { name: '팀원 모집' })).toBeVisible();
    await expect(page.getByText('함께할 팀원을 찾고 있어요')).toBeVisible();

    // 커뮤니티 섹션 확인
    await expect(page.getByRole('heading', { name: '커뮤니티' })).toBeVisible();
    await expect(page.getByText('다른 플레이어들과 소통해보세요')).toBeVisible();

    // 스크린샷 촬영
    await page.screenshot({ path: 'test-results/homepage-test.png', fullPage: true });

    // 성능 메트릭 로그
    console.log(`홈페이지 로딩 시간: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // 5초 이내 로딩
  });

  test('2. 경기 목록 및 상세 페이지 테스트', async ({ page }) => {
    // 경기 목록 페이지로 이동
    await page.goto(`${BASE_URL}/matches`);

    // 페이지 제목 및 기본 요소 확인
    await expect(page.getByRole('heading', { name: '경기 목록' })).toBeVisible();
    await expect(page.getByText('참가하고 싶은 경기를 찾아보세요')).toBeVisible();

    // 필터 기능 확인
    await expect(page.getByRole('heading', { name: '필터' })).toBeVisible();
    
    // 경기 카드들이 표시되는지 확인 (로딩 후)
    await page.waitForTimeout(3000);
    
    // 경기 목록 확인 (최소 1개 이상의 경기가 표시되어야 함)
    const matchCards = page.locator('[data-testid="match-card"], .match-card, .cursor-pointer').filter({ hasText: /준비중|진행중|완료/ });
    await expect(matchCards.first()).toBeVisible({ timeout: 10000 });

    // 스크린샷 촬영
    await page.screenshot({ path: 'test-results/matches-list-test.png', fullPage: true });

    console.log('경기 목록 페이지 테스트 완료');
  });

  test('3. 팀 목록 및 상세 페이지 테스트', async ({ page }) => {
    // 팀 목록 페이지로 이동
    await page.goto(`${BASE_URL}/teams`);

    // 페이지 제목 및 기본 요소 확인
    await expect(page.getByRole('heading', { name: '팀 목록' })).toBeVisible();
    await expect(page.getByText('등록된 팀들을 확인하고 관리하세요')).toBeVisible();

    // 팀 생성 버튼 확인
    await expect(page.getByRole('button', { name: '팀 생성' })).toBeVisible();

    // 검색 기능 확인
    await expect(page.getByPlaceholder('팀 이름이나 설명으로 검색...')).toBeVisible();

    // 팀 목록 로딩 대기 및 확인
    await page.waitForTimeout(3000);
    
    // 팀 카드들 확인
    const teamCards = page.locator('.cursor-pointer').filter({ hasText: /선수|명/ });
    await expect(teamCards.first()).toBeVisible({ timeout: 10000 });

    // 첫 번째 팀 클릭하여 상세 페이지로 이동
    await teamCards.first().click();

    // 팀 상세 페이지 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('팀 정보')).toBeVisible();
    await expect(page.getByText('선수 목록')).toBeVisible();

    // 스크린샷 촬영
    await page.screenshot({ path: 'test-results/team-detail-test.png', fullPage: true });

    console.log('팀 목록 및 상세 페이지 테스트 완료');
  });

  test('4. 커뮤니티 페이지 및 탭 전환 테스트', async ({ page }) => {
    // 커뮤니티 페이지로 이동
    await page.goto(`${BASE_URL}/community`);

    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: '커뮤니티' })).toBeVisible();

    // 탭 메뉴 확인
    await expect(page.getByRole('button', { name: '전체' })).toBeVisible();
    await expect(page.getByRole('button', { name: '자유게시판' })).toBeVisible();
    await expect(page.getByRole('button', { name: '팀원모집' })).toBeVisible();
    await expect(page.getByRole('button', { name: '경기후기' })).toBeVisible();

    // 게시글 로딩 대기
    await page.waitForTimeout(3000);

    // 전체 탭에서 게시글 확인
    const posts = page.locator('a[href*="/community/posts/"]');
    await expect(posts.first()).toBeVisible({ timeout: 10000 });

    // 팀원모집 탭 클릭 및 확인
    await page.getByRole('button', { name: '팀원모집' }).click();
    await expect(page.getByRole('button', { name: '팀원모집' })).toHaveAttribute('aria-pressed', 'true');

    // 자유게시판 탭 클릭 및 확인
    await page.getByRole('button', { name: '자유게시판' }).click();
    await expect(page.getByRole('button', { name: '자유게시판' })).toHaveAttribute('aria-pressed', 'true');

    // 다시 전체 탭으로 돌아가기
    await page.getByRole('button', { name: '전체' }).click();

    // 스크린샷 촬영
    await page.screenshot({ path: 'test-results/community-test.png', fullPage: true });

    console.log('커뮤니티 페이지 및 탭 전환 테스트 완료');
  });

  test('5. 반응형 디자인 테스트 - 모바일', async ({ page }) => {
    // 모바일 뷰포트 설정 (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);

    // 모바일 네비게이션 확인
    await expect(page.locator('nav')).toBeVisible();
    
    // 하단 네비게이션 확인
    const bottomNav = page.locator('navigation').last();
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByText('홈')).toBeVisible();
    await expect(bottomNav.getByText('경기')).toBeVisible();
    await expect(bottomNav.getByText('커뮤니티')).toBeVisible();
    await expect(bottomNav.getByText('팀')).toBeVisible();

    // 콘텐츠가 모바일에서도 잘 표시되는지 확인
    await expect(page.getByRole('heading', { name: 'Live Now' })).toBeVisible();

    // 스크린샷 촬영
    await page.screenshot({ path: 'test-results/mobile-375px-test.png', fullPage: true });

    console.log('모바일 반응형 디자인 테스트 완료');
  });

  test('6. 반응형 디자인 테스트 - 태블릿', async ({ page }) => {
    // 태블릿 뷰포트 설정 (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);

    // 태블릿에서 네비게이션 확인
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('The Match')).toBeVisible();

    // 콘텐츠 레이아웃 확인
    await expect(page.getByRole('heading', { name: 'Live Now' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '참가 신청 가능한 경기' })).toBeVisible();

    // 스크린샷 촬영
    await page.screenshot({ path: 'test-results/tablet-768px-test.png', fullPage: true });

    console.log('태블릿 반응형 디자인 테스트 완료');
  });

  test('7. 반응형 디자인 테스트 - 데스크톱', async ({ page }) => {
    // 데스크톱 뷰포트 설정
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL);

    // 데스크톱에서 네비게이션 확인
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('The Match')).toBeVisible();

    // 데스크톱 레이아웃 특성 확인
    await expect(page.getByRole('heading', { name: 'Live Now' })).toBeVisible();
    
    // 더 넓은 레이아웃에서 콘텐츠 확인
    const sections = page.locator('section, main > div');
    await expect(sections.first()).toBeVisible();

    // 스크린샷 촬영
    await page.screenshot({ path: 'test-results/desktop-1440px-test.png', fullPage: true });

    console.log('데스크톱 반응형 디자인 테스트 완료');
  });

  test('8. 종합 성능 및 네트워크 테스트', async ({ page }) => {
    // 네트워크 요청 모니터링 시작
    const requests: any[] = [];
    page.on('request', request => requests.push(request));

    const responses: any[] = [];
    page.on('response', response => responses.push(response));

    // 홈페이지 로딩
    const startTime = Date.now();
    await page.goto(BASE_URL);
    const homeLoadTime = Date.now() - startTime;

    // 주요 페이지들 순차 방문하여 성능 측정
    const pages = [
      { url: '/matches', name: '경기 목록' },
      { url: '/teams', name: '팀 목록' },
      { url: '/community', name: '커뮤니티' }
    ];

    const performanceMetrics: any[] = [];

    for (const pageInfo of pages) {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}${pageInfo.url}`);
      const loadTime = Date.now() - startTime;
      
      performanceMetrics.push({
        page: pageInfo.name,
        loadTime,
        url: pageInfo.url
      });

      // 페이지 로딩 대기
      await page.waitForTimeout(2000);
    }

    // 성능 메트릭 출력
    console.log('=== 성능 테스트 결과 ===');
    console.log(`홈페이지 로딩 시간: ${homeLoadTime}ms`);
    
    performanceMetrics.forEach(metric => {
      console.log(`${metric.page} 로딩 시간: ${metric.loadTime}ms`);
    });

    console.log(`총 네트워크 요청 수: ${requests.length}`);
    console.log(`총 응답 수: ${responses.length}`);

    // 성능 기준 검증
    expect(homeLoadTime).toBeLessThan(10000); // 10초 이내
    performanceMetrics.forEach(metric => {
      expect(metric.loadTime).toBeLessThan(8000); // 8초 이내
    });

    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/performance-test-complete.png' });

    console.log('종합 성능 테스트 완료');
  });

  test.afterEach(async ({ page }) => {
    // 테스트 완료 후 정리
    await page.evaluate(() => {
      window.performance.mark('test-end');
      window.performance.measure('test-duration', 'test-start', 'test-end');
    });
  });
});