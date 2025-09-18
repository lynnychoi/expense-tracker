const { chromium } = require('playwright');

async function createTestUser() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  console.log('🚀 Creating test user...');
  
  try {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(2000);
    
    // 회원가입 버튼 클릭
    const signUpButton = page.getByText('회원가입');
    if (await signUpButton.isVisible()) {
      console.log('✅ Found signup button, clicking...');
      await signUpButton.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/signup-form.png', fullPage: true });
      
      // 회원가입 폼 작성
      console.log('📝 Filling signup form...');
      
      // 이름 입력
      const nameInput = page.locator('input[name="name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('테스트 사용자');
        await page.waitForTimeout(300);
      }
      
      // 이메일 입력
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.clear();
      await emailInput.fill('test@test.com');
      await page.waitForTimeout(300);
      
      // 비밀번호 입력
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.clear();
      await passwordInput.fill('testtest123');
      await page.waitForTimeout(300);
      
      await page.screenshot({ path: 'test-results/signup-filled.png', fullPage: true });
      
      // 회원가입 버튼 클릭
      const submitButton = page.getByRole('button', { name: '회원가입' });
      if (await submitButton.isVisible()) {
        console.log('🔄 Submitting signup form...');
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'test-results/after-signup.png', fullPage: true });
        
        // 결과 확인
        const currentUrl = page.url();
        console.log('Current URL after signup:', currentUrl);
        
        if (currentUrl.includes('dashboard') || currentUrl === 'http://localhost:3002/') {
          console.log('✅ Signup successful - redirected to dashboard');
          
          // 대시보드 상태 확인
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'test-results/dashboard-after-signup.png', fullPage: true });
          
          // 예산 설정하기 버튼 찾기
          const budgetButton = page.getByText('첫 예산 설정하기');
          if (await budgetButton.isVisible()) {
            console.log('✅ Found "첫 예산 설정하기" button in dashboard');
          } else {
            console.log('❌ "첫 예산 설정하기" button not found in dashboard');
          }
          
          // 거래 추가 버튼 찾기
          const addTransactionButton = page.getByText('거래 추가');
          if (await addTransactionButton.isVisible()) {
            console.log('✅ Found "거래 추가" button in dashboard');
          } else {
            console.log('❌ "거래 추가" button not found in dashboard');
          }
          
        } else {
          console.log('❌ Signup might have failed - not redirected to dashboard');
        }
        
      } else {
        console.log('❌ Submit button not found');
      }
    } else {
      console.log('⚠️ Signup button not found - might need to scroll or look for different text');
      
      // 페이지의 모든 텍스트 찍어보기
      await page.screenshot({ path: 'test-results/login-page-full.png', fullPage: true });
    }
    
  } catch (error) {
    console.log('❌ Error creating test user:', error.message);
    await page.screenshot({ path: 'test-results/error-state.png', fullPage: true });
  }
  
  await browser.close();
}

// 테스트 실행
createTestUser().then(() => {
  console.log('✅ Test user creation completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});