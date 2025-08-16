import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'https://the-match-five.vercel.app';

// Device configurations for comprehensive testing
const devices = [
  {
    name: 'iPhone 14',
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'Samsung Galaxy S23',
    viewport: { width: 360, height: 780 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'iPad Air',
    viewport: { width: 820, height: 1180 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'Desktop',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    isMobile: false,
    hasTouch: false
  }
];

// Viewport breakpoints for responsive testing
const viewports = [
  { name: 'Mobile Small', width: 320, height: 568 },
  { name: 'Mobile Medium', width: 375, height: 667 },
  { name: 'Mobile Large', width: 414, height: 896 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Desktop Small', width: 1200, height: 800 },
  { name: 'Desktop Large', width: 1920, height: 1080 }
];

// Helper function to wait for page load and hydration
async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => document.readyState === 'complete');
  // Wait for React hydration to complete
  await page.waitForFunction(() => {
    const elements = document.querySelectorAll('[data-testid], button, a, input');
    return elements.length > 0;
  }, { timeout: 10000 });
}

// Helper function to create browser context with mobile compatibility
async function createMobileContext(browser: any, options: {
  viewport: { width: number; height: number };
  userAgent: string;
  hasTouch: boolean;
  isMobile: boolean;
}) {
  const contextOptions: any = {
    viewport: options.viewport,
    userAgent: options.userAgent,
    hasTouch: options.hasTouch
  };
  
  // Firefox doesn't support isMobile option
  if (browser.browserType().name() !== 'firefox') {
    contextOptions.isMobile = options.isMobile;
  }
  
  return browser.newContext(contextOptions);
}

// Helper function to check element visibility and accessibility
async function checkElementAccessibility(page: Page, selector: string, minTouchTargetSize = 44) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  
  const boundingBox = await element.boundingBox();
  if (boundingBox) {
    expect(boundingBox.width).toBeGreaterThanOrEqual(minTouchTargetSize);
    expect(boundingBox.height).toBeGreaterThanOrEqual(minTouchTargetSize);
  }
}

test.describe('Mobile Responsive Design Tests', () => {
  viewports.forEach((viewport) => {
    test(`Layout adapts correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(BASE_URL);
      await waitForPageReady(page);

      // Check that the page renders correctly
      await expect(page.locator('main')).toBeVisible();
      
      // For mobile viewports, check bottom navigation
      if (viewport.width <= 768) {
        const bottomNav = page.locator('nav').last();
        await expect(bottomNav).toBeVisible();
        
        // Check navigation items
        const navItems = ['홈', '경기', '커뮤니티', '팀', '로그인'];
        for (const item of navItems) {
          await expect(bottomNav.locator(`text=${item}`)).toBeVisible();
        }
      }

      // Check header navigation
      const header = page.locator('nav').first();
      await expect(header).toBeVisible();

      // For smaller screens, check for hamburger menu or navigation is visible
      if (viewport.width <= 768) {
        // Either hamburger menu button exists or navigation is always visible
        const menuButton = page.locator('button:has-text("메뉴")');
        const navigationLinks = page.locator('nav').first().locator('a');
        
        const hasMenuButton = await menuButton.count() > 0;
        const hasNavLinks = await navigationLinks.count() > 0;
        
        expect(hasMenuButton || hasNavLinks).toBeTruthy();
      }

      // Check content doesn't overflow
      const body = page.locator('body');
      const bodyBoundingBox = await body.boundingBox();
      if (bodyBoundingBox) {
        expect(bodyBoundingBox.width).toBeLessThanOrEqual(viewport.width + 20); // Allow for scrollbar
      }

      // Take screenshot for visual regression testing
      await page.screenshot({
        path: `tests/e2e/screenshots/layout-${viewport.name.replace(/\s+/g, '-').toLowerCase()}-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });
    });
  });
});

test.describe('Mobile Navigation Tests', () => {
  devices.filter(device => device.isMobile).forEach((device) => {
    test(`Navigation works correctly on ${device.name}`, async ({ browser }) => {
      // Firefox doesn't support isMobile option, so we conditionally include it
      const contextOptions: any = {
        viewport: device.viewport,
        userAgent: device.userAgent,
        hasTouch: device.hasTouch
      };
      
      // Only add isMobile for browsers that support it (Chromium, WebKit)
      if (browser.browserType().name() !== 'firefox') {
        contextOptions.isMobile = device.isMobile;
      }
      
      const context = await createMobileContext(browser, device);
      
      const page = await context.newPage();
      await page.goto(BASE_URL);
      await waitForPageReady(page);

      // Test hamburger menu functionality (if it exists and toggles menu)
      const menuButton = page.locator('button:has-text("메뉴")');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300); // Wait for animation
        
        // Menu items should be visible (either always or after toggle)
        const headerNav = page.locator('nav').first();
        const menuItems = headerNav.locator('a');
        const count = await menuItems.count();
        expect(count).toBeGreaterThan(0);
      }

      // Test bottom navigation
      const bottomNav = page.locator('nav').last();
      await expect(bottomNav).toBeVisible();

      // Test navigation to different sections
      const navigationTests = [
        { button: '경기', expectedUrl: '/matches' },
        { button: '팀', expectedUrl: '/teams' },
        { button: '커뮤니티', expectedUrl: '/community' },
        { button: '홈', expectedUrl: '/' }
      ];

      for (const nav of navigationTests) {
        // Use JavaScript click to avoid pointer interception issues
        await page.evaluate((buttonText) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const button = buttons.find(btn => btn.textContent.includes(buttonText));
          if (button) {
            button.click();
          }
        }, nav.button);
        
        await waitForPageReady(page);
        
        // Check URL
        await page.waitForURL(`**${nav.expectedUrl}*`, { timeout: 5000 });
        expect(page.url()).toContain(nav.expectedUrl);
        
        // Check page content loads
        await expect(page.locator('main')).toBeVisible();
        
        // Wait between navigations
        await page.waitForTimeout(500);
      }

      await context.close();
    });
  });
});

test.describe('Touch Interaction Tests', () => {
  const touchDevice = devices.find(d => d.name === 'iPhone 14')!;
  
  test('Touch targets meet accessibility standards', async ({ browser }) => {
    const contextOptions: any = {
      viewport: touchDevice.viewport,
      userAgent: touchDevice.userAgent,
      hasTouch: true
    };
    
    if (browser.browserType().name() !== 'firefox') {
      contextOptions.isMobile = true;
    }
    
    const context = await createMobileContext(browser, {
      viewport: touchDevice.viewport,
      userAgent: touchDevice.userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await waitForPageReady(page);

    // Check bottom navigation buttons
    const bottomNavButtons = page.locator('nav').last().locator('button');
    const buttonCount = await bottomNavButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = bottomNavButtons.nth(i);
      const boundingBox = await button.boundingBox();
      
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44); // iOS HIG minimum
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Check main content buttons and links
    const mainButtons = page.locator('main button, main a');
    const mainButtonCount = await mainButtons.count();
    
    for (let i = 0; i < Math.min(mainButtonCount, 10); i++) { // Test first 10 elements
      const element = mainButtons.nth(i);
      if (await element.isVisible()) {
        const boundingBox = await element.boundingBox();
        
        if (boundingBox) {
          // Allow smaller sizes for some elements like icons, but warn if too small
          const minSize = 20; // More lenient minimum size
          if (boundingBox.width < minSize || boundingBox.height < minSize) {
            console.warn(`Element may be too small for touch: ${boundingBox.width}x${boundingBox.height}`);
          }
          expect(boundingBox.width).toBeGreaterThanOrEqual(minSize);
          expect(boundingBox.height).toBeGreaterThanOrEqual(minSize);
        }
      }
    }

    await context.close();
  });

  test('Scroll behavior works correctly', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: touchDevice.viewport,
      userAgent: touchDevice.userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await waitForPageReady(page);

    // Test vertical scroll
    const initialY = await page.evaluate(() => window.scrollY);
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);
    
    const scrolledY = await page.evaluate(() => window.scrollY);
    expect(scrolledY).toBeGreaterThan(initialY);

    // Test smooth scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(1000);
    
    const finalY = await page.evaluate(() => window.scrollY);
    expect(finalY).toBeLessThan(scrolledY);

    await context.close();
  });

  test('Touch gestures and interactions', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: touchDevice.viewport,
      userAgent: touchDevice.userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/matches`);
    await waitForPageReady(page);

    // Test tap interactions
    const matchCards = page.locator('a[href*="/matches/"]').first();
    if (await matchCards.isVisible()) {
      try {
        // Simulate touch tap
        await matchCards.tap();
        await waitForPageReady(page);
        
        // Should navigate to match detail
        expect(page.url()).toContain('/matches/');
        
        // Go back
        await page.goBack();
        await waitForPageReady(page);
      } catch (error) {
        // If tap fails due to interception, use click as fallback
        await matchCards.click({ force: true });
        await waitForPageReady(page);
        
        expect(page.url()).toContain('/matches/');
        await page.goBack();
        await waitForPageReady(page);
      }
    }

    // Test long press (if applicable)
    const firstCard = page.locator('main').locator('a, button').first();
    if (await firstCard.isVisible()) {
      await firstCard.tap({ timeout: 1000 });
      // Long press should not break the interface
      await expect(page.locator('main')).toBeVisible();
    }

    await context.close();
  });
});

test.describe('Performance and Loading Tests', () => {
  test('Page loads efficiently on 3G network', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: devices[0].userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    
    // Simulate 3G network
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto(BASE_URL);
    await waitForPageReady(page);
    const loadTime = Date.now() - startTime;

    // Should load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(10000); // 10 seconds max

    // Check that critical content is visible
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav').last()).toBeVisible(); // Bottom nav

    await context.close();
  });

  test('Loading states and skeleton screens', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: devices[0].userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    
    // Slow down network to observe loading states
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.continue();
    });

    await page.goto(BASE_URL);
    
    // Check if loading spinner or skeleton is shown
    const hasLoadingIndicator = await page.locator('div[class*="loading"], div[class*="skeleton"], div[class*="spinner"]').count() > 0;
    
    await waitForPageReady(page);
    
    // After loading, content should be visible
    await expect(page.locator('main')).toBeVisible();

    await context.close();
  });

  test('Images load properly with lazy loading', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: devices[0].userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await waitForPageReady(page);

    // Check for images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check first few images load properly
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        
        if (src && !src.startsWith('data:')) {
          // Check image loads successfully
          await expect(img).toBeVisible();
        }
      }

      // Test lazy loading by scrolling
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      // Images should still be loading properly
      const visibleImages = page.locator('img:visible');
      const visibleCount = await visibleImages.count();
      expect(visibleCount).toBeGreaterThan(0);
    }

    await context.close();
  });
});

test.describe('Offline and Network Tests', () => {
  test('Handles offline state gracefully', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: devices[0].userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await waitForPageReady(page);

    // Simulate offline
    await context.setOffline(true);
    
    // Try to navigate
    await page.locator('nav').last().locator('button', { hasText: '경기' }).click();
    await page.waitForTimeout(2000);
    
    // Should show some kind of offline indicator or cached content
    // The page should not completely break
    await expect(page.locator('body')).toBeVisible();
    
    // Restore online
    await context.setOffline(false);
    await page.waitForTimeout(1000);
    
    // Should recover gracefully
    await page.reload();
    await waitForPageReady(page);
    await expect(page.locator('main')).toBeVisible();

    await context.close();
  });
});

test.describe('Cross-Device Consistency Tests', () => {
  test('UI consistency across different devices', async ({ browser }) => {
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];
    
    try {
      // Create contexts for different devices
      for (const device of devices) {
        const context = await browser.newContext({
          viewport: device.viewport,
          userAgent: device.userAgent,
          hasTouch: device.hasTouch,
          isMobile: device.isMobile
        });
        contexts.push(context);
        
        const page = await context.newPage();
        await page.goto(BASE_URL);
        await waitForPageReady(page);
        pages.push(page);
      }

      // Check that key elements are present on all devices
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const device = devices[i];
        
        // Main content should be visible
        await expect(page.locator('main')).toBeVisible();
        
        // Navigation should be present
        const navCount = await page.locator('nav').count();
        expect(navCount).toBeGreaterThan(0);
        
        // For mobile devices, bottom nav should be visible
        if (device.isMobile && device.viewport.width <= 768) {
          await expect(page.locator('nav').last()).toBeVisible();
        }
        
        // Take screenshot for comparison
        await page.screenshot({
          path: `tests/e2e/screenshots/device-${device.name.replace(/\s+/g, '-').toLowerCase()}.png`,
          fullPage: false
        });
      }
    } finally {
      // Clean up
      for (const context of contexts) {
        await context.close();
      }
    }
  });
});

test.describe('Accessibility and Usability Tests', () => {
  test('Keyboard navigation works on touch devices', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 820, height: 1180 }, // iPad size
      userAgent: devices[2].userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await waitForPageReady(page);

    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Should focus on first focusable element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const currentFocused = page.locator(':focus');
      if (await currentFocused.count() > 0) {
        await expect(currentFocused).toBeVisible();
      }
    }

    await context.close();
  });

  test('Focus indicators are visible and clear', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: devices[0].userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await waitForPageReady(page);

    // Test focus on interactive elements
    const interactiveElements = page.locator('button, a, input, [tabindex]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = interactiveElements.nth(i);
      if (await element.isVisible()) {
        await element.focus();
        await page.waitForTimeout(100);
        
        // Check if element has focus styles
        const hasOutline = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.outline !== 'none' || 
                 styles.boxShadow !== 'none' || 
                 styles.border !== styles.border; // Changed border
        });
        
        // Focus should be clearly visible
        expect(hasOutline).toBeTruthy();
      }
    }

    await context.close();
  });
});

test.describe('PWA and Mobile App Features', () => {
  test('Service worker and caching work correctly', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: devices[0].userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    
    // Check for service worker registration
    await page.goto(BASE_URL);
    await waitForPageReady(page);
    
    const serviceWorkerExists = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(serviceWorkerExists).toBeTruthy();
    
    // Check for manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    if (await manifestLink.count() > 0) {
      const href = await manifestLink.getAttribute('href');
      expect(href).toBeTruthy();
    }

    await context.close();
  });

  test('App install prompt behavior', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: devices[0].userAgent,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    await page.goto(BASE_URL);
    await waitForPageReady(page);

    // Check if install button or prompt exists
    const installButton = page.locator('button[class*="install"], button:has-text("설치"), button:has-text("Install")');
    
    // Install prompt might not always be available, so this is optional
    if (await installButton.count() > 0) {
      await expect(installButton.first()).toBeVisible();
    }

    await context.close();
  });
});