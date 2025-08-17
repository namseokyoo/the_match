import { test, expect } from '@playwright/test';

test.describe('Manual Auth Debug', () => {
  test('debug authentication flow', async ({ page }) => {
    // 콘솔 로그 캡처
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    
    // 네트워크 요청 모니터링
    page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('login')) {
        console.log(`[Network] ${response.status()} ${response.url()}`);
      }
    });
    
    // 1. 홈페이지로 이동
    await page.goto('http://localhost:3000');
    await page.screenshot({ path: 'tests/e2e/screenshots/debug-1-home.png' });
    
    // 2. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    await page.screenshot({ path: 'tests/e2e/screenshots/debug-2-login.png' });
    
    // 3. 로그인 폼 작성
    await page.fill('input[type="email"]', 'testuser1755406332023@thematch.test');
    await page.fill('input[type="password"]', 'Test123456!');
    await page.screenshot({ path: 'tests/e2e/screenshots/debug-3-filled.png' });
    
    // 4. 로그인 버튼 클릭
    console.log('Clicking login button...');
    await page.click('button:has-text("로그인")');
    
    // 5. 네트워크 요청 완료 대기
    await page.waitForTimeout(3000);
    
    // 6. 현재 URL 확인
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    await page.screenshot({ path: 'tests/e2e/screenshots/debug-4-after-login.png' });
    
    // 7. 쿠키 확인
    const cookies = await page.context().cookies();
    console.log('Cookies:', cookies.map(c => ({ name: c.name, domain: c.domain })));
    
    // 8. localStorage 확인
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.includes('supabase')) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });
    console.log('LocalStorage (Supabase):', Object.keys(localStorage));
    
    // 대기
    await page.waitForTimeout(30000);
  });
});