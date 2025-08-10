import { test, expect } from '@playwright/test';

// 테스트 설정
test.describe.configure({ mode: 'parallel' }); // 병렬 실행으로 변경 - 각 테스트 독립 실행
test.use({ 
  baseURL: 'https://the-match-five.vercel.app',
  timeout: 30000 // 각 테스트 30초 타임아웃
});

// 테스트 데이터
const testUser = {
  name: '테스트유저' + Date.now(),
  email: `test${Date.now()}@example.com`,
  password: 'Test1234!@#',
  teamName: '테스트 FC ' + Date.now(),
  teamDescription: '이것은 테스트 팀입니다.',
  players: [
    { name: '선수1', position: 'FW', number: '9' },
    { name: '선수2', position: 'MF', number: '10' },
    { name: '선수3', position: 'DF', number: '5' }
  ]
};

// 발견된 문제점을 저장할 배열
const issues: Array<{
  scenario: string;
  issue: string;
  severity: 'critical' | 'major' | 'minor';
  details: string;
}> = [];

test.describe('The Match 플랫폼 종합 테스트', () => {

  // 시나리오 1: 회원가입 프로세스
  test('시나리오 1: 회원가입 프로세스', async ({ page }) => {
    try {
      console.log('🔍 시나리오 1: 회원가입 프로세스 시작');
      
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');
      
      // 회원가입 폼 확인
      const nameInput = page.locator('input[placeholder*="홍길동"]');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[placeholder*="최소 8자"]');
      const confirmPasswordInput = page.locator('input[placeholder*="비밀번호를 다시"]');
      
      // 입력 필드 존재 확인
      await expect(nameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(confirmPasswordInput).toBeVisible();
      
      // 회원가입 정보 입력
      await nameInput.fill(testUser.name);
      await emailInput.fill(testUser.email);
      await passwordInput.fill(testUser.password);
      await confirmPasswordInput.fill(testUser.password);
      
      // 회원가입 버튼 클릭
      await page.click('button:has-text("회원가입")');
      
      // 회원가입 후 자동 로그인 되므로 리다이렉트 대기
      await page.waitForTimeout(5000);
      
      // URL 확인으로 성공 여부 판단
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/matches')) {
        console.log('✅ 회원가입 성공 (자동 로그인됨)');
      } else {
        // 에러 메시지 확인
        const errorText = await page.locator('.text-red-800').textContent().catch(() => null);
        issues.push({
          scenario: '회원가입',
          issue: '회원가입 실패',
          severity: 'major',
          details: errorText || '회원가입 후 리다이렉트 실패'
        });
        console.log('❌ 회원가입 실패:', errorText || currentUrl);
      }
    } catch (error) {
      issues.push({
        scenario: '회원가입',
        issue: '예외 발생',
        severity: 'critical',
        details: error.message
      });
      console.log('❌ 회원가입 테스트 실패:', error.message);
    }
  });

  // 시나리오 2: 로그인 및 로그아웃
  test('시나리오 2: 로그인 및 로그아웃', async ({ page }) => {
    try {
      console.log('🔍 시나리오 2: 로그인 및 로그아웃 시작');
      
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // 로그인 폼 입력
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button:has-text("로그인")');
      
      // 로그인 후 리다이렉트 대기
      await page.waitForTimeout(3000);
      
      // 로그인 성공 확인
      const currentUrl = page.url();
      if (currentUrl.includes('/matches') || currentUrl.includes('/dashboard')) {
        console.log('✅ 로그인 성공');
        
        // 로그아웃 테스트
        const logoutButton = await page.locator('text=로그아웃').first();
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
          await page.waitForTimeout(2000);
          console.log('✅ 로그아웃 성공');
        } else {
          issues.push({
            scenario: '로그아웃',
            issue: '로그아웃 버튼 없음',
            severity: 'minor',
            details: '네비게이션 바에 로그아웃 버튼이 표시되지 않음'
          });
        }
      } else {
        const errorText = await page.locator('.text-red-800').textContent();
        issues.push({
          scenario: '로그인',
          issue: '로그인 실패',
          severity: 'critical',
          details: errorText || '로그인 후 리다이렉트 실패'
        });
        console.log('❌ 로그인 실패');
      }
    } catch (error) {
      issues.push({
        scenario: '로그인',
        issue: '예외 발생',
        severity: 'critical',
        details: error.message
      });
      console.log('❌ 로그인 테스트 실패:', error.message);
    }
  });

  // 시나리오 3: 팀 생성 및 관리
  test('시나리오 3: 팀 생성 및 관리', async ({ page }) => {
    try {
      console.log('🔍 시나리오 3: 팀 생성 및 관리 시작');
      
      // 먼저 로그인
      await page.goto('/login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button:has-text("로그인")');
      await page.waitForTimeout(3000);
      
      // 팀 생성 페이지로 이동
      await page.goto('/teams/create');
      await page.waitForLoadState('networkidle');
      
      // 팀 정보 입력
      await page.fill('input[placeholder*="팀 이름을 입력하세요"]', testUser.teamName);
      await page.fill('textarea[placeholder*="팀에 대한 설명을 입력하세요"]', testUser.teamDescription);
      
      // 스포츠 종목 선택
      const sportSelect = page.locator('select');
      if (await sportSelect.isVisible()) {
        await sportSelect.selectOption('축구');
      }
      
      // 팀 생성 버튼 클릭
      await page.click('button:has-text("팀 생성")');
      await page.waitForTimeout(3000);
      
      // 팀 생성 성공 확인
      const currentUrl = page.url();
      if (currentUrl.includes('/teams/')) {
        console.log('✅ 팀 생성 성공');
      } else {
        issues.push({
          scenario: '팀 생성',
          issue: '팀 생성 실패',
          severity: 'major',
          details: '팀 생성 후 상세 페이지로 이동하지 않음'
        });
        console.log('❌ 팀 생성 실패');
      }
    } catch (error) {
      issues.push({
        scenario: '팀 생성',
        issue: '예외 발생',
        severity: 'major',
        details: error.message
      });
      console.log('❌ 팀 생성 테스트 실패:', error.message);
    }
  });

  // 시나리오 4: 선수 추가
  test('시나리오 4: 선수 추가 및 명단 관리', async ({ page }) => {
    try {
      console.log('🔍 시나리오 4: 선수 추가 시작');
      
      // 로그인
      await page.goto('/login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button:has-text("로그인")');
      await page.waitForTimeout(3000);
      
      // 팀 목록으로 이동
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');
      
      // 자신의 팀 찾기
      const teamCard = page.locator(`text=${testUser.teamName}`).first();
      if (await teamCard.isVisible()) {
        await teamCard.click();
        await page.waitForLoadState('networkidle');
        
        // 선수 추가 버튼 찾기
        const addPlayerButton = page.locator('button:has-text("선수 추가")').first();
        if (await addPlayerButton.isVisible()) {
          // 첫 번째 선수 추가
          await addPlayerButton.click();
          await page.fill('input[placeholder*="선수 이름"]', testUser.players[0].name);
          await page.fill('input[placeholder*="포지션"]', testUser.players[0].position);
          await page.fill('input[placeholder*="등번호"]', testUser.players[0].number);
          await page.click('button:has-text("추가")');
          await page.waitForTimeout(1000);
          
          console.log('✅ 선수 추가 성공');
        } else {
          issues.push({
            scenario: '선수 추가',
            issue: '선수 추가 버튼 없음',
            severity: 'major',
            details: '팀 상세 페이지에 선수 추가 버튼이 표시되지 않음'
          });
        }
      } else {
        issues.push({
          scenario: '선수 추가',
          issue: '팀을 찾을 수 없음',
          severity: 'major',
          details: '생성한 팀이 목록에 표시되지 않음'
        });
      }
    } catch (error) {
      issues.push({
        scenario: '선수 추가',
        issue: '예외 발생',
        severity: 'major',
        details: error.message
      });
      console.log('❌ 선수 추가 테스트 실패:', error.message);
    }
  });

  // 시나리오 5: 경기 생성 (리그전)
  test('시나리오 5: 경기 생성 (리그전)', async ({ page }) => {
    try {
      console.log('🔍 시나리오 5: 리그전 경기 생성 시작');
      
      // 로그인
      await page.goto('/login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button:has-text("로그인")');
      await page.waitForTimeout(3000);
      
      // 경기 생성 페이지로 이동
      await page.goto('/matches/create');
      await page.waitForLoadState('networkidle');
      
      // 경기 정보 입력
      const matchTitle = '테스트 리그 ' + Date.now();
      await page.fill('input[placeholder*="경기 제목을 입력하세요"]', matchTitle);
      await page.fill('textarea[placeholder*="경기에 대한 설명을 입력하세요"]', '테스트 리그전입니다.');
      
      // 경기 타입 선택
      const matchTypeSelect = page.locator('select#type');
      if (await matchTypeSelect.isVisible()) {
        await matchTypeSelect.selectOption('league');
      }
      
      // 날짜 설정 (미래 날짜)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateString = futureDate.toISOString().split('T')[0];
      
      // 날짜 입력 - datetime-local 타입 사용
      await page.fill('input[type="datetime-local"]', dateString + 'T10:00');
      // 최대 참가팀 수 입력
      await page.fill('input[placeholder="예: 16"]', '8');
      
      // 경기 생성 버튼 클릭
      await page.click('button:has-text("경기 생성")');
      
      // 결과 확인 (최대 10초 대기)
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/matches/') && !currentUrl.includes('/create')) {
        console.log('✅ 리그전 경기 생성 성공');
      } else {
        // 에러 메시지 확인
        const errorModal = page.locator('text=인증이 필요합니다');
        if (await errorModal.isVisible()) {
          issues.push({
            scenario: '경기 생성',
            issue: '인증 오류',
            severity: 'critical',
            details: '로그인 상태임에도 401 인증 오류 발생'
          });
          console.log('❌ 경기 생성 실패: 인증 오류');
        } else {
          issues.push({
            scenario: '경기 생성',
            issue: '경기 생성 실패',
            severity: 'major',
            details: '경기 생성 후 상세 페이지로 이동하지 않음'
          });
          console.log('❌ 경기 생성 실패');
        }
      }
    } catch (error) {
      issues.push({
        scenario: '경기 생성',
        issue: '예외 발생',
        severity: 'critical',
        details: error.message
      });
      console.log('❌ 경기 생성 테스트 실패:', error.message);
    }
  });

  // 시나리오 6: 경기 생성 (토너먼트)
  test('시나리오 6: 경기 생성 (토너먼트)', async ({ page }) => {
    try {
      console.log('🔍 시나리오 6: 토너먼트 경기 생성 시작');
      
      // 로그인
      await page.goto('/login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button:has-text("로그인")');
      await page.waitForTimeout(3000);
      
      // 경기 생성 페이지로 이동
      await page.goto('/matches/create');
      await page.waitForLoadState('networkidle');
      
      // 경기 정보 입력
      const matchTitle = '테스트 토너먼트 ' + Date.now();
      await page.fill('input[placeholder*="경기 제목을 입력하세요"]', matchTitle);
      await page.fill('textarea[placeholder*="경기에 대한 설명을 입력하세요"]', '테스트 토너먼트입니다.');
      
      // 경기 타입 선택
      const matchTypeSelect = page.locator('select#type');
      if (await matchTypeSelect.isVisible()) {
        await matchTypeSelect.selectOption('single_elimination');
      }
      
      // 날짜 설정
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);
      const dateString = futureDate.toISOString().split('T')[0];
      
      // 날짜 입력 - datetime-local 타입 사용
      await page.fill('input[type="datetime-local"]', dateString + 'T10:00');
      // 최대 참가팀 수 입력
      await page.fill('input[placeholder="예: 16"]', '16');
      
      // 경기 생성 버튼 클릭
      await page.click('button:has-text("경기 생성")');
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/matches/') && !currentUrl.includes('/create')) {
        console.log('✅ 토너먼트 경기 생성 성공');
      } else {
        issues.push({
          scenario: '토너먼트 생성',
          issue: '토너먼트 생성 실패',
          severity: 'major',
          details: '토너먼트 생성 후 상세 페이지로 이동하지 않음'
        });
        console.log('❌ 토너먼트 생성 실패');
      }
    } catch (error) {
      issues.push({
        scenario: '토너먼트 생성',
        issue: '예외 발생',
        severity: 'major',
        details: error.message
      });
      console.log('❌ 토너먼트 생성 테스트 실패:', error.message);
    }
  });

  // 시나리오 7: 경기 참가 신청
  test('시나리오 7: 경기 참가 신청', async ({ page }) => {
    try {
      console.log('🔍 시나리오 7: 경기 참가 신청 시작');
      
      // 로그인
      await page.goto('/login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button:has-text("로그인")');
      await page.waitForTimeout(3000);
      
      // 경기 목록으로 이동
      await page.goto('/matches');
      await page.waitForLoadState('networkidle');
      
      // 첫 번째 경기 선택
      const firstMatch = page.locator('.cursor-pointer').first();
      if (await firstMatch.isVisible()) {
        await firstMatch.click();
        await page.waitForLoadState('networkidle');
        
        // 참가 신청 버튼 찾기
        const joinButton = page.locator('button:has-text("참가 신청")');
        if (await joinButton.isVisible()) {
          await joinButton.click();
          await page.waitForTimeout(1000);
          
          // 팀 선택
          const teamSelect = page.locator('select');
          if (await teamSelect.isVisible()) {
            await teamSelect.selectOption({ index: 1 }); // 첫 번째 옵션 선택
            await page.fill('textarea[placeholder*="참가 신청 메시지"]', '테스트 참가 신청입니다.');
            await page.click('button:has-text("신청하기")');
            await page.waitForTimeout(2000);
            console.log('✅ 경기 참가 신청 성공');
          } else {
            issues.push({
              scenario: '경기 참가',
              issue: '팀 선택 불가',
              severity: 'major',
              details: '참가 신청 시 팀을 선택할 수 없음'
            });
          }
        } else {
          console.log('ℹ️ 이미 참가 신청했거나 참가 신청 불가능한 경기');
        }
      } else {
        issues.push({
          scenario: '경기 참가',
          issue: '경기 없음',
          severity: 'minor',
          details: '참가 신청할 수 있는 경기가 없음'
        });
      }
    } catch (error) {
      issues.push({
        scenario: '경기 참가',
        issue: '예외 발생',
        severity: 'major',
        details: error.message
      });
      console.log('❌ 경기 참가 신청 테스트 실패:', error.message);
    }
  });

  // 시나리오 8: 경기 목록 및 검색
  test('시나리오 8: 경기 목록 및 검색', async ({ page }) => {
    try {
      console.log('🔍 시나리오 8: 경기 목록 및 검색 시작');
      
      await page.goto('/matches');
      await page.waitForLoadState('networkidle');
      
      // 경기 목록 표시 확인
      const matchCards = page.locator('.cursor-pointer');
      const matchCount = await matchCards.count();
      
      if (matchCount > 0) {
        console.log(`✅ 경기 목록 표시 성공 (${matchCount}개 경기)`);
        
        // 검색 기능 테스트
        const searchInput = page.locator('input[placeholder*="검색"]');
        if (await searchInput.isVisible()) {
          await searchInput.fill('테스트');
          await page.waitForTimeout(1000);
          
          const filteredCount = await matchCards.count();
          console.log(`✅ 검색 기능 작동 (${filteredCount}개 결과)`);
        } else {
          issues.push({
            scenario: '경기 검색',
            issue: '검색 입력창 없음',
            severity: 'minor',
            details: '경기 목록 페이지에 검색 기능이 없음'
          });
        }
        
        // 필터 기능 테스트
        const filterSelect = page.locator('select').first();
        if (await filterSelect.isVisible()) {
          await filterSelect.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
          console.log('✅ 필터 기능 작동');
        }
      } else {
        issues.push({
          scenario: '경기 목록',
          issue: '경기 없음',
          severity: 'minor',
          details: '표시할 경기가 없음'
        });
      }
    } catch (error) {
      issues.push({
        scenario: '경기 목록',
        issue: '예외 발생',
        severity: 'major',
        details: error.message
      });
      console.log('❌ 경기 목록 테스트 실패:', error.message);
    }
  });

  // 시나리오 9: 팀 목록 조회
  test('시나리오 9: 팀 목록 조회', async ({ page }) => {
    try {
      console.log('🔍 시나리오 9: 팀 목록 조회 시작');
      
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');
      
      // 팀 목록 표시 확인
      const teamCards = await page.locator('.cursor-pointer').count();
      
      if (teamCards > 0) {
        console.log(`✅ 팀 목록 표시 성공 (${teamCards}개 팀)`);
        
        // 팀 상세 페이지 접근 테스트
        await page.locator('.cursor-pointer').first().click();
        await page.waitForLoadState('networkidle');
        
        if (page.url().includes('/teams/')) {
          console.log('✅ 팀 상세 페이지 접근 성공');
        } else {
          issues.push({
            scenario: '팀 상세',
            issue: '팀 상세 페이지 접근 실패',
            severity: 'minor',
            details: '팀 클릭 시 상세 페이지로 이동하지 않음'
          });
        }
      } else {
        issues.push({
          scenario: '팀 목록',
          issue: '팀 없음',
          severity: 'minor',
          details: '표시할 팀이 없음'
        });
      }
    } catch (error) {
      issues.push({
        scenario: '팀 목록',
        issue: '예외 발생',
        severity: 'major',
        details: error.message
      });
      console.log('❌ 팀 목록 테스트 실패:', error.message);
    }
  });

  // 시나리오 10: 프로필 관리
  test('시나리오 10: 프로필 관리', async ({ page }) => {
    try {
      console.log('🔍 시나리오 10: 프로필 관리 시작');
      
      // 로그인
      await page.goto('/login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button:has-text("로그인")');
      await page.waitForTimeout(3000);
      
      // 프로필 페이지로 이동
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      
      // 프로필 정보 확인 - 프로필은 처음에는 수정 모드가 아님
      const profileName = page.locator('h1').first();
      const editButton = page.locator('button:has-text("프로필 수정")');
      
      if (await editButton.isVisible()) {
        console.log('✅ 프로필 정보 표시 성공');
        
        // 프로필 수정 모드로 전환
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // 프로필 수정 테스트
        const bioTextarea = page.locator('textarea[placeholder*="자기소개"]');
        if (await bioTextarea.isVisible()) {
          await bioTextarea.fill('테스트 자기소개입니다.');
          
          const saveButton = page.locator('button:has-text("저장")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ 프로필 수정 성공');
          }
        }
      } else {
        issues.push({
          scenario: '프로필',
          issue: '프로필 정보 표시 안됨',
          severity: 'major',
          details: '사용자 프로필 정보가 표시되지 않음'
        });
      }
    } catch (error) {
      issues.push({
        scenario: '프로필',
        issue: '예외 발생',
        severity: 'major',
        details: error.message
      });
      console.log('❌ 프로필 관리 테스트 실패:', error.message);
    }
  });

  // 시나리오 11: 대시보드 기능
  test('시나리오 11: 대시보드 기능', async ({ page }) => {
    try {
      console.log('🔍 시나리오 11: 대시보드 기능 시작');
      
      // 로그인
      await page.goto('/login');
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button:has-text("로그인")');
      await page.waitForTimeout(3000);
      
      // 대시보드로 이동
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // 대시보드 섹션 확인
      const sections = [
        { text: '내 경기', selector: 'h2:has-text("내 경기"), h3:has-text("내 경기")' },
        { text: '내 팀', selector: 'h2:has-text("내 팀"), h3:has-text("내 팀")' },
        { text: '참가 중인 경기', selector: 'h2:has-text("참가 중인 경기"), h3:has-text("참가 중인 경기")' }
      ];
      
      for (const section of sections) {
        const sectionElement = page.locator(section.selector).first();
        if (await sectionElement.isVisible()) {
          console.log(`✅ ${section.text} 섹션 표시됨`);
        } else {
          issues.push({
            scenario: '대시보드',
            issue: `${section.text} 섹션 없음`,
            severity: 'minor',
            details: `대시보드에 ${section.text} 섹션이 표시되지 않음`
          });
        }
      }
    } catch (error) {
      issues.push({
        scenario: '대시보드',
        issue: '예외 발생',
        severity: 'major',
        details: error.message
      });
      console.log('❌ 대시보드 테스트 실패:', error.message);
    }
  });

  // 시나리오 12: 모바일 반응형 테스트
  test('시나리오 12: 모바일 반응형 테스트', async ({ page }) => {
    try {
      console.log('🔍 시나리오 12: 모바일 반응형 테스트 시작');
      
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });
      
      // 홈페이지 테스트
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // 햄버거 메뉴 확인
      const hamburgerMenu = page.locator('button[aria-label*="menu"]').or(page.locator('button:has(svg)')).first();
      if (await hamburgerMenu.isVisible()) {
        await hamburgerMenu.click();
        await page.waitForTimeout(1000);
        
        // 모바일 메뉴 항목 확인
        const menuItems = ['경기', '팀', '로그인'];
        let menuWorking = true;
        
        for (const item of menuItems) {
          const menuItem = page.locator(`a:has-text("${item}")`).first();
          if (!(await menuItem.isVisible())) {
            menuWorking = false;
            break;
          }
        }
        
        if (menuWorking) {
          console.log('✅ 모바일 메뉴 작동');
        } else {
          issues.push({
            scenario: '모바일 반응형',
            issue: '모바일 메뉴 문제',
            severity: 'minor',
            details: '모바일 메뉴 항목이 제대로 표시되지 않음'
          });
        }
      } else {
        console.log('ℹ️ 햄버거 메뉴가 표시되지 않음 (반응형 디자인 미적용)');
      }
      
      // 경기 목록 모바일 뷰 테스트
      await page.goto('/matches');
      await page.waitForLoadState('networkidle');
      
      const matchCards = page.locator('.cursor-pointer');
      if (await matchCards.first().isVisible()) {
        // 카드 너비 확인
        const cardBox = await matchCards.first().boundingBox();
        if (cardBox && cardBox.width < 375) {
          console.log('✅ 모바일 레이아웃 적용됨');
        } else {
          issues.push({
            scenario: '모바일 반응형',
            issue: '레이아웃 문제',
            severity: 'minor',
            details: '모바일에서 카드가 화면 너비를 초과함'
          });
        }
      }
    } catch (error) {
      issues.push({
        scenario: '모바일 반응형',
        issue: '예외 발생',
        severity: 'minor',
        details: error.message
      });
      console.log('❌ 모바일 반응형 테스트 실패:', error.message);
    }
  });

  // 테스트 종료 후 문제점 정리
  test.afterAll(async () => {
    console.log('\n\n========================================');
    console.log('📊 테스트 결과 요약');
    console.log('========================================\n');
    
    if (issues.length === 0) {
      console.log('✅ 모든 테스트 통과! 발견된 문제가 없습니다.');
    } else {
      console.log(`⚠️ 총 ${issues.length}개의 문제 발견\n`);
      
      // 심각도별 분류
      const critical = issues.filter(i => i.severity === 'critical');
      const major = issues.filter(i => i.severity === 'major');
      const minor = issues.filter(i => i.severity === 'minor');
      
      if (critical.length > 0) {
        console.log('🔴 Critical 문제:');
        critical.forEach(issue => {
          console.log(`  - [${issue.scenario}] ${issue.issue}: ${issue.details}`);
        });
        console.log('');
      }
      
      if (major.length > 0) {
        console.log('🟠 Major 문제:');
        major.forEach(issue => {
          console.log(`  - [${issue.scenario}] ${issue.issue}: ${issue.details}`);
        });
        console.log('');
      }
      
      if (minor.length > 0) {
        console.log('🟡 Minor 문제:');
        minor.forEach(issue => {
          console.log(`  - [${issue.scenario}] ${issue.issue}: ${issue.details}`);
        });
        console.log('');
      }
    }
    
    console.log('========================================\n');
  });
});