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

async function performAction(account: TestAccount, actionName: string, actionFunction: (page: any) => Promise<boolean>): Promise<boolean> {
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
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
        
        // Wait for login
        try {
            await page.waitForURL('**/dashboard', { timeout: 5000 });
        } catch {
            await page.waitForURL('**/matches', { timeout: 5000 });
        }
        
        console.log(`   🔐 로그인 완료`);
        
        // Perform the specific action
        const success = await actionFunction(page);
        
        if (success) {
            console.log(`   ✅ ${actionName} 성공!`);
        } else {
            console.log(`   ❌ ${actionName} 실패`);
        }
        
        return success;
        
    } catch (error) {
        console.error(`   ❌ ${actionName} 오류:`, error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Action functions
async function createTeamAction(teamName: string) {
    return async (page: any) => {
        await page.goto(`${BASE_URL}/teams`);
        await page.waitForLoadState('networkidle');
        
        // Check if team already exists
        const existingTeam = page.locator(`text="${teamName}"`).first();
        if (await existingTeam.isVisible()) {
            console.log(`   ℹ️ 팀 "${teamName}" 이미 존재`);
            return true;
        }
        
        // Click create team button
        await page.click('text=팀 생성');
        await page.waitForTimeout(2000);
        
        // Fill team form with correct field IDs
        const nameInput = page.locator('input[id="name"]').first();
        if (await nameInput.isVisible()) {
            await nameInput.fill(teamName);
        }
        
        const descInput = page.locator('textarea[id="description"]').first();
        if (await descInput.isVisible()) {
            await descInput.fill(`${teamName} 팀입니다.`);
        }
        
        // Submit
        await page.click('button[type="submit"], button:has-text("생성")');
        await page.waitForTimeout(3000);
        
        return true;
    };
}

async function createMatchAction(matchName: string, matchType: string = 'single_elimination') {
    return async (page: any) => {
        await page.goto(`${BASE_URL}/matches`);
        await page.waitForLoadState('networkidle');
        
        // Check if match already exists
        const existingMatch = page.locator(`text="${matchName}"`).first();
        if (await existingMatch.isVisible()) {
            console.log(`   ℹ️ 경기 "${matchName}" 이미 존재`);
            return true;
        }
        
        // Click create match button
        await page.click('text=경기 생성');
        await page.waitForTimeout(2000);
        
        // Fill match form with correct field IDs
        const titleInput = page.locator('input[id="title"]').first();
        if (await titleInput.isVisible()) {
            await titleInput.fill(matchName);
        }
        
        const descInput = page.locator('textarea[id="description"]').first();
        if (await descInput.isVisible()) {
            await descInput.fill(`${matchName} - 테스트 경기입니다.`);
        }
        
        // Set match type
        const typeSelect = page.locator('select[id="type"]').first();
        if (await typeSelect.isVisible()) {
            await typeSelect.selectOption(matchType);
        }
        
        // Set dates (using datetime-local format)
        const today = new Date();
        const deadline = new Date(today);
        deadline.setDate(deadline.getDate() + 7);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() + 14);
        
        const deadlineInput = page.locator('input[id="registration_deadline"]').first();
        if (await deadlineInput.isVisible()) {
            await deadlineInput.fill(deadline.toISOString().slice(0, 16));
        }
        
        const startInput = page.locator('input[id="start_date"]').first();
        if (await startInput.isVisible()) {
            await startInput.fill(startDate.toISOString().slice(0, 16));
        }
        
        // Submit
        await page.click('button[type="submit"], button:has-text("생성")');
        await page.waitForTimeout(3000);
        
        return true;
    };
}

async function joinTeamAction(targetTeamName: string) {
    return async (page: any) => {
        await page.goto(`${BASE_URL}/teams`);
        await page.waitForLoadState('networkidle');
        
        // Find the team
        const teamLink = page.locator(`text="${targetTeamName}"`).first();
        if (await teamLink.isVisible()) {
            await teamLink.click();
            await page.waitForTimeout(2000);
            
            // Look for join team button
            const joinButton = page.locator('button:has-text("팀 가입"), button:has-text("가입 신청")').first();
            if (await joinButton.isVisible()) {
                await joinButton.click();
                await page.waitForTimeout(2000);
                return true;
            }
        }
        
        return false;
    };
}

async function joinMatchAction(matchName: string, teamName: string) {
    return async (page: any) => {
        await page.goto(`${BASE_URL}/matches`);
        await page.waitForLoadState('networkidle');
        
        // Find and click on the match
        const matchLink = page.locator(`text="${matchName}"`).first();
        if (await matchLink.isVisible()) {
            await matchLink.click();
            await page.waitForTimeout(2000);
            
            // Look for join match button
            const joinButton = page.locator('button:has-text("참가 신청"), button:has-text("경기 참여")').first();
            if (await joinButton.isVisible()) {
                await joinButton.click();
                
                // Select team if dropdown appears
                const teamSelect = page.locator('select[name="team"], select:has(option)').first();
                if (await teamSelect.isVisible()) {
                    // Try to select by text content
                    await teamSelect.selectOption({ label: teamName });
                }
                
                // Confirm
                const confirmButton = page.locator('button:has-text("확인"), button:has-text("신청")').first();
                if (await confirmButton.isVisible()) {
                    await confirmButton.click();
                }
                
                await page.waitForTimeout(2000);
                return true;
            }
        }
        
        return false;
    };
}

async function runFullScenario() {
    console.log('🚀 전체 시나리오 테스트 시작!\n');
    
    const testData: TestAccountsData = JSON.parse(
        fs.readFileSync(TEST_ACCOUNTS_PATH, 'utf-8')
    );
    
    const results: { phase: string; action: string; user: string; success: boolean }[] = [];
    
    // Phase 1: Team Creation
    console.log('📋 Phase 1: 팀 생성');
    const teamCreators = testData.accounts.filter(a => 
        a.team && (a.role === 'team_captain' || a.role === 'match_creator')
    );
    
    for (const account of teamCreators) {
        if (account.team) {
            const success = await performAction(
                account, 
                `팀 "${account.team}" 생성`, 
                createTeamAction(account.team)
            );
            results.push({ phase: 'Team Creation', action: `Create ${account.team}`, user: account.name, success });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Phase 2: Match Creation
    console.log('\n📋 Phase 2: 경기 생성');
    const matchCreators = testData.accounts.filter(a => a.role === 'match_creator');
    
    if (matchCreators.length >= 1) {
        const success1 = await performAction(
            matchCreators[0],
            '경기 "2025 봄 챔피언십" 생성',
            createMatchAction('2025 봄 챔피언십', 'single_elimination')
        );
        results.push({ phase: 'Match Creation', action: 'Create 2025 봄 챔피언십', user: matchCreators[0].name, success: success1 });
    }
    
    if (matchCreators.length >= 2) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const success2 = await performAction(
            matchCreators[1],
            '경기 "주말 리그" 생성',
            createMatchAction('주말 리그', 'league')
        );
        results.push({ phase: 'Match Creation', action: 'Create 주말 리그', user: matchCreators[1].name, success: success2 });
    }
    
    // Phase 3: Team Joining
    console.log('\n📋 Phase 3: 팀 가입');
    const players = testData.accounts.filter(a => a.role === 'player');
    
    for (const player of players) {
        if (player.team) {
            const success = await performAction(
                player,
                `팀 "${player.team}" 가입 신청`,
                joinTeamAction(player.team)
            );
            results.push({ phase: 'Team Joining', action: `Join ${player.team}`, user: player.name, success });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Phase 4: Match Participation
    console.log('\n📋 Phase 4: 경기 참여');
    const teamCaptains = testData.accounts.filter(a => a.role === 'team_captain');
    
    for (const captain of teamCaptains) {
        if (captain.team) {
            // Join championship
            const success1 = await performAction(
                captain,
                `팀 "${captain.team}"으로 "2025 봄 챔피언십" 참가`,
                joinMatchAction('2025 봄 챔피언십', captain.team)
            );
            results.push({ phase: 'Match Participation', action: 'Join 2025 봄 챔피언십', user: captain.name, success: success1 });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Join league
            const success2 = await performAction(
                captain,
                `팀 "${captain.team}"으로 "주말 리그" 참가`,
                joinMatchAction('주말 리그', captain.team)
            );
            results.push({ phase: 'Match Participation', action: 'Join 주말 리그', user: captain.name, success: success2 });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Results Summary
    console.log('\n✨ 전체 시나리오 테스트 완료!\n');
    console.log('📊 결과 요약:');
    
    const phases = ['Team Creation', 'Match Creation', 'Team Joining', 'Match Participation'];
    phases.forEach(phase => {
        const phaseResults = results.filter(r => r.phase === phase);
        const successCount = phaseResults.filter(r => r.success).length;
        console.log(`   ${phase}: ${successCount}/${phaseResults.length} 성공`);
    });
    
    console.log('\n📋 상세 결과:');
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.phase} - ${result.action} (${result.user})`);
    });
    
    // Save results
    const finalResults = {
        timestamp: new Date().toISOString(),
        summary: phases.map(phase => {
            const phaseResults = results.filter(r => r.phase === phase);
            return {
                phase,
                total: phaseResults.length,
                successful: phaseResults.filter(r => r.success).length
            };
        }),
        details: results
    };
    
    fs.writeFileSync('full-scenario-results.json', JSON.stringify(finalResults, null, 2));
    console.log('\n💾 결과가 full-scenario-results.json에 저장되었습니다.');
    
    return finalResults;
}

// Run the full scenario
runFullScenario().then((results) => {
    const totalSuccess = results.details.filter(r => r.success).length;
    const totalActions = results.details.length;
    console.log(`\n🎉 전체 시나리오 완료! ${totalSuccess}/${totalActions} 액션 성공`);
    process.exit(0);
}).catch((error) => {
    console.error('❌ 시나리오 실행 실패:', error);
    process.exit(1);
});