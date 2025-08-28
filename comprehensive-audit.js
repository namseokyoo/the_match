const { chromium } = require('playwright');
const path = require('path');

async function comprehensiveAudit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set desktop viewport for audit
  await page.setViewportSize({ width: 1440, height: 900 });
  
  const auditResults = [];
  const screenshots = {};
  
  try {
    console.log('🔍 Starting comprehensive UI/UX audit...');
    
    // 1. Homepage Analysis
    console.log('📱 Analyzing Homepage...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    screenshots.homepage = await page.screenshot({ path: 'audit-01-homepage.png', fullPage: true });
    console.log('✅ Homepage screenshot saved');
    
    // Check for modal/popup and close it if exists
    try {
      const closeButton = page.locator('button:has-text("다음"), button:has-text("×"), button[aria-label*="close"], button[aria-label*="닫"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('No modal to close');
    }
    
    // 2. Matches List Page
    console.log('📱 Analyzing Matches List Page...');
    await page.goto('http://localhost:3001/matches', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    screenshots.matchesList = await page.screenshot({ path: 'audit-02-matches-list.png', fullPage: true });
    console.log('✅ Matches list screenshot saved');
    
    // 3. Click on first match for detail page
    console.log('📱 Analyzing Match Detail Page...');
    try {
      // Look for match cards or links
      const matchLink = page.locator('a[href*="/matches/"], .match-card, [data-testid*="match"]').first();
      if (await matchLink.isVisible()) {
        await matchLink.click();
        await page.waitForTimeout(2000);
        screenshots.matchDetail = await page.screenshot({ path: 'audit-03-match-detail.png', fullPage: true });
        console.log('✅ Match detail screenshot saved');
      } else {
        console.log('⚠️ No match links found, navigating to a sample match');
        // Try to navigate to a sample match detail page directly
        await page.goto('http://localhost:3001/matches/1', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        screenshots.matchDetail = await page.screenshot({ path: 'audit-03-match-detail.png', fullPage: true });
      }
    } catch (error) {
      console.log('⚠️ Could not access match detail page:', error.message);
    }
    
    // 4. Teams List Page
    console.log('📱 Analyzing Teams List Page...');
    await page.goto('http://localhost:3001/teams', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    screenshots.teamsList = await page.screenshot({ path: 'audit-04-teams-list.png', fullPage: true });
    console.log('✅ Teams list screenshot saved');
    
    // 5. Create Match Page
    console.log('📱 Analyzing Create Match Page...');
    await page.goto('http://localhost:3001/matches/create', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    screenshots.createMatch = await page.screenshot({ path: 'audit-05-create-match.png', fullPage: true });
    console.log('✅ Create match screenshot saved');
    
    // 6. Login Page
    console.log('📱 Analyzing Login Page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    screenshots.login = await page.screenshot({ path: 'audit-06-login.png', fullPage: true });
    console.log('✅ Login screenshot saved');
    
    // 7. Signup Page
    console.log('📱 Analyzing Signup Page...');
    await page.goto('http://localhost:3001/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    screenshots.signup = await page.screenshot({ path: 'audit-07-signup.png', fullPage: true });
    console.log('✅ Signup screenshot saved');
    
    // 8. Mobile Responsiveness Test
    console.log('📱 Testing Mobile Responsiveness...');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    screenshots.mobileLanding = await page.screenshot({ path: 'audit-08-mobile-homepage.png', fullPage: true });
    
    await page.goto('http://localhost:3001/matches', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    screenshots.mobileMatches = await page.screenshot({ path: 'audit-09-mobile-matches.png', fullPage: true });
    console.log('✅ Mobile screenshots saved');
    
    console.log('🎉 Audit completed successfully!');
    console.log('📸 Screenshots saved:');
    console.log('- audit-01-homepage.png');
    console.log('- audit-02-matches-list.png');
    console.log('- audit-03-match-detail.png');
    console.log('- audit-04-teams-list.png');
    console.log('- audit-05-create-match.png');
    console.log('- audit-06-login.png');
    console.log('- audit-07-signup.png');
    console.log('- audit-08-mobile-homepage.png');
    console.log('- audit-09-mobile-matches.png');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await browser.close();
  }
}

comprehensiveAudit();