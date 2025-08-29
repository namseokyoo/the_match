import { test, expect } from '@playwright/test';

// 로컬 프로덕션 빌드 테스트
const BASE_URL = 'http://localhost:3000';

async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // 추가 안정성을 위한 대기
}

test.describe('프로덕션 CSS 로딩 테스트', () => {
  test('Homepage CSS Loading Test', async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const cssRequests: string[] = [];
    const failedRequests: string[] = [];
    
    // Monitor network requests
    page.on('request', (request) => {
      if (request.resourceType() === 'stylesheet' || request.url().includes('.css')) {
        cssRequests.push(request.url());
        console.log(`CSS Request: ${request.url()}`);
      }
    });
    
    page.on('requestfailed', (request) => {
      if (request.resourceType() === 'stylesheet' || request.url().includes('.css')) {
        failedRequests.push(request.url());
        console.log(`Failed CSS Request: ${request.url()}`);
      }
    });
    
    // Navigate to homepage
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'production-homepage.png',
      fullPage: true 
    });
    
    // Check if CSS files are loaded
    const cssLinks = await page.locator('link[rel="stylesheet"]').count();
    console.log(`Number of CSS links found: ${cssLinks}`);
    
    // Check for Next.js built CSS
    const nextCss = await page.locator('link[href*="_next/static/css"]').count();
    console.log(`Number of Next.js CSS files: ${nextCss}`);
    
    console.log(`Total CSS requests: ${cssRequests.length}`);
    console.log(`Failed CSS requests: ${failedRequests.length}`);
    
    if (failedRequests.length > 0) {
      console.log('Failed requests:', failedRequests);
    }

    // Check for Tailwind classes in the DOM
    const tailwindElements = await page.locator('[class*="flex"], [class*="grid"], [class*="bg-"], [class*="text-"]').count();
    console.log(`Elements with Tailwind classes: ${tailwindElements}`);
    
    // Verify if basic styles are applied
    const body = page.locator('body');
    const bodyStyles = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        backgroundColor: styles.backgroundColor,
        margin: styles.margin
      };
    });
    console.log('Body styles:', bodyStyles);
  });

  test('Matches Page CSS Test', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await page.goto(`${BASE_URL}/matches`);
    await waitForPageLoad(page);
    
    await page.screenshot({ 
      path: 'production-matches.png',
      fullPage: true 
    });
    
    // Check for styled elements
    const styledElements = await page.locator('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="rounded"]').count();
    console.log(`Number of styled elements on matches page: ${styledElements}`);

    // Check if page loaded with expected content
    const hasContent = await page.locator('body').textContent();
    const hasNavigation = await page.locator('nav, header').isVisible();
    console.log(`Page has navigation: ${hasNavigation}`);
    console.log(`Page content length: ${hasContent?.length || 0}`);
  });

  test('Teams Page CSS Test', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await page.goto(`${BASE_URL}/teams`);
    await waitForPageLoad(page);
    
    await page.screenshot({ 
      path: 'production-teams.png',
      fullPage: true 
    });
    
    // Check for styled elements
    const styledElements = await page.locator('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="rounded"]').count();
    console.log(`Number of styled elements on teams page: ${styledElements}`);

    // Check if page loaded with expected content
    const hasContent = await page.locator('body').textContent();
    const hasNavigation = await page.locator('nav, header').isVisible();
    console.log(`Page has navigation: ${hasNavigation}`);
    console.log(`Page content length: ${hasContent?.length || 0}`);
  });
});