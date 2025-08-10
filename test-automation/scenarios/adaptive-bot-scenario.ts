import { chromium, Browser, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://the-match-five.vercel.app';

interface BotConfig {
    mode: 'maintenance' | 'stress' | 'normal';
    concurrency: number;
    delayRange: [number, number];
    errorRetryCount: number;
    screenshotOnError: boolean;
}

interface ActionResult {
    action: string;
    success: boolean;
    duration: number;
    error?: string;
    retryCount?: number;
}

/**
 * 적응형 테스트 봇 - 서비스 상태에 맞춰 동작하는 지능형 봇
 * 실제 서비스 운영 시 더미 데이터 유지 및 안정성 모니터링에 활용
 */
export class AdaptiveTestBot {
    private browser: Browser | null = null;
    private config: BotConfig;
    private actionHistory: ActionResult[] = [];
    private currentUsers: Map<string, Page> = new Map();

    constructor(config: Partial<BotConfig> = {}) {
        this.config = {
            mode: 'normal',
            concurrency: 3,
            delayRange: [1000, 3000],
            errorRetryCount: 2,
            screenshotOnError: true,
            ...config
        };
    }

    private async delay(min?: number, max?: number) {
        const [minDelay, maxDelay] = [min || this.config.delayRange[0], max || this.config.delayRange[1]];
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    private async randomAction(page: Page): Promise<ActionResult> {
        const actions = [
            () => this.browseMatches(page),
            () => this.browseTeams(page),
            () => this.updateProfile(page),
            () => this.sendRandomMessage(page),
            () => this.viewMatchDetails(page),
            () => this.searchContent(page)
        ];

        const action = actions[Math.floor(Math.random() * actions.length)];
        const actionName = action.name.replace('bound ', '');
        
        const startTime = Date.now();
        let retryCount = 0;
        
        while (retryCount <= this.config.errorRetryCount) {
            try {
                await action();
                const duration = Date.now() - startTime;
                
                const result: ActionResult = {
                    action: actionName,
                    success: true,
                    duration,
                    retryCount
                };
                
                this.actionHistory.push(result);
                return result;
                
            } catch (error) {
                retryCount++;
                const errorMessage = error instanceof Error ? error.message : String(error);
                
                if (retryCount > this.config.errorRetryCount) {
                    const result: ActionResult = {
                        action: actionName,
                        success: false,
                        duration: Date.now() - startTime,
                        error: errorMessage,
                        retryCount
                    };
                    
                    this.actionHistory.push(result);
                    
                    if (this.config.screenshotOnError) {
                        await this.takeErrorScreenshot(page, actionName);
                    }
                    
                    return result;
                }
                
                console.log(`⚠️ ${actionName} 재시도 ${retryCount}/${this.config.errorRetryCount}`);
                await this.delay(500, 1500);
            }
        }

        // 이 부분은 도달하지 않아야 하지만 타입 안전성을 위해
        return {
            action: actionName,
            success: false,
            duration: Date.now() - startTime,
            error: 'Unknown error'
        };
    }

    private async browseMatches(page: Page) {
        console.log('🏆 경기 목록 탐색');
        await page.goto(`${BASE_URL}/matches`);
        await page.waitForLoadState('networkidle');
        
        // 랜덤한 필터 적용
        const filters = ['전체', '모집중', '진행중', '완료'];
        const randomFilter = filters[Math.floor(Math.random() * filters.length)];
        
        const filterBtn = page.locator(`text=${randomFilter}`);
        if (await filterBtn.isVisible()) {
            await filterBtn.click();
            await this.delay(500, 1000);
        }
        
        // 스크롤하여 더 많은 경기 로드
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight * Math.random());
        });
        
        await this.delay(1000, 2000);
    }

    private async browseTeams(page: Page) {
        console.log('👥 팀 목록 탐색');
        await page.goto(`${BASE_URL}/teams`);
        await page.waitForLoadState('networkidle');
        
        // 팀 카드 중 하나 클릭
        const teamCards = page.locator('[href*="/teams/"]');
        const count = await teamCards.count();
        
        if (count > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(count, 5));
            await teamCards.nth(randomIndex).click();
            await page.waitForTimeout(1000);
            
            // 팀 상세 정보 확인
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight * 0.5);
            });
        }
        
        await this.delay(1000, 2000);
    }

    private async updateProfile(page: Page) {
        console.log('👤 프로필 업데이트');
        await page.goto(`${BASE_URL}/profile`);
        await page.waitForLoadState('networkidle');
        
        // 간단한 프로필 정보 업데이트 시뮬레이션
        const descriptionField = page.locator('textarea[placeholder*="소개"], textarea[name*="description"]');
        if (await descriptionField.isVisible()) {
            const randomDescriptions = [
                '열정적으로 운동을 즐기는 선수입니다!',
                '팀워크를 중시하며 함께 성장하겠습니다.',
                '새로운 경기에 도전하는 것을 좋아해요.',
                '건강한 스포츠 문화를 만들어가요!'
            ];
            
            const randomDesc = randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)];
            await descriptionField.fill(randomDesc);
            
            const saveBtn = page.locator('button[type="submit"], button:has-text("저장")');
            if (await saveBtn.isVisible()) {
                await saveBtn.click();
                await this.delay(1000, 2000);
            }
        }
    }

    private async sendRandomMessage(page: Page) {
        console.log('💬 랜덤 메시지 전송');
        
        // 팀 채팅 페이지로 이동
        await page.goto(`${BASE_URL}/teams`);
        await page.waitForLoadState('networkidle');
        
        const teamLinks = page.locator('[href*="/teams/"]');
        const count = await teamLinks.count();
        
        if (count > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(count, 3));
            await teamLinks.nth(randomIndex).click();
            await page.waitForTimeout(1000);
            
            // 채팅 링크 찾기
            const chatLink = page.locator('a:has-text("채팅"), a[href*="chat"]');
            if (await chatLink.isVisible()) {
                await chatLink.click();
                await page.waitForTimeout(1000);
                
                // 메시지 입력
                const messageInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="메시지"]');
                if (await messageInput.isVisible()) {
                    const messages = [
                        '안녕하세요! 좋은 하루 되세요 😊',
                        '다음 경기 언제인가요?',
                        '모두 화이팅입니다! 💪',
                        '연습 일정 공유해주세요~',
                        '팀워크로 승리해봅시다!'
                    ];
                    
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    await messageInput.fill(randomMessage);
                    
                    const sendBtn = page.locator('button[type="submit"], button:has-text("전송")');
                    if (await sendBtn.isVisible()) {
                        await sendBtn.click();
                        await this.delay(500, 1000);
                    }
                }
            }
        }
    }

    private async viewMatchDetails(page: Page) {
        console.log('📊 경기 상세 정보 조회');
        await page.goto(`${BASE_URL}/matches`);
        await page.waitForLoadState('networkidle');
        
        const matchLinks = page.locator('[href*="/matches/"]').filter({ hasText: /토너먼트|리그|대회/ });
        const count = await matchLinks.count();
        
        if (count > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(count, 5));
            await matchLinks.nth(randomIndex).click();
            await page.waitForTimeout(1500);
            
            // 다양한 탭이나 섹션 확인
            const tabs = ['대진표', '참가팀', '결과', '채팅'];
            const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
            
            const tabLink = page.locator(`text=${randomTab}, a:has-text("${randomTab}")`);
            if (await tabLink.isVisible()) {
                await tabLink.click();
                await this.delay(1000, 2000);
            }
            
            // 페이지 스크롤
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight * Math.random());
            });
        }
    }

    private async searchContent(page: Page) {
        console.log('🔍 콘텐츠 검색');
        const searchQueries = ['축구', '농구', '배구', '토너먼트', '리그', '팀'];
        const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
        
        // 메인 페이지에서 검색 시도
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');
        
        const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]');
        if (await searchInput.isVisible()) {
            await searchInput.fill(randomQuery);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        }
    }

    private async takeErrorScreenshot(page: Page, actionName: string) {
        try {
            const screenshotPath = path.join(__dirname, '../screenshots', `error-${actionName}-${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 에러 스크린샷: ${screenshotPath}`);
        } catch (error) {
            console.log('스크린샷 저장 실패:', error);
        }
    }

    private async loginRandomUser(page: Page): Promise<boolean> {
        try {
            const testAccounts = [
                { email: 'test1@thematch.test', password: 'TestPassword123!' },
                { email: 'test2@thematch.test', password: 'TestPassword123!' },
                { email: 'test3@thematch.test', password: 'TestPassword123!' },
                { email: 'test4@thematch.test', password: 'TestPassword123!' },
                { email: 'test5@thematch.test', password: 'TestPassword123!' }
            ];

            const randomAccount = testAccounts[Math.floor(Math.random() * testAccounts.length)];
            
            await page.goto(`${BASE_URL}/login`);
            await page.waitForLoadState('networkidle');

            await page.fill('input[type="email"]', randomAccount.email);
            await page.fill('input[type="password"]', randomAccount.password);
            await page.click('button[type="submit"]');
            
            await page.waitForTimeout(2000);
            
            // 로그인 성공 확인
            const isLoggedIn = page.url().includes('/dashboard') || 
                             page.url().includes('/matches') ||
                             await page.locator('text=로그아웃').isVisible();

            if (isLoggedIn) {
                console.log(`✅ 로그인 성공: ${randomAccount.email}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.log('로그인 실패:', error);
            return false;
        }
    }

    public async startBotSession(durationMinutes: number = 30): Promise<void> {
        console.log(`🤖 적응형 봇 세션 시작 (${durationMinutes}분간 실행)`);
        console.log(`📋 설정: ${this.config.mode} 모드, 동시실행 ${this.config.concurrency}개`);
        
        this.browser = await chromium.launch({
            headless: true, // 봇 모드에서는 헤드리스로 실행
            args: ['--no-sandbox', '--disable-dev-shm-usage']
        });

        const endTime = Date.now() + (durationMinutes * 60 * 1000);
        const userSessions: Promise<void>[] = [];

        // 동시에 여러 사용자 세션 시작
        for (let i = 0; i < this.config.concurrency; i++) {
            userSessions.push(this.runUserSession(`user${i + 1}`, endTime));
            await this.delay(2000, 5000); // 사용자별 시작 시간 분산
        }

        // 모든 사용자 세션 완료 대기
        await Promise.allSettled(userSessions);
        
        if (this.browser) {
            await this.browser.close();
        }

        // 결과 분석 및 저장
        this.analyzeAndSaveResults();
    }

    private async runUserSession(userId: string, endTime: number): Promise<void> {
        const page = await this.browser!.newPage();
        this.currentUsers.set(userId, page);

        try {
            console.log(`👤 ${userId} 세션 시작`);
            
            // 로그인
            const loginSuccess = await this.loginRandomUser(page);
            if (!loginSuccess) {
                console.log(`❌ ${userId} 로그인 실패 - 세션 종료`);
                return;
            }

            // 지정된 시간까지 랜덤 액션 수행
            while (Date.now() < endTime) {
                await this.randomAction(page);
                
                // 적응형 대기 시간 (서버 부하 고려)
                const adaptiveDelay = this.calculateAdaptiveDelay();
                await this.delay(adaptiveDelay[0], adaptiveDelay[1]);
            }
            
        } catch (error) {
            console.log(`❌ ${userId} 세션 에러:`, error);
        } finally {
            await page.close();
            this.currentUsers.delete(userId);
            console.log(`👤 ${userId} 세션 종료`);
        }
    }

    private calculateAdaptiveDelay(): [number, number] {
        // 최근 액션들의 성공률을 기반으로 대기 시간 조정
        const recentActions = this.actionHistory.slice(-10);
        const successRate = recentActions.length > 0 
            ? recentActions.filter(a => a.success).length / recentActions.length 
            : 1;

        if (successRate < 0.7) {
            // 성공률이 낮으면 더 긴 대기 시간
            return [3000, 8000];
        } else if (successRate < 0.9) {
            // 보통 성공률
            return [2000, 5000];
        } else {
            // 높은 성공률
            return [1000, 3000];
        }
    }

    private analyzeAndSaveResults(): void {
        const totalActions = this.actionHistory.length;
        const successfulActions = this.actionHistory.filter(a => a.success).length;
        const successRate = totalActions > 0 ? (successfulActions / totalActions * 100).toFixed(1) : '0';

        const report = {
            timestamp: new Date().toISOString(),
            config: this.config,
            summary: {
                totalActions,
                successfulActions,
                failedActions: totalActions - successfulActions,
                successRate: `${successRate}%`,
                averageDuration: totalActions > 0 
                    ? Math.round(this.actionHistory.reduce((sum, a) => sum + a.duration, 0) / totalActions)
                    : 0
            },
            actionBreakdown: this.actionHistory.reduce((acc, action) => {
                acc[action.action] = acc[action.action] || { total: 0, success: 0, failed: 0 };
                acc[action.action].total++;
                if (action.success) {
                    acc[action.action].success++;
                } else {
                    acc[action.action].failed++;
                }
                return acc;
            }, {} as any),
            errors: this.actionHistory.filter(a => !a.success).map(a => ({
                action: a.action,
                error: a.error,
                retryCount: a.retryCount
            }))
        };

        const resultsPath = path.join(__dirname, '../results', `bot-session-${Date.now()}.json`);
        fs.writeFileSync(resultsPath, JSON.stringify(report, null, 2));
        
        console.log('\n🤖 봇 세션 완료!');
        console.log(`📊 총 액션: ${totalActions}, 성공률: ${successRate}%`);
        console.log(`💾 결과 저장: ${resultsPath}`);
        
        if (parseFloat(successRate) < 80) {
            console.log('⚠️ 성공률이 낮습니다. 서비스 상태를 확인해주세요.');
        }
    }
}

// CLI에서 직접 실행 가능
if (require.main === module) {
    const bot = new AdaptiveTestBot({
        mode: 'normal',
        concurrency: 2,
        delayRange: [2000, 5000]
    });
    
    bot.startBotSession(10).catch(console.error); // 10분간 실행
}