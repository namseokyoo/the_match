import { chromium } from 'playwright';
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

async function loginAndPerformAction(account: TestAccount, actionName: string, action: (page: any) => Promise<boolean>): Promise<boolean> {
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    
    try {
        console.log(`👤 ${account.name}: ${actionName}`);
        
        // Login
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[placeholder*="example"]', account.email);
        await page.fill('input[placeholder*="비밀번호"]', account.password);
        await page.click('button[type="submit"]');
        
        // Wait for redirect to matches page
        await page.waitForURL('**/matches', { timeout: 10000 });
        console.log(`   🔐 로그인 완료 - 경기 목록 페이지`);
        
        // Take a screenshot to see current state
        await page.screenshot({ path: `debug-${account.name.replace(/\s+/g, '-')}-after-login.png` });
        
        // Perform the action
        const success = await action(page);
        
        if (success) {
            console.log(`   ✅ ${actionName} 성공!`);
        } else {
            console.log(`   ❌ ${actionName} 실패`);
        }
        
        return success;
        
    } catch (error) {
        console.error(`   ❌ ${actionName} 오류:`, error.message);
        await page.screenshot({ path: `error-${account.name.replace(/\s+/g, '-')}-${Date.now()}.png` });
        return false;
    } finally {
        await browser.close();
    }
}

// Team creation action
async function createTeam(teamName: string) {
    return async (page: any) => {
        try {
            // Navigate to teams page through navigation
            await page.click('a[href="/teams"], text=팀');
            await page.waitForLoadState('networkidle');
            console.log(`   📋 팀 페이지로 이동`);
            
            // Take screenshot
            await page.screenshot({ path: `debug-teams-page-${Date.now()}.png` });
            
            // Look for "팀 생성" button and click it
            const createButton = await page.locator('button:has-text("팀 생성"), a:has-text("팀 생성")').first();
            if (await createButton.isVisible()) {
                await createButton.click();
                await page.waitForLoadState('networkidle');
                console.log(`   🆕 팀 생성 페이지로 이동`);
                
                // Take screenshot of create form
                await page.screenshot({ path: `debug-team-create-form-${Date.now()}.png` });
                
                // Fill the form
                await page.fill('input[id="name"]', teamName);
                await page.fill('textarea[id="description"]', `${teamName} 팀입니다.`);
                
                // Submit
                await page.click('button[type="submit"]');
                await page.waitForTimeout(5000);
                
                // Check if we're on team detail page
                const currentUrl = page.url();
                if (currentUrl.includes('/teams/')) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error(`   팀 생성 오류:`, error.message);
            return false;
        }
    };
}

// Match creation action
async function createMatch(matchName: string, matchType: string = 'single_elimination') {
    return async (page: any) => {
        try {
            // We're already on matches page after login
            console.log(`   📋 이미 경기 페이지에 있음`);
            
            // Take screenshot
            await page.screenshot({ path: `debug-matches-page-${Date.now()}.png` });
            
            // Look for "경기 생성" button
            const createButton = await page.locator('button:has-text("경기 생성"), a:has-text("경기 생성")').first();
            if (await createButton.isVisible()) {
                await createButton.click();
                await page.waitForLoadState('networkidle');
                console.log(`   🆕 경기 생성 페이지로 이동`);
                
                // Take screenshot of create form
                await page.screenshot({ path: `debug-match-create-form-${Date.now()}.png` });
                
                // Fill the form
                await page.fill('input[id="title"]', matchName);
                await page.fill('textarea[id="description"]', `${matchName} - 테스트 경기입니다.`);
                
                // Set match type
                await page.selectOption('select[id="type"]', matchType);
                
                // Set dates
                const today = new Date();
                const deadline = new Date(today);
                deadline.setDate(deadline.getDate() + 7);
                const startDate = new Date(today);
                startDate.setDate(startDate.getDate() + 14);
                
                await page.fill('input[id="registration_deadline"]', deadline.toISOString().slice(0, 16));
                await page.fill('input[id="start_date"]', startDate.toISOString().slice(0, 16));
                
                // Submit
                await page.click('button[type="submit"]');
                await page.waitForTimeout(5000);
                
                // Check if we're on match detail page
                const currentUrl = page.url();
                if (currentUrl.includes('/matches/')) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error(`   경기 생성 오류:`, error.message);
            return false;
        }
    };
}

async function runRealisticScenario() {
    console.log('🚀 실제 UI 플로우 기반 시나리오 테스트 시작!\n');
    
    const testData: TestAccountsData = JSON.parse(
        fs.readFileSync(TEST_ACCOUNTS_PATH, 'utf-8')
    );
    
    let results: { action: string; user: string; success: boolean }[] = [];
    
    // Phase 1: Team Creation (팀장들만)
    console.log('📋 Phase 1: 팀 생성 (팀장들)');
    const teamCaptains = testData.accounts.filter(a => 
        a.team && (a.role === 'team_captain' || a.role === 'match_creator')
    );
    
    for (let i = 0; i < Math.min(3, teamCaptains.length); i++) {
        const account = teamCaptains[i];
        if (account.team) {
            const success = await loginAndPerformAction(
                account,
                `팀 "${account.team}" 생성`,
                createTeam(account.team)
            );
            results.push({
                action: `Create ${account.team}`,
                user: account.name,
                success
            });
            
            // 2초 대기
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Phase 2: Match Creation (경기 주최자들)
    console.log('\n📋 Phase 2: 경기 생성');
    const matchCreators = testData.accounts.filter(a => a.role === 'match_creator');
    
    if (matchCreators.length >= 1) {
        const success1 = await loginAndPerformAction(
            matchCreators[0],
            '경기 "2025 봄 챔피언십" 생성',
            createMatch('2025 봄 챔피언십', 'single_elimination')
        );
        results.push({
            action: 'Create 2025 봄 챔피언십',
            user: matchCreators[0].name,
            success: success1
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (matchCreators.length >= 2) {
            const success2 = await loginAndPerformAction(
                matchCreators[1],
                '경기 "주말 리그" 생성',
                createMatch('주말 리그', 'league')
            );
            results.push({
                action: 'Create 주말 리그',
                user: matchCreators[1].name,
                success: success2
            });
        }
    }
    
    // Results
    console.log('\n✨ 시나리오 테스트 완료!\n');
    console.log('📊 결과 요약:');
    
    const successCount = results.filter(r => r.success).length;
    console.log(`   전체: ${successCount}/${results.length} 성공\n`);
    
    console.log('📋 상세 결과:');
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.action} (${result.user})`);
    });
    
    // Save results
    const finalResults = {
        timestamp: new Date().toISOString(),
        total: results.length,
        successful: successCount,
        results
    };
    
    fs.writeFileSync('realistic-scenario-results.json', JSON.stringify(finalResults, null, 2));
    console.log('\n💾 결과가 realistic-scenario-results.json에 저장되었습니다.');
    
    return finalResults;
}

// Run the realistic scenario
runRealisticScenario().then((results) => {
    console.log(`\n🎉 테스트 완료! ${results.successful}/${results.total} 성공`);
    process.exit(0);
}).catch((error) => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
});