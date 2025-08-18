import { test, expect } from '@playwright/test';

test.describe('Match Creator - 최준영 페르소나', () => {
  test.beforeEach(async ({ page }) => {
    // 경기 생성자로 로그인
    await page.goto('/login');
    await page.fill('input[name="email"]', 'organizer@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('싱글 엘리미네이션 토너먼트를 생성할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/create');
    
    // 기본 정보 입력
    await page.fill('input[name="name"]', '2024 겨울 챔피언십');
    await page.fill('textarea[name="description"]', '연말 최강자를 가리는 토너먼트');
    await page.selectOption('select[name="sport"]', 'soccer');
    await page.selectOption('select[name="type"]', 'single_elimination');
    
    // 상세 설정
    await page.fill('input[name="maxTeams"]', '16');
    await page.fill('input[name="startDate"]', '2024-02-01');
    await page.fill('input[name="endDate"]', '2024-02-15');
    await page.fill('input[name="location"]', '서울 월드컵경기장');
    
    // 참가비 설정
    await page.fill('input[name="entryFee"]', '50000');
    
    // 생성
    await page.click('button:has-text("대회 생성")');
    
    // 성공 확인
    await expect(page.locator('text=대회가 생성되었습니다')).toBeVisible();
    await expect(page).toHaveURL(/\/matches\/[a-z0-9-]+/);
    
    // 대진표 자동 생성 확인
    await page.click('tab:has-text("대진표")');
    await expect(page.locator('[data-testid="tournament-bracket"]')).toBeVisible();
  });

  test('더블 엘리미네이션 토너먼트를 생성할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/create');
    
    await page.fill('input[name="name"]', '더블 엘리미네이션 대회');
    await page.selectOption('select[name="type"]', 'double_elimination');
    await page.fill('input[name="maxTeams"]', '8');
    
    await page.click('button:has-text("대회 생성")');
    
    // Winners/Losers Bracket 확인
    await page.goto(/\/matches\/[a-z0-9-]+\/bracket/);
    await expect(page.locator('text=Winners Bracket')).toBeVisible();
    await expect(page.locator('text=Losers Bracket')).toBeVisible();
    await expect(page.locator('text=Grand Final')).toBeVisible();
  });

  test('리그전을 생성할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/create');
    
    await page.fill('input[name="name"]', 'K리그 미니');
    await page.selectOption('select[name="type"]', 'round_robin');
    await page.fill('input[name="maxTeams"]', '6');
    
    // 홈/원정 2회전 설정
    await page.check('input[name="doubleRound"]');
    
    await page.click('button:has-text("대회 생성")');
    
    // 리그 순위표 확인
    await page.goto(/\/matches\/[a-z0-9-]+\/standings/);
    await expect(page.locator('table[data-testid="league-standings"]')).toBeVisible();
    await expect(page.locator('th:has-text("순위")')).toBeVisible();
    await expect(page.locator('th:has-text("승점")')).toBeVisible();
  });

  test('스위스 시스템 대회를 생성할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/create');
    
    await page.fill('input[name="name"]', '스위스 시스템 대회');
    await page.selectOption('select[name="type"]', 'swiss');
    await page.fill('input[name="maxTeams"]', '12');
    await page.fill('input[name="rounds"]', '5');
    
    await page.click('button:has-text("대회 생성")');
    
    // 스위스 시스템 설정 확인
    await expect(page.locator('text=5 라운드')).toBeVisible();
    await expect(page.locator('text=스위스 시스템')).toBeVisible();
  });

  test('참가 신청을 관리할 수 있어야 함', async ({ page }) => {
    // 생성한 대회 관리 페이지로 이동
    await page.goto('/matches/winter-championship/manage');
    
    // 참가 신청 탭
    await page.click('tab:has-text("참가 신청")');
    
    // 대기 중인 신청 목록
    const applicationList = page.locator('[data-testid="application-list"]');
    await expect(applicationList).toBeVisible();
    
    // 첫 번째 팀 승인
    const firstApplication = applicationList.locator('tr').first();
    await firstApplication.locator('button:has-text("승인")').click();
    await page.click('button:has-text("확인")'); // 확인 모달
    
    // 승인 완료 메시지
    await expect(page.locator('text=참가 신청이 승인되었습니다')).toBeVisible();
    
    // 두 번째 팀 거절
    const secondApplication = applicationList.locator('tr').nth(1);
    await secondApplication.locator('button:has-text("거절")').click();
    await page.fill('textarea[name="rejectReason"]', '팀 정원 초과');
    await page.click('button:has-text("거절 확인")');
    
    // 거절 완료 메시지
    await expect(page.locator('text=참가 신청이 거절되었습니다')).toBeVisible();
  });

  test('경기 일정을 설정할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/winter-championship/manage');
    
    // 일정 관리 탭
    await page.click('tab:has-text("일정 관리")');
    
    // 자동 일정 생성
    await page.click('button:has-text("자동 일정 생성")');
    await page.fill('input[name="startTime"]', '09:00');
    await page.fill('input[name="gameDuration"]', '90');
    await page.fill('input[name="breakTime"]', '15');
    await page.click('button:has-text("생성")');
    
    // 일정 확인
    await expect(page.locator('[data-testid="schedule-table"]')).toBeVisible();
    
    // 개별 경기 시간 수정
    const firstGame = page.locator('tr[data-game-id="1"]');
    await firstGame.locator('button:has-text("수정")').click();
    await page.fill('input[name="gameTime"]', '10:00');
    await page.click('button:has-text("저장")');
    
    // 수정 확인
    await expect(firstGame.locator('text=10:00')).toBeVisible();
  });

  test('경기 점수를 입력하고 다음 라운드를 진행할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/winter-championship/bracket');
    
    // 첫 번째 경기 선택
    const firstMatch = page.locator('[data-testid="bracket-match"]').first();
    await firstMatch.click();
    
    // 점수 입력 모달
    await expect(page.locator('text=점수 입력')).toBeVisible();
    await page.fill('input[name="team1Score"]', '2');
    await page.fill('input[name="team2Score"]', '1');
    await page.click('button:has-text("저장")');
    
    // 점수 반영 확인
    await expect(firstMatch.locator('text=2:1')).toBeVisible();
    
    // 승자가 다음 라운드로 진출했는지 확인
    const nextRoundMatch = page.locator('[data-round="2"] [data-testid="bracket-match"]').first();
    await expect(nextRoundMatch).toContainText('FC 번개'); // 승자 팀명
    
    // 토스트 메시지 확인
    await expect(page.locator('text=경기 결과가 저장되었습니다')).toBeVisible();
  });

  test('대회 진행 상태를 관리할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/winter-championship/manage');
    
    // 상태 관리 탭
    await page.click('tab:has-text("상태 관리")');
    
    // 현재 상태 확인
    await expect(page.locator('text=진행중')).toBeVisible();
    
    // 일시 중지
    await page.click('button:has-text("일시 중지")');
    await page.fill('textarea[name="pauseReason"]', '날씨로 인한 일시 중단');
    await page.click('button:has-text("확인")');
    
    // 상태 변경 확인
    await expect(page.locator('text=일시 중지')).toBeVisible();
    
    // 재개
    await page.click('button:has-text("재개")');
    await expect(page.locator('text=진행중')).toBeVisible();
    
    // 대회 종료
    await page.click('button:has-text("대회 종료")');
    await page.click('button:has-text("확인")'); // 확인 모달
    
    // 종료 상태 확인
    await expect(page.locator('text=종료됨')).toBeVisible();
  });

  test('실시간 알림을 전송할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/winter-championship/manage');
    
    // 알림 관리 탭
    await page.click('tab:has-text("알림 관리")');
    
    // 전체 공지
    await page.click('button:has-text("전체 공지")');
    await page.fill('input[name="title"]', '경기 시간 변경 안내');
    await page.fill('textarea[name="message"]', '우천으로 인해 오늘 경기는 1시간 연기됩니다.');
    await page.click('button:has-text("전송")');
    
    // 전송 확인
    await expect(page.locator('text=알림이 전송되었습니다')).toBeVisible();
    
    // 특정 팀에게 알림
    await page.click('button:has-text("팀별 알림")');
    await page.selectOption('select[name="teamId"]', 'fc-lightning');
    await page.fill('textarea[name="message"]', '다음 경기는 A구장에서 진행됩니다.');
    await page.click('button:has-text("전송")');
    
    // 전송 기록 확인
    await expect(page.locator('[data-testid="notification-history"]')).toBeVisible();
  });
});