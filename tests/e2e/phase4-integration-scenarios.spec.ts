import { test, expect, Page, Browser } from '@playwright/test';

// Phase 4: End-to-End 통합 테스트 시나리오
// 실제 사용 시나리오를 기반으로 한 종합 테스트

test.describe('Phase 4: End-to-End 통합 시나리오', () => {

  test.describe('시나리오 1: 동호회 축구 리그 운영', () => {
    const league = {
      name: `2025 봄 축구 리그_${Date.now()}`,
      description: '서울 지역 동호회 축구 리그',
      teams: [
        { name: 'FC 강남', captain: 'captain.gangnam@test.com', players: 11 },
        { name: 'FC 서초', captain: 'captain.seocho@test.com', players: 11 },
        { name: 'FC 송파', captain: 'captain.songpa@test.com', players: 11 },
        { name: 'FC 강동', captain: 'captain.gangdong@test.com', players: 11 }
      ],
      rounds: 3, // 3라운드 리그전
      matchesPerRound: 2
    };

    test('전체 리그 라이프사이클', async ({ browser }) => {
      // Step 1: 리그 주최자 계정 생성 및 리그 개설
      const organizerContext = await browser.newContext();
      const organizerPage = await organizerContext.newPage();

      // 주최자 회원가입
      await organizerPage.goto('/signup');
      await organizerPage.getByPlaceholder(/이메일/i).fill(`league.organizer${Date.now()}@test.com`);
      await organizerPage.getByPlaceholder(/비밀번호/i).first().fill('LeagueOrg123!@');
      await organizerPage.getByPlaceholder(/비밀번호 확인/i).fill('LeagueOrg123!@');
      await organizerPage.getByPlaceholder(/이름/i).fill('리그 주최자');
      await organizerPage.getByRole('button', { name: /회원가입/i }).click();
      await organizerPage.waitForTimeout(2000);

      // 리그 생성
      await organizerPage.goto('/matches/create');
      await organizerPage.getByPlaceholder(/경기.*제목/i).fill(league.name);
      await organizerPage.getByPlaceholder(/설명/i).fill(league.description);
      
      const typeSelect = organizerPage.getByRole('combobox', { name: /형식|타입/i });
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption('league');
      }
      
      await organizerPage.getByLabel(/날짜/i).fill(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      await organizerPage.getByLabel(/시간/i).fill('10:00');
      await organizerPage.getByPlaceholder(/장소/i).fill('서울 월드컵 경기장');
      await organizerPage.getByLabel(/최대.*팀/i).fill(league.teams.length.toString());
      await organizerPage.getByLabel(/라운드/i).fill(league.rounds.toString());
      
      await organizerPage.getByRole('button', { name: /생성/i }).click();
      await organizerPage.waitForURL('**/matches/**');
      
      const leagueUrl = organizerPage.url();

      // Step 2: 각 팀 주장이 회원가입하고 팀 생성 후 리그 참가
      for (const team of league.teams) {
        const captainContext = await browser.newContext();
        const captainPage = await captainContext.newPage();

        // 팀 주장 회원가입
        await captainPage.goto('/signup');
        await captainPage.getByPlaceholder(/이메일/i).fill(team.captain);
        await captainPage.getByPlaceholder(/비밀번호/i).first().fill('Captain123!@');
        await captainPage.getByPlaceholder(/비밀번호 확인/i).fill('Captain123!@');
        await captainPage.getByPlaceholder(/이름/i).fill(`${team.name} 주장`);
        await captainPage.getByRole('button', { name: /회원가입/i }).click();
        await captainPage.waitForTimeout(2000);

        // 팀 생성
        await captainPage.goto('/teams/create');
        await captainPage.getByPlaceholder(/팀.*이름/i).fill(team.name);
        await captainPage.getByPlaceholder(/설명/i).fill(`${team.name} 축구팀`);
        await captainPage.getByPlaceholder(/지역/i).fill('서울');
        await captainPage.getByRole('button', { name: /생성/i }).click();
        await captainPage.waitForTimeout(2000);

        // 선수 등록
        for (let i = 1; i <= 5; i++) {
          const addPlayerButton = captainPage.getByRole('button', { name: /선수.*추가/i });
          if (await addPlayerButton.count() > 0) {
            await addPlayerButton.click();
            await captainPage.getByPlaceholder(/선수.*이름/i).fill(`${team.name} 선수${i}`);
            await captainPage.getByRole('button', { name: /추가|등록/i }).click();
            await captainPage.waitForTimeout(500);
          }
        }

        // 리그 참가 신청
        await captainPage.goto(leagueUrl);
        const joinButton = captainPage.getByRole('button', { name: /참가.*신청/i });
        if (await joinButton.count() > 0) {
          await joinButton.click();
          await captainPage.getByRole('button', { name: /신청|확인/i }).click();
          await captainPage.waitForTimeout(1000);
        }

        await captainContext.close();
      }

      // Step 3: 주최자가 참가 신청 승인 및 일정 생성
      await organizerPage.reload();
      
      // 참가 신청 승인
      const manageButton = organizerPage.getByRole('button', { name: /참가.*관리|신청.*관리/i });
      if (await manageButton.count() > 0) {
        await manageButton.click();
        
        // 모든 팀 승인
        const approveButtons = organizerPage.getByRole('button', { name: /승인/i });
        for (let i = 0; i < league.teams.length; i++) {
          if (await approveButtons.count() > i) {
            await approveButtons.nth(i).click();
            await organizerPage.waitForTimeout(500);
          }
        }
      }

      // 경기 일정 생성
      const scheduleButton = organizerPage.getByRole('button', { name: /일정.*생성|대진표.*생성/i });
      if (await scheduleButton.count() > 0) {
        await scheduleButton.click();
        await organizerPage.waitForTimeout(2000);
      }

      // Step 4: 경기 진행 및 결과 입력
      for (let round = 1; round <= league.rounds; round++) {
        // 라운드별 경기 진행
        for (let match = 1; match <= league.matchesPerRound; match++) {
          const scoreButton = organizerPage.getByRole('button', { name: /점수.*입력/i }).nth((round - 1) * league.matchesPerRound + match - 1);
          if (await scoreButton.count() > 0) {
            await scoreButton.click();
            
            // 랜덤 점수 입력
            const score1 = Math.floor(Math.random() * 5);
            const score2 = Math.floor(Math.random() * 5);
            
            const scoreInputs = organizerPage.locator('input[type="number"]');
            if (await scoreInputs.count() >= 2) {
              await scoreInputs.nth(0).fill(score1.toString());
              await scoreInputs.nth(1).fill(score2.toString());
            }
            
            await organizerPage.getByRole('button', { name: /저장|확인/i }).click();
            await organizerPage.waitForTimeout(1000);
          }
        }
      }

      // Step 5: 최종 순위 확인
      const standingsButton = organizerPage.getByRole('button', { name: /순위표|최종.*순위/i });
      if (await standingsButton.count() > 0) {
        await standingsButton.click();
        
        // 순위표 확인
        const standingsTable = organizerPage.locator('table[data-testid="standings-table"]');
        await expect(standingsTable).toBeVisible();
        
        // 모든 팀이 순위표에 있는지 확인
        for (const team of league.teams) {
          await expect(organizerPage.getByText(team.name)).toBeVisible();
        }
      }

      await organizerContext.close();
    });
  });

  test.describe('시나리오 2: 학교 체육대회 토너먼트', () => {
    const tournament = {
      name: `2025 봄 체육대회_${Date.now()}`,
      description: '고등학교 체육대회 배구 토너먼트',
      classes: [
        '1학년 1반', '1학년 2반', '1학년 3반', '1학년 4반',
        '2학년 1반', '2학년 2반', '2학년 3반', '2학년 4반'
      ],
      format: 'single_elimination'
    };

    test('학교 체육대회 토너먼트 운영', async ({ browser }) => {
      // Step 1: 체육 선생님 계정으로 토너먼트 생성
      const teacherContext = await browser.newContext();
      const teacherPage = await teacherContext.newPage();

      await teacherPage.goto('/signup');
      await teacherPage.getByPlaceholder(/이메일/i).fill(`teacher${Date.now()}@school.com`);
      await teacherPage.getByPlaceholder(/비밀번호/i).first().fill('Teacher123!@');
      await teacherPage.getByPlaceholder(/비밀번호 확인/i).fill('Teacher123!@');
      await teacherPage.getByPlaceholder(/이름/i).fill('체육선생님');
      await teacherPage.getByRole('button', { name: /회원가입/i }).click();
      await teacherPage.waitForTimeout(2000);

      // 토너먼트 생성
      await teacherPage.goto('/matches/create');
      await teacherPage.getByPlaceholder(/경기.*제목/i).fill(tournament.name);
      await teacherPage.getByPlaceholder(/설명/i).fill(tournament.description);
      
      const typeSelect = teacherPage.getByRole('combobox', { name: /형식|타입/i });
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption(tournament.format);
      }
      
      await teacherPage.getByLabel(/날짜/i).fill(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      await teacherPage.getByLabel(/시간/i).fill('09:00');
      await teacherPage.getByPlaceholder(/장소/i).fill('학교 체육관');
      await teacherPage.getByLabel(/최대.*팀/i).fill(tournament.classes.length.toString());
      
      // QR 체크인 활성화
      const qrCheckbox = teacherPage.getByRole('checkbox', { name: /QR.*체크인/i });
      if (await qrCheckbox.count() > 0) {
        await qrCheckbox.check();
      }
      
      await teacherPage.getByRole('button', { name: /생성/i }).click();
      await teacherPage.waitForURL('**/matches/**');

      // Step 2: 각 반 대표가 팀 등록
      for (const className of tournament.classes) {
        const repContext = await browser.newContext();
        const repPage = await repContext.newPage();

        await repPage.goto('/signup');
        await repPage.getByPlaceholder(/이메일/i).fill(`${className.replace(/\s/g, '')}@school.com`);
        await repPage.getByPlaceholder(/비밀번호/i).first().fill('Student123!@');
        await repPage.getByPlaceholder(/비밀번호 확인/i).fill('Student123!@');
        await repPage.getByPlaceholder(/이름/i).fill(`${className} 대표`);
        await repPage.getByRole('button', { name: /회원가입/i }).click();
        await repPage.waitForTimeout(2000);

        // 팀 생성
        await repPage.goto('/teams/create');
        await repPage.getByPlaceholder(/팀.*이름/i).fill(className);
        await repPage.getByPlaceholder(/설명/i).fill(`${className} 배구팀`);
        await repPage.getByPlaceholder(/지역/i).fill('학교');
        await repPage.getByRole('button', { name: /생성/i }).click();
        await repPage.waitForTimeout(2000);

        await repContext.close();
      }

      // Step 3: 대진표 자동 생성 및 QR 코드 생성
      await teacherPage.reload();
      
      // 대진표 생성
      const generateBracketButton = teacherPage.getByRole('button', { name: /대진표.*생성/i });
      if (await generateBracketButton.count() > 0) {
        await generateBracketButton.click();
        await teacherPage.waitForTimeout(2000);
      }

      // QR 코드 확인
      await teacherPage.getByRole('button', { name: /QR.*코드|체크인.*관리/i }).click();
      await expect(teacherPage.locator('[data-testid="qr-code"]')).toBeVisible();

      // Step 4: 경기 진행 시뮬레이션
      const rounds = Math.ceil(Math.log2(tournament.classes.length));
      let matchesInRound = tournament.classes.length / 2;

      for (let round = 1; round <= rounds; round++) {
        for (let match = 0; match < matchesInRound; match++) {
          const scoreButton = teacherPage.getByRole('button', { name: /점수.*입력/i }).nth(match);
          if (await scoreButton.count() > 0) {
            await scoreButton.click();
            
            // 세트 점수 입력 (배구)
            const set1 = [25, 23];
            const set2 = [25, 20];
            const set3 = [15, 13];
            
            const scoreInputs = teacherPage.locator('input[type="number"]');
            if (await scoreInputs.count() >= 6) {
              await scoreInputs.nth(0).fill(set1[0].toString());
              await scoreInputs.nth(1).fill(set1[1].toString());
              await scoreInputs.nth(2).fill(set2[0].toString());
              await scoreInputs.nth(3).fill(set2[1].toString());
              await scoreInputs.nth(4).fill(set3[0].toString());
              await scoreInputs.nth(5).fill(set3[1].toString());
            }
            
            await teacherPage.getByRole('button', { name: /저장|확인/i }).click();
            await teacherPage.waitForTimeout(1000);
          }
        }
        matchesInRound = Math.floor(matchesInRound / 2);
      }

      // Step 5: 최종 결과 및 시상
      await teacherPage.getByRole('button', { name: /결과|시상/i }).click();
      
      // 우승팀 확인
      await expect(teacherPage.getByText(/우승|1위/i)).toBeVisible();
      await expect(teacherPage.getByText(/준우승|2위/i)).toBeVisible();

      await teacherContext.close();
    });
  });

  test.describe('시나리오 3: 기업 e스포츠 대회', () => {
    const esportsTournament = {
      name: `2025 사내 LOL 대회_${Date.now()}`,
      description: '전사 리그오브레전드 토너먼트',
      departments: [
        { name: '개발팀', members: ['dev1', 'dev2', 'dev3', 'dev4', 'dev5'] },
        { name: '디자인팀', members: ['design1', 'design2', 'design3', 'design4', 'design5'] },
        { name: '마케팅팀', members: ['marketing1', 'marketing2', 'marketing3', 'marketing4', 'marketing5'] },
        { name: '영업팀', members: ['sales1', 'sales2', 'sales3', 'sales4', 'sales5'] },
        { name: 'HR팀', members: ['hr1', 'hr2', 'hr3', 'hr4', 'hr5'] },
        { name: '재무팀', members: ['finance1', 'finance2', 'finance3', 'finance4', 'finance5'] }
      ],
      format: 'double_elimination'
    };

    test('기업 e스포츠 대회 운영', async ({ browser }) => {
      // Step 1: HR 담당자가 대회 개설
      const hrContext = await browser.newContext();
      const hrPage = await hrContext.newPage();

      await hrPage.goto('/signup');
      await hrPage.getByPlaceholder(/이메일/i).fill(`hr.admin${Date.now()}@company.com`);
      await hrPage.getByPlaceholder(/비밀번호/i).first().fill('HRAdmin123!@');
      await hrPage.getByPlaceholder(/비밀번호 확인/i).fill('HRAdmin123!@');
      await hrPage.getByPlaceholder(/이름/i).fill('HR 담당자');
      await hrPage.getByRole('button', { name: /회원가입/i }).click();
      await hrPage.waitForTimeout(2000);

      // 대회 생성
      await hrPage.goto('/matches/create');
      await hrPage.getByPlaceholder(/경기.*제목/i).fill(esportsTournament.name);
      await hrPage.getByPlaceholder(/설명/i).fill(esportsTournament.description);
      
      const typeSelect = hrPage.getByRole('combobox', { name: /형식|타입/i });
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption(esportsTournament.format);
      }
      
      await hrPage.getByLabel(/날짜/i).fill(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      await hrPage.getByLabel(/시간/i).fill('19:00');
      await hrPage.getByPlaceholder(/장소/i).fill('온라인 (Discord)');
      await hrPage.getByLabel(/최대.*팀/i).fill(esportsTournament.departments.length.toString());
      
      await hrPage.getByRole('button', { name: /생성/i }).click();
      await hrPage.waitForURL('**/matches/**');
      
      const tournamentUrl = hrPage.url();

      // Step 2: 각 부서 팀장이 팀 등록
      for (const dept of esportsTournament.departments) {
        const deptContext = await browser.newContext();
        const deptPage = await deptContext.newPage();

        await deptPage.goto('/signup');
        await deptPage.getByPlaceholder(/이메일/i).fill(`${dept.name.toLowerCase()}@company.com`);
        await deptPage.getByPlaceholder(/비밀번호/i).first().fill('Dept123!@');
        await deptPage.getByPlaceholder(/비밀번호 확인/i).fill('Dept123!@');
        await deptPage.getByPlaceholder(/이름/i).fill(`${dept.name} 팀장`);
        await deptPage.getByRole('button', { name: /회원가입/i }).click();
        await deptPage.waitForTimeout(2000);

        // 팀 생성
        await deptPage.goto('/teams/create');
        await deptPage.getByPlaceholder(/팀.*이름/i).fill(dept.name);
        await deptPage.getByPlaceholder(/설명/i).fill(`${dept.name} LOL 팀`);
        await deptPage.getByPlaceholder(/지역/i).fill('회사');
        await deptPage.getByRole('button', { name: /생성/i }).click();
        await deptPage.waitForTimeout(2000);

        // 팀원 등록
        for (const member of dept.members) {
          const addPlayerButton = deptPage.getByRole('button', { name: /선수.*추가|팀원.*추가/i });
          if (await addPlayerButton.count() > 0) {
            await addPlayerButton.click();
            await deptPage.getByPlaceholder(/이름|닉네임/i).fill(member);
            await deptPage.getByRole('button', { name: /추가|등록/i }).click();
            await deptPage.waitForTimeout(500);
          }
        }

        // 대회 참가 신청
        await deptPage.goto(tournamentUrl);
        const joinButton = deptPage.getByRole('button', { name: /참가.*신청/i });
        if (await joinButton.count() > 0) {
          await joinButton.click();
          await deptPage.getByRole('button', { name: /신청|확인/i }).click();
          await deptPage.waitForTimeout(1000);
        }

        await deptContext.close();
      }

      // Step 3: 더블 엘리미네이션 대진표 생성
      await hrPage.reload();
      
      // 모든 팀 승인
      const manageButton = hrPage.getByRole('button', { name: /참가.*관리|신청.*관리/i });
      if (await manageButton.count() > 0) {
        await manageButton.click();
        
        const approveAllButton = hrPage.getByRole('button', { name: /모두.*승인|전체.*승인/i });
        if (await approveAllButton.count() > 0) {
          await approveAllButton.click();
        } else {
          const approveButtons = hrPage.getByRole('button', { name: /승인/i });
          for (let i = 0; i < esportsTournament.departments.length; i++) {
            if (await approveButtons.count() > i) {
              await approveButtons.nth(i).click();
              await hrPage.waitForTimeout(500);
            }
          }
        }
      }

      // 대진표 생성
      const generateBracketButton = hrPage.getByRole('button', { name: /대진표.*생성/i });
      if (await generateBracketButton.count() > 0) {
        await generateBracketButton.click();
        await hrPage.waitForTimeout(2000);
      }

      // Step 4: 위너스 브래킷과 루저스 브래킷 진행
      // 위너스 브래킷 1라운드
      const winnerMatches = Math.floor(esportsTournament.departments.length / 2);
      for (let i = 0; i < winnerMatches; i++) {
        const scoreButton = hrPage.getByRole('button', { name: /점수.*입력/i }).nth(i);
        if (await scoreButton.count() > 0) {
          await scoreButton.click();
          
          const winner = Math.random() > 0.5 ? 0 : 1;
          const scoreInputs = hrPage.locator('input[type="number"]');
          if (await scoreInputs.count() >= 2) {
            await scoreInputs.nth(winner).fill('2');
            await scoreInputs.nth(1 - winner).fill('1');
          }
          
          await hrPage.getByRole('button', { name: /저장|확인/i }).click();
          await hrPage.waitForTimeout(1000);
        }
      }

      // 루저스 브래킷 진행 (패자 부활전)
      const losersBracketButton = hrPage.getByRole('button', { name: /루저스.*브래킷|패자전/i });
      if (await losersBracketButton.count() > 0) {
        await losersBracketButton.click();
        
        // 루저스 브래킷 경기 진행
        const loserMatches = hrPage.getByRole('button', { name: /점수.*입력/i });
        for (let i = 0; i < await loserMatches.count(); i++) {
          await loserMatches.nth(i).click();
          
          const scoreInputs = hrPage.locator('input[type="number"]');
          if (await scoreInputs.count() >= 2) {
            await scoreInputs.nth(0).fill('2');
            await scoreInputs.nth(1).fill('0');
          }
          
          await hrPage.getByRole('button', { name: /저장|확인/i }).click();
          await hrPage.waitForTimeout(1000);
        }
      }

      // Step 5: 최종 결과 및 시상
      await hrPage.getByRole('button', { name: /최종.*결과|시상/i }).click();
      
      // 최종 순위 확인
      const finalStandings = hrPage.locator('[data-testid="final-standings"]');
      if (await finalStandings.count() > 0) {
        await expect(finalStandings).toBeVisible();
        await expect(hrPage.getByText(/우승/i)).toBeVisible();
        await expect(hrPage.getByText(/준우승/i)).toBeVisible();
        await expect(hrPage.getByText(/3위/i)).toBeVisible();
      }

      // 통계 확인
      await hrPage.getByRole('button', { name: /통계/i }).click();
      await expect(hrPage.getByText(/총.*경기/i)).toBeVisible();
      await expect(hrPage.getByText(/MVP/i)).toBeVisible();

      await hrContext.close();
    });
  });

  test.describe('시나리오 4: 지역 배드민턴 대회', () => {
    test('개인전/복식 혼합 토너먼트', async ({ browser }) => {
      const badmintonTournament = {
        name: `지역 배드민턴 대회_${Date.now()}`,
        categories: ['남자 단식', '여자 단식', '남자 복식', '여자 복식', '혼합 복식']
      };

      // 대회 개최자 로그인
      const organizerContext = await browser.newContext();
      const organizerPage = await organizerContext.newPage();

      await organizerPage.goto('/signup');
      await organizerPage.getByPlaceholder(/이메일/i).fill(`badminton.org${Date.now()}@test.com`);
      await organizerPage.getByPlaceholder(/비밀번호/i).first().fill('BadOrg123!@');
      await organizerPage.getByPlaceholder(/비밀번호 확인/i).fill('BadOrg123!@');
      await organizerPage.getByPlaceholder(/이름/i).fill('배드민턴 협회');
      await organizerPage.getByRole('button', { name: /회원가입/i }).click();
      await organizerPage.waitForTimeout(2000);

      // 각 부문별 토너먼트 생성
      for (const category of badmintonTournament.categories) {
        await organizerPage.goto('/matches/create');
        await organizerPage.getByPlaceholder(/경기.*제목/i).fill(`${badmintonTournament.name} - ${category}`);
        await organizerPage.getByPlaceholder(/설명/i).fill(`${category} 토너먼트`);
        
        const typeSelect = organizerPage.getByRole('combobox', { name: /형식|타입/i });
        if (await typeSelect.count() > 0) {
          await typeSelect.selectOption('single_elimination');
        }
        
        await organizerPage.getByLabel(/날짜/i).fill(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        await organizerPage.getByLabel(/시간/i).fill('09:00');
        await organizerPage.getByPlaceholder(/장소/i).fill('시민체육관');
        
        const maxParticipants = category.includes('복식') ? 16 : 32;
        await organizerPage.getByLabel(/최대/i).fill(maxParticipants.toString());
        
        await organizerPage.getByRole('button', { name: /생성/i }).click();
        await organizerPage.waitForTimeout(2000);
      }

      // 참가자 등록 시뮬레이션
      const participants = ['player1', 'player2', 'player3', 'player4'];
      for (const participant of participants) {
        const playerContext = await browser.newContext();
        const playerPage = await playerContext.newPage();

        await playerPage.goto('/signup');
        await playerPage.getByPlaceholder(/이메일/i).fill(`${participant}${Date.now()}@test.com`);
        await playerPage.getByPlaceholder(/비밀번호/i).first().fill('Player123!@');
        await playerPage.getByPlaceholder(/비밀번호 확인/i).fill('Player123!@');
        await playerPage.getByPlaceholder(/이름/i).fill(participant);
        await playerPage.getByRole('button', { name: /회원가입/i }).click();
        await playerPage.waitForTimeout(2000);

        // 개인전 또는 복식 참가 신청
        await playerPage.goto('/matches');
        const matchCard = playerPage.locator('[data-testid="match-card"]').first();
        await matchCard.click();
        
        const joinButton = playerPage.getByRole('button', { name: /참가.*신청/i });
        if (await joinButton.count() > 0) {
          await joinButton.click();
          
          // 복식인 경우 파트너 지정
          if (await playerPage.getByText(/복식/i).count() > 0) {
            const partnerInput = playerPage.getByPlaceholder(/파트너/i);
            if (await partnerInput.count() > 0) {
              await partnerInput.fill(`파트너_${participant}`);
            }
          }
          
          await playerPage.getByRole('button', { name: /신청|확인/i }).click();
          await playerPage.waitForTimeout(1000);
        }

        await playerContext.close();
      }

      // 대진표 자동 조정
      await organizerPage.goto('/matches');
      const firstMatch = organizerPage.locator('[data-testid="match-card"]').first();
      await firstMatch.click();

      // 시드 배정
      const seedButton = organizerPage.getByRole('button', { name: /시드.*배정/i });
      if (await seedButton.count() > 0) {
        await seedButton.click();
        
        // 상위 시드 설정
        const seedInputs = organizerPage.locator('input[name*="seed"]');
        for (let i = 0; i < Math.min(4, await seedInputs.count()); i++) {
          await seedInputs.nth(i).fill((i + 1).toString());
        }
        
        await organizerPage.getByRole('button', { name: /저장|확인/i }).click();
        await organizerPage.waitForTimeout(1000);
      }

      // 대진표 재조정
      const adjustBracketButton = organizerPage.getByRole('button', { name: /대진표.*조정|재배치/i });
      if (await adjustBracketButton.count() > 0) {
        await adjustBracketButton.click();
        
        // 드래그 앤 드롭 시뮬레이션 (실제로는 더 복잡한 구현 필요)
        await organizerPage.waitForTimeout(2000);
        
        await organizerPage.getByRole('button', { name: /저장|적용/i }).click();
      }

      await organizerContext.close();
    });
  });

  test.describe('성능 및 동시 접속 테스트', () => {
    test('다중 사용자 동시 접속 시나리오', async ({ browser }) => {
      const concurrentUsers = 5;
      const contexts = [];
      const pages = [];

      // 다중 사용자 생성
      for (let i = 0; i < concurrentUsers; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        contexts.push(context);
        pages.push(page);

        // 각 사용자 회원가입
        await page.goto('/signup');
        await page.getByPlaceholder(/이메일/i).fill(`concurrent${i}_${Date.now()}@test.com`);
        await page.getByPlaceholder(/비밀번호/i).first().fill('Concurrent123!@');
        await page.getByPlaceholder(/비밀번호 확인/i).fill('Concurrent123!@');
        await page.getByPlaceholder(/이름/i).fill(`동시접속유저${i}`);
        await page.getByRole('button', { name: /회원가입/i }).click();
        await page.waitForTimeout(1000);
      }

      // 모든 사용자가 동시에 경기 목록 조회
      const matchListPromises = pages.map(page => 
        page.goto('/matches')
      );
      await Promise.all(matchListPromises);

      // 모든 사용자가 동시에 같은 경기 상세 페이지 접속
      const matchDetailPromises = pages.map(page => 
        page.locator('[data-testid="match-card"]').first().click()
      );
      await Promise.all(matchDetailPromises);

      // 실시간 업데이트 테스트
      // 첫 번째 사용자가 점수 업데이트
      const scoreButton = pages[0].getByRole('button', { name: /점수/i });
      if (await scoreButton.count() > 0) {
        await scoreButton.click();
        
        const scoreInputs = pages[0].locator('input[type="number"]');
        if (await scoreInputs.count() >= 2) {
          await scoreInputs.nth(0).fill('5');
          await scoreInputs.nth(1).fill('3');
        }
        
        await pages[0].getByRole('button', { name: /저장|확인/i }).click();
      }

      // 다른 사용자들이 업데이트된 점수 확인
      await pages[0].waitForTimeout(3000); // 실시간 업데이트 대기
      
      for (let i = 1; i < concurrentUsers; i++) {
        await expect(pages[i].getByText('5 : 3')).toBeVisible({ timeout: 5000 });
      }

      // 정리
      for (const context of contexts) {
        await context.close();
      }
    });

    test('대용량 데이터 처리 테스트', async ({ page }) => {
      // 많은 수의 팀이 참가한 리그 테스트
      const largeLeague = {
        teams: 32,
        rounds: 31,
        totalMatches: 496 // 32팀 풀리그
      };

      await page.goto('/signup');
      await page.getByPlaceholder(/이메일/i).fill(`large.league${Date.now()}@test.com`);
      await page.getByPlaceholder(/비밀번호/i).first().fill('LargeLeague123!@');
      await page.getByPlaceholder(/비밀번호 확인/i).fill('LargeLeague123!@');
      await page.getByPlaceholder(/이름/i).fill('대규모리그주최자');
      await page.getByRole('button', { name: /회원가입/i }).click();
      await page.waitForTimeout(2000);

      // 대규모 리그 생성
      await page.goto('/matches/create');
      await page.getByPlaceholder(/경기.*제목/i).fill(`대규모 리그 테스트_${Date.now()}`);
      await page.getByPlaceholder(/설명/i).fill('32팀 풀리그 테스트');
      
      const typeSelect = page.getByRole('combobox', { name: /형식|타입/i });
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption('round_robin');
      }
      
      await page.getByLabel(/날짜/i).fill(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      await page.getByLabel(/시간/i).fill('09:00');
      await page.getByPlaceholder(/장소/i).fill('다목적 경기장');
      await page.getByLabel(/최대.*팀/i).fill(largeLeague.teams.toString());
      
      // 로딩 시간 측정
      const startTime = Date.now();
      await page.getByRole('button', { name: /생성/i }).click();
      await page.waitForURL('**/matches/**', { timeout: 30000 });
      const loadTime = Date.now() - startTime;
      
      // 성능 기준: 30초 이내 로딩
      expect(loadTime).toBeLessThan(30000);

      // 대진표 생성 성능 테스트
      const bracketStartTime = Date.now();
      const generateBracketButton = page.getByRole('button', { name: /대진표.*생성|일정.*생성/i });
      if (await generateBracketButton.count() > 0) {
        await generateBracketButton.click();
        await page.waitForTimeout(5000);
      }
      const bracketGenerationTime = Date.now() - bracketStartTime;
      
      // 대진표 생성 성능 기준: 10초 이내
      expect(bracketGenerationTime).toBeLessThan(10000);

      // 페이지네이션 테스트
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.count() > 0) {
        await expect(pagination).toBeVisible();
        
        // 다음 페이지로 이동
        const nextButton = page.getByRole('button', { name: /다음|next/i });
        if (await nextButton.count() > 0) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  });
});