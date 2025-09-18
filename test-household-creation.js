const { chromium } = require('playwright');

async function testHouseholdCreation() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
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
  
  console.log('🚀 Testing household creation specifically...');
  
  try {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(3000);
    
    console.log('📄 1. Initial page loaded');
    
    // 회원가입 버튼 클릭
    const signUpButton = page.getByText('회원가입');
    if (await signUpButton.isVisible()) {
      console.log('✅ 2. Found signup button, clicking...');
      await signUpButton.click();
      await page.waitForTimeout(2000);
      
      // 새로운 이메일로 회원가입
      const timestamp = Date.now();
      const testEmail = `household-test-${timestamp}@test.com`;
      const testPassword = 'testtest123';
      
      console.log(`📝 3. Filling form with email: ${testEmail}`);
      
      await page.locator('input[id="name"]').fill('가구 테스트 사용자');
      await page.locator('input[id="email"]').fill(testEmail);
      await page.locator('input[id="password"]').fill(testPassword);
      await page.locator('input[id="confirmPassword"]').fill(testPassword);
      
      await page.waitForTimeout(1000);
      
      // 회원가입 버튼 클릭
      console.log('🔄 4. Submitting signup...');
      await page.getByRole('button', { name: '회원가입' }).click();
      await page.waitForTimeout(8000);
      
      await page.screenshot({ path: 'test-results/household-01-after-signup.png', fullPage: true });
      
      // HouseholdSetup에서 가구 만들기 시도
      console.log('🏠 5. Attempting household creation...');
      const householdNameInput = page.locator('input[placeholder*="김가네 가계부"]');
      if (await householdNameInput.isVisible()) {
        await householdNameInput.fill('가구 생성 테스트');
        await page.waitForTimeout(1000);
        
        console.log('🔄 6. Clicking household creation button...');
        
        // 네트워크 요청 및 응답 모니터링
        let requestMade = false;
        let responseReceived = false;
        let errorOccurred = false;
        
        page.on('request', request => {
          if (request.url().includes('supabase') && request.method() === 'POST') {
            console.log(`🌐 Request: ${request.method()} ${request.url()}`);
            requestMade = true;
          }
        });
        
        page.on('response', response => {
          if (response.url().includes('supabase') && response.request().method() === 'POST') {
            console.log(`📡 Response: ${response.status()} ${response.url()}`);
            responseReceived = true;
            if (!response.ok()) {
              console.log(`❌ Response Error: ${response.status()} ${response.statusText()}`);
              errorOccurred = true;
            }
          }
        });
        
        await page.getByRole('button', { name: '가구 만들기' }).click();
        
        // 더 긴 시간 대기하면서 변화 관찰
        console.log('⏱️  Waiting for household creation response...');
        await page.waitForTimeout(10000);
        
        console.log(`📊 Network Analysis:`);
        console.log(`  Request made: ${requestMade}`);
        console.log(`  Response received: ${responseReceived}`);
        console.log(`  Error occurred: ${errorOccurred}`);
        
        await page.screenshot({ path: 'test-results/household-02-after-creation-attempt.png', fullPage: true });
        
        // 현재 상태 확인
        const currentUrl = page.url();
        const pageContent = await page.textContent('body');
        
        console.log(`📍 Current URL: ${currentUrl}`);
        console.log('📄 Page content analysis:');
        console.log(`  Contains "가구 설정": ${pageContent.includes('가구 설정')}`);
        console.log(`  Contains "대시보드": ${pageContent.includes('대시보드')}`);
        console.log(`  Contains "가구를 만들어": ${pageContent.includes('가구를 만들어')}`);
        console.log(`  Contains "에러": ${pageContent.includes('에러')}`);
        console.log(`  Contains "오류": ${pageContent.includes('오류')}`);
        console.log(`  Contains "실패": ${pageContent.includes('실패')}`);
        
        // Check if still on household setup page
        if (pageContent.includes('가구 설정') || pageContent.includes('가구를 만들어')) {
          console.log('❌ HOUSEHOLD CREATION FAILED - Still on setup page');
        } else if (pageContent.includes('대시보드')) {
          console.log('✅ HOUSEHOLD CREATION SUCCESS - Reached dashboard');
        } else {
          console.log('❓ UNKNOWN STATE - Need to investigate further');
        }
        
      } else {
        console.log('❌ Household name input not found');
      }
    } else {
      console.log('❌ Signup button not found');
    }
    
  } catch (error) {
    console.log('❌ Error during household creation test:', error.message);
    await page.screenshot({ path: 'test-results/household-error.png', fullPage: true });
  }
  
  await browser.close();
}

// 테스트 실행
testHouseholdCreation().then(() => {
  console.log('✅ Household creation test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});