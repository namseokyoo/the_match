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

async function logoutUser(page: Page): Promise<void> {
    try {
        console.log('   🚪 Logging out...');
        
        // Try to find logout button or menu
        const userMenu = page.locator('button:has-text("Menu"), [data-testid="user-menu"], .user-menu');
        const logoutBtn = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")');
        
        // If logout button is directly visible, click it
        if (await logoutBtn.isVisible()) {
            await logoutBtn.click();
        } else if (await userMenu.first().isVisible()) {
            // If user menu exists, click it first then logout
            await userMenu.first().click();
            await page.waitForTimeout(500);
            await logoutBtn.click();
        } else {
            // If no logout button found, just navigate to login page
            console.log('   ⚠️ No logout button found, navigating to login page');
            await page.goto(`${BASE_URL}/login`);
        }
        
        // Wait for logout to complete
        await page.waitForTimeout(1000);
    } catch (error) {
        console.log('   ⚠️ Logout failed, navigating to login page manually');
        await page.goto(`${BASE_URL}/login`);
    }
}

async function signupUser(page: Page, account: TestAccount): Promise<boolean> {
    console.log(`👤 Signing up: ${account.name} (${account.email})`);
    
    try {
        // Navigate to signup page
        await page.goto(`${BASE_URL}/signup`);
        await page.waitForLoadState('networkidle');
        
        // Wait for form elements
        await page.waitForSelector('input[placeholder*="홍길동"]', { timeout: 10000 });
        
        // Fill the form
        await page.fill('input[placeholder*="홍길동"]', account.name);
        await page.fill('input[placeholder*="example"]', account.email);
        await page.fill('input[placeholder*="최소"]', account.password);
        await page.fill('input[placeholder*="다시"]', account.password);
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for response (either success page or error)
        await page.waitForTimeout(3000);
        
        // Check if we see success message or are redirected
        const currentUrl = page.url();
        const successText = await page.locator('text=회원가입 완료').first();
        const errorText = await page.locator('text=이미 등록된 이메일').first();
        
        if (await successText.isVisible()) {
            console.log(`   ✅ ${account.name} - Success page shown`);
            // If on success page, need to logout by going to login page
            await page.goto(`${BASE_URL}/login`);
            return true;
        } else if (currentUrl.includes('/dashboard')) {
            console.log(`   ✅ ${account.name} - Redirected to dashboard`);
            // User is logged in, need to logout
            await logoutUser(page);
            return true;
        } else if (await errorText.isVisible()) {
            console.log(`   ⚠️ ${account.name} - Email already exists`);
            return true; // Already exists is okay for testing
        } else {
            console.log(`   ❌ ${account.name} - Unknown response`);
            return false;
        }
        
    } catch (error) {
        console.error(`   ❌ ${account.name} - Error:`, error.message);
        return false;
    }
}

async function createAllAccounts() {
    console.log('🚀 Starting batch signup...\n');
    
    // Read test accounts
    const testData: TestAccountsData = JSON.parse(
        fs.readFileSync(TEST_ACCOUNTS_PATH, 'utf-8')
    );
    
    console.log('🌐 Starting browser...');
    const browser = await chromium.launch({
        headless: false, // Set to true for faster execution
        slowMo: 500
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    let successCount = 0;
    const results: { name: string; email: string; success: boolean }[] = [];
    
    try {
        for (const account of testData.accounts) {
            const success = await signupUser(page, account);
            results.push({
                name: account.name,
                email: account.email,
                success
            });
            
            if (success) successCount++;
            
            // Small delay between signups
            await page.waitForTimeout(1000);
        }
        
        console.log('\n✨ Batch signup complete!');
        console.log(`📊 Results: ${successCount}/${testData.accounts.length} successful`);
        
        console.log('\n📋 Detailed Results:');
        results.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`   ${status} ${result.name} (${result.email})`);
        });
        
        // Save results to file
        fs.writeFileSync('signup-results.json', JSON.stringify(results, null, 2));
        console.log('\n💾 Results saved to signup-results.json');
        
    } catch (error) {
        console.error('❌ Batch signup failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the script
createAllAccounts().then(() => {
    console.log('\n🎉 All done! Check the results above.');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});