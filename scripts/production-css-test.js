const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testProductionCSS() {
  console.log('🚀 Starting Production CSS Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Monitor network requests
    const cssRequests = [];
    const failedRequests = [];
    
    page.on('request', (request) => {
      if (request.resourceType() === 'stylesheet' || request.url().includes('.css')) {
        cssRequests.push(request.url());
        console.log(`📥 CSS Request: ${request.url()}`);
      }
    });
    
    page.on('requestfailed', (request) => {
      if (request.resourceType() === 'stylesheet' || request.url().includes('.css')) {
        failedRequests.push(request.url());
        console.log(`❌ Failed CSS Request: ${request.url()}`);
      }
    });
    
    // Test Homepage
    console.log('🏠 Testing Homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'production-homepage.png',
      fullPage: true
    });
    console.log('📸 Homepage screenshot saved');
    
    // Check CSS loading
    const cssLinks = await page.$$eval('link[rel="stylesheet"]', links => links.length);
    console.log(`🔗 CSS links found: ${cssLinks}`);
    
    const nextCssLinks = await page.$$eval('link[href*="_next/static/css"]', links => links.length);
    console.log(`🔗 Next.js CSS files: ${nextCssLinks}`);
    
    // Check Tailwind classes
    const tailwindElements = await page.$$eval('[class*="bg-"], [class*="text-"], [class*="flex"], [class*="grid"]', els => els.length);
    console.log(`🎨 Elements with Tailwind classes: ${tailwindElements}`);
    
    // Check computed styles
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });
    console.log('🎨 Body computed styles:', bodyStyles);
    
    // Test Matches Page
    console.log('\\n🏆 Testing Matches Page...');
    await page.goto('http://localhost:3000/matches', { waitUntil: 'networkidle0' });
    
    await page.screenshot({ 
      path: 'production-matches.png',
      fullPage: true
    });
    console.log('📸 Matches page screenshot saved');
    
    const matchesStyledElements = await page.$$eval('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="rounded"]', els => els.length);
    console.log(`🎨 Styled elements on matches page: ${matchesStyledElements}`);
    
    const hasNavigation = await page.$eval('nav, header', el => el !== null).catch(() => false);
    console.log(`🧭 Navigation present: ${hasNavigation}`);
    
    // Test Teams Page
    console.log('\\n👥 Testing Teams Page...');
    await page.goto('http://localhost:3000/teams', { waitUntil: 'networkidle0' });
    
    await page.screenshot({ 
      path: 'production-teams.png',
      fullPage: true
    });
    console.log('📸 Teams page screenshot saved');
    
    const teamsStyledElements = await page.$$eval('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="rounded"]', els => els.length);
    console.log(`🎨 Styled elements on teams page: ${teamsStyledElements}`);
    
    // Summary
    console.log('\\n📊 Test Summary:');
    console.log(`📥 Total CSS requests: ${cssRequests.length}`);
    console.log(`❌ Failed CSS requests: ${failedRequests.length}`);
    
    if (failedRequests.length > 0) {
      console.log('❌ Failed requests:', failedRequests);
    } else {
      console.log('✅ All CSS requests successful');
    }
    
    console.log('\\n✅ Production CSS Test Complete!');
    console.log('📸 Screenshots saved:');
    console.log('  - production-homepage.png');
    console.log('  - production-matches.png');
    console.log('  - production-teams.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testProductionCSS().catch(console.error);