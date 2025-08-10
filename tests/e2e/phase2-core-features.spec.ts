import { test, expect } from '@playwright/test';

// Phase 2: 핵심 기능 테스트
// 경기 참가 시스템, 대진표 관리, 실시간 점수 입력 테스트

test.describe('Phase 2: 핵심 기능 테스트', () => {
  
  // 테스트 데이터
  const organizer = {
    email: `organizer${Date.now()}@thematch.com`,
    password: 'Organizer1234!@',
    name: '주최자',
    teamName: '주최팀'
  };

  const participants = [
    {
      email: `team1_${Date.now()}@thematch.com`,
      password: 'Team1234!@',
      name: '팀장1',
      teamName: `참가팀1_${Date.now()}`,
      players: ['선수A', '선수B', '선수C', '선수D', '선수E']
    },
    {
      email: `team2_${Date.now()}@thematch.com`,
      password: 'Team1234!@',
      name: '팀장2',
      teamName: `참가팀2_${Date.now()}`,
      players: ['선수F', '선수G', '선수H', '선수I', '선수J']
    },
    {
      email: `team3_${Date.now()}@thematch.com`,
      password: 'Team1234!@',
      name: '팀장3',
      teamName: `참가팀3_${Date.now()}`,
      players: ['선수K', '선수L', '선수M', '선수N', '선수O']
    },
    {
      email: `team4_${Date.now()}@thematch.com`,
      password: 'Team1234!@',
      name: '팀장4',
      teamName: `참가팀4_${Date.now()}`,
      players: ['선수P', '선수Q', '선수R', '선수S', '선수T']
    }
  ];

  const testMatch = {
    title: `테스트 토너먼트_${Date.now()}`,
    description: '대진표 테스트를 위한 토너먼트',
    sport: '축구',
    type: 'single_elimination',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3일 후
    time: '10:00',
    location: '테스트 경기장',
    maxTeams: 4
  };

  // Setup: 주최자와 참가자 계정 생성
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 주최자 회원가입
    await page.goto('/signup');
    await page.getByPlaceholder(/이메일/i).fill(organizer.email);
    await page.getByPlaceholder(/비밀번호/i).first().fill(organizer.password);
    await page.getByPlaceholder(/비밀번호 확인/i).fill(organizer.password);
    await page.getByPlaceholder(/이름/i).fill(organizer.name);
    await page.getByRole('button', { name: /회원가입/i }).click();
    await page.waitForTimeout(2000);

    // 참가자들 회원가입
    for (const participant of participants) {
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

  test.describe('1. 경기 참가 시스템', () => {
    
    test('1-1. 경기 생성 및 참가 신청 오픈', async ({ page }) => {
      // 주최자로 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(organizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      // 팀 생성
      await page.goto('/teams/create');
      await page.getByPlaceholder(/팀.*이름/i).fill(organizer.teamName);
      await page.getByPlaceholder(/설명/i).fill('주최자 팀');
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
      
      await page.getByRole('button', { name: /생성/i }).click();
      await page.waitForURL('**/matches/**', { timeout: 10000 });
      
      // 경기 생성 확인
      await expect(page.getByText(testMatch.title)).toBeVisible();
      await expect(page.getByText(/참가 신청.*가능/i)).toBeVisible();
    });

    test('1-2. 팀 생성 및 경기 참가 신청', async ({ browser }) => {
      // 각 참가자가 팀을 생성하고 경기에 참가 신청
      for (const participant of participants) {
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
        await page.getByPlaceholder(/설명/i).fill(`${participant.name}의 팀`);
        await page.getByPlaceholder(/지역/i).fill('서울');
        await page.getByRole('button', { name: /생성/i }).click();
        await page.waitForTimeout(2000);

        // 경기 찾기
        await page.goto('/matches');
        await page.getByText(testMatch.title).click();

        // 참가 신청
        const joinButton = page.getByRole('button', { name: /참가.*신청/i });
        if (await joinButton.count() > 0) {
          await joinButton.click();
          
          // 팀 선택 (드롭다운이 있는 경우)
          const teamSelect = page.getByRole('combobox', { name: /팀.*선택/i });
          if (await teamSelect.count() > 0) {
            await teamSelect.selectOption(participant.teamName);
          }
          
          // 신청 확인
          await page.getByRole('button', { name: /신청|확인/i }).click();
          await expect(page.getByText(/신청.*완료|대기/i)).toBeVisible({ timeout: 5000 });
        }

        await context.close();
      }
    });

    test('1-3. 참가 신청 승인/거절', async ({ page }) => {
      // 주최자로 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(organizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      // 경기 관리 페이지로 이동
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 참가 신청 관리 섹션 찾기
      const manageButton = page.getByRole('button', { name: /참가.*관리|신청.*관리/i });
      if (await manageButton.count() > 0) {
        await manageButton.click();
      }

      // 첫 3팀 승인
      for (let i = 0; i < 3; i++) {
        const approveButtons = page.getByRole('button', { name: /승인/i });
        if (await approveButtons.count() > i) {
          await approveButtons.nth(i).click();
          await page.waitForTimeout(1000);
        }
      }

      // 마지막 팀 거절
      const rejectButton = page.getByRole('button', { name: /거절/i });
      if (await rejectButton.count() > 0) {
        await rejectButton.first().click();
        await page.waitForTimeout(1000);
      }

      // 승인 상태 확인
      await expect(page.getByText(/승인.*3/i)).toBeVisible();
    });

    test('1-4. 참가 상태 확인', async ({ browser }) => {
      // 승인된 팀 확인
      const approvedContext = await browser.newContext();
      const approvedPage = await approvedContext.newPage();

      await approvedPage.goto('/login');
      await approvedPage.getByPlaceholder(/이메일/i).fill(participants[0].email);
      await approvedPage.getByPlaceholder(/비밀번호/i).fill(participants[0].password);
      await approvedPage.getByRole('button', { name: /로그인/i }).click();
      await approvedPage.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await approvedPage.goto('/matches');
      await approvedPage.getByText(testMatch.title).click();
      await expect(approvedPage.getByText(/승인.*완료|참가.*확정/i)).toBeVisible();

      await approvedContext.close();

      // 거절된 팀 확인
      const rejectedContext = await browser.newContext();
      const rejectedPage = await rejectedContext.newPage();

      await rejectedPage.goto('/login');
      await rejectedPage.getByPlaceholder(/이메일/i).fill(participants[3].email);
      await rejectedPage.getByPlaceholder(/비밀번호/i).fill(participants[3].password);
      await rejectedPage.getByRole('button', { name: /로그인/i }).click();
      await rejectedPage.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await rejectedPage.goto('/matches');
      await rejectedPage.getByText(testMatch.title).click();
      await expect(rejectedPage.getByText(/거절|참가.*불가/i)).toBeVisible();

      await rejectedContext.close();
    });
  });

  test.describe('2. 대진표 관리', () => {
    
    test('2-1. 대진표 자동 생성', async ({ page }) => {
      // 주최자로 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(organizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      // 경기 페이지로 이동
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 대진표 생성 버튼 클릭
      const generateBracketButton = page.getByRole('button', { name: /대진표.*생성/i });
      if (await generateBracketButton.count() > 0) {
        await generateBracketButton.click();
        await page.waitForTimeout(2000);

        // 대진표 생성 확인
        await expect(page.getByText(/대진표/i)).toBeVisible();
        await expect(page.locator('[data-testid="bracket-container"]')).toBeVisible();
      }
    });

    test('2-2. 대진표 조회', async ({ page }) => {
      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 대진표 보기 버튼 클릭
      const viewBracketButton = page.getByRole('button', { name: /대진표.*보기/i });
      if (await viewBracketButton.count() > 0) {
        await viewBracketButton.click();
      } else {
        // 또는 대진표 탭/링크 클릭
        await page.getByRole('link', { name: /대진표/i }).click();
      }

      // 대진표 표시 확인
      await expect(page.locator('[data-testid="bracket-container"]')).toBeVisible();
      
      // 참가 팀들이 대진표에 표시되는지 확인
      for (let i = 0; i < 3; i++) {
        await expect(page.getByText(participants[i].teamName)).toBeVisible();
      }
    });

    test('2-3. 시드 배정', async ({ page }) => {
      // 주최자로 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(organizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 대진표 수정 버튼
      const editBracketButton = page.getByRole('button', { name: /대진표.*수정|시드.*배정/i });
      if (await editBracketButton.count() > 0) {
        await editBracketButton.click();

        // 시드 배정 (드래그 앤 드롭 또는 선택)
        const seedInputs = page.locator('input[name*="seed"]');
        if (await seedInputs.count() > 0) {
          await seedInputs.nth(0).fill('1');
          await seedInputs.nth(1).fill('2');
          await seedInputs.nth(2).fill('3');
          await seedInputs.nth(3).fill('4');
        }

        // 저장
        await page.getByRole('button', { name: /저장|확인/i }).click();
        await page.waitForTimeout(1000);
      }
    });

    test('2-4. 대진표 재생성', async ({ page }) => {
      // 주최자로 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(organizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 대진표 재생성 버튼
      const regenerateButton = page.getByRole('button', { name: /재생성|다시.*생성/i });
      if (await regenerateButton.count() > 0) {
        await regenerateButton.click();

        // 확인 다이얼로그
        const confirmButton = page.getByRole('button', { name: /확인|예/i });
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        await page.waitForTimeout(2000);
        await expect(page.getByText(/대진표.*생성.*완료/i)).toBeVisible();
      }
    });
  });

  test.describe('3. 실시간 점수 입력', () => {
    
    test('3-1. 경기 시작 및 상태 변경', async ({ page }) => {
      // 주최자로 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(organizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 경기 시작 버튼
      const startButton = page.getByRole('button', { name: /경기.*시작|시작/i });
      if (await startButton.count() > 0) {
        await startButton.click();
        await page.waitForTimeout(1000);
        
        // 상태 변경 확인
        await expect(page.getByText(/진행.*중|경기.*중/i)).toBeVisible();
      }
    });

    test('3-2. 점수 입력 인터페이스', async ({ page }) => {
      // 주최자로 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(organizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 점수 입력 버튼
      const scoreButton = page.getByRole('button', { name: /점수.*입력|스코어/i }).first();
      if (await scoreButton.count() > 0) {
        await scoreButton.click();

        // 점수 입력 폼 확인
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // 팀 이름 표시 확인
        const teamNames = page.locator('[data-testid="team-name"]');
        await expect(teamNames).toHaveCount(2);
      }
    });

    test('3-3. 점수 입력 및 저장', async ({ page }) => {
      // 주최자로 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(organizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 첫 번째 경기 점수 입력
      const scoreButton = page.getByRole('button', { name: /점수.*입력|스코어/i }).first();
      if (await scoreButton.count() > 0) {
        await scoreButton.click();

        // 점수 입력
        const scoreInputs = page.locator('input[type="number"]');
        if (await scoreInputs.count() >= 2) {
          await scoreInputs.nth(0).fill('2');
          await scoreInputs.nth(1).fill('1');
        }

        // 저장
        await page.getByRole('button', { name: /저장|확인/i }).click();
        await page.waitForTimeout(1000);

        // 점수 표시 확인
        await expect(page.getByText('2 : 1')).toBeVisible();
      }
    });

    test('3-4. 실시간 점수 업데이트', async ({ browser }) => {
      // 두 개의 브라우저 컨텍스트 생성 (주최자와 참가자)
      const organizerContext = await browser.newContext();
      const organizerPage = await organizerContext.newPage();

      const participantContext = await browser.newContext();
      const participantPage = await participantContext.newPage();

      // 주최자 로그인
      await organizerPage.goto('/login');
      await organizerPage.getByPlaceholder(/이메일/i).fill(organizer.email);
      await organizerPage.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await organizerPage.getByRole('button', { name: /로그인/i }).click();
      await organizerPage.waitForURL(/dashboard|matches/, { timeout: 10000 });

      // 참가자 로그인
      await participantPage.goto('/login');
      await participantPage.getByPlaceholder(/이메일/i).fill(participants[0].email);
      await participantPage.getByPlaceholder(/비밀번호/i).fill(participants[0].password);
      await participantPage.getByRole('button', { name: /로그인/i }).click();
      await participantPage.waitForURL(/dashboard|matches/, { timeout: 10000 });

      // 둘 다 같은 경기 페이지로 이동
      await organizerPage.goto('/matches');
      await organizerPage.getByText(testMatch.title).click();

      await participantPage.goto('/matches');
      await participantPage.getByText(testMatch.title).click();

      // 주최자가 점수 업데이트
      const scoreButton = organizerPage.getByRole('button', { name: /점수.*입력|스코어/i }).first();
      if (await scoreButton.count() > 0) {
        await scoreButton.click();

        const scoreInputs = organizerPage.locator('input[type="number"]');
        if (await scoreInputs.count() >= 2) {
          await scoreInputs.nth(0).fill('3');
          await scoreInputs.nth(1).fill('2');
        }

        await organizerPage.getByRole('button', { name: /저장|확인/i }).click();
        await organizerPage.waitForTimeout(1000);
      }

      // 참가자 페이지에서 실시간 업데이트 확인
      await participantPage.waitForTimeout(2000); // 실시간 업데이트 대기
      await expect(participantPage.getByText('3 : 2')).toBeVisible({ timeout: 5000 });

      await organizerContext.close();
      await participantContext.close();
    });

    test('3-5. 경기 종료 및 결과 확정', async ({ page }) => {
      // 주최자로 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(organizer.email);
      await page.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await page.goto('/matches');
      await page.getByText(testMatch.title).click();

      // 모든 경기 점수 입력 완료 후 종료
      const endButton = page.getByRole('button', { name: /경기.*종료|종료/i });
      if (await endButton.count() > 0) {
        await endButton.click();

        // 확인 다이얼로그
        const confirmButton = page.getByRole('button', { name: /확인|예/i });
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);
        
        // 종료 상태 확인
        await expect(page.getByText(/종료|완료/i)).toBeVisible();
      }
    });

    test('3-6. 모바일 점수 입력', async ({ browser }) => {
      // 모바일 뷰포트로 테스트
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      const mobilePage = await mobileContext.newPage();

      // 주최자로 로그인
      await mobilePage.goto('/login');
      await mobilePage.getByPlaceholder(/이메일/i).fill(organizer.email);
      await mobilePage.getByPlaceholder(/비밀번호/i).fill(organizer.password);
      await mobilePage.getByRole('button', { name: /로그인/i }).click();
      await mobilePage.waitForURL(/dashboard|matches/, { timeout: 10000 });

      await mobilePage.goto('/matches');
      await mobilePage.getByText(testMatch.title).click();

      // 모바일에서 점수 입력 UI 확인
      const mobileScoreButton = mobilePage.getByRole('button', { name: /점수/i }).first();
      if (await mobileScoreButton.count() > 0) {
        await mobileScoreButton.click();

        // 모바일 최적화된 입력 UI 확인
        await expect(mobilePage.locator('[data-testid="mobile-score-input"]')).toBeVisible();
        
        // 터치 친화적인 버튼 확인
        const plusButtons = mobilePage.getByRole('button', { name: '+' });
        const minusButtons = mobilePage.getByRole('button', { name: '-' });
        
        await expect(plusButtons).toHaveCount(2);
        await expect(minusButtons).toHaveCount(2);
      }

      await mobileContext.close();
    });
  });
});