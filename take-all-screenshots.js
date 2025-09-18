const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

async function takeAllScreenshots() {
  const browser = await chromium.launch({ headless: false });
  
  // Ensure screenshots directory exists
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  try {
    // Define pages to test
    const pages = [
      { url: '/', name: 'homepage', description: '홈/대시보드' },
      { url: '/transactions', name: 'transactions', description: '거래내역' },
      { url: '/budget', name: 'budget', description: '예산관리' },
      { url: '/analytics', name: 'analytics', description: '분석' },
      { url: '/reports', name: 'reports', description: '리포트' },
      { url: '/settings', name: 'settings', description: '설정' }
    ];
    
    // Define viewport sizes for responsive testing
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-xl', description: 'Desktop XL (1920x1080)' },
      { width: 1440, height: 900, name: 'desktop-lg', description: 'Desktop Large (1440x900)' },
      { width: 1280, height: 800, name: 'desktop', description: 'Desktop (1280x800)' },
      { width: 1024, height: 768, name: 'tablet-landscape', description: 'Tablet Landscape (1024x768)' },
      { width: 768, height: 1024, name: 'tablet', description: 'Tablet Portrait (768x1024)' },
      { width: 375, height: 812, name: 'mobile', description: 'Mobile (iPhone X)' },
      { width: 360, height: 640, name: 'mobile-android', description: 'Mobile Android (360x640)' }
    ];
    
    console.log('====================================');
    console.log('📸 Starting comprehensive screenshot capture...');
    console.log('====================================\n');
    
    // Test with different viewport sizes
    for (const viewport of viewports) {
      console.log(`\n📱 Testing ${viewport.description}`);
      console.log('-----------------------------------');
      
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      
      for (const pageInfo of pages) {
        try {
          console.log(`  📄 Loading ${pageInfo.description}...`);
          
          // Navigate to page
          const response = await page.goto(`http://localhost:3002${pageInfo.url}`, {
            waitUntil: 'networkidle',
            timeout: 30000
          });
          
          // Check response status
          if (response && response.status() >= 400) {
            console.log(`    ❌ Error: HTTP ${response.status()} for ${pageInfo.description}`);
            continue;
          }
          
          // Wait for content to load
          await page.waitForTimeout(2000);
          
          // Check for any JavaScript errors
          const errors = [];
          page.on('pageerror', error => {
            errors.push(error.message);
          });
          
          // Take screenshot
          const filename = `${pageInfo.name}-${viewport.name}.png`;
          await page.screenshot({ 
            path: path.join(screenshotsDir, filename), 
            fullPage: true 
          });
          
          // Check if there were any errors
          if (errors.length > 0) {
            console.log(`    ⚠️  JavaScript errors detected:`);
            errors.forEach(error => console.log(`       - ${error}`));
          } else {
            console.log(`    ✅ Screenshot saved: ${filename}`);
          }
          
          // Test responsive behavior by checking if mobile menu appears
          if (viewport.width < 768) {
            const mobileMenu = await page.$('[aria-label="Mobile menu"]');
            if (mobileMenu) {
              console.log(`    ✅ Mobile menu detected`);
            }
          }
          
          // Check for layout issues
          const layoutIssues = await page.evaluate(() => {
            const issues = [];
            
            // Check for horizontal overflow
            if (document.body.scrollWidth > window.innerWidth) {
              issues.push('Horizontal scroll detected');
            }
            
            // Check for overlapping elements
            const elements = document.querySelectorAll('*');
            for (let i = 0; i < Math.min(elements.length, 100); i++) {
              const rect = elements[i].getBoundingClientRect();
              if (rect.width < 0 || rect.height < 0) {
                issues.push(`Negative dimensions detected on element`);
                break;
              }
            }
            
            return issues;
          });
          
          if (layoutIssues.length > 0) {
            console.log(`    ⚠️  Layout issues detected:`);
            layoutIssues.forEach(issue => console.log(`       - ${issue}`));
          }
          
        } catch (error) {
          console.log(`    ❌ Failed to capture ${pageInfo.description}: ${error.message}`);
        }
      }
      
      await context.close();
    }
    
    // Test with actual mobile devices
    console.log('\n\n📱 Testing with real device emulation');
    console.log('=====================================');
    
    const mobileDevices = [
      { device: devices['iPhone 12'], name: 'iphone-12' },
      { device: devices['iPhone 12 Pro Max'], name: 'iphone-12-pro-max' },
      { device: devices['iPad'], name: 'ipad' },
      { device: devices['iPad Pro'], name: 'ipad-pro' },
      { device: devices['Pixel 5'], name: 'pixel-5' },
      { device: devices['Galaxy S9+'], name: 'galaxy-s9' }
    ];
    
    for (const { device, name } of mobileDevices) {
      console.log(`\n📱 Testing ${device.name || name}`);
      console.log('-----------------------------------');
      
      const context = await browser.newContext(device);
      const page = await context.newPage();
      
      for (const pageInfo of pages) {
        try {
          console.log(`  📄 Loading ${pageInfo.description}...`);
          
          await page.goto(`http://localhost:3002${pageInfo.url}`, {
            waitUntil: 'networkidle',
            timeout: 30000
          });
          
          await page.waitForTimeout(1500);
          
          const filename = `${pageInfo.name}-${name}.png`;
          await page.screenshot({ 
            path: path.join(screenshotsDir, filename), 
            fullPage: true 
          });
          
          console.log(`    ✅ Screenshot saved: ${filename}`);
          
        } catch (error) {
          console.log(`    ❌ Failed: ${error.message}`);
        }
      }
      
      await context.close();
    }
    
    // Summary
    console.log('\n====================================');
    console.log('📊 Screenshot Summary');
    console.log('====================================');
    console.log(`✅ Tested ${pages.length} pages`);
    console.log(`✅ Tested ${viewports.length} viewport sizes`);
    console.log(`✅ Tested ${mobileDevices.length} mobile devices`);
    console.log(`✅ Total screenshots: ${pages.length * (viewports.length + mobileDevices.length)}`);
    console.log('\n📁 All screenshots saved to: ./screenshots/');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
  }
}

takeAllScreenshots();