const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport size
  await page.setViewportSize({ width: 1440, height: 900 });
  
  try {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'audit-homepage.png', fullPage: true });
    console.log('Homepage screenshot saved');
    
    // Wait for user interaction or timeout
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('Error during audit:', error);
  } finally {
    await browser.close();
  }
})();