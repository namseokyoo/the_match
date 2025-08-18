import { test, expect } from '@playwright/test';

test.describe('Team Captain - 박성호 페르소나', () => {
  test.beforeEach(async ({ page }) => {
    // 팀 주장으로 로그인
    await page.goto('/login');
    await page.fill('input[name="email"]', 'captain@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('팀을 생성할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams/create');
    
    // 팀 정보 입력
    await page.fill('input[name="name"]', 'FC 번개');
    await page.fill('textarea[name="description"]', '주말 축구 동호회입니다.');
    await page.selectOption('select[name="sport"]', 'soccer');
    await page.selectOption('select[name="city"]', 'seoul');
    
    // 팀 로고 업로드 (선택사항)
    // await page.setInputFiles('input[type="file"]', 'path/to/logo.png');
    
    // 제출
    await page.click('button:has-text("팀 생성")');
    
    // 성공 확인
    await expect(page.locator('text=팀이 생성되었습니다')).toBeVisible();
    await expect(page).toHaveURL(/\/teams\/[a-z0-9-]+/);
    
    // 팀 상세 페이지 확인
    await expect(page.locator('h1:has-text("FC 번개")')).toBeVisible();
  });

  test('선수를 추가하고 관리할 수 있어야 함', async ({ page }) => {
    // 팀 관리 페이지로 이동
    await page.goto('/teams/fc-lightning/manage');
    
    // 선수 추가 탭
    await page.click('button:has-text("선수 관리")');
    
    // 새 선수 추가
    await page.click('button:has-text("선수 추가")');
    await page.fill('input[name="playerName"]', '김민수');
    await page.fill('input[name="jerseyNumber"]', '10');
    await page.selectOption('select[name="position"]', 'midfielder');
    await page.fill('input[name="email"]', 'minsu@test.com');
    await page.click('button:has-text("추가")');
    
    // 추가 확인
    await expect(page.locator('text=김민수')).toBeVisible();
    await expect(page.locator('text=10번')).toBeVisible();
    
    // 선수 정보 수정
    await page.click('button[aria-label="김민수 수정"]');
    await page.fill('input[name="jerseyNumber"]', '7');
    await page.click('button:has-text("저장")');
    
    // 수정 확인
    await expect(page.locator('text=7번')).toBeVisible();
    
    // 선수 제거
    await page.click('button[aria-label="김민수 제거"]');
    await page.click('button:has-text("확인")'); // 확인 모달
    
    // 제거 확인
    await expect(page.locator('text=김민수')).not.toBeVisible();
  });

  test('대회에 참가 신청을 할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches');
    
    // 참가 가능한 대회 찾기
    await page.click('button:has-text("필터")');
    await page.selectOption('select[name="status"]', 'upcoming');
    await page.click('button:has-text("적용")');
    
    // 첫 번째 대회 상세 페이지로 이동
    await page.locator('[data-testid="match-card"]').first().click();
    
    // 참가 신청 버튼 클릭
    await page.click('button:has-text("참가 신청")');
    
    // 참가 신청 모달
    await expect(page.locator('text=참가 신청')).toBeVisible();
    
    // 팀 선택
    await page.selectOption('select[name="teamId"]', 'fc-lightning');
    
    // 참가 메시지 작성
    await page.fill('textarea[name="message"]', '열심히 하겠습니다!');
    
    // 신청 제출
    await page.click('button:has-text("신청하기")');
    
    // 성공 메시지
    await expect(page.locator('text=참가 신청이 완료되었습니다')).toBeVisible();
    
    // 신청 상태 확인
    await expect(page.locator('text=승인 대기중')).toBeVisible();
  });

  test('팀 멤버에게 권한을 부여할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams/fc-lightning/manage');
    
    // 멤버 관리 탭
    await page.click('button:has-text("멤버 관리")');
    
    // 멤버 목록 확인
    const memberList = page.locator('[data-testid="member-list"]');
    await expect(memberList).toBeVisible();
    
    // 멤버 역할 변경
    const memberRow = page.locator('tr:has-text("정다은")');
    await memberRow.locator('button:has-text("역할 변경")').click();
    
    // 부주장으로 변경
    await page.selectOption('select[name="role"]', 'vice-captain');
    await page.click('button:has-text("변경")');
    
    // 변경 확인
    await expect(memberRow.locator('text=부주장')).toBeVisible();
  });

  test('팀 일정을 관리할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams/fc-lightning/schedule');
    
    // 일정 추가 버튼
    await page.click('button:has-text("일정 추가")');
    
    // 일정 정보 입력
    await page.fill('input[name="title"]', '정기 훈련');
    await page.fill('input[name="date"]', '2024-01-20');
    await page.fill('input[name="time"]', '18:00');
    await page.fill('input[name="location"]', '서울 잠실 운동장');
    await page.fill('textarea[name="description"]', '기본기 훈련 및 전술 연습');
    
    // 저장
    await page.click('button:has-text("저장")');
    
    // 일정 확인
    await expect(page.locator('text=정기 훈련')).toBeVisible();
    await expect(page.locator('text=2024-01-20')).toBeVisible();
  });

  test('팀 통계를 확인할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams/fc-lightning/stats');
    
    // 통계 카드 확인
    await expect(page.locator('[data-testid="team-stats-card"]')).toBeVisible();
    
    // 주요 통계 항목 확인
    await expect(page.locator('text=전체 경기')).toBeVisible();
    await expect(page.locator('text=승률')).toBeVisible();
    await expect(page.locator('text=득실차')).toBeVisible();
    
    // 최근 경기 결과 확인
    const recentResults = page.locator('[data-testid="recent-results"]');
    await expect(recentResults).toBeVisible();
    
    // 선수별 통계 확인
    await page.click('tab:has-text("선수별 통계")');
    await expect(page.locator('table[data-testid="player-stats-table"]')).toBeVisible();
  });
});