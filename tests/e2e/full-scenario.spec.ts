import { test, expect } from '@playwright/test';

// 테스트 데이터
const testUsers = [
  {
    email: 'captain1@test.com',
    password: 'Test1234!',
    teamName: 'FC 서울 레전드',
    players: ['김철수', '이영희', '박민수', '최강민', '정우성']
  },
  {
    email: 'captain2@test.com', 
    password: 'Test1234!',
    teamName: '부산 아이파크',
    players: ['강호동', '유재석', '박명수', '정준하', '하하']
  },
  {
    email: 'captain3@test.com',
    password: 'Test1234!',
    teamName: '인천 유나이티드',
    players: ['손흥민', '이강인', '황희찬', '김민재', '조규성']
  },
  {
    email: 'organizer@test.com',
    password: 'Test1234!',
    teamName: '대전 시티즌',
    players: ['홍길동', '김길동', '이길동', '박길동', '최길동']
  }
];

const matches = [
  {
    title: '2024 겨울 축구 리그',
    description: '겨울 시즌 정규 리그전입니다.',
    sport: '축구',
    type: 'league',
    date: '2024-12-25',
    time: '14:00',
    location: '서울 월드컵 경기장',
    maxTeams: 4
  },
  {
    title: '새해맞이 토너먼트',
    description: '2025년 새해를 맞이하는 토너먼트',
    sport: '축구',
    type: 'single_elimination',
    date: '2025-01-01',
    time: '10:00',
    location: '상암 월드컵 경기장',
    maxTeams: 8
  }
];

test.describe('The Match 플랫폼 전체 시나리오 테스트', () => {
  test.use({
    baseURL: 'https://the-match-five.vercel.app',
    viewport: { width: 1280, height: 720 }
  });

  test('시나리오 1: 회원가입, 팀 생성, 경기 생성 및 참가 신청', async ({ page }) => {
    // 1. 첫 번째 사용자 - 경기 주최자 회원가입
    await page.goto('/');
    await page.click('text=회원가입');
    await page.waitForLoadState('networkidle');

    // 회원가입 폼 작성
    await page.fill('input[type="email"]', testUsers[3].email);
    await page.fill('input[type="password"]', testUsers[3].password);
    await page.click('button:has-text("회원가입")');
    
    // 회원가입 성공 후 자동 로그인 대기
    await page.waitForTimeout(3000);
    
    // 홈페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 2. 팀 생성
    await page.click('text=팀 생성');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="팀 이름"]', testUsers[3].teamName);
    await page.fill('textarea[placeholder*="팀 소개"]', '대전을 대표하는 축구팀입니다.');
    await page.fill('input[placeholder*="연락처"]', '010-1234-5678');
    
    // 스포츠 종목 선택
    await page.selectOption('select', { label: '축구' });
    
    await page.click('button:has-text("팀 생성")');
    await page.waitForTimeout(2000);

    // 3. 선수 추가
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await page.click(`text=${testUsers[3].teamName}`);
    await page.waitForLoadState('networkidle');

    for (const playerName of testUsers[3].players) {
      await page.click('button:has-text("선수 추가")');
      await page.fill('input[placeholder*="선수 이름"]', playerName);
      await page.fill('input[placeholder*="포지션"]', 'MF');
      await page.fill('input[placeholder*="등번호"]', Math.floor(Math.random() * 99 + 1).toString());
      await page.click('button:has-text("추가")');
      await page.waitForTimeout(1000);
    }

    // 4. 경기 생성
    await page.goto('/matches/create');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="경기 제목"]', matches[0].title);
    await page.fill('textarea[placeholder*="경기 설명"]', matches[0].description);
    await page.selectOption('select[name="sport"]', { label: matches[0].sport });
    await page.selectOption('select[name="match_type"]', { value: matches[0].type });
    
    // 날짜와 시간 설정
    await page.fill('input[type="date"]', matches[0].date);
    await page.fill('input[type="time"]', matches[0].time);
    
    await page.fill('input[placeholder*="경기 장소"]', matches[0].location);
    await page.fill('input[placeholder*="최대 팀 수"]', matches[0].maxTeams.toString());
    
    await page.click('button:has-text("경기 생성")');
    await page.waitForTimeout(3000);

    // 5. 로그아웃
    await page.click('text=로그아웃');
    await page.waitForTimeout(2000);
  });

  test('시나리오 2: 다른 사용자들이 팀 생성하고 경기 참가 신청', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      const user = testUsers[i];
      
      // 1. 회원가입
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      await page.click('button:has-text("회원가입")');
      await page.waitForTimeout(3000);
      
      // 2. 팀 생성
      await page.goto('/teams/create');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[placeholder*="팀 이름"]', user.teamName);
      await page.fill('textarea[placeholder*="팀 소개"]', `${user.teamName}의 공식 팀입니다.`);
      await page.fill('input[placeholder*="연락처"]', `010-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`);
      await page.selectOption('select', { label: '축구' });
      
      await page.click('button:has-text("팀 생성")');
      await page.waitForTimeout(2000);
      
      // 3. 선수 추가
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');
      await page.click(`text=${user.teamName}`);
      await page.waitForLoadState('networkidle');
      
      for (let j = 0; j < 3; j++) {
        const playerName = user.players[j];
        await page.click('button:has-text("선수 추가")');
        await page.fill('input[placeholder*="선수 이름"]', playerName);
        await page.fill('input[placeholder*="포지션"]', ['FW', 'MF', 'DF'][j % 3]);
        await page.fill('input[placeholder*="등번호"]', (j + 1).toString());
        await page.click('button:has-text("추가")');
        await page.waitForTimeout(1000);
      }
      
      // 4. 경기 참가 신청
      await page.goto('/matches');
      await page.waitForLoadState('networkidle');
      
      // 첫 번째 경기 클릭
      await page.click('text=2024 겨울 축구 리그');
      await page.waitForLoadState('networkidle');
      
      // 참가 신청
      await page.click('button:has-text("참가 신청")');
      await page.waitForTimeout(1000);
      
      // 팀 선택 (자신의 팀)
      await page.selectOption('select', { label: user.teamName });
      await page.fill('textarea[placeholder*="참가 신청 메시지"]', `${user.teamName}이 참가를 희망합니다.`);
      await page.click('button:has-text("신청하기")');
      await page.waitForTimeout(2000);
      
      // 5. 로그아웃
      await page.goto('/');
      await page.click('text=로그아웃');
      await page.waitForTimeout(2000);
    }
  });

  test('시나리오 3: 경기 주최자가 참가 신청 승인 및 대진표 생성', async ({ page }) => {
    // 1. 주최자 로그인
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', testUsers[3].email);
    await page.fill('input[type="password"]', testUsers[3].password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 2. 내 경기 페이지로 이동
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 3. 생성한 경기 클릭
    await page.click('text=2024 겨울 축구 리그');
    await page.waitForLoadState('networkidle');
    
    // 4. 참가 신청 관리 탭으로 이동
    await page.click('text=참가 신청 관리');
    await page.waitForTimeout(2000);
    
    // 5. 모든 참가 신청 승인
    const approveButtons = await page.$$('button:has-text("승인")');
    for (const button of approveButtons) {
      await button.click();
      await page.waitForTimeout(1000);
    }
    
    // 6. 대진표 생성
    await page.click('text=대진표');
    await page.waitForTimeout(2000);
    
    // 대진표가 자동 생성되었는지 확인
    await expect(page.locator('text=대진표')).toBeVisible();
  });

  test('시나리오 4: 두 번째 토너먼트 생성 및 참가', async ({ page }) => {
    // 1. 첫 번째 사용자로 로그인
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', testUsers[0].email);
    await page.fill('input[type="password"]', testUsers[0].password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 2. 새 토너먼트 생성
    await page.goto('/matches/create');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="경기 제목"]', matches[1].title);
    await page.fill('textarea[placeholder*="경기 설명"]', matches[1].description);
    await page.selectOption('select[name="sport"]', { label: matches[1].sport });
    await page.selectOption('select[name="match_type"]', { value: matches[1].type });
    
    await page.fill('input[type="date"]', matches[1].date);
    await page.fill('input[type="time"]', matches[1].time);
    await page.fill('input[placeholder*="경기 장소"]', matches[1].location);
    await page.fill('input[placeholder*="최대 팀 수"]', matches[1].maxTeams.toString());
    
    await page.click('button:has-text("경기 생성")');
    await page.waitForTimeout(3000);
    
    // 3. 자신의 팀으로 참가 신청
    await page.goto('/matches');
    await page.waitForLoadState('networkidle');
    
    await page.click('text=새해맞이 토너먼트');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("참가 신청")');
    await page.waitForTimeout(1000);
    
    await page.selectOption('select', { label: testUsers[0].teamName });
    await page.fill('textarea[placeholder*="참가 신청 메시지"]', '새해 토너먼트에 참가합니다!');
    await page.click('button:has-text("신청하기")');
    await page.waitForTimeout(2000);
  });

  test('시나리오 5: 경기 목록 확인 및 필터링', async ({ page }) => {
    // 1. 경기 목록 페이지로 이동
    await page.goto('/matches');
    await page.waitForLoadState('networkidle');
    
    // 2. 생성된 경기들이 표시되는지 확인
    await expect(page.locator('text=2024 겨울 축구 리그')).toBeVisible();
    await expect(page.locator('text=새해맞이 토너먼트')).toBeVisible();
    
    // 3. 검색 기능 테스트
    await page.fill('input[placeholder*="검색"]', '겨울');
    await page.waitForTimeout(1000);
    
    await expect(page.locator('text=2024 겨울 축구 리그')).toBeVisible();
    await expect(page.locator('text=새해맞이 토너먼트')).not.toBeVisible();
    
    // 4. 검색 초기화
    await page.fill('input[placeholder*="검색"]', '');
    await page.waitForTimeout(1000);
    
    // 5. 경기 타입 필터링
    if (await page.locator('select[name="match_type"]').isVisible()) {
      await page.selectOption('select[name="match_type"]', { value: 'single_elimination' });
      await page.waitForTimeout(1000);
      
      await expect(page.locator('text=새해맞이 토너먼트')).toBeVisible();
      await expect(page.locator('text=2024 겨울 축구 리그')).not.toBeVisible();
    }
  });
});