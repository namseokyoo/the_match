import { test, expect } from '@playwright/test';

test.describe('Team Member - 정다은 페르소나', () => {
  test.beforeEach(async ({ page }) => {
    // 팀 멤버로 로그인
    await page.goto('/login');
    await page.fill('input[name="email"]', 'member@test.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('팀 정보를 확인할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams/fc-lightning');
    
    // 팀 정보 표시 확인
    await expect(page.locator('h1:has-text("FC 번개")')).toBeVisible();
    await expect(page.locator('text=주말 축구 동호회')).toBeVisible();
    
    // 팀원 목록 확인
    await expect(page.locator('[data-testid="team-members"]')).toBeVisible();
    
    // 본인 정보 확인
    await expect(page.locator('text=정다은')).toBeVisible();
    
    // 관리 버튼 없음 확인 (권한 없음)
    await expect(page.locator('button:has-text("팀 관리")')).not.toBeVisible();
  });

  test('경기 일정을 확인할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams/fc-lightning/schedule');
    
    // 일정 목록 확인
    await expect(page.locator('[data-testid="schedule-list"]')).toBeVisible();
    
    // 다가오는 경기 확인
    const upcomingMatch = page.locator('[data-testid="upcoming-match"]').first();
    await expect(upcomingMatch).toBeVisible();
    
    // 경기 상세 정보 확인
    await upcomingMatch.click();
    await expect(page.locator('text=경기 시간')).toBeVisible();
    await expect(page.locator('text=경기 장소')).toBeVisible();
    
    // 일정 추가 버튼 없음 확인 (권한 없음)
    await expect(page.locator('button:has-text("일정 추가")')).not.toBeVisible();
  });

  test('체크인을 할 수 있어야 함', async ({ page }) => {
    // 참가 중인 경기 페이지로 이동
    await page.goto('/matches/winter-championship');
    
    // 체크인 버튼 확인
    await expect(page.locator('button:has-text("체크인")')).toBeVisible();
    
    // 체크인 버튼 클릭
    await page.click('button:has-text("체크인")');
    
    // QR 코드 모달 표시
    const qrModal = page.locator('[data-testid="checkin-qr-modal"]');
    await expect(qrModal).toBeVisible();
    
    // QR 코드 이미지 확인
    await expect(qrModal.locator('img[alt="체크인 QR"]')).toBeVisible();
    
    // 체크인 완료 시뮬레이션
    await page.click('button:has-text("QR 스캔 완료")'); // 테스트용 버튼
    
    // 체크인 완료 메시지
    await expect(page.locator('text=체크인이 완료되었습니다')).toBeVisible();
    
    // 체크인 상태 변경 확인
    await expect(page.locator('text=체크인 완료')).toBeVisible();
  });

  test('팀 채팅에 참여할 수 있어야 함', async ({ page }) => {
    await page.goto('/teams/fc-lightning/chat');
    
    // 채팅방 로드 확인
    await expect(page.locator('[data-testid="team-chat"]')).toBeVisible();
    
    // 기존 메시지 확인
    const messageList = page.locator('[data-testid="message-list"]');
    await expect(messageList).toBeVisible();
    
    // 메시지 입력
    const messageInput = page.locator('input[placeholder*="메시지"]');
    await messageInput.fill('안녕하세요! 이번 주 경기 잘 부탁드립니다.');
    await messageInput.press('Enter');
    
    // 메시지 전송 확인
    await expect(page.locator('text=안녕하세요! 이번 주 경기 잘 부탁드립니다.')).toBeVisible();
    
    // 실시간 메시지 수신 시뮬레이션
    await page.waitForTimeout(1000);
    
    // 이모지 반응
    const lastMessage = messageList.locator('[data-testid="chat-message"]').last();
    await lastMessage.hover();
    await lastMessage.locator('button[aria-label="이모지 추가"]').click();
    await page.click('text=👍');
    
    // 이모지 반응 확인
    await expect(lastMessage.locator('text=👍')).toBeVisible();
  });

  test('경기 결과를 확인할 수 있어야 함', async ({ page }) => {
    await page.goto('/matches/winter-championship/results');
    
    // 결과 페이지 로드
    await expect(page.locator('h2:has-text("경기 결과")')).toBeVisible();
    
    // 대진표 확인
    await page.click('tab:has-text("대진표")');
    await expect(page.locator('[data-testid="tournament-bracket"]')).toBeVisible();
    
    // 팀 경기 결과 확인
    const teamResult = page.locator('[data-testid="team-result"]:has-text("FC 번개")');
    await expect(teamResult).toBeVisible();
    
    // 점수 확인
    await expect(teamResult.locator('text=/\\d+:\\d+/')).toBeVisible();
    
    // 다음 경기 일정 확인
    if (await page.locator('text=다음 경기').isVisible()) {
      await expect(page.locator('[data-testid="next-match-info"]')).toBeVisible();
    }
  });

  test('개인 프로필을 수정할 수 있어야 함', async ({ page }) => {
    await page.goto('/profile');
    
    // 프로필 페이지 로드
    await expect(page.locator('h1:has-text("프로필")')).toBeVisible();
    
    // 현재 정보 확인
    await expect(page.locator('input[name="name"]')).toHaveValue('정다은');
    
    // 프로필 이미지 변경
    await page.click('button:has-text("이미지 변경")');
    // await page.setInputFiles('input[type="file"]', 'path/to/profile.jpg');
    
    // 연락처 수정
    await page.fill('input[name="phone"]', '010-5678-9012');
    
    // 포지션 정보 수정
    await page.selectOption('select[name="position"]', 'defender');
    
    // 저장
    await page.click('button:has-text("저장")');
    
    // 저장 완료 메시지
    await expect(page.locator('text=프로필이 업데이트되었습니다')).toBeVisible();
  });
});