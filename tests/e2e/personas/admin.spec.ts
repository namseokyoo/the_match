import { test, expect } from '@playwright/test';

test.describe('Admin - 김수정 페르소나', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자로 로그인
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@thematch.com');
    await page.fill('input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('관리자 대시보드를 확인할 수 있어야 함', async ({ page }) => {
    // 대시보드 메트릭 확인
    await expect(page.locator('h1:has-text("관리자 대시보드")')).toBeVisible();
    
    // 실시간 통계 위젯
    const statsWidget = page.locator('[data-testid="stats-widget"]');
    await expect(statsWidget).toBeVisible();
    await expect(statsWidget.locator('text=활성 사용자')).toBeVisible();
    await expect(statsWidget.locator('text=진행중인 경기')).toBeVisible();
    await expect(statsWidget.locator('text=오늘 체크인')).toBeVisible();
    await expect(statsWidget.locator('text=총 팀 수')).toBeVisible();
    
    // 시스템 상태 모니터링
    const systemStatus = page.locator('[data-testid="system-status"]');
    await expect(systemStatus).toBeVisible();
    await expect(systemStatus.locator('text=API 상태')).toBeVisible();
    await expect(systemStatus.locator('text=DB 상태')).toBeVisible();
    await expect(systemStatus.locator('text=캐시 상태')).toBeVisible();
    
    // 최근 활동 로그
    const activityLog = page.locator('[data-testid="activity-log"]');
    await expect(activityLog).toBeVisible();
  });

  test('사용자를 관리할 수 있어야 함', async ({ page }) => {
    await page.goto('/admin/users');
    
    // 사용자 목록 확인
    await expect(page.locator('h1:has-text("사용자 관리")')).toBeVisible();
    const userTable = page.locator('table[data-testid="users-table"]');
    await expect(userTable).toBeVisible();
    
    // 사용자 검색
    await page.fill('input[placeholder*="검색"]', 'captain@test.com');
    await page.press('input[placeholder*="검색"]', 'Enter');
    
    // 검색 결과 확인
    await page.waitForLoadState('networkidle');
    const userRow = page.locator('tr:has-text("captain@test.com")');
    await expect(userRow).toBeVisible();
    
    // 사용자 상세 보기
    await userRow.locator('button:has-text("상세")').click();
    
    // 사용자 정보 모달
    const userModal = page.locator('[data-testid="user-detail-modal"]');
    await expect(userModal).toBeVisible();
    
    // 권한 변경
    await page.selectOption('select[name="role"]', 'team_captain');
    await page.click('button:has-text("권한 변경")');
    await expect(page.locator('text=권한이 변경되었습니다')).toBeVisible();
    
    // 계정 상태 관리
    await page.click('button:has-text("계정 정지")');
    await page.fill('textarea[name="suspendReason"]', '이용 약관 위반');
    await page.selectOption('select[name="suspendDuration"]', '7days');
    await page.click('button:has-text("정지 확인")');
    
    // 정지 확인
    await expect(page.locator('text=계정이 정지되었습니다')).toBeVisible();
  });

  test('신고된 콘텐츠를 처리할 수 있어야 함', async ({ page }) => {
    await page.goto('/admin/reports');
    
    // 신고 목록 확인
    await expect(page.locator('h1:has-text("신고 관리")')).toBeVisible();
    
    // 필터링
    await page.selectOption('select[name="reportType"]', 'inappropriate_content');
    await page.selectOption('select[name="status"]', 'pending');
    await page.click('button:has-text("필터 적용")');
    
    // 첫 번째 신고 처리
    const firstReport = page.locator('[data-testid="report-item"]').first();
    await firstReport.click();
    
    // 신고 상세 정보
    const reportDetail = page.locator('[data-testid="report-detail"]');
    await expect(reportDetail).toBeVisible();
    await expect(reportDetail.locator('text=신고 내용')).toBeVisible();
    await expect(reportDetail.locator('text=신고자')).toBeVisible();
    await expect(reportDetail.locator('text=피신고자')).toBeVisible();
    
    // 콘텐츠 확인
    await page.click('button:has-text("원본 콘텐츠 보기")');
    
    // 처리 결정
    await page.click('button:has-text("콘텐츠 삭제")');
    await page.fill('textarea[name="actionReason"]', '커뮤니티 가이드라인 위반');
    await page.check('input[name="notifyUser"]');
    await page.click('button:has-text("처리 완료")');
    
    // 처리 확인
    await expect(page.locator('text=신고가 처리되었습니다')).toBeVisible();
  });

  test('대회를 강제 수정할 수 있어야 함', async ({ page }) => {
    await page.goto('/admin/matches');
    
    // 대회 목록
    await expect(page.locator('h1:has-text("대회 관리")')).toBeVisible();
    
    // 문제가 있는 대회 찾기
    await page.fill('input[placeholder*="검색"]', '2024 겨울');
    await page.press('input[placeholder*="검색"]', 'Enter');
    
    // 대회 상세 관리
    const matchRow = page.locator('tr:has-text("2024 겨울 챔피언십")');
    await matchRow.locator('button:has-text("관리")').click();
    
    // 대회 정보 수정
    const editModal = page.locator('[data-testid="match-edit-modal"]');
    await expect(editModal).toBeVisible();
    
    // 상태 변경
    await page.selectOption('select[name="status"]', 'paused');
    await page.fill('textarea[name="adminNote"]', '규정 위반으로 인한 일시 중지');
    
    // 참가비 환불 설정
    await page.check('input[name="enableRefund"]');
    
    // 저장
    await page.click('button:has-text("변경 저장")');
    await expect(page.locator('text=대회가 수정되었습니다')).toBeVisible();
    
    // 참가자에게 알림 전송
    await page.click('button:has-text("참가자 알림")');
    await page.fill('textarea[name="notificationMessage"]', '대회가 일시 중지되었습니다. 자세한 사항은 공지를 확인해주세요.');
    await page.click('button:has-text("알림 전송")');
  });

  test('시스템 설정을 관리할 수 있어야 함', async ({ page }) => {
    await page.goto('/admin/settings');
    
    // 시스템 설정 페이지
    await expect(page.locator('h1:has-text("시스템 설정")')).toBeVisible();
    
    // Rate Limiting 설정
    await page.click('tab:has-text("보안 설정")');
    await page.fill('input[name="rateLimitRequests"]', '100');
    await page.fill('input[name="rateLimitWindow"]', '60');
    await page.check('input[name="enableCaptcha"]');
    
    // 저장
    await page.click('button:has-text("보안 설정 저장")');
    await expect(page.locator('text=설정이 저장되었습니다')).toBeVisible();
    
    // 유지보수 모드
    await page.click('tab:has-text("유지보수")');
    await page.check('input[name="maintenanceMode"]');
    await page.fill('input[name="maintenanceStart"]', '2024-02-01T03:00');
    await page.fill('input[name="maintenanceEnd"]', '2024-02-01T05:00');
    await page.fill('textarea[name="maintenanceMessage"]', '시스템 업데이트를 진행중입니다.');
    
    // 유지보수 예약
    await page.click('button:has-text("유지보수 예약")');
    await expect(page.locator('text=유지보수가 예약되었습니다')).toBeVisible();
  });

  test('데이터 분석 및 리포트를 확인할 수 있어야 함', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    // 분석 대시보드
    await expect(page.locator('h1:has-text("데이터 분석")')).toBeVisible();
    
    // 기간 설정
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-01-31');
    await page.click('button:has-text("조회")');
    
    // 차트 확인
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="match-stats-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    
    // 리포트 다운로드
    await page.click('button:has-text("리포트 생성")');
    await page.selectOption('select[name="reportType"]', 'monthly');
    await page.selectOption('select[name="reportFormat"]', 'pdf');
    
    // 다운로드 시작
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("다운로드")');
    const download = await downloadPromise;
    
    // 다운로드 확인
    expect(download.suggestedFilename()).toContain('report');
  });

  test('공지사항을 작성할 수 있어야 함', async ({ page }) => {
    await page.goto('/admin/announcements');
    
    // 공지사항 관리 페이지
    await expect(page.locator('h1:has-text("공지사항 관리")')).toBeVisible();
    
    // 새 공지사항 작성
    await page.click('button:has-text("새 공지사항")');
    
    // 공지사항 작성 폼
    const announcementForm = page.locator('[data-testid="announcement-form"]');
    await expect(announcementForm).toBeVisible();
    
    // 내용 입력
    await page.fill('input[name="title"]', '시스템 업데이트 안내');
    await page.selectOption('select[name="category"]', 'update');
    await page.selectOption('select[name="priority"]', 'high');
    
    // 에디터 내용 입력
    await page.fill('[data-testid="rich-editor"]', '2월 1일 새벽 3시부터 5시까지 시스템 업데이트가 진행됩니다.');
    
    // 대상 설정
    await page.check('input[value="all_users"]');
    
    // 게시 옵션
    await page.check('input[name="pinToTop"]');
    await page.fill('input[name="publishDate"]', '2024-01-30T09:00');
    
    // 게시
    await page.click('button:has-text("공지사항 게시")');
    
    // 게시 확인
    await expect(page.locator('text=공지사항이 게시되었습니다')).toBeVisible();
    
    // 목록에서 확인
    await expect(page.locator('text=시스템 업데이트 안내')).toBeVisible();
  });
});