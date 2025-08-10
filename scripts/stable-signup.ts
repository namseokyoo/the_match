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

async function signupSingleUser(account: TestAccount): Promise<boolean> {
    const browser = await chromium.launch({
        headless: true, // Faster execution
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
        console.log(`👤 Signing up: ${account.name} (${account.email})`);
        
        // Navigate to signup page
        await page.goto(`${BASE_URL}/signup`);
        await page.waitForLoadState('networkidle');
        
        // Wait for form elements
        await page.waitForSelector('input[placeholder*="홍길동"]', { timeout: 15000 });
        
        // Fill the form
        await page.fill('input[placeholder*="홍길동"]', account.name);
        await page.fill('input[placeholder*="example"]', account.email);
        await page.fill('input[placeholder*="최소"]', account.password);
        await page.fill('input[placeholder*="다시"]', account.password);
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        // Check result
        const currentUrl = page.url();
        const successText = await page.locator('text=회원가입 완료').first();
        const errorText = await page.locator('text=이미 등록된 이메일').first();
        
        if (await successText.isVisible()) {
            console.log(`   ✅ ${account.name} - Success!`);
            return true;
        } else if (currentUrl.includes('/dashboard')) {
            console.log(`   ✅ ${account.name} - Logged in!`);
            return true;
        } else if (await errorText.isVisible()) {
            console.log(`   ⚠️ ${account.name} - Already exists (OK)`);
            return true;
        } else {
            console.log(`   ❌ ${account.name} - Failed`);
            return false;
        }
        
    } catch (error) {
        console.error(`   ❌ ${account.name} - Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

async function signupAllUsers() {
    console.log('🚀 Starting stable signup process...\n');
    
    // Read test accounts
    const testData: TestAccountsData = JSON.parse(
        fs.readFileSync(TEST_ACCOUNTS_PATH, 'utf-8')
    );
    
    const results: { name: string; email: string; success: boolean }[] = [];
    let successCount = 0;
    
    for (let i = 0; i < testData.accounts.length; i++) {
        const account = testData.accounts[i];
        console.log(`[${i + 1}/${testData.accounts.length}]`);
        
        const success = await signupSingleUser(account);
        results.push({
            name: account.name,
            email: account.email,
            success
        });
        
        if (success) successCount++;
        
        // Small delay between signups to be polite
        if (i < testData.accounts.length - 1) {
            console.log('   ⏳ Waiting 2 seconds...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n✨ Signup process complete!');
    console.log(`📊 Final Results: ${successCount}/${testData.accounts.length} successful\n`);
    
    console.log('📋 Summary:');
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.name} (${result.email})`);
    });
    
    // Save results
    fs.writeFileSync('stable-signup-results.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        total: testData.accounts.length,
        successful: successCount,
        results
    }, null, 2));
    
    console.log('\n💾 Results saved to stable-signup-results.json');
    
    return successCount;
}

// Run the script
signupAllUsers().then((count) => {
    console.log(`\n🎉 Process completed! ${count} users successfully signed up.`);
    process.exit(0);
}).catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});