import { test, expect } from '@playwright/test';

test.describe('간단한 연결 테스트', () => {
  test('홈페이지 접속 테스트', async ({ page }) => {
    // 로컬 서버로 접속 (포트 3001)
    await page.goto('http://localhost:3001');
    
    // 페이지 타이틀 확인
    const title = await page.title();
    console.log('페이지 타이틀:', title);
    
    // The Match 텍스트 확인
    await expect(page.getByText(/The Match/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('로그인 페이지 접속 테스트', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // 로그인 폼 확인
    await expect(page.getByRole('heading', { name: /로그인/i })).toBeVisible({ timeout: 10000 });
  });

  test('회원가입 페이지 접속 테스트', async ({ page }) => {
    await page.goto('http://localhost:3001/signup');
    
    // 회원가입 폼 확인
    await expect(page.getByRole('heading', { name: /회원가입/i })).toBeVisible({ timeout: 10000 });
  });
});