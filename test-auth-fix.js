const { chromium } = require('playwright');

async function testAuthFix() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  console.log('🚀 Testing authentication fix...');
  
  try {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/auth-fix-start.png', fullPage: true });
    
    // 회원가입 버튼 클릭
    const signUpButton = page.getByText('회원가입');
    if (await signUpButton.isVisible()) {
      console.log('✅ Found signup button, clicking...');
      await signUpButton.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/auth-fix-signup-form.png', fullPage: true });
      
      // 회원가입 폼 작성 - 새로운 이메일 사용
      console.log('📝 Filling signup form with new credentials...');
      
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@test.com`;
      
      // 이름 입력
      const nameInput = page.locator('input[name="name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('테스트 사용자');
        await page.waitForTimeout(300);
      }
      
      // 이메일 입력
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.clear();
      await emailInput.fill(testEmail);
      await page.waitForTimeout(300);
      
      // 비밀번호 입력
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.clear();
      await passwordInput.fill('testtest123');
      await page.waitForTimeout(300);
      
      // 비밀번호 확인 입력
      const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
      await confirmPasswordInput.clear();
      await confirmPasswordInput.fill('testtest123');
      await page.waitForTimeout(300);
      
      await page.screenshot({ path: 'test-results/auth-fix-signup-filled.png', fullPage: true });
      
      // 회원가입 버튼 클릭
      const submitButton = page.getByRole('button', { name: '회원가입' });
      if (await submitButton.isVisible()) {
        console.log('🔄 Submitting signup form...');
        await submitButton.click();
        
        // 더 오래 기다리기 - 인증 처리 시간
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: 'test-results/auth-fix-after-signup.png', fullPage: true });
        
        // 결과 확인
        const currentUrl = page.url();
        console.log('Current URL after signup:', currentUrl);
        
        // 페이지 상태 확인
        const pageText = await page.textContent('body');
        
        if (pageText.includes('회원가입이 완료되었습니다')) {
          console.log('❌ Still showing signup success message - email confirmation required');
          
          // 로그인 버튼 찾아서 클릭
          const loginButton = page.getByText('로그인하기');
          if (await loginButton.isVisible()) {
            console.log('🔄 Clicking login button...');
            await loginButton.click();
            await page.waitForTimeout(2000);
            
            // 로그인 폼 채우기
            const loginEmailInput = page.locator('input[type="email"]').first();
            await loginEmailInput.clear();
            await loginEmailInput.fill(testEmail);
            
            const loginPasswordInput = page.locator('input[type="password"]').first();
            await loginPasswordInput.clear();
            await loginPasswordInput.fill('testtest123');
            
            await page.screenshot({ path: 'test-results/auth-fix-login-form.png', fullPage: true });
            
            // 로그인 버튼 클릭
            const loginSubmitButton = page.getByRole('button', { name: '로그인' });
            await loginSubmitButton.click();
            await page.waitForTimeout(3000);
            
            await page.screenshot({ path: 'test-results/auth-fix-after-login.png', fullPage: true });
          }
        } else if (pageText.includes('첫 예산 설정하기') || pageText.includes('거래 추가')) {
          console.log('✅ SUCCESS! User was automatically logged in and reached dashboard!');
          
          // 대시보드에서 버튼들 확인
          const budgetButton = page.getByText('첫 예산 설정하기');
          if (await budgetButton.isVisible()) {
            console.log('✅ Found "첫 예산 설정하기" button in dashboard');
          } else {
            console.log('❌ "첫 예산 설정하기" button not found in dashboard');
          }
          
          const addTransactionButton = page.getByText('거래 추가');
          if (await addTransactionButton.isVisible()) {
            console.log('✅ Found "거래 추가" button in dashboard');
          } else {
            console.log('❌ "거래 추가" button not found in dashboard');
          }
          
        } else {
          console.log('🔍 Checking page content...');
          console.log('Page includes dashboard elements:', pageText.includes('가계부'));
          console.log('Page includes auth elements:', pageText.includes('회원가입') || pageText.includes('로그인'));
        }
        
        // 최종 상태 스크린샷
        await page.screenshot({ path: 'test-results/auth-fix-final-state.png', fullPage: true });
        
      } else {
        console.log('❌ Submit button not found');
      }
    } else {
      console.log('⚠️ Signup button not found');
      await page.screenshot({ path: 'test-results/auth-fix-no-signup-button.png', fullPage: true });
    }
    
  } catch (error) {
    console.log('❌ Error testing auth fix:', error.message);
    await page.screenshot({ path: 'test-results/auth-fix-error.png', fullPage: true });
  }
  
  await browser.close();
}

// 테스트 실행
testAuthFix().then(() => {
  console.log('✅ Auth fix test completed!');
}).catch(error => {
  console.error('❌ Auth fix test failed:', error);
  process.exit(1);
});