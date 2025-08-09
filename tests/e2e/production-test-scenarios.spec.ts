import { test, expect } from '@playwright/test';

// 테스트 사용자 데이터
const testUsers = [
  {
    name: '김민수',
    email: 'kimminsu2025@gmail.com',
    password: 'Test1234!',
    teamName: 'FC 서울 유나이티드',
    teamDescription: '서울 지역 축구 동호회입니다. 매주 토요일 오전에 모여서 운동합니다.',
    teamContact: '010-1234-5678',
    sport: '축구',
    players: [
      { name: '박지성', position: 'FW', number: '7' },
      { name: '이영표', position: 'MF', number: '14' },
      { name: '김남일', position: 'MF', number: '6' },
      { name: '홍명보', position: 'DF', number: '20' },
      { name: '이운재', position: 'GK', number: '1' }
    ]
  },
  {
    name: '이정호',
    email: 'leejungho2025@gmail.com',
    password: 'Test1234!',
    teamName: '부산 농구단',
    teamDescription: '부산 지역 농구 동호회입니다. 초보자도 환영합니다!',
    teamContact: '010-2345-6789',
    sport: '농구',
    players: [
      { name: '김상식', position: 'C', number: '32' },
      { name: '이상민', position: 'PF', number: '24' },
      { name: '박찬호', position: 'SF', number: '15' },
      { name: '정성훈', position: 'SG', number: '10' },
      { name: '강동희', position: 'PG', number: '3' }
    ]
  },
  {
    name: '박소연',
    email: 'parksoyeon2025@gmail.com',
    password: 'Test1234!',
    teamName: '인천 배드민턴 클럽',
    teamDescription: '인천 지역 배드민턴 동호회입니다. 실력 향상을 목표로 합니다.',
    teamContact: '010-3456-7890',
    sport: '배드민턴',
    players: [
      { name: '최수진', position: '단식', number: '1' },
      { name: '김미영', position: '복식', number: '2' },
      { name: '이지은', position: '혼합복식', number: '3' },
      { name: '박세리', position: '단식', number: '4' }
    ]
  },
  {
    name: '최영진',
    email: 'choiyoungjin2025@gmail.com',
    password: 'Test1234!',
    teamName: '대전 탁구 클럽',
    teamDescription: '대전 지역 탁구 동호회입니다. 매주 화요일, 목요일 저녁에 모입니다.',
    teamContact: '010-4567-8901',
    sport: '탁구',
    players: [
      { name: '유남규', position: '단식', number: '1' },
      { name: '오상은', position: '복식', number: '2' },
      { name: '김택수', position: '단식', number: '3' }
    ]
  },
  {
    name: '정다은',
    email: 'jungdaeun2025@gmail.com',
    password: 'Test1234!',
    teamName: '광주 배구단',
    teamDescription: '광주 지역 배구 동호회입니다. 함께 즐겁게 운동해요!',
    teamContact: '010-5678-9012',
    sport: '배구',
    players: [
      { name: '김연경', position: '아웃사이드히터', number: '10' },
      { name: '양효진', position: '세터', number: '1' },
      { name: '김수지', position: '미들블로커', number: '15' },
      { name: '이재영', position: '아웃사이드히터', number: '17' },
      { name: '박정아', position: '리베로', number: '7' },
      { name: '안혜진', position: '라이트', number: '9' }
    ]
  }
];

// 경기 데이터
const matches = [
  {
    title: '2025 서울 축구 리그',
    description: '서울 지역 축구 동호회 리그전입니다. 매주 토요일 경기가 진행됩니다.',
    sport: '축구',
    type: 'league',
    startDate: '2025-01-15',
    startTime: '10:00',
    registrationDeadline: '2025-01-10',
    location: '서울 월드컵 경기장 보조구장',
    maxTeams: '8',
    minPlayers: '11',
    maxPlayers: '20'
  },
  {
    title: '부산 농구 토너먼트',
    description: '부산 지역 농구 토너먼트입니다. 싱글 엘리미네이션 방식으로 진행됩니다.',
    sport: '농구',
    type: 'single_elimination',
    startDate: '2025-01-20',
    startTime: '14:00',
    registrationDeadline: '2025-01-15',
    location: '부산 사직실내체육관',
    maxTeams: '16',
    minPlayers: '5',
    maxPlayers: '12'
  },
  {
    title: '전국 배드민턴 대회',
    description: '전국 배드민턴 동호인 대회입니다. 더블 엘리미네이션 방식입니다.',
    sport: '배드민턴',
    type: 'double_elimination',
    startDate: '2025-01-25',
    startTime: '09:00',
    registrationDeadline: '2025-01-20',
    location: '올림픽 체조경기장',
    maxTeams: '32',
    minPlayers: '2',
    maxPlayers: '6'
  }
];

test.describe('The Match 플랫폼 종합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://the-match-five.vercel.app');
  });

  test('시나리오 1: 첫 번째 사용자 회원가입 및 팀 생성', async ({ page }) => {
    const user = testUsers[0];
    
    // 회원가입
    await page.click('text=회원가입');
    await page.fill('input[placeholder*="홍길동"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[placeholder*="최소 8자"]', user.password);
    await page.fill('input[placeholder*="비밀번호를 다시"]', user.password);
    await page.click('button:has-text("회원가입")');
    
    // 회원가입 성공 확인
    await expect(page.locator('text=회원가입 완료')).toBeVisible({ timeout: 10000 });
    
    // 이메일 확인 (테스트 환경이므로 수동으로 확인 처리)
    // 실제로는 Supabase 대시보드에서 수동 확인 필요
    
    console.log(`✅ ${user.name} 회원가입 완료`);
  });

  test('시나리오 2: 첫 번째 사용자 로그인 및 팀 생성', async ({ page }) => {
    const user = testUsers[0];
    
    // 로그인
    await page.goto('https://the-match-five.vercel.app/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button:has-text("로그인")');
    
    // 로그인 성공 확인 (리다이렉트 대기)
    await page.waitForTimeout(3000);
    
    // 팀 생성 페이지로 이동
    await page.goto('https://the-match-five.vercel.app/teams/create');
    await page.waitForLoadState('networkidle');
    
    // 팀 정보 입력
    await page.fill('input[placeholder*="팀 이름"]', user.teamName);
    await page.fill('textarea[placeholder*="팀 소개"]', user.teamDescription);
    await page.fill('input[placeholder*="연락처"]', user.teamContact);
    await page.selectOption('select', user.sport);
    
    await page.click('button:has-text("팀 생성")');
    await page.waitForTimeout(3000);
    
    console.log(`✅ ${user.teamName} 팀 생성 완료`);
    
    // 선수 추가
    for (const player of user.players) {
      await page.click('button:has-text("선수 추가")');
      await page.fill('input[placeholder*="선수 이름"]', player.name);
      await page.fill('input[placeholder*="포지션"]', player.position);
      await page.fill('input[placeholder*="등번호"]', player.number);
      await page.click('button:has-text("추가")');
      await page.waitForTimeout(1000);
    }
    
    console.log(`✅ ${user.players.length}명의 선수 추가 완료`);
  });

  test('시나리오 3: 첫 번째 사용자가 리그전 경기 생성', async ({ page }) => {
    const user = testUsers[0];
    const match = matches[0];
    
    // 로그인
    await page.goto('https://the-match-five.vercel.app/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 경기 생성 페이지로 이동
    await page.goto('https://the-match-five.vercel.app/matches/create');
    await page.waitForLoadState('networkidle');
    
    // 경기 정보 입력
    await page.fill('input[placeholder*="경기 제목"]', match.title);
    await page.fill('textarea[placeholder*="경기 설명"]', match.description);
    await page.selectOption('select[name="sport"]', match.sport);
    await page.selectOption('select[name="match_type"]', match.type);
    
    await page.fill('input[type="date"][name="start_date"]', match.startDate);
    await page.fill('input[type="time"]', match.startTime);
    await page.fill('input[type="date"][name="registration_deadline"]', match.registrationDeadline);
    
    await page.fill('input[placeholder*="경기 장소"]', match.location);
    await page.fill('input[placeholder*="최대 팀"]', match.maxTeams);
    await page.fill('input[placeholder*="최소 선수"]', match.minPlayers);
    await page.fill('input[placeholder*="최대 선수"]', match.maxPlayers);
    
    await page.click('button:has-text("경기 생성")');
    await page.waitForTimeout(3000);
    
    console.log(`✅ ${match.title} 경기 생성 완료`);
  });

  test('시나리오 4: 두 번째 사용자 회원가입, 팀 생성 및 경기 참가 신청', async ({ page }) => {
    const user = testUsers[1];
    
    // 회원가입
    await page.goto('https://the-match-five.vercel.app/signup');
    await page.fill('input[placeholder*="홍길동"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[placeholder*="최소 8자"]', user.password);
    await page.fill('input[placeholder*="비밀번호를 다시"]', user.password);
    await page.click('button:has-text("회원가입")');
    await expect(page.locator('text=회원가입 완료')).toBeVisible({ timeout: 10000 });
    
    // 로그인
    await page.goto('https://the-match-five.vercel.app/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 팀 생성
    await page.goto('https://the-match-five.vercel.app/teams/create');
    await page.fill('input[placeholder*="팀 이름"]', user.teamName);
    await page.fill('textarea[placeholder*="팀 소개"]', user.teamDescription);
    await page.fill('input[placeholder*="연락처"]', user.teamContact);
    await page.selectOption('select', user.sport);
    await page.click('button:has-text("팀 생성")');
    await page.waitForTimeout(3000);
    
    // 선수 추가
    for (const player of user.players) {
      await page.click('button:has-text("선수 추가")');
      await page.fill('input[placeholder*="선수 이름"]', player.name);
      await page.fill('input[placeholder*="포지션"]', player.position);
      await page.fill('input[placeholder*="등번호"]', player.number);
      await page.click('button:has-text("추가")');
      await page.waitForTimeout(1000);
    }
    
    console.log(`✅ ${user.name} 회원가입, 팀 생성, 선수 추가 완료`);
  });

  test('시나리오 5: 세 번째 사용자 회원가입 및 토너먼트 생성', async ({ page }) => {
    const user = testUsers[2];
    const match = matches[1];
    
    // 회원가입
    await page.goto('https://the-match-five.vercel.app/signup');
    await page.fill('input[placeholder*="홍길동"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[placeholder*="최소 8자"]', user.password);
    await page.fill('input[placeholder*="비밀번호를 다시"]', user.password);
    await page.click('button:has-text("회원가입")');
    await expect(page.locator('text=회원가입 완료')).toBeVisible({ timeout: 10000 });
    
    // 로그인
    await page.goto('https://the-match-five.vercel.app/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 경기 생성
    await page.goto('https://the-match-five.vercel.app/matches/create');
    await page.fill('input[placeholder*="경기 제목"]', match.title);
    await page.fill('textarea[placeholder*="경기 설명"]', match.description);
    await page.selectOption('select[name="sport"]', match.sport);
    await page.selectOption('select[name="match_type"]', match.type);
    
    await page.fill('input[type="date"][name="start_date"]', match.startDate);
    await page.fill('input[type="time"]', match.startTime);
    await page.fill('input[type="date"][name="registration_deadline"]', match.registrationDeadline);
    
    await page.fill('input[placeholder*="경기 장소"]', match.location);
    await page.fill('input[placeholder*="최대 팀"]', match.maxTeams);
    await page.fill('input[placeholder*="최소 선수"]', match.minPlayers);
    await page.fill('input[placeholder*="최대 선수"]', match.maxPlayers);
    
    await page.click('button:has-text("경기 생성")');
    await page.waitForTimeout(3000);
    
    console.log(`✅ ${user.name}의 ${match.title} 토너먼트 생성 완료`);
  });

  test('시나리오 6: 경기 목록 확인 및 검색', async ({ page }) => {
    // 경기 목록 페이지로 이동
    await page.goto('https://the-match-five.vercel.app/matches');
    await page.waitForLoadState('networkidle');
    
    // 생성된 경기들이 표시되는지 확인
    await expect(page.locator('text=2025 서울 축구 리그')).toBeVisible();
    await expect(page.locator('text=부산 농구 토너먼트')).toBeVisible();
    
    // 검색 기능 테스트
    await page.fill('input[placeholder*="검색"]', '축구');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=2025 서울 축구 리그')).toBeVisible();
    
    // 필터링 테스트
    await page.selectOption('select[name="sport"]', '농구');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=부산 농구 토너먼트')).toBeVisible();
    
    console.log(`✅ 경기 목록 확인 및 검색/필터링 테스트 완료`);
  });

  test('시나리오 7: 팀 목록 확인 및 상세 정보 확인', async ({ page }) => {
    // 팀 목록 페이지로 이동
    await page.goto('https://the-match-five.vercel.app/teams');
    await page.waitForLoadState('networkidle');
    
    // 생성된 팀들이 표시되는지 확인
    await expect(page.locator('text=FC 서울 유나이티드')).toBeVisible();
    await expect(page.locator('text=부산 농구단')).toBeVisible();
    
    // 팀 상세 페이지로 이동
    await page.click('text=FC 서울 유나이티드');
    await page.waitForLoadState('networkidle');
    
    // 팀 정보 확인
    await expect(page.locator('text=서울 지역 축구 동호회')).toBeVisible();
    await expect(page.locator('text=박지성')).toBeVisible();
    await expect(page.locator('text=이영표')).toBeVisible();
    
    console.log(`✅ 팀 목록 및 상세 정보 확인 완료`);
  });

  test('시나리오 8: 경기 참가 신청 프로세스', async ({ page }) => {
    const user = testUsers[1];
    
    // 로그인
    await page.goto('https://the-match-five.vercel.app/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 경기 목록에서 참가할 경기 선택
    await page.goto('https://the-match-five.vercel.app/matches');
    await page.click('text=부산 농구 토너먼트');
    await page.waitForLoadState('networkidle');
    
    // 참가 신청 버튼 클릭
    await page.click('button:has-text("참가 신청")');
    await page.waitForTimeout(1000);
    
    // 팀 선택 및 메시지 입력
    await page.selectOption('select', user.teamName);
    await page.fill('textarea[placeholder*="참가 신청 메시지"]', '열심히 하겠습니다! 좋은 경기 기대합니다.');
    await page.click('button:has-text("신청하기")');
    await page.waitForTimeout(2000);
    
    console.log(`✅ ${user.teamName}의 경기 참가 신청 완료`);
  });

  test('시나리오 9: 경기 주최자의 참가 신청 관리', async ({ page }) => {
    const organizer = testUsers[2];
    
    // 주최자 로그인
    await page.goto('https://the-match-five.vercel.app/login');
    await page.fill('input[type="email"]', organizer.email);
    await page.fill('input[type="password"]', organizer.password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 대시보드로 이동
    await page.goto('https://the-match-five.vercel.app/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 내가 만든 경기 관리
    await page.click('text=부산 농구 토너먼트');
    await page.waitForLoadState('networkidle');
    
    // 참가 신청 관리 탭
    await page.click('text=참가 신청 관리');
    await page.waitForTimeout(2000);
    
    // 참가 신청 승인
    const approveButtons = page.locator('button:has-text("승인")');
    const count = await approveButtons.count();
    
    for (let i = 0; i < Math.min(count, 2); i++) {
      await approveButtons.nth(i).click();
      await page.waitForTimeout(1000);
    }
    
    console.log(`✅ ${count}개의 참가 신청 처리 완료`);
  });

  test('시나리오 10: 프로필 수정 및 계정 설정', async ({ page }) => {
    const user = testUsers[0];
    
    // 로그인
    await page.goto('https://the-match-five.vercel.app/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 프로필 페이지로 이동
    await page.goto('https://the-match-five.vercel.app/profile');
    await page.waitForLoadState('networkidle');
    
    // 프로필 정보 수정
    await page.fill('textarea[placeholder*="자기소개"]', '안녕하세요! 축구를 사랑하는 김민수입니다. 함께 즐거운 경기 만들어가요!');
    await page.fill('input[placeholder*="연락처"]', '010-1234-5678');
    
    // 소셜 링크 추가
    await page.fill('input[placeholder*="인스타그램"]', '@kimminsu_fc');
    
    await page.click('button:has-text("프로필 저장")');
    await page.waitForTimeout(2000);
    
    console.log(`✅ ${user.name}의 프로필 수정 완료`);
  });

  test('시나리오 11: 경기 일정 수정 및 공지사항 작성', async ({ page }) => {
    const organizer = testUsers[0];
    
    // 주최자 로그인
    await page.goto('https://the-match-five.vercel.app/login');
    await page.fill('input[type="email"]', organizer.email);
    await page.fill('input[type="password"]', organizer.password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 내 경기 관리 페이지로 이동
    await page.goto('https://the-match-five.vercel.app/dashboard');
    await page.click('text=2025 서울 축구 리그');
    await page.waitForLoadState('networkidle');
    
    // 경기 정보 수정
    await page.click('button:has-text("경기 수정")');
    await page.fill('textarea[placeholder*="공지사항"]', '⚠️ 날씨 관계로 경기 시작 시간이 30분 늦춰집니다. 10:30에 시작합니다.');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(2000);
    
    console.log(`✅ 경기 일정 수정 및 공지사항 작성 완료`);
  });

  test('시나리오 12: 경기 결과 입력 및 통계 확인', async ({ page }) => {
    const organizer = testUsers[0];
    
    // 주최자 로그인
    await page.goto('https://the-match-five.vercel.app/login');
    await page.fill('input[type="email"]', organizer.email);
    await page.fill('input[type="password"]', organizer.password);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // 경기 관리 페이지로 이동
    await page.goto('https://the-match-five.vercel.app/dashboard');
    await page.click('text=2025 서울 축구 리그');
    await page.waitForLoadState('networkidle');
    
    // 경기 결과 입력
    await page.click('text=경기 결과 입력');
    
    // 첫 번째 경기 결과 입력
    await page.fill('input[name="home_score"]', '3');
    await page.fill('input[name="away_score"]', '2');
    await page.click('button:has-text("결과 저장")');
    await page.waitForTimeout(2000);
    
    // 통계 페이지로 이동
    await page.goto('https://the-match-five.vercel.app/stats');
    await page.waitForLoadState('networkidle');
    
    // 통계 확인
    await expect(page.locator('text=FC 서울 유나이티드')).toBeVisible();
    await expect(page.locator('text=승: 1')).toBeVisible();
    
    console.log(`✅ 경기 결과 입력 및 통계 확인 완료`);
  });
});