const { chromium, devices } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch();
  
  try {
    // Desktop screenshots
    const desktopPage = await browser.newPage();
    await desktopPage.setViewportSize({ width: 1280, height: 800 });
    
    // Mobile screenshots (iPhone 12)
    const mobileContext = await browser.newContext({
      ...devices['iPhone 12']
    });
    const mobilePage = await mobileContext.newPage();
    
    const pages = [
      { url: '', name: 'homepage' },
      { url: '/transactions', name: 'transactions' },
      { url: '/analytics', name: 'analytics' },
      { url: '/budget', name: 'budget' },
      { url: '/reports', name: 'reports' }
    ];
    
    // Take desktop screenshots
    console.log('Taking desktop screenshots...');
    for (const pageInfo of pages) {
      try {
        await desktopPage.goto(`http://localhost:3001${pageInfo.url}`);
        await desktopPage.waitForTimeout(2000);
        await desktopPage.screenshot({ 
          path: `screenshots/${pageInfo.name}-desktop.png`, 
          fullPage: true 
        });
        console.log(`✓ Desktop ${pageInfo.name} screenshot saved`);
      } catch (error) {
        console.log(`Could not navigate to ${pageInfo.name} page (desktop): ${error.message}`);
      }
    }
    
    // Take mobile screenshots
    console.log('\nTaking mobile screenshots...');
    for (const pageInfo of pages) {
      try {
        await mobilePage.goto(`http://localhost:3001${pageInfo.url}`);
        await mobilePage.waitForTimeout(2000);
        await mobilePage.screenshot({ 
          path: `screenshots/${pageInfo.name}-mobile.png`, 
          fullPage: true 
        });
        console.log(`✓ Mobile ${pageInfo.name} screenshot saved`);
      } catch (error) {
        console.log(`Could not navigate to ${pageInfo.name} page (mobile): ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();