import { chromium, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const TEST_ACCOUNTS_PATH = path.join(process.cwd(), 'test-accounts.json');
const BASE_URL = 'https://the-match-five.vercel.app';

interface TestAccount {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
    team: string | null;
    description: string;
}

interface TestAccountsData {
    accounts: TestAccount[];
}

interface TestResult {
    phase: string;
    action: string;
    user: string;
    success: boolean;
    error?: string;
    details?: string;
}

// 프로젝트 구조 기반 정확한 테스트 플랜
class ComprehensiveTestPlan {
    private browser!: Browser;
    private results: TestResult[] = [];
    private testData!: TestAccountsData;

    async initialize() {
        console.log('🚀 프로젝트 구조 기반 종합 테스트 시작!');
        
        this.browser = await chromium.launch({ 
            headless: false, 
            slowMo: 800 
        });
        
        this.testData = JSON.parse(
            fs.readFileSync(TEST_ACCOUNTS_PATH, 'utf-8')
        );
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    private async createBrowserSession(): Promise<{ context: BrowserContext; page: Page }> {
        const context = await this.browser.newContext({ 
            viewport: { width: 1280, height: 720 } 
        });
        const page = await context.newPage();
        return { context, page };
    }

    private async login(page: Page, account: TestAccount): Promise<boolean> {
        try {
            await page.goto(`${BASE_URL}/login`);
            await page.waitForLoadState('networkidle');
            
            await page.fill('input[placeholder*="example"]', account.email);
            await page.fill('input[placeholder*="비밀번호"]', account.password);
            await page.click('button[type="submit"]');
            
            // 경기 목록 페이지로 리다이렉트 대기
            await page.waitForURL('**/matches', { timeout: 10000 });
            console.log(`   ✅ ${account.name} 로그인 성공`);
            return true;
        } catch (error) {
            console.log(`   ❌ ${account.name} 로그인 실패: ${error.message}`);
            return false;
        }
    }

    private logResult(phase: string, action: string, user: string, success: boolean, error?: string, details?: string) {
        const result: TestResult = { phase, action, user, success, error, details };
        this.results.push(result);
        
        const status = success ? '✅' : '❌';
        console.log(`   ${status} ${action} (${user})`);
        if (error) console.log(`      오류: ${error}`);
        if (details) console.log(`      상세: ${details}`);
    }

    // Phase 1: 팀 생성 (정확한 네비게이션 경로 사용)
    async executeTeamCreation() {
        console.log('\n📋 Phase 1: 팀 생성');
        
        const teamCreators = this.testData.accounts.filter(a => 
            a.team && (a.role === 'team_captain' || a.role === 'match_creator')
        );

        for (let i = 0; i < Math.min(4, teamCreators.length); i++) {
            const account = teamCreators[i];
            if (!account.team) continue;

            const { context, page } = await this.createBrowserSession();
            
            try {
                // 로그인
                const loginSuccess = await this.login(page, account);
                if (!loginSuccess) {
                    this.logResult('Team Creation', `팀 "${account.team}" 생성`, account.name, false, '로그인 실패');
                    continue;
                }

                // 로그인 후 /matches 페이지에 있음 - 네비게이션을 통해 팀 페이지로 이동
                await page.click('a[href="/teams"]');
                await page.waitForLoadState('networkidle');
                console.log(`   📋 팀 페이지로 이동`);
                
                // 팀 생성 버튼 클릭 (네비바의 "팀 생성" 버튼 사용)
                await page.click('a[href="/teams/create"]');
                await page.waitForLoadState('networkidle');
                console.log(`   🆕 팀 생성 페이지로 이동`);
                
                // 폼 작성
                await page.fill('input[id="name"]', account.team);
                await page.fill('textarea[id="description"]', `${account.team} 팀입니다. ${account.name}이 팀장을 맡고 있습니다.`);
                
                // 폼 제출
                await page.click('button[type="submit"]');
                await page.waitForTimeout(3000);
                
                // 성공 확인 - 팀 상세 페이지 또는 팀 목록 페이지로 이동했는지 확인
                const currentUrl = page.url();
                const success = currentUrl.includes('/teams/') || currentUrl.includes('/teams');
                
                this.logResult(
                    'Team Creation', 
                    `팀 "${account.team}" 생성`, 
                    account.name, 
                    success,
                    success ? undefined : '팀 생성 후 리다이렉트 실패',
                    `현재 URL: ${currentUrl}`
                );
                
            } catch (error) {
                this.logResult('Team Creation', `팀 "${account.team}" 생성`, account.name, false, error.message);
            } finally {
                await context.close();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    // Phase 2: 경기 생성 (이미 /matches 페이지에서 시작)
    async executeMatchCreation() {
        console.log('\n📋 Phase 2: 경기 생성');
        
        const matchCreators = this.testData.accounts.filter(a => a.role === 'match_creator');
        const matches = [
            { name: '2025 봄 챔피언십', type: 'single_elimination' },
            { name: '주말 리그', type: 'league' }
        ];

        for (let i = 0; i < Math.min(2, matchCreators.length); i++) {
            const account = matchCreators[i];
            const match = matches[i];
            
            const { context, page } = await this.createBrowserSession();
            
            try {
                // 로그인 (자동으로 /matches 페이지로 이동)
                const loginSuccess = await this.login(page, account);
                if (!loginSuccess) {
                    this.logResult('Match Creation', `경기 "${match.name}" 생성`, account.name, false, '로그인 실패');
                    continue;
                }

                // 이미 /matches 페이지에 있으므로 바로 경기 생성 버튼 클릭
                await page.click('a[href="/matches/create"]'); // 네비바의 "경기 생성" 버튼
                await page.waitForLoadState('networkidle');
                console.log(`   🆕 경기 생성 페이지로 이동`);
                
                // 폼 작성
                await page.fill('input[id="title"]', match.name);
                await page.fill('textarea[id="description"]', `${match.name} - 테스트 경기입니다.`);
                await page.selectOption('select[id="type"]', match.type);
                
                // 날짜 설정
                const today = new Date();
                const deadline = new Date(today);
                deadline.setDate(deadline.getDate() + 7);
                const startDate = new Date(today);
                startDate.setDate(startDate.getDate() + 14);
                
                await page.fill('input[id="registration_deadline"]', deadline.toISOString().slice(0, 16));
                await page.fill('input[id="start_date"]', startDate.toISOString().slice(0, 16));
                
                // 폼 제출
                await page.click('button[type="submit"]');
                await page.waitForTimeout(3000);
                
                // 성공 확인
                const currentUrl = page.url();
                const success = currentUrl.includes('/matches/') && !currentUrl.includes('/create');
                
                this.logResult(
                    'Match Creation', 
                    `경기 "${match.name}" 생성`, 
                    account.name, 
                    success,
                    success ? undefined : '경기 생성 후 리다이렉트 실패',
                    `현재 URL: ${currentUrl}`
                );
                
            } catch (error) {
                this.logResult('Match Creation', `경기 "${match.name}" 생성`, account.name, false, error.message);
            } finally {
                await context.close();
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    // Phase 3: 팀 가입 신청
    async executeTeamJoining() {
        console.log('\n📋 Phase 3: 팀 가입 신청');
        
        const players = this.testData.accounts.filter(a => a.role === 'player').slice(0, 3);
        
        for (const player of players) {
            if (!player.team) continue;
            
            const { context, page } = await this.createBrowserSession();
            
            try {
                const loginSuccess = await this.login(page, player);
                if (!loginSuccess) {
                    this.logResult('Team Joining', `팀 "${player.team}" 가입 신청`, player.name, false, '로그인 실패');
                    continue;
                }

                // 팀 페이지로 이동
                await page.click('a[href="/teams"]');
                await page.waitForLoadState('networkidle');
                
                // 목표 팀 찾기 및 클릭
                const teamExists = await page.locator(`text="${player.team}"`).first().isVisible();
                if (teamExists) {
                    await page.click(`text="${player.team}"`);
                    await page.waitForLoadState('networkidle');
                    
                    // 팀 가입 버튼 클릭 시도
                    const joinButton = page.locator('button').filter({ hasText: /가입|참여|신청/ }).first();
                    const joinButtonVisible = await joinButton.isVisible();
                    
                    if (joinButtonVisible) {
                        await joinButton.click();
                        await page.waitForTimeout(2000);
                        
                        this.logResult('Team Joining', `팀 "${player.team}" 가입 신청`, player.name, true);
                    } else {
                        this.logResult('Team Joining', `팀 "${player.team}" 가입 신청`, player.name, false, '가입 버튼을 찾을 수 없음');
                    }
                } else {
                    this.logResult('Team Joining', `팀 "${player.team}" 가입 신청`, player.name, false, '팀을 찾을 수 없음');
                }
                
            } catch (error) {
                this.logResult('Team Joining', `팀 "${player.team}" 가입 신청`, player.name, false, error.message);
            } finally {
                await context.close();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    // Phase 4: 경기 참가 신청
    async executeMatchParticipation() {
        console.log('\n📋 Phase 4: 경기 참가 신청');
        
        const teamCaptains = this.testData.accounts.filter(a => a.role === 'team_captain').slice(0, 3);
        const targetMatches = ['2025 봄 챔피언십', '주말 리그'];
        
        for (const captain of teamCaptains) {
            if (!captain.team) continue;
            
            for (const matchName of targetMatches) {
                const { context, page } = await this.createBrowserSession();
                
                try {
                    const loginSuccess = await this.login(page, captain);
                    if (!loginSuccess) {
                        this.logResult('Match Participation', `경기 "${matchName}" 참가 신청`, captain.name, false, '로그인 실패');
                        continue;
                    }

                    // 이미 /matches 페이지에 있음
                    const matchExists = await page.locator(`text="${matchName}"`).first().isVisible();
                    
                    if (matchExists) {
                        await page.click(`text="${matchName}"`);
                        await page.waitForLoadState('networkidle');
                        
                        // 참가 신청 버튼 찾기
                        const participateButton = page.locator('button').filter({ hasText: /참가|신청|참여/ }).first();
                        const buttonVisible = await participateButton.isVisible();
                        
                        if (buttonVisible) {
                            await participateButton.click();
                            await page.waitForTimeout(2000);
                            
                            // 팀 선택 드롭다운이 있다면 팀 선택
                            const teamSelect = page.locator('select').first();
                            const selectVisible = await teamSelect.isVisible();
                            
                            if (selectVisible) {
                                await teamSelect.selectOption({ label: captain.team });
                                const confirmButton = page.locator('button').filter({ hasText: /확인|신청/ }).first();
                                if (await confirmButton.isVisible()) {
                                    await confirmButton.click();
                                }
                            }
                            
                            this.logResult('Match Participation', `경기 "${matchName}" 참가 신청`, captain.name, true);
                        } else {
                            this.logResult('Match Participation', `경기 "${matchName}" 참가 신청`, captain.name, false, '참가 버튼을 찾을 수 없음');
                        }
                    } else {
                        this.logResult('Match Participation', `경기 "${matchName}" 참가 신청`, captain.name, false, '경기를 찾을 수 없음');
                    }
                    
                } catch (error) {
                    this.logResult('Match Participation', `경기 "${matchName}" 참가 신청`, captain.name, false, error.message);
                } finally {
                    await context.close();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    }

    async generateReport() {
        console.log('\n✨ 종합 테스트 완료!');
        console.log('\n📊 결과 요약:');
        
        const phases = ['Team Creation', 'Match Creation', 'Team Joining', 'Match Participation'];
        const summary = phases.map(phase => {
            const phaseResults = this.results.filter(r => r.phase === phase);
            const successful = phaseResults.filter(r => r.success).length;
            const total = phaseResults.length;
            
            console.log(`   ${phase}: ${successful}/${total} 성공`);
            
            return { phase, total, successful };
        });

        console.log('\n📋 상세 결과:');
        this.results.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`   ${status} ${result.phase} - ${result.action} (${result.user})`);
            if (result.error) {
                console.log(`      ❌ 오류: ${result.error}`);
            }
            if (result.details) {
                console.log(`      ℹ️ 상세: ${result.details}`);
            }
        });

        // 결과 저장
        const finalResults = {
            timestamp: new Date().toISOString(),
            summary,
            details: this.results,
            totalSuccess: this.results.filter(r => r.success).length,
            totalActions: this.results.length
        };

        fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(finalResults, null, 2));
        console.log('\n💾 결과가 comprehensive-test-results.json에 저장되었습니다.');
        
        return finalResults;
    }

    async execute() {
        try {
            await this.initialize();
            
            await this.executeTeamCreation();
            await this.executeMatchCreation();
            await this.executeTeamJoining();
            await this.executeMatchParticipation();
            
            const results = await this.generateReport();
            console.log(`\n🎉 테스트 완료! ${results.totalSuccess}/${results.totalActions} 액션 성공`);
            
            return results;
        } finally {
            await this.cleanup();
        }
    }
}

// 실행

const testPlan = new ComprehensiveTestPlan();
testPlan.execute()
    .then((results) => {
        console.log(`\n🏆 최종 결과: ${results.totalSuccess}/${results.totalActions} 성공`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ 테스트 실행 실패:', error);
        process.exit(1);
    });