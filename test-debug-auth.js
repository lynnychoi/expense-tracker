const { chromium } = require('playwright');

async function debugAuth() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 수집
  page.on('console', msg => {
    console.log(`🖥️  Console: ${msg.type()}: ${msg.text()}`);
  });
  
  // 네트워크 에러 수집
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  console.log('🚀 Debugging authentication...');
  
  try {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3002');
    
    // 5초간 로그 수집
    console.log('⏱️  Waiting 5 seconds to collect console logs...');
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'test-results/debug-auth-state.png', fullPage: true });
    
    // 페이지 상태 확인
    const bodyText = await page.textContent('body');
    console.log('📄 Page contains:');
    console.log('  - 로딩 중:', bodyText.includes('로딩 중'));
    console.log('  - 회원가입:', bodyText.includes('회원가입'));
    console.log('  - 로그인:', bodyText.includes('로그인'));
    console.log('  - 가계부:', bodyText.includes('가계부'));
    console.log('  - 대시보드 elements:', bodyText.includes('예산') || bodyText.includes('거래'));
    
  } catch (error) {
    console.log('❌ Error during debug:', error.message);
    await page.screenshot({ path: 'test-results/debug-auth-error.png', fullPage: true });
  }
  
  await browser.close();
}

// 디버그 실행
debugAuth().then(() => {
  console.log('✅ Debug completed!');
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});