import { test, expect } from '@playwright/test';

test.describe('Quick Auth Test', () => {
  test('should login and maintain session', async ({ page }) => {
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    
    // 2. 로그인 폼 작성
    await page.fill('input[type="email"]', 'testuser1755406332023@thematch.test');
    await page.fill('input[type="password"]', 'Test123456!');
    
    // 3. 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    
    // 4. 대시보드로 리다이렉트 확인
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // 5. 프로필 페이지 접근 테스트
    await page.goto('http://localhost:3000/profile');
    await expect(page).not.toHaveURL('**/login');
    
    // 6. 경기 생성 페이지 접근 테스트  
    await page.goto('http://localhost:3000/matches/create');
    await expect(page).not.toHaveURL('**/login');
    
    console.log('✅ Authentication test passed!');
  });
});