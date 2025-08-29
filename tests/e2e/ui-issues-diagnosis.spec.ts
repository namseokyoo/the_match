import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test('Homepage UI diagnosis', async ({ page }) => {
  console.log('Testing Homepage...');
  
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for CSS loading
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const tailwindDetected = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.className && (el.className.includes('text-') || el.className.includes('bg-') || el.className.includes('flex'))) {
        return true;
      }
    }
    return false;
  });
  
  console.log(`Homepage - Stylesheets: ${stylesheetCount}, Tailwind detected: ${tailwindDetected}`);
  
  await page.screenshot({ path: 'tests/e2e/screenshots/homepage-diagnosis.png', fullPage: true });
  
  expect(page.locator('body')).toBeTruthy();
});

test('Matches page UI diagnosis', async ({ page }) => {
  console.log('Testing Matches page...');
  
  await page.goto(`${BASE_URL}/matches`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for CSS loading
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const tailwindDetected = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.className && (el.className.includes('text-') || el.className.includes('bg-') || el.className.includes('flex'))) {
        return true;
      }
    }
    return false;
  });
  
  console.log(`Matches - Stylesheets: ${stylesheetCount}, Tailwind detected: ${tailwindDetected}`);
  
  await page.screenshot({ path: 'tests/e2e/screenshots/matches-diagnosis.png', fullPage: true });
  
  expect(page.locator('body')).toBeTruthy();
});

test('Teams page UI diagnosis', async ({ page }) => {
  console.log('Testing Teams page...');
  
  await page.goto(`${BASE_URL}/teams`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for CSS loading
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const tailwindDetected = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.className && (el.className.includes('text-') || el.className.includes('bg-') || el.className.includes('flex'))) {
        return true;
      }
    }
    return false;
  });
  
  console.log(`Teams - Stylesheets: ${stylesheetCount}, Tailwind detected: ${tailwindDetected}`);
  
  await page.screenshot({ path: 'tests/e2e/screenshots/teams-diagnosis.png', fullPage: true });
  
  expect(page.locator('body')).toBeTruthy();
});

test('Login page UI diagnosis', async ({ page }) => {
  console.log('Testing Login page...');
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for CSS loading
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const tailwindDetected = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.className && (el.className.includes('text-') || el.className.includes('bg-') || el.className.includes('flex'))) {
        return true;
      }
    }
    return false;
  });
  
  console.log(`Login - Stylesheets: ${stylesheetCount}, Tailwind detected: ${tailwindDetected}`);
  
  await page.screenshot({ path: 'tests/e2e/screenshots/login-diagnosis.png', fullPage: true });
  
  expect(page.locator('body')).toBeTruthy();
});

test('Signup page UI diagnosis', async ({ page }) => {
  console.log('Testing Signup page...');
  
  await page.goto(`${BASE_URL}/signup`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for CSS loading
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const tailwindDetected = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.className && (el.className.includes('text-') || el.className.includes('bg-') || el.className.includes('flex'))) {
        return true;
      }
    }
    return false;
  });
  
  console.log(`Signup - Stylesheets: ${stylesheetCount}, Tailwind detected: ${tailwindDetected}`);
  
  await page.screenshot({ path: 'tests/e2e/screenshots/signup-diagnosis.png', fullPage: true });
  
  expect(page.locator('body')).toBeTruthy();
});

test('Dashboard page UI diagnosis', async ({ page }) => {
  console.log('Testing Dashboard page...');
  
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for CSS loading
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const tailwindDetected = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.className && (el.className.includes('text-') || el.className.includes('bg-') || el.className.includes('flex'))) {
        return true;
      }
    }
    return false;
  });
  
  console.log(`Dashboard - Stylesheets: ${stylesheetCount}, Tailwind detected: ${tailwindDetected}`);
  
  await page.screenshot({ path: 'tests/e2e/screenshots/dashboard-diagnosis.png', fullPage: true });
  
  expect(page.locator('body')).toBeTruthy();
});

test('Profile page UI diagnosis', async ({ page }) => {
  console.log('Testing Profile page...');
  
  await page.goto(`${BASE_URL}/profile`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for CSS loading
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const tailwindDetected = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.className && (el.className.includes('text-') || el.className.includes('bg-') || el.className.includes('flex'))) {
        return true;
      }
    }
    return false;
  });
  
  console.log(`Profile - Stylesheets: ${stylesheetCount}, Tailwind detected: ${tailwindDetected}`);
  
  await page.screenshot({ path: 'tests/e2e/screenshots/profile-diagnosis.png', fullPage: true });
  
  expect(page.locator('body')).toBeTruthy();
});

test('Community page UI diagnosis', async ({ page }) => {
  console.log('Testing Community page...');
  
  await page.goto(`${BASE_URL}/community`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for CSS loading
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const tailwindDetected = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.className && (el.className.includes('text-') || el.className.includes('bg-') || el.className.includes('flex'))) {
        return true;
      }
    }
    return false;
  });
  
  console.log(`Community - Stylesheets: ${stylesheetCount}, Tailwind detected: ${tailwindDetected}`);
  
  await page.screenshot({ path: 'tests/e2e/screenshots/community-diagnosis.png', fullPage: true });
  
  expect(page.locator('body')).toBeTruthy();
});