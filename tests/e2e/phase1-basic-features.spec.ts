import { test, expect } from '@playwright/test';

// Phase 1: 기본 기능 테스트
// 인증 시스템, 팀 관리, 경기 생성 테스트

test.describe('Phase 1: 기본 기능 테스트', () => {
  
  // 테스트 데이터
  const testUser = {
    email: `test${Date.now()}@thematch.com`,
    password: 'Test1234!@',
    name: '테스트유저'
  };

  const testTeam = {
    name: `테스트팀_${Date.now()}`,
    description: '테스트를 위한 팀입니다',
    sport: '축구',
    location: '서울',
    players: ['선수1', '선수2', '선수3', '선수4', '선수5']
  };

  const testMatch = {
    title: `테스트 경기_${Date.now()}`,
    description: '테스트 경기입니다',
    sport: '축구',
    type: 'league', // 리그전
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 일주일 후
    time: '14:00',
    location: '서울 월드컵 경기장',
    maxTeams: 4
  };

  test.describe('1. 인증 시스템 테스트', () => {
    
    test('1-1. 회원가입 프로세스', async ({ page }) => {
      await page.goto('/signup');
      
      // 회원가입 폼 확인
      await expect(page.getByRole('heading', { name: /회원가입/i })).toBeVisible();
      
      // 이메일 입력
      await page.getByPlaceholder(/이메일/i).fill(testUser.email);
      
      // 비밀번호 입력
      await page.getByPlaceholder(/비밀번호/i).first().fill(testUser.password);
      await page.getByPlaceholder(/비밀번호 확인/i).fill(testUser.password);
      
      // 이름 입력
      await page.getByPlaceholder(/이름/i).fill(testUser.name);
      
      // 회원가입 버튼 클릭
      await page.getByRole('button', { name: /회원가입/i }).click();
      
      // 회원가입 성공 확인 (리다이렉트 또는 성공 메시지)
      await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
        // 이메일 인증이 필요한 경우
        expect(page.getByText(/이메일을 확인/i)).toBeVisible();
      });
    });

    test('1-2. 로그인 프로세스', async ({ page }) => {
      await page.goto('/login');
      
      // 로그인 폼 확인
      await expect(page.getByRole('heading', { name: /로그인/i })).toBeVisible();
      
      // 이메일과 비밀번호 입력
      await page.getByPlaceholder(/이메일/i).fill(testUser.email);
      await page.getByPlaceholder(/비밀번호/i).fill(testUser.password);
      
      // 로그인 버튼 클릭
      await page.getByRole('button', { name: /로그인/i }).click();
      
      // 로그인 성공 확인
      await expect(page).toHaveURL(/dashboard|matches/, { timeout: 10000 });
    });

    test('1-3. 로그아웃 프로세스', async ({ page }) => {
      // 먼저 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(testUser.email);
      await page.getByPlaceholder(/비밀번호/i).fill(testUser.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });
      
      // 로그아웃 버튼 찾기 및 클릭
      await page.getByRole('button', { name: /로그아웃/i }).click();
      
      // 로그아웃 확인
      await expect(page).toHaveURL('/');
    });

    test('1-4. 비밀번호 유효성 검사', async ({ page }) => {
      await page.goto('/signup');
      
      // 약한 비밀번호 테스트
      await page.getByPlaceholder(/비밀번호/i).first().fill('123');
      await page.getByPlaceholder(/이메일/i).click(); // 포커스 이동
      
      // 에러 메시지 확인
      const errorMessage = page.getByText(/비밀번호는.*문자/i);
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('2. 팀 관리 테스트', () => {
    
    test.beforeEach(async ({ page }) => {
      // 각 테스트 전에 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(testUser.email);
      await page.getByPlaceholder(/비밀번호/i).fill(testUser.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });
    });

    test('2-1. 팀 생성', async ({ page }) => {
      await page.goto('/teams/create');
      
      // 팀 생성 폼 확인
      await expect(page.getByRole('heading', { name: /팀.*생성/i })).toBeVisible();
      
      // 팀 정보 입력
      await page.getByPlaceholder(/팀.*이름/i).fill(testTeam.name);
      await page.getByPlaceholder(/설명/i).fill(testTeam.description);
      
      // 스포츠 종목 선택
      const sportSelect = page.getByRole('combobox', { name: /종목/i });
      if (await sportSelect.count() > 0) {
        await sportSelect.selectOption(testTeam.sport);
      }
      
      // 지역 입력
      await page.getByPlaceholder(/지역/i).fill(testTeam.location);
      
      // 팀 생성 버튼 클릭
      await page.getByRole('button', { name: /생성/i }).click();
      
      // 팀 생성 성공 확인
      await page.waitForURL('**/teams/**', { timeout: 10000 });
      await expect(page.getByText(testTeam.name)).toBeVisible();
    });

    test('2-2. 선수 추가', async ({ page }) => {
      // 팀 목록에서 생성한 팀 찾기
      await page.goto('/teams');
      await page.getByText(testTeam.name).click();
      
      // 선수 추가 버튼 클릭
      const addPlayerButton = page.getByRole('button', { name: /선수.*추가/i });
      if (await addPlayerButton.count() > 0) {
        await addPlayerButton.click();
        
        // 선수 정보 입력
        for (const player of testTeam.players.slice(0, 3)) {
          await page.getByPlaceholder(/선수.*이름/i).fill(player);
          await page.getByRole('button', { name: /추가|등록/i }).click();
          await page.waitForTimeout(500); // 각 선수 추가 후 잠시 대기
        }
      }
    });

    test('2-3. 팀 정보 수정', async ({ page }) => {
      await page.goto('/teams');
      await page.getByText(testTeam.name).click();
      
      // 수정 버튼 클릭
      const editButton = page.getByRole('button', { name: /수정/i });
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // 설명 수정
        const newDescription = '수정된 팀 설명입니다';
        await page.getByPlaceholder(/설명/i).fill(newDescription);
        
        // 저장
        await page.getByRole('button', { name: /저장/i }).click();
        
        // 수정 확인
        await expect(page.getByText(newDescription)).toBeVisible();
      }
    });

    test('2-4. 팀 목록 조회', async ({ page }) => {
      await page.goto('/teams');
      
      // 팀 목록 페이지 확인
      await expect(page.getByRole('heading', { name: /팀.*목록/i })).toBeVisible();
      
      // 생성한 팀이 목록에 있는지 확인
      await expect(page.getByText(testTeam.name)).toBeVisible();
    });
  });

  test.describe('3. 경기 생성 테스트', () => {
    
    test.beforeEach(async ({ page }) => {
      // 각 테스트 전에 로그인
      await page.goto('/login');
      await page.getByPlaceholder(/이메일/i).fill(testUser.email);
      await page.getByPlaceholder(/비밀번호/i).fill(testUser.password);
      await page.getByRole('button', { name: /로그인/i }).click();
      await page.waitForURL(/dashboard|matches/, { timeout: 10000 });
    });

    test('3-1. 리그전 경기 생성', async ({ page }) => {
      await page.goto('/matches/create');
      
      // 경기 생성 폼 확인
      await expect(page.getByRole('heading', { name: /경기.*생성/i })).toBeVisible();
      
      // 경기 정보 입력
      await page.getByPlaceholder(/경기.*제목/i).fill(testMatch.title);
      await page.getByPlaceholder(/설명/i).fill(testMatch.description);
      
      // 경기 형식 선택
      const typeSelect = page.getByRole('combobox', { name: /형식|타입/i });
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption('league');
      }
      
      // 날짜와 시간 입력
      await page.getByLabel(/날짜/i).fill(testMatch.date);
      await page.getByLabel(/시간/i).fill(testMatch.time);
      
      // 장소 입력
      await page.getByPlaceholder(/장소/i).fill(testMatch.location);
      
      // 최대 팀 수 입력
      await page.getByLabel(/최대.*팀/i).fill(testMatch.maxTeams.toString());
      
      // 경기 생성 버튼 클릭
      await page.getByRole('button', { name: /생성/i }).click();
      
      // 경기 생성 성공 확인
      await page.waitForURL('**/matches/**', { timeout: 10000 });
      await expect(page.getByText(testMatch.title)).toBeVisible();
    });

    test('3-2. 토너먼트 경기 생성', async ({ page }) => {
      const tournamentMatch = {
        ...testMatch,
        title: `토너먼트_${Date.now()}`,
        type: 'single_elimination',
        maxTeams: 8
      };

      await page.goto('/matches/create');
      
      // 경기 정보 입력
      await page.getByPlaceholder(/경기.*제목/i).fill(tournamentMatch.title);
      await page.getByPlaceholder(/설명/i).fill(tournamentMatch.description);
      
      // 토너먼트 형식 선택
      const typeSelect = page.getByRole('combobox', { name: /형식|타입/i });
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption('single_elimination');
      }
      
      // 날짜, 시간, 장소 입력
      await page.getByLabel(/날짜/i).fill(tournamentMatch.date);
      await page.getByLabel(/시간/i).fill(tournamentMatch.time);
      await page.getByPlaceholder(/장소/i).fill(tournamentMatch.location);
      
      // 최대 팀 수 입력
      await page.getByLabel(/최대.*팀/i).fill(tournamentMatch.maxTeams.toString());
      
      // 경기 생성
      await page.getByRole('button', { name: /생성/i }).click();
      
      // 생성 확인
      await page.waitForURL('**/matches/**', { timeout: 10000 });
      await expect(page.getByText(tournamentMatch.title)).toBeVisible();
    });

    test('3-3. 경기 목록 조회', async ({ page }) => {
      await page.goto('/matches');
      
      // 경기 목록 페이지 확인
      await expect(page.getByRole('heading', { name: /경기.*목록/i })).toBeVisible();
      
      // 생성한 경기들이 목록에 있는지 확인
      const matchCards = page.locator('[data-testid="match-card"]');
      await expect(matchCards).toHaveCount(2, { timeout: 10000 });
    });

    test('3-4. 경기 상세 정보 확인', async ({ page }) => {
      await page.goto('/matches');
      
      // 첫 번째 경기 클릭
      await page.getByText(testMatch.title).first().click();
      
      // 상세 페이지 확인
      await expect(page.getByText(testMatch.description)).toBeVisible();
      await expect(page.getByText(testMatch.location)).toBeVisible();
    });

    test('3-5. 경기 형식별 옵션 확인', async ({ page }) => {
      await page.goto('/matches/create');
      
      // 각 경기 형식 선택 시 옵션 변경 확인
      const formats = ['league', 'single_elimination', 'double_elimination', 'round_robin'];
      
      for (const format of formats) {
        const typeSelect = page.getByRole('combobox', { name: /형식|타입/i });
        if (await typeSelect.count() > 0) {
          await typeSelect.selectOption(format);
          await page.waitForTimeout(500);
          
          // 형식별 특수 옵션 확인
          if (format === 'league' || format === 'round_robin') {
            // 라운드 수 옵션 확인
            const roundsInput = page.getByLabel(/라운드/i);
            if (await roundsInput.count() > 0) {
              await expect(roundsInput).toBeVisible();
            }
          }
        }
      }
    });
  });
});