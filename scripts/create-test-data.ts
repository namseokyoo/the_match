import { chromium, Browser, Page } from 'playwright';
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

let browser: Browser;
let context: any;

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupBrowser() {
    console.log('🌐 Starting browser...');
    browser = await chromium.launch({
        headless: false, // Set to true for headless mode
        slowMo: 500 // Slow down actions for visibility
    });
    
    context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        locale: 'ko-KR'
    });
    
    return context;
}

async function registerUser(page: Page, account: TestAccount) {
    console.log(`\n👤 Registering user: ${account.name} (${account.email})`);
    
    try {
        // Navigate to signup page
        await page.goto(`${BASE_URL}/signup`);
        await page.waitForLoadState('networkidle');
        
        // Wait for form to be visible
        await page.waitForSelector('form', { timeout: 10000 });
        
        // Fill registration form with more specific selectors
        await page.fill('[placeholder*="홍길동"], input[id="name"]', account.name);
        await page.fill('[placeholder*="example@email.com"], input[id="email"]', account.email);
        await page.fill('[placeholder*="최소 8자"], input[id="password"]', account.password);
        await page.fill('[placeholder*="비밀번호를 다시"], input[id="confirmPassword"]', account.password);
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Wait for navigation or success message
        // Wait for success or redirect
        try {
            await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
        } catch {
            // If not redirected to dashboard, check if there's a success message
            const successElement = await page.locator('text=회원가입 완료').first();
            if (await successElement.isVisible()) {
                console.log('   ✅ Registration successful - confirmation page shown');
            } else {
                console.log('   ⚠️  Registration might have failed or redirected elsewhere');
            }
        }
        
        console.log(`   ✅ User ${account.name} registered successfully`);
        await delay(1000);
        
        // Logout after registration
        await logout(page);
        
    } catch (error) {
        console.error(`   ❌ Failed to register ${account.name}:`, error);
    }
}

async function login(page: Page, email: string, password: string) {
    console.log(`   🔐 Logging in as ${email}...`);
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('[placeholder*="example@email.com"], input[id="email"]', email);
    await page.fill('[placeholder*="비밀번호를 입력"], input[id="password"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    console.log('   ✅ Logged in successfully');
}

async function logout(page: Page) {
    try {
        // Try to find and click logout button
        const logoutButton = page.locator('button:has-text("로그아웃")').first();
        if (await logoutButton.isVisible()) {
            await logoutButton.click();
            await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 }).catch(() => {});
        }
    } catch (error) {
        // If logout fails, just navigate to login page
        await page.goto(`${BASE_URL}/login`);
    }
}

async function createTeam(page: Page, teamName: string) {
    console.log(`   ⚽ Creating team: ${teamName}`);
    
    try {
        // Navigate to teams page
        await page.goto(`${BASE_URL}/teams`);
        await page.waitForLoadState('networkidle');
        
        // Click create team button
        await page.click('a:has-text("팀 생성"), button:has-text("팀 생성")');
        await page.waitForURL('**/teams/new', { timeout: 5000 });
        
        // Fill team creation form
        await page.fill('input[name="name"]', teamName);
        await page.fill('textarea[name="description"]', `${teamName} 설명`);
        
        // Select sport (if dropdown exists)
        const sportSelect = page.locator('select[name="sport"]');
        if (await sportSelect.isVisible()) {
            await sportSelect.selectOption('soccer');
        }
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Wait for redirect to team detail page
        await page.waitForURL('**/teams/**', { timeout: 10000 });
        console.log(`   ✅ Team ${teamName} created successfully`);
        
    } catch (error) {
        console.error(`   ❌ Failed to create team ${teamName}:`, error);
    }
}

async function createMatch(page: Page, matchName: string, matchType: string = 'single_elimination') {
    console.log(`   🏆 Creating match: ${matchName}`);
    
    try {
        // Navigate to matches page
        await page.goto(`${BASE_URL}/matches`);
        await page.waitForLoadState('networkidle');
        
        // Click create match button
        await page.click('a:has-text("경기 생성"), button:has-text("경기 생성")');
        await page.waitForURL('**/matches/new', { timeout: 5000 });
        
        // Fill match creation form
        await page.fill('input[name="name"]', matchName);
        await page.fill('textarea[name="description"]', `${matchName} 설명`);
        
        // Select match type
        const typeSelect = page.locator('select[name="match_type"]');
        if (await typeSelect.isVisible()) {
            await typeSelect.selectOption(matchType);
        }
        
        // Set dates
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        
        await page.fill('input[name="registration_deadline"]', endDate.toISOString().split('T')[0]);
        
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() + 1);
        await page.fill('input[name="start_date"]', startDate.toISOString().split('T')[0]);
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Wait for redirect to match detail page
        await page.waitForURL('**/matches/**', { timeout: 10000 });
        console.log(`   ✅ Match ${matchName} created successfully`);
        
    } catch (error) {
        console.error(`   ❌ Failed to create match ${matchName}:`, error);
    }
}

async function joinMatch(page: Page, matchName: string, teamName: string) {
    console.log(`   🎯 Joining match ${matchName} with team ${teamName}`);
    
    try {
        // Navigate to matches page
        await page.goto(`${BASE_URL}/matches`);
        await page.waitForLoadState('networkidle');
        
        // Find and click on the match
        await page.click(`text="${matchName}"`);
        await page.waitForLoadState('networkidle');
        
        // Click join match button
        const joinButton = page.locator('button:has-text("참가 신청")');
        if (await joinButton.isVisible()) {
            await joinButton.click();
            
            // Select team if dropdown appears
            const teamSelect = page.locator('select[name="team"]');
            if (await teamSelect.isVisible()) {
                await teamSelect.selectOption({ label: teamName });
            }
            
            // Confirm join
            const confirmButton = page.locator('button:has-text("확인")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
            }
            
            console.log(`   ✅ Successfully joined match ${matchName}`);
        } else {
            console.log(`   ℹ️  Already joined or cannot join match ${matchName}`);
        }
        
    } catch (error) {
        console.error(`   ❌ Failed to join match ${matchName}:`, error);
    }
}

async function createTestData() {
    console.log('🚀 Starting test data creation...\n');
    
    // Read test accounts
    const testData: TestAccountsData = JSON.parse(
        fs.readFileSync(TEST_ACCOUNTS_PATH, 'utf-8')
    );
    
    const context = await setupBrowser();
    const page = await context.newPage();
    
    try {
        // Phase 1: Register all users
        console.log('📝 Phase 1: Registering all users...');
        for (const account of testData.accounts) {
            await registerUser(page, account);
        }
        
        // Phase 2: Create teams
        console.log('\n📝 Phase 2: Creating teams...');
        const teamCreators = testData.accounts.filter(a => 
            a.role === 'team_captain' || a.role === 'match_creator'
        );
        
        for (const account of teamCreators) {
            if (account.team) {
                await login(page, account.email, account.password);
                await createTeam(page, account.team);
                await logout(page);
            }
        }
        
        // Phase 3: Create matches
        console.log('\n📝 Phase 3: Creating matches...');
        const matchCreators = testData.accounts.filter(a => a.role === 'match_creator');
        
        // Create tournament by user 1
        await login(page, matchCreators[0].email, matchCreators[0].password);
        await createMatch(page, '2025 봄 챔피언십', 'single_elimination');
        await logout(page);
        
        // Create league by user 8
        if (matchCreators[1]) {
            await login(page, matchCreators[1].email, matchCreators[1].password);
            await createMatch(page, '주말 리그', 'league');
            await logout(page);
        }
        
        // Phase 4: Teams join matches
        console.log('\n📝 Phase 4: Teams joining matches...');
        const teamCaptains = testData.accounts.filter(a => a.role === 'team_captain');
        
        for (const captain of teamCaptains) {
            if (captain.team) {
                await login(page, captain.email, captain.password);
                await joinMatch(page, '2025 봄 챔피언십', captain.team);
                await delay(1000);
                await joinMatch(page, '주말 리그', captain.team);
                await logout(page);
            }
        }
        
        console.log('\n✅ Test data creation complete!');
        console.log('📊 Created:');
        console.log(`   - ${testData.accounts.length} users`);
        console.log(`   - ${teamCreators.filter(a => a.team).length} teams`);
        console.log(`   - 2 matches (1 tournament, 1 league)`);
        
    } catch (error) {
        console.error('❌ Error creating test data:', error);
    } finally {
        await browser.close();
    }
}

// Run the script
createTestData().then(() => {
    console.log('\n✨ All test data has been created!');
    console.log('📝 You can now login with any of the test accounts from test-accounts.json');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Failed to create test data:', error);
    process.exit(1);
});