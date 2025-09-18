const { chromium } = require('playwright');

// Quick test for remaining pages
const remainingPages = [
  { url: '/reports', name: 'reports' },
  { url: '/settings', name: 'settings' }
];

const keyViewports = [
  { width: 1280, height: 800, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 812, name: 'mobile' }
];

async function quickTest() {
  console.log('🚀 Quick test for remaining pages...\n');
  
  const browser = await chromium.launch({ headless: true });
  
  for (const page of remainingPages) {
    console.log(`📄 Testing: ${page.name} (${page.url})`);
    
    for (const viewport of keyViewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: 'ko-KR'
      });
      
      const browserPage = await context.newPage();
      
      try {
        const response = await browserPage.goto(`http://localhost:3000${page.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        const status = response.status();
        await browserPage.waitForTimeout(1000);
        
        const screenshotPath = `screenshots/${page.name}-${viewport.name}-quick.png`;
        await browserPage.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        console.log(`  ${status === 200 ? '✅' : '❌'} ${viewport.name}: ${status === 200 ? 'OK' : 'FAILED'} (${viewport.width}x${viewport.height})`);
        
      } catch (error) {
        console.log(`  ❌ ${viewport.name}: ERROR - ${error.message}`);
      } finally {
        await context.close();
      }
    }
  }
  
  await browser.close();
  console.log('\n✨ Quick test completed!');
}

quickTest().catch(console.error);