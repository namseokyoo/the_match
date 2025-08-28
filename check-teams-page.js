const { chromium } = require('playwright');

async function checkTeamsPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Capture network errors
  const networkErrors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.statusText()}: ${response.url()}`);
    }
  });

  // Capture JavaScript errors
  const jsErrors = [];
  page.on('pageerror', error => {
    jsErrors.push(`Page error: ${error.message}`);
  });

  try {
    console.log('Navigating to http://localhost:3000/teams...');
    
    // Navigate to the teams page with a timeout
    await page.goto('http://localhost:3000/teams', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000);

    // Take a screenshot
    await page.screenshot({ 
      path: '/Users/namseokyoo/project/the_match/teams-page-screenshot.png',
      fullPage: true 
    });

    // Get page title and URL
    const title = await page.title();
    const url = page.url();

    // Check if there are any visible error messages on the page
    const errorElements = await page.$$eval('[class*="error"], [class*="Error"], .error-message, [data-testid*="error"]', 
      elements => elements.map(el => el.textContent?.trim()).filter(text => text)
    );

    // Get page content for analysis
    const bodyText = await page.$eval('body', el => el.textContent?.trim() || '');
    const pageHTML = await page.content();

    console.log('\n=== PAGE ANALYSIS RESULTS ===');
    console.log(`Title: ${title}`);
    console.log(`URL: ${url}`);
    console.log(`Screenshot saved: teams-page-screenshot.png`);

    if (jsErrors.length > 0) {
      console.log('\n🚨 JavaScript Errors:');
      jsErrors.forEach(error => console.log(`  - ${error}`));
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 Network Errors:');
      networkErrors.forEach(error => console.log(`  - ${error}`));
    }

    if (errorElements.length > 0) {
      console.log('\n❌ Visible Error Messages:');
      errorElements.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n📝 Console Messages:');
    if (consoleMessages.length === 0) {
      console.log('  No console messages');
    } else {
      consoleMessages.forEach(msg => console.log(`  - ${msg}`));
    }

    console.log(`\n📄 Page Content Preview (first 500 chars):`);
    console.log(bodyText.substring(0, 500) + (bodyText.length > 500 ? '...' : ''));

    // Check if the page loaded successfully (not showing a generic error page)
    const isErrorPage = bodyText.toLowerCase().includes('error') || 
                       bodyText.toLowerCase().includes('something went wrong') ||
                       bodyText.toLowerCase().includes('404') ||
                       bodyText.toLowerCase().includes('500');

    console.log(`\n✅ Page Status: ${isErrorPage ? 'ERROR PAGE DETECTED' : 'PAGE LOADED'}`);

  } catch (error) {
    console.error('\n❌ Error during navigation:');
    console.error(error.message);
    
    // Try to take a screenshot anyway
    try {
      await page.screenshot({ 
        path: '/Users/namseokyoo/project/the_match/teams-page-error-screenshot.png' 
      });
      console.log('Error screenshot saved: teams-page-error-screenshot.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

checkTeamsPage();