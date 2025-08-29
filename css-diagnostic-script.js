const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = 'https://the-match-five.vercel.app';

async function diagnoseCSSIssues() {
  console.log('🔍 Starting CSS Diagnostic on Vercel Production Site...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const diagnostics = [];

  // Listen for console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  // Listen for JavaScript errors
  const jsErrors = [];
  page.on('pageerror', (error) => {
    jsErrors.push(`JavaScript Error: ${error.message}`);
  });

  // Listen for network responses
  const responses = [];
  const networkErrors = [];
  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    const contentType = response.headers()['content-type'] || '';
    
    responses.push({
      url,
      status,
      contentType,
      headers: response.headers()
    });

    // Track failed requests
    if (status >= 400) {
      networkErrors.push({
        url,
        status,
        statusText: response.statusText()
      });
    }
  });

  const pages = [
    { url: PRODUCTION_URL, name: 'homepage' },
    { url: `${PRODUCTION_URL}/matches`, name: 'matches' },
    { url: `${PRODUCTION_URL}/teams`, name: 'teams' },
    { url: `${PRODUCTION_URL}/login`, name: 'login' }
  ];

  for (const pageInfo of pages) {
    console.log(`\n🔍 Testing ${pageInfo.name}: ${pageInfo.url}`);
    
    // Reset arrays for each page
    consoleMessages.length = 0;
    jsErrors.length = 0;
    networkErrors.length = 0;
    responses.length = 0;

    try {
      // Navigate to page
      await page.goto(pageInfo.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for any late-loading resources
      await page.waitForTimeout(3000);

      // Take screenshot
      const screenshotPath = `vercel-${pageInfo.name}-broken.png`;
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });

      // Check if Tailwind classes are present in HTML
      const tailwindClassesPresent = await page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"], [class*="flex"], [class*="grid"]');
        return elements.length > 0;
      });

      // Check for inline styles
      const inlineStylesPresent = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style]');
        return elements.length > 0;
      });

      // Check page title and basic HTML structure
      const pageTitle = await page.title();
      const hasNavigation = await page.evaluate(() => {
        return document.querySelector('nav') !== null;
      });

      // Filter CSS files from responses
      const cssFiles = responses
        .filter(r => r.url.includes('.css') || r.contentType.includes('text/css'))
        .map(r => ({
          url: r.url,
          status: r.status,
          contentType: r.contentType
        }));

      // Get response headers for the main document
      const mainResponse = responses.find(r => r.url === pageInfo.url);
      const responseHeaders = mainResponse ? mainResponse.headers : {};

      const diagnostic = {
        url: pageInfo.url,
        pageName: pageInfo.name,
        screenshotPath,
        pageTitle,
        hasNavigation,
        cssFiles,
        jsErrors: [...jsErrors],
        consoleErrors: [...consoleMessages],
        networkErrors: [...networkErrors],
        tailwindClassesPresent,
        inlineStylesPresent,
        responseHeaders
      };

      diagnostics.push(diagnostic);

      // Log immediate findings
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      console.log(`📄 Page title: ${pageTitle}`);
      console.log(`🧭 Navigation present: ${hasNavigation}`);
      console.log(`🎨 CSS Files found: ${cssFiles.length}`);
      console.log(`🏷️  Tailwind classes present: ${tailwindClassesPresent}`);
      console.log(`📝 Inline styles present: ${inlineStylesPresent}`);
      console.log(`❌ Network errors: ${networkErrors.length}`);
      console.log(`🚫 JS errors: ${jsErrors.length}`);
      console.log(`⚠️  Console errors: ${consoleMessages.length}`);

      if (cssFiles.length > 0) {
        console.log('CSS Files Details:');
        cssFiles.forEach(css => {
          console.log(`  - ${css.url} (Status: ${css.status}, Type: ${css.contentType})`);
        });
      }

      if (networkErrors.length > 0) {
        console.log('Network Errors:');
        networkErrors.forEach(err => {
          console.log(`  ❌ ${err.url} → ${err.status}: ${err.statusText}`);
        });
      }

      if (jsErrors.length > 0) {
        console.log('JavaScript Errors:');
        jsErrors.forEach(err => {
          console.log(`  ❌ ${err}`);
        });
      }

      if (consoleMessages.length > 0) {
        console.log('Console Errors:');
        consoleMessages.forEach(msg => {
          console.log(`  ⚠️  ${msg}`);
        });
      }

    } catch (error) {
      console.error(`❌ Error testing ${pageInfo.name}:`, error.message);
      
      // Still try to take a screenshot if possible
      try {
        const screenshotPath = `vercel-${pageInfo.name}-error.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Error screenshot saved: ${screenshotPath}`);
      } catch (screenshotError) {
        console.error('Could not take error screenshot:', screenshotError.message);
      }
    }
  }

  await browser.close();

  // Generate comprehensive report
  console.log('\n=================================================');
  console.log('🔍 VERCEL CSS DIAGNOSTIC REPORT');
  console.log('=================================================\n');

  diagnostics.forEach((diagnostic, index) => {
    console.log(`📄 PAGE ${index + 1}: ${diagnostic.pageName.toUpperCase()}`);
    console.log(`URL: ${diagnostic.url}`);
    console.log(`Screenshot: ${diagnostic.screenshotPath}`);
    console.log(`Page Title: ${diagnostic.pageTitle || 'N/A'}`);
    console.log(`Navigation Present: ${diagnostic.hasNavigation}`);
    console.log(`---`);
    
    console.log(`🎨 CSS Loading Status:`);
    if (diagnostic.cssFiles.length === 0) {
      console.log(`  ❌ NO CSS FILES DETECTED`);
    } else {
      console.log(`  ✅ Found ${diagnostic.cssFiles.length} CSS file(s):`);
      diagnostic.cssFiles.forEach(css => {
        const status = css.status === 200 ? '✅' : '❌';
        console.log(`    ${status} ${css.url} (${css.status})`);
      });
    }

    console.log(`🏷️  HTML Analysis:`);
    console.log(`  Tailwind classes present: ${diagnostic.tailwindClassesPresent ? '✅' : '❌'}`);
    console.log(`  Inline styles present: ${diagnostic.inlineStylesPresent ? '✅' : '❌'}`);

    if (diagnostic.networkErrors.length > 0) {
      console.log(`🚨 Network Errors (${diagnostic.networkErrors.length}):`);
      diagnostic.networkErrors.forEach(err => {
        console.log(`  ❌ ${err.url} → ${err.status}: ${err.statusText}`);
      });
    }

    if (diagnostic.jsErrors.length > 0) {
      console.log(`💥 JavaScript Errors (${diagnostic.jsErrors.length}):`);
      diagnostic.jsErrors.forEach(err => {
        console.log(`  ❌ ${err}`);
      });
    }

    if (diagnostic.consoleErrors.length > 0) {
      console.log(`⚠️  Console Errors (${diagnostic.consoleErrors.length}):`);
      diagnostic.consoleErrors.forEach(err => {
        console.log(`  ⚠️  ${err}`);
      });
    }

    console.log(`\n`);
  });

  // Summary analysis
  console.log('📊 SUMMARY ANALYSIS:');
  console.log('===================');
  
  const totalCssFiles = diagnostics.reduce((sum, d) => sum + d.cssFiles.length, 0);
  const totalNetworkErrors = diagnostics.reduce((sum, d) => sum + d.networkErrors.length, 0);
  const pagesWithTailwind = diagnostics.filter(d => d.tailwindClassesPresent).length;
  const pagesWithInlineStyles = diagnostics.filter(d => d.inlineStylesPresent).length;
  const pagesWithNavigation = diagnostics.filter(d => d.hasNavigation).length;

  console.log(`Total pages tested: ${diagnostics.length}`);
  console.log(`Total CSS files found: ${totalCssFiles}`);
  console.log(`Pages with Tailwind classes: ${pagesWithTailwind}/${diagnostics.length}`);
  console.log(`Pages with inline styles: ${pagesWithInlineStyles}/${diagnostics.length}`);
  console.log(`Pages with navigation: ${pagesWithNavigation}/${diagnostics.length}`);
  console.log(`Total network errors: ${totalNetworkErrors}`);

  // Diagnosis
  if (totalCssFiles === 0) {
    console.log(`\n🚨 CRITICAL ISSUE: No CSS files detected on any page!`);
    console.log(`This suggests a build or deployment issue with CSS bundling.`);
    console.log(`Recommendation: Check Vercel build logs and Next.js configuration.`);
  } else if (totalNetworkErrors > 0) {
    console.log(`\n⚠️  CSS files are being requested but some are failing to load.`);
    console.log(`This could be due to incorrect file paths or CDN issues.`);
  } else if (pagesWithTailwind === diagnostics.length && totalCssFiles > 0) {
    console.log(`\n🤔 POTENTIAL ISSUE: Tailwind classes are present and CSS files are loading,`);
    console.log(`but styles may not be applying correctly. This could be a hydration issue.`);
    console.log(`Recommendation: Check for CSS-in-JS conflicts or Next.js hydration issues.`);
  }

  if (pagesWithNavigation < diagnostics.length) {
    console.log(`\n🚨 NAVIGATION ISSUE: Some pages are missing navigation elements.`);
    console.log(`This could indicate layout component issues.`);
  }

  // Write detailed report to file
  const reportPath = 'css-diagnostic-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(diagnostics, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  console.log('\n✅ Diagnostic complete! Check the screenshots and report file for details.');
}

// Run the diagnostic
diagnoseCSSIssues().catch(console.error);