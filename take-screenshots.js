const { chromium } = require('playwright');

(async () => {
  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // Navigate to localhost
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of homepage
    await page.screenshot({ 
      path: '/Users/lynnchoi/Projects/test/finance/screenshot-homepage.png',
      fullPage: true 
    });
    console.log('✓ Homepage screenshot saved');

    // Try to navigate to transactions page
    try {
      await page.click('text=거래내역', { timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: '/Users/lynnchoi/Projects/test/finance/screenshot-transactions.png',
        fullPage: true 
      });
      console.log('✓ Transactions page screenshot saved');
    } catch (e) {
      console.log('Could not navigate to transactions page');
    }

    // Try to navigate to analytics page
    try {
      await page.click('text=분석', { timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: '/Users/lynnchoi/Projects/test/finance/screenshot-analytics.png',
        fullPage: true 
      });
      console.log('✓ Analytics page screenshot saved');
    } catch (e) {
      console.log('Could not navigate to analytics page');
    }

    // Try to navigate to budget page
    try {
      await page.click('text=예산', { timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: '/Users/lynnchoi/Projects/test/finance/screenshot-budget.png',
        fullPage: true 
      });
      console.log('✓ Budget page screenshot saved');
    } catch (e) {
      console.log('Could not navigate to budget page');
    }

    // Try to navigate to reports page
    try {
      await page.click('text=리포트', { timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: '/Users/lynnchoi/Projects/test/finance/screenshot-reports.png',
        fullPage: true 
      });
      console.log('✓ Reports page screenshot saved');
    } catch (e) {
      console.log('Could not navigate to reports page');
    }

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
})();