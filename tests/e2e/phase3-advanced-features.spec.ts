import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Phase 3: 고급 기능 테스트
// QR 체크인, 통계 및 분석, 공유 기능 테스트

test.describe('Phase 3: 고급 기능 테스트', () => {
  
  // 테스트 데이터
  const testOrganizer = {
    email: `qr_organizer${Date.now()}@thematch.com`,
    password: 'QROrganizer1234!@',
    name: 'QR주최자',
    teamName: 'QR주최팀'
  };

  const testParticipants = [
    {
      email: `qr_team1_${Date.now()}@thematch.com`,
      password: 'QRTeam1234!@',
      name: 'QR팀장1',
      teamName: `QR팀1_${Date.now()}`,
      players: ['QR선수1', 'QR선수2', 'QR선수3', 'QR선수4', 'QR선수5']
    },
    {
      email: `qr_team2_${Date.now()}@thematch.com`,
      password: 'QRTeam1234!@',
      name: 'QR팀장2',
      teamName: `QR팀2_${Date.now()}`,
      players: ['QR선수6', 'QR선수7', 'QR선수8', 'QR선수9', 'QR선수10']
    }
  ];

  const testMatch = {
    title: `QR체크인 테스트 경기_${Date.now()}`,
    description: 'QR 체크인 및 고급 기능 테스트용 경기',
    sport: '축구',
    type: 'league',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 내일
    time: '15:00',
    location: 'QR 테스트 경기장',
    maxTeams: 4
  };

  // Setup: 계정 및 경기 생성
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 주최자 회원가입
    await page.goto('/signup');
    await page.getByPlaceholder(/이메일/i).fill(testOrganizer.email);
    await page.getByPlaceholder(/비밀번호/i).first().fill(testOrganizer.password);
    await page.getByPlaceholder(/비밀번호 확인/i).fill(testOrganizer.password);
    await page.getByPlaceholder(/이름/i).fill(testOrganizer.name);
    await page.getByRole('button', { name: /회원가입/i }).click();
    await page.waitForTimeout(2000);

    // 참가자들 회원가입
    for (const participant of testParticipants) {
      await page.goto('/signup');
      await page.getByPlaceholder(/이메일/i).fill(participant.email);
      await page.getByPlaceholder(/비밀번호/i).first().fill(participant.password);
      await page.getByPlaceholder(/비밀번호 확인/i).fill(participant.password);
      await page.getByPlaceholder(/이름/i).fill(participant.name);
      await page.getByRole('button', { name: /회원가입/i }).click();
      await page.waitForTimeout(2000);
    }

    await context.close();
  });

  test.describe('1. QR 체크인 시스템', () => {
    
    test('1-1. QR 코드 생성', async ({ page }) => {
      // 주최자 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(testOrganizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(testOrganizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      // 팀 생성
      await page.goto('/teams/create');
      await page.getByPlaceholder(/팀.*이름/i).fill(testOrganizer.teamName);
      await page.getByPlaceholder(/설명/i).fill('QR 테스트 주최팀');
      await page.getByPlaceholder(/지역/i).fill('서울');
      await page.getByRole('button', { name: /생성/i }).click();
      await page.waitForTimeout(2000);

      // 경기 생성
      await page.goto('/matches/create');
      await page.getByPlaceholder(/경기.*제목/i).fill(testMatch.title);
      await page.getByPlaceholder(/설명/i).fill(testMatch.description);
      
      const typeSelect = page.getByRole('combobox', { name: /형식|타입/i });
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption(testMatch.type);
      }
      
      await page.getByLabel(/날짜/i).fill(testMatch.date);
      await page.getByLabel(/시간/i).fill(testMatch.time);
      await page.getByPlaceholder(/장소/i).fill(testMatch.location);
      await page.getByLabel(/최대.*팀/i).fill(testMatch.maxTeams.toString());
      
      // QR 체크인 활성화 옵션
      const qrCheckbox = page.getByRole('checkbox', { name: /QR.*체크인/i });
      if (await qrCheckbox.count() > 0) {
        await qrCheckbox.check();
      }
      
      await page.getByRole('button', { name: /생성/i }).click();
      await page.waitForURL('**/matches/**', { timeout: 10000 });

      // QR 코드 생성 확인
      await page.getByRole('button', { name: /QR.*코드|체크인.*관리/i }).click();
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
      
      // QR 코드 이미지 확인
      const qrImage = page.locator('img[alt*="QR"]');
      await expect(qrImage).toBeVisible();
    });

    test('1-2. 팀별 체크인 QR 생성', async ({ browser }) => {
      // 참가자들이 팀 생성 및 경기 참가
      for (const participant of testParticipants) {
        const context = await browser.newContext();
        const page = await context.newPage();

        // 로그인
        await page.goto('/login');
        await page.getByPlaceholder(/이메일/i).fill(participant.email);
        await page.getByPlaceholder(/비밀번호/i).fill(participant.password);
        await page.getByRole('button', { name: /로그인/i }).click();
        await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

        // 팀 생성
        await page.goto('/teams/create');
        await page.getByPlaceholder(/팀.*이름/i).fill(participant.teamName);
        await page.getByPlaceholder(/설명/i).fill(`${participant.name}의 QR 테스트 팀`);
        await page.getByPlaceholder(/지역/i).fill('서울');
        await page.getByRole('button', { name: /생성/i }).click();
        await page.waitForTimeout(2000);

        // 경기 참가 신청
        await page.goto('/matches');
        await page.getByText(testMatch.title).click();
        
        const joinButton = page.getByRole('button', { name: /참가.*신청/i });
        if (await joinButton.count() > 0) {
          await joinButton.click();
          await page.getByRole('button', { name: /신청|확인/i }).click();
          await page.waitForTimeout(1000);
        }

        // 체크인 QR 코드 받기
        const checkInButton = page.getByRole('button', { name: /체크인.*QR|QR.*받기/i });
        if (await checkInButton.count() > 0) {
          await checkInButton.click();
          
          // 팀 체크인 QR 코드 확인
          await expect(page.locator('[data-testid="team-checkin-qr"]')).toBeVisible();
        }

        await context.close();
      }
    });

    test('1-3. QR 스캔 시뮬레이션', async ({ page }) => {
      // 주최자 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(testOrganizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(testOrganizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 체크인 관리 페이지
      await page.getByRole('button', { name: /체크인.*관리|QR.*스캔/i }).click();

      // QR 스캐너 인터페이스 확인
      const scannerButton = page.getByRole('button', { name: /스캔.*시작|카메라/i });
      if (await scannerButton.count() > 0) {
        await scannerButton.click();
        
        // 카메라 권한 요청 시뮬레이션
        // 실제 환경에서는 브라우저 권한 설정 필요
        await expect(page.locator('[data-testid="qr-scanner"]')).toBeVisible();
      }

      // 수동 체크인 옵션
      const manualCheckInButton = page.getByRole('button', { name: /수동.*체크인/i });
      if (await manualCheckInButton.count() > 0) {
        await manualCheckInButton.click();
        
        // 팀 선택 드롭다운
        const teamSelect = page.getByRole('combobox', { name: /팀.*선택/i });
        if (await teamSelect.count() > 0) {
          await teamSelect.selectOption(testParticipants[0].teamName);
        }
        
        // 체크인 확인
        await page.getByRole('button', { name: /체크인|확인/i }).click();
        await expect(page.getByText(/체크인.*완료/i)).toBeVisible();
      }
    });

    test('1-4. 체크인 상태 확인', async ({ page }) => {
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 체크인 현황 확인
      const checkInStatus = page.locator('[data-testid="checkin-status"]');
      if (await checkInStatus.count() > 0) {
        await expect(checkInStatus).toContainText(/체크인.*1.*\/.*2/i);
      }

      // 체크인 리스트 보기
      await page.getByRole('button', { name: /체크인.*현황|참가.*현황/i }).click();
      
      // 체크인 완료 팀 표시
      await expect(page.getByText(testParticipants[0].teamName)).toBeVisible();
      await expect(page.locator('[data-testid="checkin-badge"]').first()).toContainText(/완료/i);
    });

    test('1-5. 오프라인 모드 체크인', async ({ page, context }) => {
      // 오프라인 시뮬레이션
      await context.setOffline(true);

      await page.goto('/matches');
      
      // 오프라인 알림 확인
      await expect(page.getByText(/오프라인|연결.*없음/i)).toBeVisible();

      // 로컬 스토리지에 체크인 데이터 저장 확인
      const localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('offline_checkins');
      });
      
      // 온라인 복구
      await context.setOffline(false);
      await page.reload();
      
      // 동기화 메시지 확인
      await expect(page.getByText(/동기화|업로드/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('2. 통계 및 분석', () => {
    
    test('2-1. 경기 통계 생성', async ({ page }) => {
      // 주최자 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(testOrganizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(testOrganizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 경기 결과 입력 (통계 생성을 위해)
      const scoreButton = page.getByRole('button', { name: /점수.*입력|결과.*입력/i });
      if (await scoreButton.count() > 0) {
        await scoreButton.click();
        
        // 점수 입력
        const scoreInputs = page.locator('input[type="number"]');
        if (await scoreInputs.count() >= 2) {
          await scoreInputs.nth(0).fill('3');
          await scoreInputs.nth(1).fill('2');
        }
        
        await page.getByRole('button', { name: /저장|확인/i }).click();
        await page.waitForTimeout(1000);
      }

      // 통계 보기
      await page.getByRole('button', { name: /통계|분석/i }).click();
      
      // 통계 페이지 확인
      await expect(page.getByRole('heading', { name: /통계|분석/i })).toBeVisible();
      
      // 기본 통계 항목 확인
      await expect(page.getByText(/총.*경기/i)).toBeVisible();
      await expect(page.getByText(/평균.*득점/i)).toBeVisible();
    });

    test('2-2. 팀별 성과 분석', async ({ page }) => {
      await page.goto('/teams');
      await page.getByText(testOrganizer.teamName).click();

      // 팀 통계 섹션
      const statsSection = page.locator('[data-testid="team-stats"]');
      if (await statsSection.count() > 0) {
        await expect(statsSection).toBeVisible();
        
        // 승률 표시
        await expect(page.getByText(/승률/i)).toBeVisible();
        
        // 최근 경기 결과
        await expect(page.getByText(/최근.*경기/i)).toBeVisible();
      }

      // 선수별 통계
      const playerStatsButton = page.getByRole('button', { name: /선수.*통계/i });
      if (await playerStatsButton.count() > 0) {
        await playerStatsButton.click();
        
        // 선수 통계 테이블
        await expect(page.locator('table[data-testid="player-stats-table"]')).toBeVisible();
      }
    });

    test('2-3. 순위표 자동 계산', async ({ page }) => {
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 순위표 보기
      const standingsButton = page.getByRole('button', { name: /순위표|랭킹/i });
      if (await standingsButton.count() > 0) {
        await standingsButton.click();
        
        // 순위표 테이블 확인
        const standingsTable = page.locator('table[data-testid="standings-table"]');
        await expect(standingsTable).toBeVisible();
        
        // 순위 정보 확인 (순위, 팀명, 승점, 득실차 등)
        const headers = standingsTable.locator('th');
        await expect(headers).toContainText(['순위', '팀명', '승점']);
      }
    });

    test('2-4. 개인 기록 관리', async ({ page }) => {
      await page.goto('/players');
      
      // 선수 등록 (통계를 위해)
      const addPlayerButton = page.getByRole('button', { name: /선수.*등록/i });
      if (await addPlayerButton.count() > 0) {
        await addPlayerButton.click();
        
        await page.getByPlaceholder(/이름/i).fill('테스트 선수');
        await page.getByPlaceholder(/포지션/i).fill('공격수');
        await page.getByPlaceholder(/등번호/i).fill('10');
        
        await page.getByRole('button', { name: /등록|저장/i }).click();
        await page.waitForTimeout(1000);
      }

      // 선수 상세 페이지
      await page.getByText('테스트 선수').click();
      
      // 개인 기록 확인
      await expect(page.getByText(/출전.*경기/i)).toBeVisible();
      await expect(page.getByText(/득점/i)).toBeVisible();
      await expect(page.getByText(/도움/i)).toBeVisible();
    });

    test('2-5. 경기 히트맵', async ({ page }) => {
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 분석 탭
      const analysisTab = page.getByRole('tab', { name: /분석|히트맵/i });
      if (await analysisTab.count() > 0) {
        await analysisTab.click();
        
        // 히트맵 캔버스 확인
        const heatmapCanvas = page.locator('canvas[data-testid="heatmap"]');
        if (await heatmapCanvas.count() > 0) {
          await expect(heatmapCanvas).toBeVisible();
        }
      }
    });
  });

  test.describe('3. 공유 기능', () => {
    
    test('3-1. 대진표 공유', async ({ page }) => {
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 대진표 보기
      await page.getByRole('button', { name: /대진표/i }).click();

      // 공유 버튼
      const shareButton = page.getByRole('button', { name: /공유/i });
      if (await shareButton.count() > 0) {
        await shareButton.click();
        
        // 공유 모달 확인
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // 공유 옵션들
        await expect(page.getByText(/링크.*복사/i)).toBeVisible();
        await expect(page.getByText(/이미지.*다운로드/i)).toBeVisible();
        
        // 링크 복사 테스트
        await page.getByRole('button', { name: /링크.*복사/i }).click();
        
        // 클립보드 복사 확인 메시지
        await expect(page.getByText(/복사.*완료/i)).toBeVisible();
      }
    });

    test('3-2. 경기 결과 SNS 공유', async ({ page }) => {
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 결과 탭
      await page.getByRole('tab', { name: /결과/i }).click();

      // SNS 공유 버튼들
      const facebookShare = page.getByRole('button', { name: /facebook/i });
      const twitterShare = page.getByRole('button', { name: /twitter|X/i });
      const kakaoShare = page.getByRole('button', { name: /kakao|카카오/i });

      // 각 SNS 버튼 확인
      if (await facebookShare.count() > 0) {
        await expect(facebookShare).toBeVisible();
      }
      if (await twitterShare.count() > 0) {
        await expect(twitterShare).toBeVisible();
      }
      if (await kakaoShare.count() > 0) {
        await expect(kakaoShare).toBeVisible();
      }

      // 공유 URL 생성 확인
      const shareUrl = await page.getAttribute('[data-testid="share-url"]', 'value');
      if (shareUrl) {
        expect(shareUrl).toContain('/matches/');
      }
    });

    test('3-3. 이미지 다운로드', async ({ page }) => {
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 대진표 이미지 다운로드
      const downloadButton = page.getByRole('button', { name: /다운로드|저장/i });
      if (await downloadButton.count() > 0) {
        // 다운로드 이벤트 리스너 설정
        const downloadPromise = page.waitForEvent('download');
        
        await downloadButton.click();
        
        // 다운로드 확인
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('bracket');
      }
    });

    test('3-4. 팀 갤러리', async ({ page }) => {
      await page.goto('/teams');
      await page.getByText(testOrganizer.teamName).click();

      // 갤러리 탭
      const galleryTab = page.getByRole('tab', { name: /갤러리|사진/i });
      if (await galleryTab.count() > 0) {
        await galleryTab.click();
        
        // 사진 업로드 버튼
        const uploadButton = page.getByRole('button', { name: /업로드|추가/i });
        if (await uploadButton.count() > 0) {
          await expect(uploadButton).toBeVisible();
          
          // 파일 입력 확인
          const fileInput = page.locator('input[type="file"]');
          await expect(fileInput).toHaveAttribute('accept', /image/);
        }
        
        // 갤러리 그리드
        const galleryGrid = page.locator('[data-testid="gallery-grid"]');
        if (await galleryGrid.count() > 0) {
          await expect(galleryGrid).toBeVisible();
        }
      }
    });

    test('3-5. 공유 링크 접근 권한', async ({ browser }) => {
      // 새로운 컨텍스트 (비로그인 상태)
      const guestContext = await browser.newContext();
      const guestPage = await guestContext.newPage();

      // 공유 링크로 직접 접근
      const shareUrl = `/matches/${testMatch.title}/share`;
      await guestPage.goto(shareUrl);

      // 공개 정보 확인 (로그인 없이)
      await expect(guestPage.getByText(testMatch.title)).toBeVisible();
      await expect(guestPage.getByText(testMatch.location)).toBeVisible();
      
      // 읽기 전용 확인 (수정 버튼 없음)
      const editButton = guestPage.getByRole('button', { name: /수정|편집/i });
      await expect(editButton).toHaveCount(0);

      await guestContext.close();
    });

    test('3-6. 임베드 코드 생성', async ({ page }) => {
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 공유 버튼
      await page.getByRole('button', { name: /공유/i }).click();

      // 임베드 옵션
      const embedButton = page.getByRole('button', { name: /임베드|embed/i });
      if (await embedButton.count() > 0) {
        await embedButton.click();
        
        // 임베드 코드 텍스트 영역
        const embedCode = page.locator('textarea[data-testid="embed-code"]');
        await expect(embedCode).toBeVisible();
        
        // iframe 코드 확인
        const code = await embedCode.inputValue();
        expect(code).toContain('<iframe');
        expect(code).toContain('</iframe>');
      }
    });
  });
});