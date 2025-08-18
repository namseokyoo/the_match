import { test, expect } from '@playwright/test';

test.describe('User - 이민수 페르소나', () => {
  test.beforeEach(async ({ page }) => {
    // 일반 사용자로 로그인
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('대시보드에서 추천 팀을 확인할 수 있어야 함', async ({ page }) => {
    // 대시보드 확인
    await expect(page.locator('h1:has-text("대시보드")')).toBeVisible();
    
    // 추천 팀 섹션
    const recommendedTeams = page.locator('[data-testid="recommended-teams"]');
    await expect(recommendedTeams).toBeVisible();
    await expect(recommendedTeams.locator('h2:has-text("추천 팀")')).toBeVisible();
    
    // 추천 팀 카드 확인
    const teamCards = recommendedTeams.locator('[data-testid="team-card"]');
    const count = await teamCards.count();
    expect(count).toBeGreaterThan(0);
    
    // 첫 번째 팀 상세 보기
    await teamCards.first().click();
    await expect(page).toHaveURL(/\/teams\/[a-z0-9-]+/);
  });

  test('팀 가입을 신청할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams');
    
    // 팀 검색
    await page.fill('input[placeholder*="검색"]', '번개');
    await page.press('input[placeholder*="검색"]', 'Enter');
    
    // 검색 결과 확인
    await page.waitForLoadState('networkidle');
    const searchResult = page.locator('[data-testid="team-card"]:has-text("FC 번개")');
    await expect(searchResult).toBeVisible();
    
    // 팀 상세 페이지로 이동
    await searchResult.click();
    
    // 가입 신청 버튼 확인
    await expect(page.locator('button:has-text("가입 신청")')).toBeVisible();
    
    // 가입 신청 클릭
    await page.click('button:has-text("가입 신청")');
    
    // 가입 신청 모달
    const modal = page.locator('[data-testid="join-team-modal"]');
    await expect(modal).toBeVisible();
    
    // 자기소개 작성
    await page.fill('textarea[name="introduction"]', '축구를 좋아하는 개발자입니다. 주말에 참여 가능합니다.');
    await page.selectOption('select[name="position"]', 'midfielder');
    
    // 신청 제출
    await page.click('button:has-text("신청하기")');
    
    // 성공 메시지
    await expect(page.locator('text=가입 신청이 완료되었습니다')).toBeVisible();
    
    // 신청 상태 확인
    await expect(page.locator('text=승인 대기중')).toBeVisible();
  });

  test('새로운 팀을 생성할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams/create');
    
    // 팀 생성 폼 확인
    await expect(page.locator('h1:has-text("팀 생성")')).toBeVisible();
    
    // 팀 정보 입력
    await page.fill('input[name="name"]', 'FC 천둥');
    await page.fill('textarea[name="description"]', '평일 저녁 축구 동호회');
    await page.selectOption('select[name="sport"]', 'soccer');
    await page.selectOption('select[name="city"]', 'seoul');
    await page.selectOption('select[name="district"]', 'gangnam');
    
    // 활동 시간 설정
    await page.check('input[value="weekday"]');
    await page.check('input[value="evening"]');
    
    // 팀 규칙 입력
    await page.fill('textarea[name="rules"]', '1. 정기 참석\n2. 회비 납부\n3. 친목 도모');
    
    // 생성 버튼 클릭
    await page.click('button:has-text("팀 생성")');
    
    // 성공 확인
    await expect(page.locator('text=팀이 생성되었습니다')).toBeVisible();
    await expect(page).toHaveURL(/\/teams\/fc-thunder/);
    
    // 팀장 권한 확인
    await expect(page.locator('button:has-text("팀 관리")')).toBeVisible();
  });

  test('대회를 생성할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/create');
    
    // 대회 생성 폼
    await expect(page.locator('h1:has-text("경기 생성")')).toBeVisible();
    
    // 기본 정보 입력
    await page.fill('input[name="name"]', '친선 경기');
    await page.fill('textarea[name="description"]', '동네 팀들과의 친선 경기');
    await page.selectOption('select[name="sport"]', 'soccer');
    await page.selectOption('select[name="type"]', 'single_elimination');
    
    // 참가 팀 수 설정
    await page.fill('input[name="maxTeams"]', '4');
    
    // 일정 설정
    await page.fill('input[name="startDate"]', '2024-02-10');
    await page.fill('input[name="endDate"]', '2024-02-10');
    await page.fill('input[name="location"]', '동네 운동장');
    
    // 생성
    await page.click('button:has-text("경기 생성")');
    
    // 성공 확인
    await expect(page.locator('text=경기가 생성되었습니다')).toBeVisible();
    await expect(page).toHaveURL(/\/matches\/[a-z0-9-]+/);
  });

  test('프로필을 완성할 수 있어야 함', async ({ page }) => {
    await page.goto('/profile');
    
    // 프로필 완성도 확인
    const completeness = page.locator('[data-testid="profile-completeness"]');
    await expect(completeness).toBeVisible();
    
    // 추가 정보 입력
    await page.fill('input[name="nickname"]', '민수');
    await page.fill('input[name="birthDate"]', '1992-05-15');
    await page.selectOption('select[name="preferredPosition"]', 'forward');
    
    // 경력 정보
    await page.fill('input[name="experience"]', '5');
    await page.selectOption('select[name="level"]', 'intermediate');
    
    // 소개글 작성
    await page.fill('textarea[name="bio"]', 'IT 개발자이며 주말에 축구를 즐깁니다.');
    
    // 저장
    await page.click('button:has-text("프로필 저장")');
    
    // 저장 완료
    await expect(page.locator('text=프로필이 저장되었습니다')).toBeVisible();
    
    // 완성도 업데이트 확인
    await expect(completeness.locator('text=100%')).toBeVisible();
  });

  test('알림 설정을 관리할 수 있어야 함', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    // 알림 설정 페이지
    await expect(page.locator('h1:has-text("알림 설정")')).toBeVisible();
    
    // 이메일 알림 설정
    await page.check('input[name="emailMatchReminder"]');
    await page.check('input[name="emailTeamAnnouncement"]');
    await page.uncheck('input[name="emailMarketing"]');
    
    // 푸시 알림 설정
    await page.check('input[name="pushMatchStart"]');
    await page.check('input[name="pushScoreUpdate"]');
    
    // 알림 시간 설정
    await page.selectOption('select[name="reminderTime"]', '1hour');
    
    // 저장
    await page.click('button:has-text("설정 저장")');
    
    // 저장 확인
    await expect(page.locator('text=알림 설정이 저장되었습니다')).toBeVisible();
  });
});