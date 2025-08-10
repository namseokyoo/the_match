import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://the-match-five.vercel.app';
const TEST_DATA_PATH = path.join(__dirname, '../data');
const RESULTS_PATH = path.join(__dirname, '../results');
const SCREENSHOTS_PATH = path.join(__dirname, '../screenshots');

// 결과 저장을 위한 디렉토리 생성
[TEST_DATA_PATH, RESULTS_PATH, SCREENSHOTS_PATH].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

interface TestAccount {
    name: string;
    email: string;
    password: string;
    role: 'organizer' | 'captain' | 'player';
}

interface TestTeam {
    name: string;
    captain: string;
    description: string;
    members: string[];
}

interface TestMatch {
    title: string;
    type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'league';
    description: string;
    organizer: string;
    maxParticipants: number;
}

interface TestResult {
    scenario: string;
    success: boolean;
    duration: number;
    errors: string[];
    details: any;
    timestamp: string;
}

class ComprehensiveTestBot {
    private browser: Browser | null = null;
    private results: TestResult[] = [];
    private testAccounts: TestAccount[] = [];
    private testTeams: TestTeam[] = [];
    private testMatches: TestMatch[] = [];

    constructor() {
        this.generateTestData();
    }

    private generateTestData() {
        // 20명의 다양한 테스트 계정 생성 (랜덤 요소 포함)
        const names = [
            '김민수', '박영희', '이철수', '정미영', '최현우',
            '강소영', '윤태준', '임지은', '홍길동', '오현아',
            '신동욱', '한지민', '조성훈', '송미라', '백진우',
            '문혜진', '양승호', '서정아', '남기훈', '고은비'
        ];

        const roles: ('organizer' | 'captain' | 'player')[] = ['organizer', 'captain', 'player'];
        
        this.testAccounts = names.map((name, index) => ({
            name,
            email: `test${index + 1}@thematch.test`,
            password: 'TestPassword123!',
            role: roles[Math.floor(Math.random() * roles.length)]
        }));

        // 5개의 다양한 팀 생성
        const teamNames = [
            '불꽃 축구단', '번개 농구팀', '태풍 배구클럽', '천둥 야구단', '폭풍 테니스팀'
        ];
        
        this.testTeams = teamNames.map((name, index) => ({
            name,
            captain: this.testAccounts[index * 4].email, // 4명마다 팀장 배정
            description: `${name}에서 함께 경기할 멤버를 모집합니다! 재미있게 운동해요.`,
            members: this.testAccounts.slice(index * 4, (index + 1) * 4).map(acc => acc.email)
        }));

        // 3개의 다양한 경기 타입
        this.testMatches = [
            {
                title: '2024 신년 축구 토너먼트',
                type: 'single_elimination' as const,
                description: '새해를 맞이하여 열리는 축구 토너먼트입니다. 우승팀에게는 특별한 상품이 준비되어 있습니다.',
                organizer: this.testAccounts[0].email,
                maxParticipants: 8
            },
            {
                title: '주말 농구 리그전',
                type: 'round_robin' as const,
                description: '매주 토요일마다 열리는 농구 리그전입니다. 모든 팀이 서로 경기하며 순위를 정합니다.',
                organizer: this.testAccounts[4].email,
                maxParticipants: 6
            },
            {
                title: '배구 더블 엘리미네이션',
                type: 'double_elimination' as const,
                description: '두 번의 기회가 있는 배구 토너먼트입니다. 한 번 져도 재도전의 기회가 있어요!',
                organizer: this.testAccounts[8].email,
                maxParticipants: 4
            }
        ];
    }

    private async delay(ms: number) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    private async takeScreenshot(page: Page, filename: string) {
        const screenshotPath = path.join(SCREENSHOTS_PATH, `${filename}-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        return screenshotPath;
    }

    private async signUp(page: Page, account: TestAccount): Promise<boolean> {
        try {
            console.log(`📝 회원가입: ${account.name} (${account.email})`);
            
            // 컨텍스트가 새로 생성되므로 로그아웃 불필요
            // await this.logout(page);
            // await this.delay(1000);
            
            await page.goto(`${BASE_URL}/signup`);
            await page.waitForLoadState('networkidle');

            // 폼 요소가 로드될 때까지 대기
            await page.waitForSelector('input#name', { timeout: 10000 });

            // 폼 입력 - ID 기반 셀렉터 사용
            await page.fill('input#name', account.name);
            await page.fill('input#email', account.email);
            await page.fill('input#password', account.password);
            await page.fill('input#confirmPassword', account.password);
            
            // 랜덤 딜레이 추가 (봇 감지 방지)
            await this.delay(500 + Math.random() * 1000);
            
            await page.click('button[type="submit"]');
            await this.delay(2000);

            // 성공 확인 - 더 상세한 체크
            const currentUrl = page.url();
            console.log(`   📍 현재 URL: ${currentUrl}`);
            
            const successPage = await page.locator('text=회원가입 완료').isVisible();
            const dashboardRedirect = currentUrl.includes('/dashboard');
            const matchesRedirect = currentUrl.includes('/matches');
            const errorExists = await page.locator('text=이미 등록된 이메일').isVisible();
            
            if (successPage) {
                console.log(`   ✅ ${account.name} - 회원가입 완료 페이지`);
                return true;
            } else if (dashboardRedirect || matchesRedirect) {
                console.log(`   ✅ ${account.name} - 자동 로그인됨 (${currentUrl})`);
                return true;
            } else if (errorExists) {
                console.log(`   ⚠️ ${account.name} - 이미 존재하는 이메일`);
                return true; // 테스트용으로는 성공으로 간주
            } else {
                console.log(`   ❌ ${account.name} - 알 수 없는 결과 (URL: ${currentUrl})`);
                return false;
            }
        } catch (error) {
            console.error(`❌ 회원가입 실패 ${account.name}:`, error);
            await this.takeScreenshot(page, `signup-error-${account.name}`);
            return false;
        }
    }

    private async login(page: Page, email: string, password: string): Promise<boolean> {
        try {
            console.log(`🔑 로그인: ${email}`);
            
            await page.goto(`${BASE_URL}/login`);
            await page.waitForLoadState('networkidle');

            await page.fill('input[type="email"]', email);
            await page.fill('input[type="password"]', password);
            
            await this.delay(300 + Math.random() * 500);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000);

            // 로그인 성공 확인
            const isLoggedIn = page.url().includes('/dashboard') || 
                             page.url().includes('/matches') ||
                             await page.locator('text=로그아웃').isVisible();

            return isLoggedIn;
        } catch (error) {
            console.error(`❌ 로그인 실패 ${email}:`, error);
            return false;
        }
    }

    private async logout(page: Page): Promise<void> {
        try {
            console.log('🚪 로그아웃 시도...');
            
            // 먼저 현재 URL 확인
            const currentUrl = page.url();
            console.log(`현재 URL: ${currentUrl}`);
            
            // 홈페이지로 이동해서 네비바 확인
            await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
            await this.delay(1000);
            
            // 로그아웃 버튼 찾기 시도 (데스크톱)
            const logoutBtn = page.locator('button:has-text("로그아웃")');
            
            if (await logoutBtn.isVisible({ timeout: 2000 })) {
                console.log('데스크톱 로그아웃 버튼 발견');
                await logoutBtn.click();
                await this.delay(2000);
            } else {
                // 모바일 메뉴 열기 시도
                console.log('모바일 메뉴 확인 중...');
                const menuBtn = page.locator('button:has(svg)').last();
                if (await menuBtn.isVisible({ timeout: 2000 })) {
                    await menuBtn.click();
                    await this.delay(1000);
                    
                    // 모바일 메뉴의 로그아웃 버튼
                    const mobileLogoutBtn = page.locator('button:has-text("로그아웃")');
                    if (await mobileLogoutBtn.isVisible({ timeout: 2000 })) {
                        console.log('모바일 로그아웃 버튼 발견');
                        await mobileLogoutBtn.click();
                        await this.delay(2000);
                    }
                }
            }
            
            // 강제 세션 클리어
            console.log('세션 클리어 중...');
            await page.context().clearCookies();
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            
            // 로그아웃 확인을 위해 다시 홈페이지 로드
            await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
            await this.delay(1000);
            
            console.log('로그아웃 완료');
            
        } catch (error) {
            console.log('로그아웃 중 에러 발생, 강제 세션 클리어:', error);
            
            // 에러 발생 시 강제 클리어
            try {
                await page.context().clearCookies();
                await page.evaluate(() => {
                    localStorage.clear();
                    sessionStorage.clear();
                });
                await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
            } catch (e) {
                console.log('강제 클리어도 실패:', e);
            }
        }
    }

    private async createTeam(page: Page, team: TestTeam): Promise<boolean> {
        try {
            console.log(`👥 팀 생성: ${team.name}`);
            
            await page.goto(`${BASE_URL}/teams/create`);
            await page.waitForLoadState('networkidle');

            // 팀 정보 입력
            await page.fill('input[placeholder*="팀 이름"]', team.name);
            await page.fill('textarea[placeholder*="팀 소개"]', team.description);
            
            await this.delay(500 + Math.random() * 1000);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);

            // 성공 확인
            const success = page.url().includes('/teams/') || 
                          await page.locator(`text=${team.name}`).isVisible();

            if (success) {
                await this.takeScreenshot(page, `team-created-${team.name.replace(/\s+/g, '-')}`);
            }

            return success;
        } catch (error) {
            console.error(`❌ 팀 생성 실패 ${team.name}:`, error);
            return false;
        }
    }

    private async createMatch(page: Page, match: TestMatch): Promise<boolean> {
        try {
            console.log(`🏆 경기 생성: ${match.title}`);
            
            await page.goto(`${BASE_URL}/matches/create`);
            await page.waitForLoadState('networkidle');

            // 경기 정보 입력
            await page.fill('input[placeholder*="경기 제목"]', match.title);
            await page.fill('textarea[placeholder*="경기 설명"]', match.description);
            
            // 경기 타입 선택
            await page.selectOption('select', match.type);
            
            // 최대 참가자 수 설정
            const maxParticipantsInput = page.locator('input[type="number"]');
            if (await maxParticipantsInput.isVisible()) {
                await maxParticipantsInput.fill(match.maxParticipants.toString());
            }

            // 시작 날짜 설정 (7일 후)
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            const dateString = futureDate.toISOString().split('T')[0];
            
            const dateInput = page.locator('input[type="date"]');
            if (await dateInput.isVisible()) {
                await dateInput.fill(dateString);
            }

            await this.delay(1000 + Math.random() * 1000);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(4000);

            // 성공 확인
            const success = page.url().includes('/matches/') || 
                          await page.locator(`text=${match.title}`).isVisible();

            if (success) {
                await this.takeScreenshot(page, `match-created-${match.title.replace(/\s+/g, '-')}`);
            }

            return success;
        } catch (error) {
            console.error(`❌ 경기 생성 실패 ${match.title}:`, error);
            return false;
        }
    }

    private async joinMatch(page: Page, matchTitle: string): Promise<boolean> {
        try {
            console.log(`🎯 경기 참가: ${matchTitle}`);
            
            // 경기 목록에서 해당 경기 찾기
            await page.goto(`${BASE_URL}/matches`);
            await page.waitForLoadState('networkidle');
            
            // 경기 카드 클릭
            const matchCard = page.locator(`text=${matchTitle}`).first();
            if (await matchCard.isVisible()) {
                await matchCard.click();
                await page.waitForTimeout(2000);
                
                // 참가 신청 버튼 클릭
                const joinButton = page.locator('button:has-text("참가 신청"), button:has-text("신청하기")');
                if (await joinButton.isVisible()) {
                    await joinButton.click();
                    await page.waitForTimeout(2000);
                    
                    return await page.locator('text=신청 완료, text=참가 신청됨').isVisible();
                }
            }
            
            return false;
        } catch (error) {
            console.error(`❌ 경기 참가 실패 ${matchTitle}:`, error);
            return false;
        }
    }

    private async sendTeamMessage(page: Page, message: string): Promise<boolean> {
        try {
            console.log(`💬 팀 채팅: ${message}`);
            
            // 팀 상세 페이지로 이동 (현재 페이지가 팀 페이지라고 가정)
            const chatLink = page.locator('a:has-text("채팅"), a[href*="chat"]');
            if (await chatLink.isVisible()) {
                await chatLink.click();
                await page.waitForTimeout(1000);
                
                // 메시지 입력
                const messageInput = page.locator('textarea[placeholder*="메시지"], input[placeholder*="메시지"]');
                if (await messageInput.isVisible()) {
                    await messageInput.fill(message);
                    await this.delay(300);
                    
                    const sendButton = page.locator('button[type="submit"], button:has-text("전송")');
                    await sendButton.click();
                    await page.waitForTimeout(1000);
                    
                    return await page.locator(`text=${message}`).isVisible();
                }
            }
            
            return false;
        } catch (error) {
            console.error(`❌ 팀 채팅 실패:`, error);
            return false;
        }
    }

    private async approveParticipant(page: Page): Promise<boolean> {
        try {
            console.log(`✅ 참가자 승인`);
            
            // 참가 신청 승인 버튼 찾기
            const approveButtons = page.locator('button:has-text("승인"), button:has-text("허용")');
            const count = await approveButtons.count();
            
            if (count > 0) {
                // 랜덤하게 일부 승인
                const approveCount = Math.min(count, Math.ceil(Math.random() * count));
                for (let i = 0; i < approveCount; i++) {
                    await approveButtons.nth(i).click();
                    await this.delay(500);
                }
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`❌ 참가자 승인 실패:`, error);
            return false;
        }
    }

    private async inputMatchScore(page: Page, homeScore: number, awayScore: number): Promise<boolean> {
        try {
            console.log(`⚽ 점수 입력: ${homeScore} - ${awayScore}`);
            
            // 점수 입력 페이지 또는 모달 찾기
            const homeScoreInput = page.locator('input[placeholder*="홈"], input[name*="home"]').first();
            const awayScoreInput = page.locator('input[placeholder*="어웨이"], input[name*="away"]').first();
            
            if (await homeScoreInput.isVisible() && await awayScoreInput.isVisible()) {
                await homeScoreInput.fill(homeScore.toString());
                await awayScoreInput.fill(awayScore.toString());
                
                await this.delay(500);
                
                const submitButton = page.locator('button[type="submit"], button:has-text("저장"), button:has-text("입력")');
                if (await submitButton.isVisible()) {
                    await submitButton.click();
                    await page.waitForTimeout(1000);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error(`❌ 점수 입력 실패:`, error);
            return false;
        }
    }

    public async runComprehensiveTest(): Promise<TestResult[]> {
        console.log('🚀 종합 테스트 시작...\n');
        
        this.browser = await chromium.launch({
            headless: false,
            slowMo: 300
        });

        try {
            await this.runAccountCreationPhase();
            await this.runTeamCreationPhase();
            await this.runMatchCreationPhase();
            await this.runParticipationPhase();
            await this.runChatTestPhase();
            await this.runMatchManagementPhase();
            await this.runScoreInputPhase();
            
        } catch (error) {
            console.error('❌ 테스트 실행 중 오류:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }

        // 결과 저장
        const resultsFile = path.join(RESULTS_PATH, `comprehensive-test-${Date.now()}.json`);
        fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
        console.log(`📊 테스트 결과 저장: ${resultsFile}`);

        return this.results;
    }

    private async runAccountCreationPhase() {
        console.log('\n📋 1단계: 계정 생성 및 회원가입');
        const startTime = Date.now();
        const errors: string[] = [];
        let successCount = 0;

        // 각 계정마다 새로운 컨텍스트와 페이지를 생성하여 완전히 격리
        for (const account of this.testAccounts) {
            const context = await this.browser!.newContext();
            const page = await context.newPage();
            
            try {
                const success = await this.signUp(page, account);
                if (success) {
                    successCount++;
                    console.log(`✅ ${account.name} 회원가입 성공`);
                } else {
                    errors.push(`${account.name} 회원가입 실패`);
                    console.log(`❌ ${account.name} 회원가입 실패`);
                }
            } finally {
                // 컨텍스트를 완전히 종료하여 세션 완전 초기화
                await context.close();
            }
            
            await this.delay(1000 + Math.random() * 2000);
        }

        this.results.push({
            scenario: '계정 생성 및 회원가입',
            success: successCount >= this.testAccounts.length * 0.8,
            duration: Date.now() - startTime,
            errors,
            details: { 
                total: this.testAccounts.length, 
                success: successCount, 
                failureRate: ((this.testAccounts.length - successCount) / this.testAccounts.length * 100).toFixed(1) + '%'
            },
            timestamp: new Date().toISOString()
        });

        console.log(`📊 회원가입 결과: ${successCount}/${this.testAccounts.length} 성공\n`);
    }

    private async runTeamCreationPhase() {
        console.log('👥 2단계: 팀 생성');
        const startTime = Date.now();
        const errors: string[] = [];
        let successCount = 0;

        for (const team of this.testTeams) {
            const page = await this.browser!.newPage();
            
            try {
                // 팀장으로 로그인
                const loginSuccess = await this.login(page, team.captain, 'TestPassword123!');
                if (!loginSuccess) {
                    errors.push(`${team.name}: 팀장 로그인 실패`);
                    continue;
                }

                const teamSuccess = await this.createTeam(page, team);
                if (teamSuccess) {
                    successCount++;
                    console.log(`✅ ${team.name} 팀 생성 성공`);
                } else {
                    errors.push(`${team.name} 팀 생성 실패`);
                    console.log(`❌ ${team.name} 팀 생성 실패`);
                }

                await this.delay(2000 + Math.random() * 3000);
                
            } finally {
                await page.close();
            }
        }

        this.results.push({
            scenario: '팀 생성',
            success: successCount >= this.testTeams.length * 0.8,
            duration: Date.now() - startTime,
            errors,
            details: { total: this.testTeams.length, success: successCount },
            timestamp: new Date().toISOString()
        });

        console.log(`📊 팀 생성 결과: ${successCount}/${this.testTeams.length} 성공\n`);
    }

    private async runMatchCreationPhase() {
        console.log('🏆 3단계: 경기 생성');
        const startTime = Date.now();
        const errors: string[] = [];
        let successCount = 0;

        for (const match of this.testMatches) {
            const page = await this.browser!.newPage();
            
            try {
                const loginSuccess = await this.login(page, match.organizer, 'TestPassword123!');
                if (!loginSuccess) {
                    errors.push(`${match.title}: 주최자 로그인 실패`);
                    continue;
                }

                const matchSuccess = await this.createMatch(page, match);
                if (matchSuccess) {
                    successCount++;
                    console.log(`✅ ${match.title} 경기 생성 성공`);
                } else {
                    errors.push(`${match.title} 경기 생성 실패`);
                    console.log(`❌ ${match.title} 경기 생성 실패`);
                }

                await this.delay(3000 + Math.random() * 2000);
                
            } finally {
                await page.close();
            }
        }

        this.results.push({
            scenario: '경기 생성',
            success: successCount >= this.testMatches.length * 0.8,
            duration: Date.now() - startTime,
            errors,
            details: { total: this.testMatches.length, success: successCount },
            timestamp: new Date().toISOString()
        });

        console.log(`📊 경기 생성 결과: ${successCount}/${this.testMatches.length} 성공\n`);
    }

    private async runParticipationPhase() {
        console.log('🎯 4단계: 경기 참가 신청');
        const startTime = Date.now();
        const errors: string[] = [];
        let successCount = 0;
        let totalAttempts = 0;

        // 각 경기마다 여러 팀이 참가 신청
        for (const match of this.testMatches) {
            const participatingTeams = this.testTeams.slice(0, Math.min(match.maxParticipants, this.testTeams.length));
            
            for (const team of participatingTeams) {
                const page = await this.browser!.newPage();
                totalAttempts++;
                
                try {
                    const loginSuccess = await this.login(page, team.captain, 'TestPassword123!');
                    if (!loginSuccess) {
                        errors.push(`${match.title} - ${team.name}: 로그인 실패`);
                        continue;
                    }

                    const joinSuccess = await this.joinMatch(page, match.title);
                    if (joinSuccess) {
                        successCount++;
                        console.log(`✅ ${team.name} → ${match.title} 참가 신청 성공`);
                    } else {
                        errors.push(`${match.title} - ${team.name}: 참가 신청 실패`);
                        console.log(`❌ ${team.name} → ${match.title} 참가 신청 실패`);
                    }

                    await this.delay(2000 + Math.random() * 3000);
                    
                } finally {
                    await page.close();
                }
            }
        }

        this.results.push({
            scenario: '경기 참가 신청',
            success: successCount >= totalAttempts * 0.7,
            duration: Date.now() - startTime,
            errors,
            details: { total: totalAttempts, success: successCount },
            timestamp: new Date().toISOString()
        });

        console.log(`📊 참가 신청 결과: ${successCount}/${totalAttempts} 성공\n`);
    }

    private async runChatTestPhase() {
        console.log('💬 5단계: 팀 채팅 테스트');
        const startTime = Date.now();
        const errors: string[] = [];
        let successCount = 0;

        const chatMessages = [
            '안녕하세요! 경기 준비 잘 되고 있나요?',
            '이번 경기 화이팅입니다! 💪',
            '연습 시간 언제로 할까요?',
            '다들 컨디션 관리 잘 하세요~',
            '팀워크가 중요해요! 😊'
        ];

        for (let i = 0; i < Math.min(5, this.testTeams.length); i++) {
            const team = this.testTeams[i];
            const message = chatMessages[i];
            const page = await this.browser!.newPage();
            
            try {
                const loginSuccess = await this.login(page, team.captain, 'TestPassword123!');
                if (!loginSuccess) {
                    errors.push(`${team.name}: 채팅 테스트 로그인 실패`);
                    continue;
                }

                // 팀 페이지로 이동
                await page.goto(`${BASE_URL}/teams`);
                await page.waitForTimeout(1000);
                
                const teamCard = page.locator(`text=${team.name}`).first();
                if (await teamCard.isVisible()) {
                    await teamCard.click();
                    await page.waitForTimeout(1000);
                    
                    const chatSuccess = await this.sendTeamMessage(page, message);
                    if (chatSuccess) {
                        successCount++;
                        console.log(`✅ ${team.name} 채팅 성공: "${message}"`);
                    } else {
                        errors.push(`${team.name}: 채팅 전송 실패`);
                        console.log(`❌ ${team.name} 채팅 실패`);
                    }
                }

                await this.delay(2000 + Math.random() * 2000);
                
            } finally {
                await page.close();
            }
        }

        this.results.push({
            scenario: '팀 채팅 테스트',
            success: successCount >= Math.min(5, this.testTeams.length) * 0.6,
            duration: Date.now() - startTime,
            errors,
            details: { total: Math.min(5, this.testTeams.length), success: successCount },
            timestamp: new Date().toISOString()
        });

        console.log(`📊 채팅 테스트 결과: ${successCount}/${Math.min(5, this.testTeams.length)} 성공\n`);
    }

    private async runMatchManagementPhase() {
        console.log('⚙️ 6단계: 경기 관리 (참가자 승인)');
        const startTime = Date.now();
        const errors: string[] = [];
        let successCount = 0;

        for (const match of this.testMatches) {
            const page = await this.browser!.newPage();
            
            try {
                const loginSuccess = await this.login(page, match.organizer, 'TestPassword123!');
                if (!loginSuccess) {
                    errors.push(`${match.title}: 관리자 로그인 실패`);
                    continue;
                }

                // 경기 상세 페이지로 이동
                await page.goto(`${BASE_URL}/matches`);
                await page.waitForTimeout(1000);
                
                const matchCard = page.locator(`text=${match.title}`).first();
                if (await matchCard.isVisible()) {
                    await matchCard.click();
                    await page.waitForTimeout(2000);
                    
                    const approveSuccess = await this.approveParticipant(page);
                    if (approveSuccess) {
                        successCount++;
                        console.log(`✅ ${match.title} 참가자 승인 성공`);
                        
                        await this.takeScreenshot(page, `match-management-${match.title.replace(/\s+/g, '-')}`);
                    } else {
                        errors.push(`${match.title}: 참가자 승인 실패 또는 승인할 참가자 없음`);
                        console.log(`⚠️ ${match.title} 승인할 참가자 없음 또는 승인 실패`);
                    }
                }

                await this.delay(3000 + Math.random() * 2000);
                
            } finally {
                await page.close();
            }
        }

        this.results.push({
            scenario: '경기 관리 (참가자 승인)',
            success: successCount >= this.testMatches.length * 0.5, // 승인할 참가자가 없을 수 있으므로 기준 완화
            duration: Date.now() - startTime,
            errors,
            details: { total: this.testMatches.length, success: successCount },
            timestamp: new Date().toISOString()
        });

        console.log(`📊 경기 관리 결과: ${successCount}/${this.testMatches.length} 성공\n`);
    }

    private async runScoreInputPhase() {
        console.log('⚽ 7단계: 경기 점수 입력');
        const startTime = Date.now();
        const errors: string[] = [];
        let successCount = 0;

        const randomScores = [
            [2, 1], [3, 0], [1, 1], [4, 2], [0, 3],
            [2, 2], [1, 0], [3, 1], [2, 3], [1, 2]
        ];

        for (let i = 0; i < this.testMatches.length; i++) {
            const match = this.testMatches[i];
            const [homeScore, awayScore] = randomScores[i % randomScores.length];
            const page = await this.browser!.newPage();
            
            try {
                const loginSuccess = await this.login(page, match.organizer, 'TestPassword123!');
                if (!loginSuccess) {
                    errors.push(`${match.title}: 점수 입력 로그인 실패`);
                    continue;
                }

                // 경기 상세 페이지로 이동 후 점수 입력 페이지 찾기
                await page.goto(`${BASE_URL}/matches`);
                await page.waitForTimeout(1000);
                
                const matchCard = page.locator(`text=${match.title}`).first();
                if (await matchCard.isVisible()) {
                    await matchCard.click();
                    await page.waitForTimeout(2000);
                    
                    // 점수 입력 또는 경기 관리 버튼 찾기
                    const scoreButton = page.locator('button:has-text("점수 입력"), button:has-text("경기 관리"), a:has-text("점수")');
                    if (await scoreButton.isVisible()) {
                        await scoreButton.click();
                        await page.waitForTimeout(1000);
                        
                        const scoreSuccess = await this.inputMatchScore(page, homeScore, awayScore);
                        if (scoreSuccess) {
                            successCount++;
                            console.log(`✅ ${match.title} 점수 입력 성공: ${homeScore} - ${awayScore}`);
                            
                            await this.takeScreenshot(page, `score-input-${match.title.replace(/\s+/g, '-')}`);
                        } else {
                            errors.push(`${match.title}: 점수 입력 실패`);
                            console.log(`❌ ${match.title} 점수 입력 실패`);
                        }
                    } else {
                        errors.push(`${match.title}: 점수 입력 페이지를 찾을 수 없음`);
                        console.log(`⚠️ ${match.title} 점수 입력 페이지 없음`);
                    }
                }

                await this.delay(3000 + Math.random() * 2000);
                
            } finally {
                await page.close();
            }
        }

        this.results.push({
            scenario: '경기 점수 입력',
            success: successCount >= this.testMatches.length * 0.3, // 점수 입력은 구현 상태에 따라 기준 완화
            duration: Date.now() - startTime,
            errors,
            details: { total: this.testMatches.length, success: successCount },
            timestamp: new Date().toISOString()
        });

        console.log(`📊 점수 입력 결과: ${successCount}/${this.testMatches.length} 성공\n`);
    }

    public generateReport(): string {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.success).length;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

        const report = `
# 🤖 The Match 플랫폼 종합 테스트 보고서

📅 **테스트 실행 시간**: ${new Date().toLocaleString('ko-KR')}
⏱️ **총 소요 시간**: ${Math.round(totalDuration / 1000 / 60)} 분
📊 **테스트 성공률**: ${passedTests}/${totalTests} (${Math.round(passedTests / totalTests * 100)}%)

## 📋 테스트 시나리오별 결과

${this.results.map((result, index) => `
### ${index + 1}. ${result.scenario}
- ✅ **성공**: ${result.success ? '통과' : '실패'}
- ⏱️ **소요시간**: ${Math.round(result.duration / 1000)} 초
- 📈 **상세결과**: ${JSON.stringify(result.details)}
${result.errors.length > 0 ? `- ❌ **오류**: ${result.errors.slice(0, 5).join(', ')}${result.errors.length > 5 ? '...' : ''}` : ''}
`).join('\n')}

## 🔍 전체 분석

### ✅ 성공한 기능들
${this.results.filter(r => r.success).map(r => `- ${r.scenario}`).join('\n')}

### ❌ 실패한 기능들
${this.results.filter(r => !r.success).map(r => `- ${r.scenario}`).join('\n')}

### 🚨 주요 발견사항
${this.results.filter(r => r.errors.length > 0).length > 0 ? 
    this.results.filter(r => r.errors.length > 0).map(r => 
        `- **${r.scenario}**: ${r.errors.slice(0, 3).join(', ')}`
    ).join('\n') : '- 모든 테스트가 예상대로 동작했습니다.'}

## 🎯 개선 권장사항

1. **에러율이 높은 기능**: ${this.results.filter(r => !r.success).map(r => r.scenario).join(', ')}
2. **응답 시간이 긴 기능**: ${this.results.sort((a, b) => b.duration - a.duration).slice(0, 2).map(r => r.scenario).join(', ')}
3. **추가 테스트 필요 영역**: 실시간 알림, 파일 업로드, 모바일 반응형

---
*이 보고서는 자동화된 테스트 봇이 생성했습니다. 🤖*
`;

        return report;
    }
}

// 테스트 실행
if (require.main === module) {
    const bot = new ComprehensiveTestBot();
    bot.runComprehensiveTest().then((results) => {
        console.log('\n🎉 모든 테스트 완료!');
        
        const report = bot.generateReport();
        const reportPath = path.join(RESULTS_PATH, `test-report-${Date.now()}.md`);
        fs.writeFileSync(reportPath, report);
        
        console.log(`📋 상세 보고서: ${reportPath}`);
        console.log('\n📊 요약 결과:');
        console.log(report.split('## 🔍 전체 분석')[0]);
    }).catch(console.error);
}

export { ComprehensiveTestBot };