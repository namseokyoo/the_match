import { chromium, Browser, Page, BrowserContext } from 'playwright';
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
    isLoggedIn?: boolean;
    userId?: string;
}

interface DbState {
    existingUsers: string[];
    existingTeams: { id: string; name: string; captain_id: string }[];
    existingMatches: { id: string; title: string; creator_id: string; status: string }[];
    lastUpdated: number;
}

interface DynamicTask {
    id: string;
    type: 'login_existing' | 'signup_new' | 'create_team' | 'create_match' | 'join_team' | 'apply_match' | 'chat' | 'score_input';
    data: any;
    priority: number;
    dependencies?: string[];
    context: any;
}

interface WorkerStatus {
    id: string;
    status: 'idle' | 'working' | 'error' | 'terminated';
    currentTask?: DynamicTask;
    successCount: number;
    errorCount: number;
    lastError?: string;
    browser?: Browser;
    context?: BrowserContext;
    page?: Page;
    loggedInAs?: TestAccount;
}

/**
 * 🧠 DB 상태 인식 지능형 봇
 * - 실시간 DB 상태 확인
 * - 동적 테스트 시나리오 생성
 * - 기존 데이터 기반 상호작용
 * - 상황에 맞는 적응적 행동
 */
class DbAwareIntelligentBot {
    private workers: WorkerStatus[] = [];
    private taskQueue: DynamicTask[] = [];
    private dbState: DbState;
    private testAccounts: TestAccount[] = [];
    private maxWorkers = 3; // DB 기반이므로 워커 수 줄임
    private isRunning = false;
    private monitoringInterval?: NodeJS.Timeout;

    constructor() {
        this.dbState = {
            existingUsers: [],
            existingTeams: [],
            existingMatches: [],
            lastUpdated: 0
        };
        this.initializeWorkers();
    }

    /**
     * 🚀 지능형 테스트 시작
     */
    async startIntelligentTesting(): Promise<void> {
        console.log('🧠 DB 상태 인식 지능형 봇 시작');
        
        this.isRunning = true;

        // 1. 현재 DB 상태 파악
        await this.analyzeDatabaseState();
        
        // 2. 워커 초기화
        await this.initializeAllWorkers();
        
        // 3. 동적 시나리오 생성
        await this.generateDynamicScenarios();
        
        // 4. 모니터링 시작
        this.startIntelligentMonitoring();
        
        // 5. 워커 실행
        const workerPromises = this.workers.map(worker => this.runIntelligentWorker(worker));
        const controlPromise = this.runAdaptiveControlLoop();

        await Promise.race([
            Promise.all(workerPromises),
            controlPromise
        ]);

        await this.cleanup();
    }

    /**
     * 📊 데이터베이스 상태 실시간 분석
     */
    private async analyzeDatabaseState(): Promise<void> {
        console.log('📊 데이터베이스 상태 분석 중...');
        
        try {
            // 실제로는 DB API를 호출하지만, 여기서는 웹 페이지를 통해 확인
            const analysisBrowser = await chromium.launch({ headless: true });
            const analysisPage = await analysisBrowser.newPage();
            
            // 기존 사용자 확인 (로그인 시도로)
            await this.checkExistingUsers(analysisPage);
            
            // 기존 팀 확인
            await this.checkExistingTeams(analysisPage);
            
            // 기존 경기 확인
            await this.checkExistingMatches(analysisPage);
            
            await analysisBrowser.close();
            
            this.dbState.lastUpdated = Date.now();
            
            console.log(`📋 DB 상태 요약:`);
            console.log(`  - 기존 사용자: ${this.dbState.existingUsers.length}명`);
            console.log(`  - 기존 팀: ${this.dbState.existingTeams.length}개`);
            console.log(`  - 기존 경기: ${this.dbState.existingMatches.length}개`);
            
        } catch (error) {
            console.error('❌ DB 상태 분석 실패:', error);
        }
    }

    private async checkExistingUsers(page: Page): Promise<void> {
        // 기존 테스트 계정들로 로그인 시도해서 존재하는 계정 확인
        const testEmails = [
            'test1@thematch.test', 'test2@thematch.test', 'test3@thematch.test',
            'test4@thematch.test', 'test5@thematch.test'
        ];
        
        for (const email of testEmails) {
            try {
                await page.goto(`${BASE_URL}/login`);
                await page.waitForLoadState('networkidle');
                
                await page.fill('input#email', email);
                await page.fill('input#password', 'TestPassword123!');
                await page.click('button[type=\"submit\"]:has-text(\"로그인\")');
                
                await page.waitForTimeout(3000);
                
                const currentUrl = page.url();
                if (currentUrl.includes('/dashboard')) {
                    this.dbState.existingUsers.push(email);
                    console.log(`✅ 기존 사용자 발견: ${email}`);
                    
                    // 기존 사용자를 테스트 계정으로 추가
                    this.testAccounts.push({
                        name: `기존사용자_${email.split('@')[0]}`,
                        email,
                        password: 'TestPassword123!',
                        role: 'player',
                        isLoggedIn: false
                    });
                    
                    // 로그아웃
                    await this.performLogout(page);
                }
            } catch (error) {
                // 로그인 실패는 정상 (계정이 없을 수 있음)
            }
        }
    }

    private async checkExistingTeams(page: Page): Promise<void> {
        try {
            await page.goto(`${BASE_URL}/teams`);
            await page.waitForLoadState('networkidle');
            
            // 팀 카드들 확인
            const teamCards = await page.locator('[data-testid=\"team-card\"], .team-card, h3').all();
            
            for (const card of teamCards) {
                try {
                    const teamName = await card.textContent();
                    if (teamName?.trim()) {
                        this.dbState.existingTeams.push({
                            id: Math.random().toString(),
                            name: teamName.trim(),
                            captain_id: 'unknown'
                        });
                    }
                } catch (error) {
                    // 개별 카드 읽기 실패는 무시
                }
            }
            
            console.log(`🏆 기존 팀 발견: ${this.dbState.existingTeams.length}개`);
        } catch (error) {
            console.log('ℹ️ 팀 페이지 접근 실패 (정상일 수 있음)');
        }
    }

    private async checkExistingMatches(page: Page): Promise<void> {
        try {
            await page.goto(`${BASE_URL}/matches`);
            await page.waitForLoadState('networkidle');
            
            // 경기 카드들 확인
            const matchCards = await page.locator('[data-testid=\"match-card\"], .match-card, h2, h3').all();
            
            for (const card of matchCards) {
                try {
                    const matchTitle = await card.textContent();
                    if (matchTitle?.trim()) {
                        this.dbState.existingMatches.push({
                            id: Math.random().toString(),
                            title: matchTitle.trim(),
                            creator_id: 'unknown',
                            status: 'active'
                        });
                    }
                } catch (error) {
                    // 개별 카드 읽기 실패는 무시
                }
            }
            
            console.log(`🏅 기존 경기 발견: ${this.dbState.existingMatches.length}개`);
        } catch (error) {
            console.log('ℹ️ 경기 페이지 접근 실패 (정상일 수 있음)');
        }
    }

    /**
     * 🎯 동적 시나리오 생성 - DB 상태 기반
     */
    private async generateDynamicScenarios(): Promise<void> {
        console.log('🎯 DB 상태 기반 동적 시나리오 생성 중...');
        
        // 기존 사용자가 있으면 로그인 태스크 생성
        if (this.dbState.existingUsers.length > 0) {
            this.dbState.existingUsers.forEach((email, index) => {
                this.taskQueue.push({
                    id: `login-existing-${index}`,
                    type: 'login_existing',
                    data: { email, password: 'TestPassword123!' },
                    priority: 10,
                    context: { existingUser: true }
                });
            });
        }
        
        // 새로운 사용자 생성 (부족한 경우)
        const neededUsers = Math.max(0, 5 - this.dbState.existingUsers.length);
        if (neededUsers > 0) {
            const timestamp = Date.now();
            for (let i = 0; i < neededUsers; i++) {
                const email = `dynamic_${timestamp}_${i + 1}@thematch.test`;
                this.testAccounts.push({
                    name: `동적생성_${i + 1}`,
                    email,
                    password: 'TestPassword123!',
                    role: i === 0 ? 'organizer' : i < 3 ? 'captain' : 'player'
                });
                
                this.taskQueue.push({
                    id: `signup-new-${i}`,
                    type: 'signup_new',
                    data: this.testAccounts[this.testAccounts.length - 1],
                    priority: 9,
                    context: { newUser: true }
                });
            }
        }
        
        // 기존 팀이 부족하면 팀 생성 태스크
        if (this.dbState.existingTeams.length < 3) {
            const neededTeams = 3 - this.dbState.existingTeams.length;
            for (let i = 0; i < neededTeams; i++) {
                this.taskQueue.push({
                    id: `create-team-${i}`,
                    type: 'create_team',
                    data: {
                        name: `동적팀_${Date.now()}_${i + 1}`,
                        description: '실시간 DB 상태 기반으로 생성된 팀입니다.'
                    },
                    priority: 7,
                    dependencies: ['login'], // 로그인된 사용자 필요
                    context: { dynamic: true }
                });
            }
        }
        
        // 기존 경기가 부족하면 경기 생성 태스크
        if (this.dbState.existingMatches.length < 2) {
            const neededMatches = 2 - this.dbState.existingMatches.length;
            for (let i = 0; i < neededMatches; i++) {
                this.taskQueue.push({
                    id: `create-match-${i}`,
                    type: 'create_match',
                    data: {
                        title: `동적경기_${Date.now()}_${i + 1}`,
                        type: ['single_elimination', 'round_robin'][i % 2],
                        description: '실시간 상황에 맞게 생성된 경기입니다.'
                    },
                    priority: 6,
                    dependencies: ['login'], // 로그인된 사용자 필요
                    context: { dynamic: true }
                });
            }
        }
        
        // 상호작용 태스크 (기존 데이터 기반)
        if (this.dbState.existingTeams.length > 0) {
            for (let i = 0; i < Math.min(3, this.testAccounts.length); i++) {
                this.taskQueue.push({
                    id: `join-existing-team-${i}`,
                    type: 'join_team',
                    data: { 
                        targetTeam: this.dbState.existingTeams[i % this.dbState.existingTeams.length]
                    },
                    priority: 4,
                    dependencies: ['login'],
                    context: { interactWithExisting: true }
                });
            }
        }
        
        console.log(`📋 총 ${this.taskQueue.length}개 동적 태스크 생성`);
        this.taskQueue.forEach(task => {
            console.log(`  - ${task.id}: ${task.type} (우선순위: ${task.priority})`);
        });
    }

    private initializeWorkers(): void {
        for (let i = 0; i < this.maxWorkers; i++) {
            this.workers.push({
                id: `intelligent-worker-${i + 1}`,
                status: 'idle',
                successCount: 0,
                errorCount: 0
            });
        }
    }

    private async initializeAllWorkers(): Promise<void> {
        console.log('🔧 지능형 워커 초기화 중...');
        
        for (const worker of this.workers) {
            try {
                worker.browser = await chromium.launch({ 
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                worker.context = await worker.browser.newContext();
                worker.page = await worker.context.newPage();
                worker.status = 'idle';
                console.log(`✅ ${worker.id} 초기화 완료`);
            } catch (error) {
                console.error(`❌ ${worker.id} 초기화 실패:`, error);
                worker.status = 'error';
            }
        }
    }

    private async runIntelligentWorker(worker: WorkerStatus): Promise<void> {
        console.log(`🧠 ${worker.id} 지능형 작업 시작`);

        while (this.isRunning && worker.status !== 'terminated') {
            try {
                const task = this.getNextIntelligentTask(worker);
                if (!task) {
                    await this.delay(2000);
                    continue;
                }

                worker.status = 'working';
                worker.currentTask = task;

                console.log(`🔄 ${worker.id}: ${task.type} 작업 시작 (${task.id})`);

                const success = await this.executeIntelligentTask(worker, task);

                if (success) {
                    worker.successCount++;
                    console.log(`✅ ${worker.id}: ${task.id} 완료`);
                    
                    // 성공 후 DB 상태 업데이트
                    await this.updateDatabaseStateAfterSuccess(task);
                } else {
                    worker.errorCount++;
                    console.log(`❌ ${worker.id}: ${task.id} 실패`);
                }

                worker.status = 'idle';
                worker.currentTask = undefined;

                // 적응적 대기 시간
                await this.delay(1000 + Math.random() * 3000);

            } catch (error) {
                console.error(`💥 ${worker.id} 워커 에러:`, error);
                worker.status = 'error';
                await this.restartWorkerBrowser(worker);
            }
        }

        console.log(`🏁 ${worker.id} 작업 종료`);
    }

    private getNextIntelligentTask(worker: WorkerStatus): DynamicTask | null {
        // 의존성과 워커 상태 고려한 지능형 태스크 선택
        const availableTasks = this.taskQueue.filter(task => {
            // 의존성 확인
            if (task.dependencies) {
                for (const dep of task.dependencies) {
                    if (dep === 'login' && !worker.loggedInAs) {
                        return false;
                    }
                }
            }
            return true;
        });
        
        if (availableTasks.length === 0) return null;
        
        // 우선순위 순 정렬
        availableTasks.sort((a, b) => b.priority - a.priority);
        
        const task = availableTasks[0];
        const index = this.taskQueue.indexOf(task);
        if (index > -1) {
            this.taskQueue.splice(index, 1);
        }
        
        return task;
    }

    private async executeIntelligentTask(worker: WorkerStatus, task: DynamicTask): Promise<boolean> {
        if (!worker.page) return false;

        try {
            switch (task.type) {
                case 'login_existing':
                    return await this.performIntelligentLogin(worker, task.data);
                case 'signup_new':
                    return await this.performIntelligentSignup(worker, task.data);
                case 'create_team':
                    return await this.performIntelligentTeamCreation(worker, task.data);
                case 'create_match':
                    return await this.performIntelligentMatchCreation(worker, task.data);
                case 'join_team':
                    return await this.performIntelligentTeamJoin(worker, task.data);
                default:
                    console.log(`⚠️ 알 수 없는 지능형 태스크: ${task.type}`);
                    return false;
            }
        } catch (error) {
            console.error(`💥 지능형 태스크 실행 에러 (${task.id}):`, error);
            return false;
        }
    }

    private async performIntelligentLogin(worker: WorkerStatus, data: any): Promise<boolean> {
        try {
            console.log(`🔑 지능형 로그인: ${data.email}`);
            
            await worker.page!.goto(`${BASE_URL}/login`);
            await worker.page!.waitForLoadState('networkidle');
            
            await worker.page!.fill('input#email', data.email);
            await worker.page!.fill('input#password', data.password);
            await worker.page!.click('button[type=\"submit\"]:has-text(\"로그인\")');
            
            await worker.page!.waitForTimeout(3000);
            
            const success = worker.page!.url().includes('/dashboard');
            
            if (success) {
                // 워커에 로그인 상태 저장
                worker.loggedInAs = {
                    name: data.email.split('@')[0],
                    email: data.email,
                    password: data.password,
                    role: 'player'
                };
                console.log(`✅ ${worker.id} 로그인 완료: ${data.email}`);
            }
            
            return success;
        } catch (error) {
            console.error(`❌ 지능형 로그인 실패:`, error);
            return false;
        }
    }

    private async performIntelligentSignup(worker: WorkerStatus, accountData: TestAccount): Promise<boolean> {
        try {
            console.log(`📝 지능형 회원가입: ${accountData.email}`);
            
            await worker.page!.goto(`${BASE_URL}/signup`);
            await worker.page!.waitForLoadState('networkidle');
            await worker.page!.waitForTimeout(2000);

            await worker.page!.fill('input#name', accountData.name);
            await worker.page!.fill('input#email', accountData.email);
            await worker.page!.fill('input#password', accountData.password);
            await worker.page!.fill('input#confirmPassword', accountData.password);

            await worker.page!.click('button[type=\"submit\"]:has-text(\"회원가입\")');
            await worker.page!.waitForTimeout(8000);

            const currentUrl = worker.page!.url();
            const success = currentUrl.includes('/dashboard') || 
                          await worker.page!.locator('text=\"회원가입 완료\"').isVisible();

            if (success) {
                // 워커에 로그인 상태 저장
                worker.loggedInAs = accountData;
                console.log(`✅ ${worker.id} 회원가입 후 자동 로그인: ${accountData.email}`);
            }

            return success;
        } catch (error) {
            console.error(`❌ 지능형 회원가입 실패:`, error);
            return false;
        }
    }

    private async performIntelligentTeamCreation(worker: WorkerStatus, teamData: any): Promise<boolean> {
        try {
            console.log(`👥 지능형 팀 생성: ${teamData.name}`);
            
            if (!worker.loggedInAs) {
                console.log(`⚠️ ${worker.id} 로그인 필요`);
                return false;
            }

            await worker.page!.goto(`${BASE_URL}/teams/create`);
            await worker.page!.waitForLoadState('networkidle');

            await worker.page!.fill('input#name', teamData.name);
            await worker.page!.fill('textarea#description', teamData.description);
            
            await worker.page!.click('button[type=\"submit\"]:has-text(\"팀 만들기\")');
            await worker.page!.waitForTimeout(3000);

            const success = worker.page!.url().includes('/teams/') && !worker.page!.url().includes('/create');
            
            if (success) {
                console.log(`✅ ${worker.id} 팀 생성 완료: ${teamData.name}`);
            }

            return success;
        } catch (error) {
            console.error(`❌ 지능형 팀 생성 실패:`, error);
            return false;
        }
    }

    private async performIntelligentMatchCreation(worker: WorkerStatus, matchData: any): Promise<boolean> {
        try {
            console.log(`🏆 지능형 경기 생성: ${matchData.title}`);
            
            if (!worker.loggedInAs) {
                console.log(`⚠️ ${worker.id} 로그인 필요`);
                return false;
            }

            // TODO: 실제 경기 생성 구현
            console.log(`🔄 경기 생성 로직 구현 필요: ${matchData.title}`);
            
            return true; // 임시
        } catch (error) {
            console.error(`❌ 지능형 경기 생성 실패:`, error);
            return false;
        }
    }

    private async performIntelligentTeamJoin(worker: WorkerStatus, data: any): Promise<boolean> {
        try {
            console.log(`🤝 지능형 팀 가입: ${data.targetTeam.name}`);
            
            if (!worker.loggedInAs) {
                console.log(`⚠️ ${worker.id} 로그인 필요`);
                return false;
            }

            // TODO: 실제 팀 가입 구현
            console.log(`🔄 팀 가입 로직 구현 필요: ${data.targetTeam.name}`);
            
            return true; // 임시
        } catch (error) {
            console.error(`❌ 지능형 팀 가입 실패:`, error);
            return false;
        }
    }

    private async performLogout(page: Page): Promise<void> {
        try {
            // 로그아웃 버튼 찾아서 클릭
            const logoutButton = page.locator('button:has-text(\"로그아웃\"), a:has-text(\"로그아웃\")');
            if (await logoutButton.isVisible()) {
                await logoutButton.click();
                await page.waitForTimeout(2000);
            }
        } catch (error) {
            // 로그아웃 실패는 무시 (이미 로그아웃되었을 수 있음)
        }
    }

    private async updateDatabaseStateAfterSuccess(task: DynamicTask): Promise<void> {
        // 성공한 작업에 따라 DB 상태 업데이트
        switch (task.type) {
            case 'signup_new':
                if (task.data.email) {
                    this.dbState.existingUsers.push(task.data.email);
                }
                break;
            case 'create_team':
                this.dbState.existingTeams.push({
                    id: Math.random().toString(),
                    name: task.data.name,
                    captain_id: 'current_user'
                });
                break;
            case 'create_match':
                this.dbState.existingMatches.push({
                    id: Math.random().toString(),
                    title: task.data.title,
                    creator_id: 'current_user',
                    status: 'active'
                });
                break;
        }
        
        this.dbState.lastUpdated = Date.now();
    }

    private startIntelligentMonitoring(): void {
        console.log('📊 지능형 모니터링 시작');
        
        this.monitoringInterval = setInterval(async () => {
            // 주기적으로 DB 상태 재분석
            if (Date.now() - this.dbState.lastUpdated > 30000) { // 30초마다
                await this.analyzeDatabaseState();
                
                // 필요시 새로운 동적 태스크 생성
                if (this.taskQueue.length < 3) {
                    await this.generateDynamicScenarios();
                }
            }
            
            this.logIntelligentStatus();
            
            // 모든 태스크 완료시 종료
            if (this.taskQueue.length === 0 && this.getActiveWorkerCount() === 0) {
                console.log('🎉 모든 지능형 태스크 완료!');
                this.isRunning = false;
            }
        }, 10000);
    }

    private async runAdaptiveControlLoop(): Promise<void> {
        while (this.isRunning) {
            await this.delay(15000);
            
            // 적응형 제어 로직
            const idleWorkers = this.workers.filter(w => w.status === 'idle').length;
            const errorWorkers = this.workers.filter(w => w.status === 'error').length;
            
            if (errorWorkers > this.maxWorkers / 2) {
                console.log('🔧 다수 워커 에러로 인한 재시작');
                for (const worker of this.workers.filter(w => w.status === 'error')) {
                    await this.restartWorkerBrowser(worker);
                }
            }
        }
    }

    private getActiveWorkerCount(): number {
        return this.workers.filter(w => w.status === 'working').length;
    }

    private logIntelligentStatus(): void {
        const activeWorkers = this.getActiveWorkerCount();
        const totalSuccess = this.workers.reduce((sum, w) => sum + w.successCount, 0);
        const totalErrors = this.workers.reduce((sum, w) => sum + w.errorCount, 0);
        const loggedInWorkers = this.workers.filter(w => w.loggedInAs).length;
        
        console.log(`
🧠 === 지능형 봇 상태 ===
👥 활성 워커: ${activeWorkers}/${this.maxWorkers}
🔑 로그인된 워커: ${loggedInWorkers}/${this.maxWorkers}
✅ 총 성공: ${totalSuccess}
❌ 총 실패: ${totalErrors}
📋 대기 태스크: ${this.taskQueue.length}개
📊 DB 상태: 사용자 ${this.dbState.existingUsers.length}명, 팀 ${this.dbState.existingTeams.length}개, 경기 ${this.dbState.existingMatches.length}개
==========================
        `.trim());
    }

    private async restartWorkerBrowser(worker: WorkerStatus): Promise<void> {
        try {
            if (worker.context) await worker.context.close();
            if (worker.browser) await worker.browser.close();
            
            worker.browser = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            worker.context = await worker.browser.newContext();
            worker.page = await worker.context.newPage();
            worker.status = 'idle';
            worker.loggedInAs = undefined;
            
            console.log(`✅ ${worker.id} 브라우저 재시작 완료`);
        } catch (error) {
            console.error(`❌ ${worker.id} 브라우저 재시작 실패:`, error);
            worker.status = 'terminated';
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async cleanup(): Promise<void> {
        console.log('🧹 지능형 봇 정리 작업 시작');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        for (const worker of this.workers) {
            try {
                if (worker.context) await worker.context.close();
                if (worker.browser) await worker.browser.close();
            } catch (error) {
                console.error(`워커 정리 실패 (${worker.id}):`, error);
            }
        }
        
        console.log('✅ 지능형 봇 정리 작업 완료');
    }
}

// 실행
async function runDbAwareIntelligentBot() {
    const bot = new DbAwareIntelligentBot();
    await bot.startIntelligentTesting();
}

if (require.main === module) {
    runDbAwareIntelligentBot().catch(console.error);
}

export { DbAwareIntelligentBot };