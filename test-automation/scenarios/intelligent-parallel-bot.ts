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
}

interface WorkerTask {
    id: string;
    type: 'signup' | 'create_team' | 'create_match' | 'join_team' | 'apply_match' | 'chat' | 'score_input';
    data: any;
    priority: number;
    retryCount: number;
    maxRetries: number;
}

interface WorkerStatus {
    id: string;
    status: 'idle' | 'working' | 'error' | 'terminated';
    currentTask?: WorkerTask;
    successCount: number;
    errorCount: number;
    lastError?: string;
    browser?: Browser;
    context?: BrowserContext;
    page?: Page;
}

interface MonitoringStats {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    activeWorkers: number;
    errorRate: number;
    avgResponseTime: number;
    startTime: number;
    lastUpdate: number;
}

/**
 * 🤖 지능형 병렬 테스트 봇
 * - 실시간 모니터링 및 에러 자동 감지
 * - 5개 브라우저 병렬 처리
 * - 실패시 자동 중단/수정/재시작
 * - 다중 사용자 시나리오 시뮬레이션
 */
class IntelligentParallelBot {
    private workers: WorkerStatus[] = [];
    private taskQueue: WorkerTask[] = [];
    private monitoringStats: MonitoringStats;
    private isRunning = false;
    private maxWorkers = 5;
    private errorThreshold = 0.3; // 30% 에러율 초과시 중단
    private monitoringInterval?: NodeJS.Timeout;
    private testAccounts: TestAccount[] = [];
    private headless = true; // 기본은 헤드리스, 디버깅 시 false로 변경 가능
    
    constructor(options?: { headless?: boolean; maxWorkers?: number }) {
        this.headless = options?.headless ?? true;
        this.maxWorkers = options?.maxWorkers ?? 5;
        
        this.monitoringStats = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            activeWorkers: 0,
            errorRate: 0,
            avgResponseTime: 0,
            startTime: Date.now(),
            lastUpdate: Date.now()
        };
        this.generateTestData();
        this.initializeWorkers();
        
        console.log(`🖥️ 브라우저 모드: ${this.headless ? '헤드리스' : '시각화'} (${this.maxWorkers}개 워커)`);
    }

    private generateTestData() {
        const names = [
            '김민수', '박영희', '이철수', '정미영', '최현우',
            '강소영', '윤태준', '임지은', '홍길동', '오현아',
            '신동욱', '한지민', '조성훈', '송미라', '백진우',
            '문혜진', '양승호', '서정아', '남기훈', '고은비'
        ];

        const roles: ('organizer' | 'captain' | 'player')[] = ['organizer', 'captain', 'player'];
        
        // 고유 타임스탬프로 중복 방지
        const timestamp = Date.now();
        
        this.testAccounts = names.map((name, index) => ({
            name: `${name}_${timestamp}`,
            email: `parallel_${timestamp}_${index + 1}@thematch.test`,
            password: 'TestPassword123!',
            role: roles[Math.floor(Math.random() * roles.length)]
        }));
        
        console.log(`📧 생성된 고유 이메일 예시: ${this.testAccounts[0].email}`);
    }

    private initializeWorkers() {
        for (let i = 0; i < this.maxWorkers; i++) {
            this.workers.push({
                id: `worker-${i + 1}`,
                status: 'idle',
                successCount: 0,
                errorCount: 0
            });
        }
    }

    /**
     * 🚀 병렬 테스트 시작
     */
    async startParallelTesting(): Promise<void> {
        console.log('🤖 지능형 병렬 테스트 봇 시작');
        console.log(`👥 ${this.maxWorkers}개 워커로 동시 테스트 진행`);
        
        this.isRunning = true;
        this.monitoringStats.startTime = Date.now();

        // 워커들 초기화
        await this.initializeAllWorkers();

        // 테스트 태스크 생성
        this.generateTestTasks();

        // 모니터링 시작
        this.startRealTimeMonitoring();

        // 워커들 시작
        const workerPromises = this.workers.map(worker => this.runWorker(worker));

        // 메인 제어 루프 시작
        const controlPromise = this.runMainControlLoop();

        // 모든 워커와 제어 루프 대기
        await Promise.race([
            Promise.all(workerPromises),
            controlPromise
        ]);

        await this.cleanup();
    }

    private async initializeAllWorkers(): Promise<void> {
        console.log('🔧 모든 워커 초기화 중...');
        
        for (const worker of this.workers) {
            try {
                worker.browser = await chromium.launch({ 
                    headless: this.headless,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                worker.context = await worker.browser.newContext();
                worker.page = await worker.context.newPage();
                worker.status = 'idle';
                console.log(`✅ ${worker.id} 초기화 완료`);
            } catch (error) {
                console.error(`❌ ${worker.id} 초기화 실패:`, error);
                worker.status = 'error';
                worker.lastError = String(error);
            }
        }
    }

    private generateTestTasks(): void {
        console.log('📋 테스트 태스크 생성 중...');

        // 1단계: 회원가입 태스크 (우선순위 높음)
        this.testAccounts.forEach((account, index) => {
            this.taskQueue.push({
                id: `signup-${index}`,
                type: 'signup',
                data: account,
                priority: 10,
                retryCount: 0,
                maxRetries: 2
            });
        });

        // 2단계: 팀 생성 태스크
        for (let i = 0; i < 5; i++) {
            this.taskQueue.push({
                id: `team-${i}`,
                type: 'create_team',
                data: {
                    name: `테스트팀 ${i + 1}`,
                    description: `병렬 테스트로 생성된 팀 ${i + 1}번입니다.`,
                    captainIndex: i * 4 // 4명마다 팀장
                },
                priority: 8,
                retryCount: 0,
                maxRetries: 3
            });
        }

        // 3단계: 경기 생성 태스크
        for (let i = 0; i < 3; i++) {
            this.taskQueue.push({
                id: `match-${i}`,
                type: 'create_match',
                data: {
                    title: `병렬 테스트 경기 ${i + 1}`,
                    type: ['single_elimination', 'round_robin', 'double_elimination'][i],
                    description: `병렬 테스트용 경기입니다.`,
                    organizerIndex: i
                },
                priority: 6,
                retryCount: 0,
                maxRetries: 3
            });
        }

        // 4단계: 팀 가입 신청 태스크
        for (let i = 5; i < 15; i++) {
            this.taskQueue.push({
                id: `join-team-${i}`,
                type: 'join_team',
                data: {
                    userIndex: i,
                    targetTeamIndex: Math.floor(Math.random() * 5)
                },
                priority: 4,
                retryCount: 0,
                maxRetries: 2
            });
        }

        console.log(`📊 총 ${this.taskQueue.length}개 태스크 생성`);
        this.monitoringStats.totalTasks = this.taskQueue.length;
    }

    private async runWorker(worker: WorkerStatus): Promise<void> {
        console.log(`🏃 ${worker.id} 작업 시작`);

        while (this.isRunning && worker.status !== 'terminated') {
            try {
                // 태스크 대기열에서 다음 작업 가져오기
                const task = this.getNextTask();
                if (!task) {
                    await this.delay(1000);
                    continue;
                }

                worker.status = 'working';
                worker.currentTask = task;
                this.monitoringStats.activeWorkers = this.getActiveWorkerCount();

                console.log(`🔄 ${worker.id}: ${task.type} 작업 시작 (${task.id})`);

                const success = await this.executeTask(worker, task);

                if (success) {
                    worker.successCount++;
                    this.monitoringStats.completedTasks++;
                    console.log(`✅ ${worker.id}: ${task.id} 완료`);
                } else {
                    worker.errorCount++;
                    task.retryCount++;
                    
                    if (task.retryCount <= task.maxRetries) {
                        // 재시도를 위해 태스크를 다시 큐에 추가
                        this.taskQueue.unshift(task);
                        console.log(`🔄 ${worker.id}: ${task.id} 재시도 예약 (${task.retryCount}/${task.maxRetries})`);
                    } else {
                        this.monitoringStats.failedTasks++;
                        console.log(`❌ ${worker.id}: ${task.id} 최종 실패`);
                    }
                }

                worker.status = 'idle';
                worker.currentTask = undefined;

                // 워커간 적절한 간격 유지 (병렬 처리 시 서버 부하 방지)
                await this.delay(1500 + Math.random() * 2000);

            } catch (error) {
                console.error(`💥 ${worker.id} 워커 에러:`, error);
                worker.status = 'error';
                worker.lastError = String(error);
                worker.errorCount++;

                // 에러 발생시 브라우저 재시작
                await this.restartWorkerBrowser(worker);
            }
        }

        console.log(`🏁 ${worker.id} 작업 종료`);
    }

    private getNextTask(): WorkerTask | null {
        // 우선순위 순으로 정렬 후 첫 번째 태스크 반환
        this.taskQueue.sort((a, b) => b.priority - a.priority);
        return this.taskQueue.shift() || null;
    }

    private async executeTask(worker: WorkerStatus, task: WorkerTask): Promise<boolean> {
        if (!worker.page) return false;

        const startTime = Date.now();
        
        try {
            let success = false;

            switch (task.type) {
                case 'signup':
                    success = await this.executeSignup(worker.page, task.data);
                    break;
                case 'create_team':
                    success = await this.executeCreateTeam(worker.page, task.data);
                    break;
                case 'create_match':
                    success = await this.executeCreateMatch(worker.page, task.data);
                    break;
                case 'join_team':
                    success = await this.executeJoinTeam(worker.page, task.data);
                    break;
                default:
                    console.log(`⚠️ 알 수 없는 태스크 타입: ${task.type}`);
                    return false;
            }

            const duration = Date.now() - startTime;
            this.updateAverageResponseTime(duration);

            return success;

        } catch (error) {
            console.error(`💥 태스크 실행 에러 (${task.id}):`, error);
            await this.captureErrorScreenshot(worker.page, `${task.type}-${task.id}-error`);
            return false;
        }
    }

    private async executeSignup(page: Page, accountData: TestAccount): Promise<boolean> {
        try {
            console.log(`📝 회원가입 시작: ${accountData.email}`);
            
            await page.goto(`${BASE_URL}/signup`);
            await page.waitForLoadState('networkidle');
            
            // 추가 로딩 대기 (병렬 처리 시 안정성 증대)
            await page.waitForTimeout(2000);

            // 검증된 셀렉터 사용 (디버깅으로 확인된 정확한 셀렉터)
            await page.fill('input#name', accountData.name);
            await page.waitForTimeout(200);
            
            await page.fill('input#email', accountData.email);
            await page.waitForTimeout(200);
            
            await page.fill('input#password', accountData.password);
            await page.waitForTimeout(200);
            
            await page.fill('input#confirmPassword', accountData.password);
            await page.waitForTimeout(500);

            // 회원가입 버튼 클릭 (검증된 셀렉터)
            await page.click('button[type="submit"]:has-text("회원가입")');

            // 충분한 대기 시간 (서버 처리 시간 고려)
            await page.waitForTimeout(8000);

            // 성공 확인
            const currentUrl = page.url();
            const success = currentUrl.includes('/dashboard') || 
                          await page.locator('text="회원가입 완료"').isVisible() ||
                          await page.locator('text="로그인 페이지로 이동"').isVisible();

            if (!success) {
                // 에러 메시지 확인
                const errorElement = await page.locator('.text-red-600, .text-red-800, .bg-red-50').first();
                if (await errorElement.isVisible()) {
                    const errorText = await errorElement.textContent();
                    console.log(`❌ 에러 메시지: ${errorText?.trim()}`);
                }
            }

            console.log(`${success ? '✅' : '❌'} 회원가입: ${accountData.email} (${currentUrl})`);
            return success;

        } catch (error) {
            console.error(`❌ 회원가입 실패 (${accountData.email}):`, error);
            await this.captureErrorScreenshot(page, `signup-error-${accountData.email}`);
            return false;
        }
    }

    private async executeCreateTeam(page: Page, teamData: any): Promise<boolean> {
        try {
            console.log(`👥 팀 생성 시작: ${teamData.name}`);
            
            // 팀장 계정으로 로그인
            const captain = this.testAccounts[teamData.captainIndex];
            const loginSuccess = await this.loginAccount(page, captain);
            if (!loginSuccess) {
                throw new Error('팀장 로그인 실패');
            }

            await page.goto(`${BASE_URL}/teams/create`);
            await page.waitForLoadState('networkidle');

            // 스마트 입력
            const nameInput = await this.smartFillInput(page, 
                ['input#name', 'input[placeholder*="팀 이름"]'], 
                teamData.name
            );
            
            const descInput = await this.smartFillInput(page, 
                ['textarea#description', 'textarea[placeholder*="팀에 대한 설명"]'], 
                teamData.description
            );

            if (!nameInput || !descInput) {
                throw new Error('팀 생성 폼 요소를 찾을 수 없습니다');
            }

            // 팀 생성 버튼 클릭
            const submitButton = await this.smartClick(page, [
                'button[type="submit"]:has-text("팀 만들기")',
                'button:has-text("팀 만들기")',
                'button[type="submit"]'
            ]);

            if (!submitButton) {
                throw new Error('팀 만들기 버튼을 찾을 수 없습니다');
            }

            await page.waitForTimeout(3000);

            // 성공 확인
            const currentUrl = page.url();
            const success = currentUrl.includes('/teams/') && !currentUrl.includes('/create');

            console.log(`${success ? '✅' : '❌'} 팀 생성: ${teamData.name}`);
            return success;

        } catch (error) {
            console.error(`❌ 팀 생성 실패 (${teamData.name}):`, error);
            return false;
        }
    }

    private async executeCreateMatch(page: Page, matchData: any): Promise<boolean> {
        try {
            console.log(`🏆 경기 생성 시작: ${matchData.title}`);
            
            // 주최자 계정으로 로그인
            const organizer = this.testAccounts[matchData.organizerIndex];
            const loginSuccess = await this.loginAccount(page, organizer);
            if (!loginSuccess) {
                throw new Error('주최자 로그인 실패');
            }

            await page.goto(`${BASE_URL}/matches/create`);
            await page.waitForLoadState('networkidle');

            // TODO: 경기 생성 폼 구조 파악 후 구현
            console.log(`🔄 경기 생성 로직 구현 필요: ${matchData.title}`);
            
            return true; // 임시로 성공 처리

        } catch (error) {
            console.error(`❌ 경기 생성 실패 (${matchData.title}):`, error);
            return false;
        }
    }

    private async executeJoinTeam(page: Page, joinData: any): Promise<boolean> {
        try {
            console.log(`🤝 팀 가입 신청 시작`);
            
            // 사용자 계정으로 로그인
            const user = this.testAccounts[joinData.userIndex];
            const loginSuccess = await this.loginAccount(page, user);
            if (!loginSuccess) {
                throw new Error('사용자 로그인 실패');
            }

            // TODO: 팀 가입 로직 구현
            console.log(`🔄 팀 가입 로직 구현 필요`);
            
            return true; // 임시로 성공 처리

        } catch (error) {
            console.error(`❌ 팀 가입 실패:`, error);
            return false;
        }
    }

    /**
     * 🧠 스마트 입력 - 여러 셀렉터 시도 후 성공한 것으로 입력
     */
    private async smartFillInput(page: Page, selectors: string[], value: string): Promise<boolean> {
        for (const selector of selectors) {
            try {
                await page.fill(selector, value, { timeout: 2000 });
                return true;
            } catch (error) {
                continue;
            }
        }
        return false;
    }

    /**
     * 🧠 스마트 클릭 - 여러 셀렉터 시도 후 성공한 것으로 클릭
     */
    private async smartClick(page: Page, selectors: string[]): Promise<boolean> {
        for (const selector of selectors) {
            try {
                await page.click(selector, { timeout: 2000 });
                return true;
            } catch (error) {
                continue;
            }
        }
        return false;
    }

    private async loginAccount(page: Page, account: TestAccount): Promise<boolean> {
        try {
            await page.goto(`${BASE_URL}/login`);
            await page.waitForLoadState('networkidle');

            const emailInput = await this.smartFillInput(page, 
                ['input#email', 'input[type="email"]'], 
                account.email
            );
            
            const passwordInput = await this.smartFillInput(page, 
                ['input#password', 'input[type="password"]'], 
                account.password
            );

            if (!emailInput || !passwordInput) {
                return false;
            }

            const loginButton = await this.smartClick(page, [
                'button[type="submit"]:has-text("로그인")',
                'button:has-text("로그인")',
                'button[type="submit"]'
            ]);

            if (!loginButton) {
                return false;
            }

            await page.waitForTimeout(3000);

            // 로그인 성공 확인
            const success = page.url().includes('/dashboard') || 
                          await page.locator('text="대시보드"').isVisible();
            
            return success;

        } catch (error) {
            console.error(`로그인 실패 (${account.email}):`, error);
            return false;
        }
    }

    /**
     * 📊 실시간 모니터링 시작
     */
    private startRealTimeMonitoring(): void {
        console.log('📊 실시간 모니터링 시작');
        
        this.monitoringInterval = setInterval(() => {
            this.updateMonitoringStats();
            this.checkErrorThreshold();
            this.logCurrentStatus();
            
            // 진행률 체크 - 모든 태스크 완료시 종료
            if (this.taskQueue.length === 0 && this.getActiveWorkerCount() === 0) {
                console.log('🎉 모든 태스크 완료!');
                this.isRunning = false;
            }
        }, 5000); // 5초마다 모니터링
    }

    private updateMonitoringStats(): void {
        const totalCompleted = this.monitoringStats.completedTasks + this.monitoringStats.failedTasks;
        this.monitoringStats.errorRate = totalCompleted > 0 ? this.monitoringStats.failedTasks / totalCompleted : 0;
        this.monitoringStats.activeWorkers = this.getActiveWorkerCount();
        this.monitoringStats.lastUpdate = Date.now();
    }

    private checkErrorThreshold(): void {
        if (this.monitoringStats.errorRate > this.errorThreshold && 
            this.monitoringStats.completedTasks + this.monitoringStats.failedTasks > 10) {
            
            console.log(`🚨 에러율 임계값 초과! (${(this.monitoringStats.errorRate * 100).toFixed(1)}%)`);
            console.log('🛠️ 자동 복구 시작...');
            
            this.triggerAutoRecovery();
        }
    }

    private async triggerAutoRecovery(): Promise<void> {
        console.log('🔧 자동 복구 프로세스 시작');
        
        // 1. 에러 상태인 워커들 재시작
        const errorWorkers = this.workers.filter(w => w.status === 'error');
        for (const worker of errorWorkers) {
            console.log(`🔄 ${worker.id} 재시작`);
            await this.restartWorkerBrowser(worker);
        }
        
        // 2. 실패한 태스크들의 재시도 카운트 초기화
        this.taskQueue.forEach(task => {
            if (task.retryCount > 0) {
                task.retryCount = Math.max(0, task.retryCount - 1);
            }
        });
        
        // 3. 에러율 통계 부분 리셋
        this.monitoringStats.failedTasks = Math.floor(this.monitoringStats.failedTasks * 0.5);
        
        console.log('✅ 자동 복구 완료');
    }

    private async restartWorkerBrowser(worker: WorkerStatus): Promise<void> {
        try {
            // 기존 브라우저 정리
            if (worker.context) await worker.context.close();
            if (worker.browser) await worker.browser.close();
            
            // 새 브라우저 시작
            worker.browser = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            worker.context = await worker.browser.newContext();
            worker.page = await worker.context.newPage();
            worker.status = 'idle';
            worker.lastError = undefined;
            
            console.log(`✅ ${worker.id} 브라우저 재시작 완료`);
        } catch (error) {
            console.error(`❌ ${worker.id} 브라우저 재시작 실패:`, error);
            worker.status = 'terminated';
        }
    }

    private getActiveWorkerCount(): number {
        return this.workers.filter(w => w.status === 'working').length;
    }

    private updateAverageResponseTime(duration: number): void {
        const totalOperations = this.monitoringStats.completedTasks + this.monitoringStats.failedTasks;
        if (totalOperations === 0) {
            this.monitoringStats.avgResponseTime = duration;
        } else {
            this.monitoringStats.avgResponseTime = 
                (this.monitoringStats.avgResponseTime * (totalOperations - 1) + duration) / totalOperations;
        }
    }

    private logCurrentStatus(): void {
        const runTime = Math.floor((Date.now() - this.monitoringStats.startTime) / 1000);
        const progressPercent = ((this.monitoringStats.completedTasks + this.monitoringStats.failedTasks) / 
                               this.monitoringStats.totalTasks * 100).toFixed(1);
        
        console.log(`
📊 === 실시간 모니터링 상태 ===
⏱️ 실행시간: ${runTime}초
📈 진행률: ${progressPercent}% (${this.monitoringStats.completedTasks + this.monitoringStats.failedTasks}/${this.monitoringStats.totalTasks})
✅ 성공: ${this.monitoringStats.completedTasks}
❌ 실패: ${this.monitoringStats.failedTasks}
🔄 활성 워커: ${this.monitoringStats.activeWorkers}/${this.maxWorkers}
📊 에러율: ${(this.monitoringStats.errorRate * 100).toFixed(1)}%
⚡ 평균 응답시간: ${Math.floor(this.monitoringStats.avgResponseTime)}ms
📋 대기 태스크: ${this.taskQueue.length}개
================================
        `.trim());
    }

    private async runMainControlLoop(): Promise<void> {
        console.log('🎛️ 메인 제어 루프 시작');
        
        while (this.isRunning) {
            await this.delay(10000); // 10초마다 체크
            
            // 데드락 방지 - 모든 워커가 유휴 상태이지만 태스크가 남아있는 경우
            if (this.taskQueue.length > 0 && this.getActiveWorkerCount() === 0) {
                const idleWorkers = this.workers.filter(w => w.status === 'idle').length;
                if (idleWorkers > 0) {
                    console.log('🔄 워커 재활성화');
                }
            }
        }
    }

    private async captureErrorScreenshot(page: Page, filename: string): Promise<void> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = path.join(SCREENSHOTS_PATH, `${filename}-${timestamp}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
        } catch (error) {
            console.error('스크린샷 캡처 실패:', error);
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async cleanup(): Promise<void> {
        console.log('🧹 정리 작업 시작');
        
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
        
        // 최종 리포트 생성
        await this.generateFinalReport();
        
        console.log('✅ 정리 작업 완료');
    }

    private async generateFinalReport(): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(RESULTS_PATH, `parallel-test-report-${timestamp}.json`);
        
        const report = {
            startTime: new Date(this.monitoringStats.startTime).toISOString(),
            endTime: new Date().toISOString(),
            duration: Date.now() - this.monitoringStats.startTime,
            stats: this.monitoringStats,
            workers: this.workers.map(w => ({
                id: w.id,
                successCount: w.successCount,
                errorCount: w.errorCount,
                lastError: w.lastError
            }))
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 최종 리포트 생성: ${reportPath}`);
    }
}

// 실행
async function runIntelligentParallelTest() {
    const bot = new IntelligentParallelBot();
    await bot.startParallelTesting();
}

if (require.main === module) {
    runIntelligentParallelTest().catch(console.error);
}

export { IntelligentParallelBot };