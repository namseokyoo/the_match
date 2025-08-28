const { chromium } = require('playwright');

async function analyzeUICards() {
  console.log('Starting UI card analysis...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to localhost
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Take homepage screenshot first
    await page.screenshot({ 
      path: 'homepage-desktop.png',
      fullPage: true
    });
    console.log('Homepage screenshot taken');

    // Try to navigate to matches page
    console.log('Looking for matches navigation...');
    
    // Check if there's a navigation menu or matches link
    const matchesLink = await page.locator('a[href*="/matches"], a:has-text("경기"), a:has-text("Match")').first();
    if (await matchesLink.isVisible({ timeout: 5000 })) {
      await matchesLink.click();
      await page.waitForLoadState('networkidle');
      console.log('Navigated to matches page');
    } else {
      // Try direct URL
      console.log('Direct navigation to /matches...');
      await page.goto('http://localhost:3000/matches', { waitUntil: 'networkidle' });
    }

    // Capture matches page desktop screenshot
    await page.screenshot({ 
      path: 'matches-desktop.png',
      fullPage: true
    });
    console.log('Matches desktop screenshot taken');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ 
      path: 'matches-mobile.png',
      fullPage: true
    });
    console.log('Matches mobile screenshot taken');

    // Navigate to teams page
    console.log('Looking for teams navigation...');
    await page.setViewportSize({ width: 1280, height: 720 }); // Reset to desktop
    
    const teamsLink = await page.locator('a[href*="/teams"], a:has-text("팀"), a:has-text("Team")').first();
    if (await teamsLink.isVisible({ timeout: 5000 })) {
      await teamsLink.click();
      await page.waitForLoadState('networkidle');
      console.log('Navigated to teams page');
    } else {
      // Try direct URL
      console.log('Direct navigation to /teams...');
      await page.goto('http://localhost:3000/teams', { waitUntil: 'networkidle' });
    }

    // Capture teams page desktop screenshot
    await page.screenshot({ 
      path: 'teams-desktop.png',
      fullPage: true
    });
    console.log('Teams desktop screenshot taken');

    // Set mobile viewport for teams
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ 
      path: 'teams-mobile.png',
      fullPage: true
    });
    console.log('Teams mobile screenshot taken');

    // Get card dimensions and layout information
    await page.setViewportSize({ width: 1280, height: 720 }); // Reset to desktop
    
    // Analyze card elements
    const cardAnalysis = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], .bg-white, [class*="border"]');
      const analysis = {
        totalCards: cards.length,
        cardDimensions: [],
        visibleCards: 0
      };

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const styles = window.getComputedStyle(card);
        
        if (rect.width > 0 && rect.height > 0) {
          analysis.cardDimensions.push({
            index,
            width: rect.width,
            height: rect.height,
            padding: styles.padding,
            margin: styles.margin,
            className: card.className
          });
          
          // Count visible cards (within viewport)
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            analysis.visibleCards++;
          }
        }
      });

      return analysis;
    });

    console.log('Card Analysis:', JSON.stringify(cardAnalysis, null, 2));

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await browser.close();
  }
}

analyzeUICards().catch(console.error);