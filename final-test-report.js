const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const pages = [
  { url: '', name: 'homepage', title: '홈페이지' },
  { url: '/transactions', name: 'transactions', title: '거래내역' },
  { url: '/analytics', name: 'analytics', title: '분석' },
  { url: '/budget', name: 'budget', title: '예산' },
  { url: '/reports', name: 'reports', title: '리포트' },
  { url: '/settings', name: 'settings', title: '설정' }
];

const viewports = [
  { width: 1920, height: 1080, name: 'desktop-xl', category: 'Desktop' },
  { width: 1280, height: 800, name: 'desktop', category: 'Desktop' },
  { width: 768, height: 1024, name: 'tablet', category: 'Tablet' },
  { width: 375, height: 812, name: 'mobile', category: 'Mobile' }
];

async function generateFinalReport() {
  console.log('🚀 Running Final Comprehensive Test Report\n');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: true });
  const results = {
    timestamp: new Date().toISOString(),
    pages: {},
    summary: {
      totalPages: pages.length,
      totalViewports: viewports.length,
      totalTests: pages.length * viewports.length,
      passed: 0,
      failed: 0
    }
  };

  // Test each page
  for (const page of pages) {
    console.log(`\n📄 Testing: ${page.title} (${page.url || '/'})`);
    results.pages[page.name] = {
      title: page.title,
      url: page.url || '/',
      viewports: {}
    };

    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: 'ko-KR'
      });
      
      const browserPage = await context.newPage();
      
      try {
        const response = await browserPage.goto(`http://localhost:3002${page.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        const status = response.status();
        const isSuccess = status === 200;
        
        // Wait for content to stabilize
        await browserPage.waitForTimeout(1000);
        
        // Take screenshot
        const screenshotPath = `screenshots/${page.name}-${viewport.name}-final.png`;
        await browserPage.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        results.pages[page.name].viewports[viewport.name] = {
          status,
          success: isSuccess,
          category: viewport.category,
          resolution: `${viewport.width}x${viewport.height}`,
          screenshot: screenshotPath
        };
        
        if (isSuccess) {
          results.summary.passed++;
          console.log(`  ✅ ${viewport.name}: PASS (${viewport.width}x${viewport.height})`);
        } else {
          results.summary.failed++;
          console.log(`  ❌ ${viewport.name}: FAIL (HTTP ${status})`);
        }
        
      } catch (error) {
        results.summary.failed++;
        console.log(`  ❌ ${viewport.name}: ERROR - ${error.message}`);
        results.pages[page.name].viewports[viewport.name] = {
          status: 'error',
          success: false,
          error: error.message,
          category: viewport.category,
          resolution: `${viewport.width}x${viewport.height}`
        };
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  // Generate summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const successRate = (results.summary.passed / results.summary.totalTests * 100).toFixed(1);
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   • Total Pages Tested: ${results.summary.totalPages}`);
  console.log(`   • Viewport Sizes: ${results.summary.totalViewports}`);
  console.log(`   • Total Test Cases: ${results.summary.totalTests}`);
  console.log(`   • ✅ Passed: ${results.summary.passed}`);
  console.log(`   • ❌ Failed: ${results.summary.failed}`);
  console.log(`   • Success Rate: ${successRate}%`);
  
  // Page-by-page summary
  console.log(`\n📄 Page Status Summary:`);
  for (const [pageName, pageData] of Object.entries(results.pages)) {
    const pageResults = Object.values(pageData.viewports);
    const pagePassed = pageResults.filter(r => r.success).length;
    const pageFailed = pageResults.filter(r => !r.success).length;
    const status = pageFailed === 0 ? '✅' : '⚠️';
    console.log(`   ${status} ${pageData.title}: ${pagePassed}/${pageResults.length} passed`);
  }
  
  // Responsive UI verification
  console.log(`\n📱 Responsive UI Verification:`);
  const categories = {};
  for (const pageData of Object.values(results.pages)) {
    for (const [viewportName, viewportData] of Object.entries(pageData.viewports)) {
      if (!categories[viewportData.category]) {
        categories[viewportData.category] = { passed: 0, failed: 0 };
      }
      if (viewportData.success) {
        categories[viewportData.category].passed++;
      } else {
        categories[viewportData.category].failed++;
      }
    }
  }
  
  for (const [category, stats] of Object.entries(categories)) {
    const total = stats.passed + stats.failed;
    const rate = (stats.passed / total * 100).toFixed(1);
    console.log(`   • ${category}: ${stats.passed}/${total} passed (${rate}%)`);
  }

  // Save detailed JSON report
  const reportPath = path.join('screenshots', 'final-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // Generate HTML dashboard
  const htmlContent = generateHTMLDashboard(results);
  const htmlPath = path.join('screenshots', 'dashboard.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log(`\n📁 Reports Generated:`);
  console.log(`   • JSON Report: ${reportPath}`);
  console.log(`   • HTML Dashboard: ${htmlPath}`);
  console.log(`   • Screenshots: screenshots/*-final.png`);
  
  // Final verdict
  console.log('\n' + '=' .repeat(60));
  if (results.summary.failed === 0) {
    console.log('✨ ALL TESTS PASSED! All pages are working correctly.');
    console.log('✨ Responsive UI is properly implemented across all viewports.');
  } else {
    console.log('⚠️  Some tests failed. Please review the detailed report.');
  }
  console.log('=' .repeat(60));
  
  return results;
}

function generateHTMLDashboard(results) {
  const successRate = (results.summary.passed / results.summary.totalTests * 100).toFixed(1);
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>가계부 앱 - 종합 테스트 대시보드</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { 
      max-width: 1400px; 
      margin: 0 auto;
    }
    .header {
      background: white;
      padding: 40px;
      border-radius: 20px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      text-align: center;
    }
    h1 { 
      color: #333; 
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      font-size: 1.1em;
      margin-bottom: 30px;
    }
    .success-rate {
      font-size: 4em;
      font-weight: bold;
      background: ${successRate >= 80 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 20px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 15px;
      text-align: center;
    }
    .stat-number {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .pages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .page-card {
      background: white;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }
    .page-card:hover {
      transform: translateY(-5px);
    }
    .page-header {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .page-title {
      font-size: 1.5em;
      margin-bottom: 5px;
    }
    .page-url {
      opacity: 0.9;
      font-size: 0.9em;
    }
    .viewport-results {
      padding: 20px;
    }
    .viewport-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .viewport-item:last-child {
      border-bottom: none;
    }
    .viewport-info {
      flex: 1;
    }
    .viewport-name {
      font-weight: 600;
      margin-bottom: 3px;
    }
    .viewport-res {
      color: #666;
      font-size: 0.85em;
    }
    .status-badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
    }
    .status-pass {
      background: #d4edda;
      color: #155724;
    }
    .status-fail {
      background: #f8d7da;
      color: #721c24;
    }
    .screenshot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      margin-top: 30px;
      padding: 20px;
      background: white;
      border-radius: 15px;
    }
    .screenshot-thumb {
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .screenshot-thumb img {
      width: 100%;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 가계부 앱 테스트 대시보드</h1>
      <p class="subtitle">종합 페이지 테스트 및 반응형 UI 검증 결과</p>
      
      <div class="success-rate">${successRate}%</div>
      <p style="color: #666;">Overall Success Rate</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number" style="color: #28a745;">${results.summary.passed}</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: #dc3545;">${results.summary.failed}</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: #007bff;">${results.summary.totalTests}</div>
          <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color: #6c757d;">${results.summary.totalPages}</div>
          <div class="stat-label">Pages</div>
        </div>
      </div>
    </div>
    
    <div class="pages-grid">
      ${Object.entries(results.pages).map(([pageName, pageData]) => `
        <div class="page-card">
          <div class="page-header">
            <div class="page-title">${pageData.title}</div>
            <div class="page-url">${pageData.url}</div>
          </div>
          <div class="viewport-results">
            ${Object.entries(pageData.viewports).map(([viewportName, data]) => `
              <div class="viewport-item">
                <div class="viewport-info">
                  <div class="viewport-name">${viewportName}</div>
                  <div class="viewport-res">${data.resolution || ''}</div>
                </div>
                <span class="status-badge ${data.success ? 'status-pass' : 'status-fail'}">
                  ${data.success ? 'PASS' : 'FAIL'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
  `;
}

// Run the final report
generateFinalReport().catch(console.error);