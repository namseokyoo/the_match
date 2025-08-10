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

async function loginAndCreateTeam(account: TestAccount): Promise<boolean> {
    // Only create teams for team captains and match creators with team names
    if (!account.team || (account.role !== 'team_captain' && account.role !== 'match_creator')) {
        return true;
    }
    
    const browser = await chromium.launch({
        headless: true,
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
        console.log(`⚽ Creating team "${account.team}" for ${account.name}`);
        
        // Login
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[placeholder*="example"]', account.email);
        await page.fill('input[placeholder*="비밀번호"]', account.password);
        await page.click('button[type="submit"]');
        
        // Wait for login (can redirect to dashboard or matches)
        try {
            await page.waitForURL('**/dashboard', { timeout: 5000 });
        } catch {
            await page.waitForURL('**/matches', { timeout: 5000 });
        }
        console.log(`   🔐 Logged in as ${account.name}`);
        
        // Navigate to teams page
        await page.goto(`${BASE_URL}/teams`);
        await page.waitForLoadState('networkidle');
        
        // Check if team already exists
        const existingTeam = page.locator(`text="${account.team}"`).first();
        if (await existingTeam.isVisible()) {
            console.log(`   ℹ️ Team "${account.team}" already exists`);
            return true;
        }
        
        // Click create team button - Look for "팀 만들기" button
        const createButton = page.locator('text=팀 만들기').first();
        await createButton.click();
        
        // Wait for team creation form
        await page.waitForTimeout(2000);
        
        // Fill team form
        const nameInput = page.locator('input[name="name"], input[placeholder*="팀 이름"]').first();
        if (await nameInput.isVisible()) {
            await nameInput.fill(account.team);
        }
        
        const descInput = page.locator('textarea[name="description"], textarea[placeholder*="팀 설명"]').first();
        if (await descInput.isVisible()) {
            await descInput.fill(`${account.team} 팀입니다. ${account.description}`);
        }
        
        // Submit team creation
        await page.click('button[type="submit"], button:has-text("생성")');
        
        // Wait for success
        await page.waitForTimeout(3000);
        
        console.log(`   ✅ Team "${account.team}" created successfully!`);
        return true;
        
    } catch (error) {
        console.error(`   ❌ Failed to create team for ${account.name}: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

async function createMatch(matchCreator: TestAccount, matchName: string, matchType: string): Promise<boolean> {
    const browser = await chromium.launch({
        headless: true,
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
        console.log(`🏆 Creating match "${matchName}" by ${matchCreator.name}`);
        
        // Login
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[placeholder*="example"]', matchCreator.email);
        await page.fill('input[placeholder*="비밀번호"]', matchCreator.password);
        await page.click('button[type="submit"]');
        
        // Wait for login (can redirect to dashboard or matches)
        try {
            await page.waitForURL('**/dashboard', { timeout: 5000 });
        } catch {
            await page.waitForURL('**/matches', { timeout: 5000 });
        }
        console.log(`   🔐 Logged in as ${matchCreator.name}`);
        
        // Navigate to matches page
        await page.goto(`${BASE_URL}/matches`);
        await page.waitForLoadState('networkidle');
        
        // Check if match already exists
        const existingMatch = page.locator(`text="${matchName}"`).first();
        if (await existingMatch.isVisible()) {
            console.log(`   ℹ️ Match "${matchName}" already exists`);
            return true;
        }
        
        // Click create match button
        const createButton = page.locator('text=경기 생성').first();
        await createButton.click();
        
        await page.waitForTimeout(2000);
        
        // Fill match form
        const nameInput = page.locator('input[name="name"], input[placeholder*="경기 이름"]').first();
        if (await nameInput.isVisible()) {
            await nameInput.fill(matchName);
        }
        
        const descInput = page.locator('textarea[name="description"], textarea[placeholder*="경기 설명"]').first();
        if (await descInput.isVisible()) {
            await descInput.fill(`${matchName} - 테스트 경기입니다.`);
        }
        
        // Set match type if dropdown exists
        const typeSelect = page.locator('select[name="match_type"], select[name="type"]').first();
        if (await typeSelect.isVisible()) {
            await typeSelect.selectOption(matchType);
        }
        
        // Set dates (7 days from now for deadline, 14 days for start)
        const today = new Date();
        const deadline = new Date(today);
        deadline.setDate(deadline.getDate() + 7);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() + 14);
        
        const deadlineInput = page.locator('input[name="registration_deadline"], input[type="date"]').first();
        if (await deadlineInput.isVisible()) {
            await deadlineInput.fill(deadline.toISOString().split('T')[0]);
        }
        
        const startInput = page.locator('input[name="start_date"]').nth(1);
        if (await startInput.isVisible()) {
            await startInput.fill(startDate.toISOString().split('T')[0]);
        }
        
        // Submit match creation
        await page.click('button[type="submit"], button:has-text("생성")');
        
        await page.waitForTimeout(3000);
        
        console.log(`   ✅ Match "${matchName}" created successfully!`);
        return true;
        
    } catch (error) {
        console.error(`   ❌ Failed to create match "${matchName}": ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

async function createTeamsAndMatches() {
    console.log('🚀 Creating teams and matches...\n');
    
    // Read test accounts
    const testData: TestAccountsData = JSON.parse(
        fs.readFileSync(TEST_ACCOUNTS_PATH, 'utf-8')
    );
    
    let teamsCreated = 0;
    let matchesCreated = 0;
    
    // Phase 1: Create teams
    console.log('📋 Phase 1: Creating teams...');
    const teamCreators = testData.accounts.filter(a => 
        a.team && (a.role === 'team_captain' || a.role === 'match_creator')
    );
    
    for (const account of teamCreators) {
        const success = await createTeam(account);
        if (success) teamsCreated++;
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Phase 2: Create matches
    console.log('\n📋 Phase 2: Creating matches...');
    const matchCreators = testData.accounts.filter(a => a.role === 'match_creator');
    
    if (matchCreators.length >= 1) {
        const success1 = await createMatch(matchCreators[0], '2025 봄 챔피언십', 'single_elimination');
        if (success1) matchesCreated++;
    }
    
    if (matchCreators.length >= 2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const success2 = await createMatch(matchCreators[1], '주말 리그', 'league');
        if (success2) matchesCreated++;
    }
    
    console.log('\n✨ Teams and matches creation complete!');
    console.log(`📊 Results:`);
    console.log(`   - Teams created: ${teamsCreated}/${teamCreators.length}`);
    console.log(`   - Matches created: ${matchesCreated}/2`);
    
    const results = {
        timestamp: new Date().toISOString(),
        teamsCreated,
        totalTeams: teamCreators.length,
        matchesCreated,
        totalMatches: 2
    };
    
    fs.writeFileSync('teams-matches-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Results saved to teams-matches-results.json');
    
    return { teamsCreated, matchesCreated };
}

// Helper function to create team (duplicate of loginAndCreateTeam but with different name for clarity)
async function createTeam(account: TestAccount): Promise<boolean> {
    return await loginAndCreateTeam(account);
}

// Run the script
createTeamsAndMatches().then(({ teamsCreated, matchesCreated }) => {
    console.log(`\n🎉 Process completed! Created ${teamsCreated} teams and ${matchesCreated} matches.`);
    process.exit(0);
}).catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});