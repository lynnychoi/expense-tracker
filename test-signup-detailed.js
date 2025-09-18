const { chromium } = require('playwright');

async function testSignupDetailed() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
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
  
  console.log('🚀 Testing detailed signup process...');
  
  try {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(3000);
    
    console.log('📄 Initial page loaded');
    await page.screenshot({ path: 'test-results/signup-detail-01-loaded.png', fullPage: true });
    
    // 회원가입 버튼 클릭
    const signUpButton = page.getByText('회원가입');
    if (await signUpButton.isVisible()) {
      console.log('✅ Found signup button, clicking...');
      await signUpButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/signup-detail-02-form.png', fullPage: true });
      
      // 새로운 이메일로 회원가입
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@test.com`;
      const testPassword = 'testtest123';
      
      console.log(`📝 Filling form with email: ${testEmail}`);
      
      // 이름 입력 - 더 정확한 선택자 사용
      console.log('  → Filling name field...');
      await page.locator('input[id="name"]').fill('테스트 사용자');
      await page.waitForTimeout(500);
      
      // 이메일 입력
      console.log('  → Filling email field...');
      await page.locator('input[id="email"]').fill(testEmail);
      await page.waitForTimeout(500);
      
      // 비밀번호 입력
      console.log('  → Filling password field...');
      await page.locator('input[id="password"]').fill(testPassword);
      await page.waitForTimeout(500);
      
      // 비밀번호 확인 입력
      console.log('  → Filling confirm password field...');
      await page.locator('input[id="confirmPassword"]').fill(testPassword);
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/signup-detail-03-filled.png', fullPage: true });
      
      // 폼 유효성 확인
      const nameValue = await page.locator('input[id="name"]').inputValue();
      const emailValue = await page.locator('input[id="email"]').inputValue();
      const passwordValue = await page.locator('input[id="password"]').inputValue();
      const confirmValue = await page.locator('input[id="confirmPassword"]').inputValue();
      
      console.log('📋 Form values:');
      console.log(`  Name: "${nameValue}"`);
      console.log(`  Email: "${emailValue}"`);
      console.log(`  Password: "${passwordValue}" (length: ${passwordValue.length})`);
      console.log(`  Confirm: "${confirmValue}" (length: ${confirmValue.length})`);
      
      // 회원가입 버튼 클릭
      const submitButton = page.getByRole('button', { name: '회원가입' });
      if (await submitButton.isVisible()) {
        console.log('🔄 Clicking signup submit button...');
        
        // 네트워크 요청 모니터링
        let requestMade = false;
        page.on('request', request => {
          if (request.url().includes('supabase') || request.url().includes('auth')) {
            console.log(`🌐 Auth request: ${request.method()} ${request.url()}`);
            requestMade = true;
          }
        });
        
        await submitButton.click();
        
        // 좀 더 오래 대기하면서 변화 관찰
        console.log('⏱️  Waiting for response...');
        await page.waitForTimeout(8000);
        
        console.log(`📊 Request made: ${requestMade}`);
        
        await page.screenshot({ path: 'test-results/signup-detail-04-after-submit.png', fullPage: true });
        
        // 현재 상태 확인
        const currentUrl = page.url();
        const pageContent = await page.textContent('body');
        
        console.log(`📍 Current URL: ${currentUrl}`);
        console.log('📄 Page content analysis:');
        console.log(`  Contains "회원가입": ${pageContent.includes('회원가입')}`);
        console.log(`  Contains "로그인": ${pageContent.includes('로그인')}`);
        console.log(`  Contains "가구": ${pageContent.includes('가구')}`);
        console.log(`  Contains "대시보드": ${pageContent.includes('대시보드')}`);
        console.log(`  Contains "예산": ${pageContent.includes('예산')}`);
        console.log(`  Contains "거래": ${pageContent.includes('거래')}`);
        console.log(`  Contains "로딩": ${pageContent.includes('로딩')}`);
        console.log(`  Contains "이 입력란을 작성하세요": ${pageContent.includes('이 입력란을 작성하세요')}`);
        
      } else {
        console.log('❌ Submit button not found');
      }
    } else {
      console.log('❌ Signup button not found');
    }
    
  } catch (error) {
    console.log('❌ Error during detailed signup test:', error.message);
    await page.screenshot({ path: 'test-results/signup-detail-error.png', fullPage: true });
  }
  
  await browser.close();
}

// 테스트 실행
testSignupDetailed().then(() => {
  console.log('✅ Detailed signup test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});