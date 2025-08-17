import { test, expect, Page } from '@playwright/test';

test.describe('Explore Signup Page', () => {
  test('Examine signup page structure', async ({ page }) => {
    console.log('🔍 Exploring signup page structure...');

    // Navigate to signup page
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ 
      path: `tests/e2e/screenshots/signup-page-exploration-${Date.now()}.png`,
      fullPage: true 
    });

    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`📄 Page title: ${title}`);
    console.log(`🔗 URL: ${url}`);

    // Find all input fields
    const inputs = await page.locator('input').all();
    console.log(`📝 Found ${inputs.length} input fields:`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type') || 'text';
      const name = await input.getAttribute('name') || 'no-name';
      const placeholder = await input.getAttribute('placeholder') || 'no-placeholder';
      const id = await input.getAttribute('id') || 'no-id';
      console.log(`  ${i + 1}. Type: ${type}, Name: ${name}, Placeholder: ${placeholder}, ID: ${id}`);
    }

    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`🔘 Found ${buttons.length} buttons:`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent() || 'no-text';
      const type = await button.getAttribute('type') || 'button';
      const disabled = await button.isDisabled();
      console.log(`  ${i + 1}. Text: "${text.trim()}", Type: ${type}, Disabled: ${disabled}`);
    }

    // Check for forms
    const forms = await page.locator('form').all();
    console.log(`📋 Found ${forms.length} forms`);

    // Check for any error messages or notifications
    const errorSelectors = [
      '.error',
      '.alert',
      '.warning',
      '[role="alert"]',
      'text="error"',
      'text="Error"',
      'text="에러"',
      'text="오류"'
    ];

    for (const selector of errorSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(`⚠️  Found error elements with selector "${selector}": ${elements.length}`);
          for (const element of elements) {
            const text = await element.textContent();
            if (text?.trim()) {
              console.log(`   Error text: "${text.trim()}"`);
            }
          }
        }
      } catch (error) {
        // Continue checking other selectors
      }
    }

    // Check if there are any loading indicators
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[role="progressbar"]',
      'text="로딩"',
      'text="Loading"'
    ];

    let hasLoading = false;
    for (const selector of loadingSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          hasLoading = true;
          console.log(`⏳ Found loading indicator: ${selector}`);
        }
      } catch (error) {
        // Continue checking
      }
    }

    if (!hasLoading) {
      console.log('✅ No loading indicators found');
    }

    console.log('\n📊 SIGNUP PAGE EXPLORATION COMPLETE');
  });
});