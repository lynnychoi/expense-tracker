const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Define all viewport configurations for comprehensive testing
const viewportConfigs = [
  // Desktop sizes
  { width: 1920, height: 1080, name: 'desktop-fullhd' },
  { width: 1440, height: 900, name: 'desktop-large' },
  { width: 1280, height: 800, name: 'desktop-medium' },
  { width: 1024, height: 768, name: 'desktop-small' },
  
  // Tablet sizes
  { width: 768, height: 1024, name: 'tablet-portrait' },
  { width: 1024, height: 768, name: 'tablet-landscape' },
  
  // Mobile sizes
  { width: 375, height: 812, name: 'mobile-iphone-x' },
  { width: 390, height: 844, name: 'mobile-iphone-14' },
  { width: 360, height: 640, name: 'mobile-android' },
  { width: 320, height: 568, name: 'mobile-small' }
];

// Define all pages to test
const pages = [
  { url: '', name: 'homepage', title: '홈페이지' },
  { url: '/transactions', name: 'transactions', title: '거래내역' },
  { url: '/analytics', name: 'analytics', title: '분석' },
  { url: '/budget', name: 'budget', title: '예산' },
  { url: '/reports', name: 'reports', title: '리포트' },
  { url: '/settings', name: 'settings', title: '설정' }
];

async function testAllPages() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: 'http://localhost:3000',
    totalTests: pages.length * viewportConfigs.length,
    passed: 0,
    failed: 0,
    errors: [],
    pageResults: {}
  };

  console.log(`\n🚀 Starting comprehensive page testing...`);
  console.log(`📊 Testing ${pages.length} pages across ${viewportConfigs.length} viewport sizes`);
  console.log(`📸 Total tests to run: ${results.totalTests}\n`);

  for (const pageConfig of pages) {
    console.log(`\n📄 Testing page: ${pageConfig.title} (${pageConfig.url || '/'})`);
    results.pageResults[pageConfig.name] = {
      url: pageConfig.url,
      title: pageConfig.title,
      viewports: {}
    };

    for (const viewport of viewportConfigs) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: 'ko-KR'
      });
      
      const page = await context.newPage();
      
      try {
        // Navigate to the page
        const response = await page.goto(`http://localhost:3000${pageConfig.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        const status = response.status();
        const isSuccess = status === 200;

        // Check for console errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // Wait for any dynamic content to load
        await page.waitForTimeout(2000);

        // Check for visible error messages on the page
        const errorElements = await page.$$eval('[class*="error"], [class*="Error"]', elements => 
          elements.map(el => el.textContent).filter(text => text && text.trim())
        );

        // Take screenshot
        const screenshotPath = path.join(screenshotsDir, `${pageConfig.name}-${viewport.name}.png`);
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });

        // Record results
        const testResult = {
          status,
          success: isSuccess && consoleErrors.length === 0 && errorElements.length === 0,
          screenshot: screenshotPath,
          consoleErrors,
          visibleErrors: errorElements,
          timestamp: new Date().toISOString()
        };

        results.pageResults[pageConfig.name].viewports[viewport.name] = testResult;

        if (testResult.success) {
          results.passed++;
          console.log(`  ✅ ${viewport.name}: OK (${viewport.width}x${viewport.height})`);
        } else {
          results.failed++;
          console.log(`  ❌ ${viewport.name}: FAILED (${viewport.width}x${viewport.height})`);
          
          if (!isSuccess) {
            console.log(`     └─ HTTP Status: ${status}`);
          }
          if (consoleErrors.length > 0) {
            console.log(`     └─ Console errors: ${consoleErrors.length}`);
            consoleErrors.forEach(err => console.log(`        • ${err.substring(0, 100)}...`));
          }
          if (errorElements.length > 0) {
            console.log(`     └─ Visible errors: ${errorElements.length}`);
            errorElements.forEach(err => console.log(`        • ${err.substring(0, 100)}...`));
          }

          results.errors.push({
            page: pageConfig.name,
            viewport: viewport.name,
            status,
            consoleErrors,
            visibleErrors: errorElements
          });
        }

      } catch (error) {
        results.failed++;
        console.log(`  ❌ ${viewport.name}: ERROR (${viewport.width}x${viewport.height})`);
        console.log(`     └─ ${error.message}`);
        
        results.pageResults[pageConfig.name].viewports[viewport.name] = {
          status: 'error',
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };

        results.errors.push({
          page: pageConfig.name,
          viewport: viewport.name,
          error: error.message
        });
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`✅ Passed: ${results.passed} (${(results.passed/results.totalTests*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${results.failed} (${(results.failed/results.totalTests*100).toFixed(1)}%)`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Error Summary:');
    const errorsByPage = {};
    results.errors.forEach(err => {
      if (!errorsByPage[err.page]) {
        errorsByPage[err.page] = [];
      }
      errorsByPage[err.page].push(err.viewport);
    });
    
    Object.entries(errorsByPage).forEach(([page, viewports]) => {
      console.log(`  • ${page}: ${viewports.length} viewport(s) failed`);
      console.log(`    └─ ${viewports.join(', ')}`);
    });
  }

  // Save detailed results to JSON
  const reportPath = path.join(screenshotsDir, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Detailed report saved to: ${reportPath}`);
  console.log(`📸 Screenshots saved to: ${screenshotsDir}/`);

  // Generate HTML report for easy viewing
  const htmlReport = generateHTMLReport(results);
  const htmlReportPath = path.join(screenshotsDir, 'test-report.html');
  fs.writeFileSync(htmlReportPath, htmlReport);
  console.log(`🌐 HTML report saved to: ${htmlReportPath}`);

  return results;
}

function generateHTMLReport(results) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Test Report - ${new Date().toLocaleString('ko-KR')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      background: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-bottom: 20px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .stat {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
    }
    .success { color: #28a745; }
    .failure { color: #dc3545; }
    .page-section {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .page-title {
      font-size: 1.5em;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    .viewport-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .viewport-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      transition: transform 0.2s;
    }
    .viewport-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .viewport-card.success {
      border-color: #28a745;
      background: #f0fff4;
    }
    .viewport-card.failure {
      border-color: #dc3545;
      background: #fff5f5;
    }
    .viewport-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .viewport-status {
      font-size: 0.9em;
      color: #666;
    }
    .screenshot-link {
      display: inline-block;
      margin-top: 5px;
      color: #007bff;
      text-decoration: none;
      font-size: 0.85em;
    }
    .screenshot-link:hover {
      text-decoration: underline;
    }
    .error-details {
      margin-top: 10px;
      padding: 10px;
      background: #f8d7da;
      border-radius: 4px;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 종합 페이지 테스트 리포트</h1>
      <p>테스트 시간: ${new Date(results.timestamp).toLocaleString('ko-KR')}</p>
      <p>베이스 URL: ${results.baseUrl}</p>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${results.totalTests}</div>
          <div class="stat-label">전체 테스트</div>
        </div>
        <div class="stat">
          <div class="stat-value success">${results.passed}</div>
          <div class="stat-label">성공</div>
        </div>
        <div class="stat">
          <div class="stat-value failure">${results.failed}</div>
          <div class="stat-label">실패</div>
        </div>
        <div class="stat">
          <div class="stat-value ${results.failed === 0 ? 'success' : 'failure'}">
            ${(results.passed/results.totalTests*100).toFixed(1)}%
          </div>
          <div class="stat-label">성공률</div>
        </div>
      </div>
    </div>

    ${Object.entries(results.pageResults).map(([pageName, pageData]) => `
      <div class="page-section">
        <h2 class="page-title">📄 ${pageData.title} (${pageData.url || '/'})</h2>
        
        <div class="viewport-grid">
          ${Object.entries(pageData.viewports).map(([viewportName, viewportData]) => `
            <div class="viewport-card ${viewportData.success ? 'success' : 'failure'}">
              <div class="viewport-name">${viewportName}</div>
              <div class="viewport-status">
                ${viewportData.success ? '✅ 성공' : '❌ 실패'}
                ${viewportData.status !== 'error' ? `(HTTP ${viewportData.status})` : '(에러)'}
              </div>
              
              ${viewportData.screenshot ? `
                <a href="${path.basename(viewportData.screenshot)}" class="screenshot-link" target="_blank">
                  📸 스크린샷 보기
                </a>
              ` : ''}
              
              ${!viewportData.success && (viewportData.consoleErrors?.length > 0 || viewportData.visibleErrors?.length > 0) ? `
                <div class="error-details">
                  ${viewportData.consoleErrors?.length > 0 ? `
                    <div>콘솔 에러: ${viewportData.consoleErrors.length}개</div>
                  ` : ''}
                  ${viewportData.visibleErrors?.length > 0 ? `
                    <div>화면 에러: ${viewportData.visibleErrors.length}개</div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;
}

// Run the tests
testAllPages().then(() => {
  console.log('\n✨ All tests completed!');
}).catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});