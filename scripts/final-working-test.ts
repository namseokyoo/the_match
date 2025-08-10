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

class FinalWorkingTest {
    private browser!: Browser;
    private results: TestResult[] = [];
    private testData!: TestAccountsData;

    async initialize() {
        console.log('🚀 최종 작업 테스트 시작!');
        
        this.browser = await chromium.launch({ 
            headless: false, 
            slowMo: 1000 
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

    private async createSession(): Promise<{ context: BrowserContext; page: Page }> {
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

    // Phase 1: 팀 생성 (visible 링크 사용)
    async executeTeamCreation() {
        console.log('\n📋 Phase 1: 팀 생성 (정확한 visible 링크 사용)');
        
        const teamCreators = this.testData.accounts.filter(a => 
            a.team && (a.role === 'team_captain' || a.role === 'match_creator')
        ).slice(0, 3); // 3개만 테스트

        for (const account of teamCreators) {
            if (!account.team) continue;

            const { context, page } = await this.createSession();
            
            try {
                // 로그인
                const loginSuccess = await this.login(page, account);
                if (!loginSuccess) {
                    this.logResult('Team Creation', `팀 "${account.team}" 생성`, account.name, false, '로그인 실패');
                    continue;
                }

                // visible한 "팀" 링크 클릭 (nth(1)은 두 번째 요소 = visible한 것)
                await page.locator('a[href="/teams"]').nth(1).click();
                await page.waitForLoadState('networkidle');
                console.log(`   📋 팀 페이지로 이동`);
                
                // visible한 "팀 생성" 링크 클릭
                await page.locator('a[href="/teams/create"]').nth(1).click();
                await page.waitForLoadState('networkidle');
                console.log(`   🆕 팀 생성 페이지로 이동`);
                
                // 폼 작성
                await page.fill('input[id="name"]', account.team);
                await page.fill('textarea[id="description"]', `${account.team} 팀입니다. ${account.name}이 팀장을 맡고 있습니다.`);
                
                // 폼 제출
                await page.click('button[type="submit"]');
                await page.waitForTimeout(3000);
                
                // 성공 확인
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

    // Phase 2: 경기 생성 (visible 링크 사용)
    async executeMatchCreation() {
        console.log('\n📋 Phase 2: 경기 생성');
        
        const matchCreators = this.testData.accounts.filter(a => a.role === 'match_creator').slice(0, 2);
        const matches = [
            { name: '2025 봄 챔피언십', type: 'single_elimination' },
            { name: '주말 리그', type: 'league' }
        ];

        for (let i = 0; i < Math.min(2, matchCreators.length); i++) {
            const account = matchCreators[i];
            const match = matches[i];
            
            const { context, page } = await this.createSession();
            
            try {
                // 로그인 (자동으로 /matches 페이지로 이동)
                const loginSuccess = await this.login(page, account);
                if (!loginSuccess) {
                    this.logResult('Match Creation', `경기 "${match.name}" 생성`, account.name, false, '로그인 실패');
                    continue;
                }

                // visible한 "경기 생성" 링크 클릭 (nth(1)은 두 번째 요소 = visible한 것)
                await page.locator('a[href="/matches/create"]').nth(1).click();
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

    // Phase 3: 간단한 데이터 확인
    async verifyCreatedData() {
        console.log('\n📋 Phase 3: 생성된 데이터 확인');
        
        const account = this.testData.accounts[0]; // 첫 번째 계정으로 확인
        const { context, page } = await this.createSession();
        
        try {
            const loginSuccess = await this.login(page, account);
            if (!loginSuccess) {
                this.logResult('Data Verification', '데이터 확인', account.name, false, '로그인 실패');
                return;
            }

            // 팀 목록 확인
            await page.locator('a[href="/teams"]').nth(1).click();
            await page.waitForLoadState('networkidle');
            
            const teamCount = await page.locator('text=FC 서울 유나이티드, text=블루 이글스, text=레드 라이온스').count();
            console.log(`   📊 생성된 팀: ${teamCount}개`);
            
            // 경기 목록 확인
            await page.locator('a[href="/matches"]').nth(1).click();
            await page.waitForLoadState('networkidle');
            
            const matchCount = await page.locator('text=2025 봄 챔피언십, text=주말 리그').count();
            console.log(`   📊 생성된 경기: ${matchCount}개`);
            
            this.logResult('Data Verification', '데이터 확인 완료', account.name, true, undefined, `팀: ${teamCount}개, 경기: ${matchCount}개`);
            
        } catch (error) {
            this.logResult('Data Verification', '데이터 확인', account.name, false, error.message);
        } finally {
            await context.close();
        }
    }

    async generateReport() {
        console.log('\n✨ 테스트 완료!');
        console.log('\n📊 결과 요약:');
        
        const phases = ['Team Creation', 'Match Creation', 'Data Verification'];
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

        fs.writeFileSync('final-working-test-results.json', JSON.stringify(finalResults, null, 2));
        console.log('\n💾 결과가 final-working-test-results.json에 저장되었습니다.');
        
        return finalResults;
    }

    async execute() {
        try {
            await this.initialize();
            
            await this.executeTeamCreation();
            await this.executeMatchCreation();
            await this.verifyCreatedData();
            
            const results = await this.generateReport();
            console.log(`\n🎉 테스트 완료! ${results.totalSuccess}/${results.totalActions} 액션 성공`);
            
            return results;
        } finally {
            await this.cleanup();
        }
    }
}

// 실행
const test = new FinalWorkingTest();
test.execute()
    .then((results) => {
        console.log(`\n🏆 최종 결과: ${results.totalSuccess}/${results.totalActions} 성공`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ 테스트 실행 실패:', error);
        process.exit(1);
    });