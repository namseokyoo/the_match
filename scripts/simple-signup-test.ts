import { chromium } from 'playwright';

const BASE_URL = 'https://the-match-five.vercel.app';

async function testSingleSignup() {
    console.log('🌐 Starting browser...');
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    try {
        // Navigate to signup page
        console.log('📝 Navigating to signup page...');
        await page.goto(`${BASE_URL}/signup`);
        await page.waitForLoadState('networkidle');
        
        // Take screenshot to see what's available
        await page.screenshot({ path: 'signup-page.png' });
        console.log('📸 Screenshot saved as signup-page.png');
        
        // Wait a bit and check what elements exist
        console.log('🔍 Looking for form elements...');
        const nameInput = await page.locator('input[placeholder*="홍길동"]').first();
        const emailInput = await page.locator('input[placeholder*="example"]').first();
        const passwordInput = await page.locator('input[placeholder*="최소"]').first();
        const confirmInput = await page.locator('input[placeholder*="다시"]').first();
        
        console.log('Name input visible:', await nameInput.isVisible());
        console.log('Email input visible:', await emailInput.isVisible());
        console.log('Password input visible:', await passwordInput.isVisible());
        console.log('Confirm input visible:', await confirmInput.isVisible());
        
        // Try to fill the form
        if (await nameInput.isVisible()) {
            console.log('✏️ Filling form...');
            await nameInput.fill('테스트 사용자');
            await emailInput.fill('test@example.com');
            await passwordInput.fill('Test123!@#');
            await confirmInput.fill('Test123!@#');
            
            // Find and click submit button
            const submitBtn = await page.locator('button[type="submit"]').first();
            if (await submitBtn.isVisible()) {
                console.log('🚀 Submitting form...');
                await submitBtn.click();
                
                // Wait and see what happens
                await page.waitForTimeout(5000);
                await page.screenshot({ path: 'after-signup.png' });
                console.log('📸 After signup screenshot saved');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        await page.screenshot({ path: 'error-page.png' });
    } finally {
        await browser.close();
    }
}

testSingleSignup();