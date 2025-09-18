const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function comprehensiveBugTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 각 액션 사이에 1초 대기
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 에러 수집
  const consoleErrors = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} - ${response.url()}`);
      console.log('❌ Network Error:', response.status(), response.url());
    }
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    consoleErrors,
    networkErrors,
    issues: []
  };
  
  try {
    console.log('🚀 Starting comprehensive bug test...\n');
    
    // 1. 초기 페이지 로드 테스트
    console.log('1️⃣ Testing initial page load...');
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(3000);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/01-initial-load.png', fullPage: true });
    
    // 페이지 로드 확인
    const title = await page.title();
    console.log('Page title:', title);
    
    results.tests.push({
      name: '초기 페이지 로드',
      status: 'completed',
      screenshot: '01-initial-load.png'
    });
    
    // 2. 로그인 기능 테스트
    console.log('\n2️⃣ Testing login functionality...');
    
    // 로그인 폼 찾기
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      console.log('✅ Login form found');
      
      // 이메일 입력
      await page.fill('input[type="email"]', 'test@example.com');
      await page.waitForTimeout(500);
      
      // 비밀번호 입력  
      await page.fill('input[type="password"]', 'testpassword123');
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/02-login-filled.png', fullPage: true });
      
      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });
      
      results.tests.push({
        name: '로그인 기능',
        status: 'completed',
        screenshots: ['02-login-filled.png', '03-after-login.png']
      });
    } else {
      console.log('⚠️ No login form found - might already be logged in');
      results.issues.push('로그인 폼을 찾을 수 없음 (이미 로그인된 상태일 수 있음)');
    }
    
    // 3. 대시보드 기능 테스트
    console.log('\n3️⃣ Testing dashboard functionality...');
    
    // 대시보드로 이동 (홈페이지가 대시보드일 수 있음)
    const dashboardUrl = page.url().includes('dashboard') ? page.url() : 'http://localhost:3002/';
    await page.goto(dashboardUrl);
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/04-dashboard.png', fullPage: true });
    
    // "첫 예산 설정하기" 버튼 테스트
    console.log('Testing "첫 예산 설정하기" button...');
    try {
      const budgetButton = page.getByText('첫 예산 설정하기').first();
      if (await budgetButton.isVisible()) {
        console.log('✅ Budget button found');
        await budgetButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'test-results/05-budget-button-clicked.png', fullPage: true });
        
        // URL 변경 확인
        const currentUrl = page.url();
        if (currentUrl.includes('budget')) {
          console.log('✅ Budget button works - navigated to budget page');
        } else {
          console.log('❌ Budget button clicked but URL did not change to budget');
          results.issues.push('첫 예산 설정하기 버튼 클릭해도 예산 페이지로 이동하지 않음');
        }
      } else {
        console.log('❌ Budget button not found');
        results.issues.push('첫 예산 설정하기 버튼을 찾을 수 없음');
      }
    } catch (error) {
      console.log('❌ Error testing budget button:', error.message);
      results.issues.push(`첫 예산 설정하기 버튼 테스트 중 에러: ${error.message}`);
    }
    
    results.tests.push({
      name: '대시보드 - 예산 버튼',
      status: 'completed',
      screenshots: ['04-dashboard.png', '05-budget-button-clicked.png']
    });
    
    // 4. 거래 추가 기능 테스트
    console.log('\n4️⃣ Testing transaction addition...');
    
    // 홈으로 다시 이동
    await page.goto('http://localhost:3002/');
    await page.waitForTimeout(1000);
    
    // "거래 추가" 버튼 찾기
    try {
      const addTransactionButton = page.getByText('거래 추가').first();
      if (await addTransactionButton.isVisible()) {
        console.log('✅ Add transaction button found');
        await addTransactionButton.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'test-results/06-add-transaction-modal.png', fullPage: true });
        
        // 거래 추가 폼 작성
        console.log('Filling transaction form...');
        
        // 타입 선택 (지출)
        await page.click('input[value="expense"]');
        await page.waitForTimeout(300);
        
        // 금액 입력
        await page.fill('input[name="amount"]', '50000');
        await page.waitForTimeout(300);
        
        // 설명 입력
        await page.fill('input[name="description"]', '테스트 지출');
        await page.waitForTimeout(300);
        
        // 결제 방법 선택
        await page.click('[role="combobox"]');
        await page.waitForTimeout(500);
        await page.getByText('신용카드').click();
        await page.waitForTimeout(300);
        
        await page.screenshot({ path: 'test-results/07-transaction-form-filled.png', fullPage: true });
        
        // 카테고리 추가 테스트
        console.log('Testing category addition...');
        const tagInput = page.locator('input[placeholder*="태그"]').first();
        if (await tagInput.isVisible()) {
          await tagInput.fill('테스트카테고리');
          await page.waitForTimeout(300);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
          
          await page.screenshot({ path: 'test-results/08-category-added.png', fullPage: true });
          console.log('✅ Category input found and filled');
        } else {
          console.log('❌ Category input not found');
          results.issues.push('카테고리 입력 필드를 찾을 수 없음');
        }
        
        // 거래 저장
        console.log('Saving transaction...');
        const saveButton = page.getByText('저장').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'test-results/09-transaction-saved.png', fullPage: true });
          console.log('✅ Transaction save button clicked');
        } else {
          console.log('❌ Save button not found');
          results.issues.push('거래 저장 버튼을 찾을 수 없음');
        }
        
      } else {
        console.log('❌ Add transaction button not found');
        results.issues.push('거래 추가 버튼을 찾을 수 없음');
      }
    } catch (error) {
      console.log('❌ Error testing transaction addition:', error.message);
      results.issues.push(`거래 추가 테스트 중 에러: ${error.message}`);
    }
    
    results.tests.push({
      name: '거래 추가',
      status: 'completed',
      screenshots: ['06-add-transaction-modal.png', '07-transaction-form-filled.png', '08-category-added.png', '09-transaction-saved.png']
    });
    
    // 5. 실시간 업데이트 확인
    console.log('\n5️⃣ Testing real-time updates...');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/10-after-transaction-update.png', fullPage: true });
    
    // 대시보드에서 새로 추가된 거래가 보이는지 확인
    const transactionText = await page.getByText('테스트 지출').first();
    if (await transactionText.isVisible()) {
      console.log('✅ Real-time update working - new transaction visible');
    } else {
      console.log('❌ Real-time update not working - new transaction not visible');
      results.issues.push('실시간 업데이트 안됨 - 새로운 거래가 바로 표시되지 않음');
    }
    
    results.tests.push({
      name: '실시간 업데이트',
      status: 'completed',
      screenshots: ['10-after-transaction-update.png']
    });
    
    // 6. 페이지 새로고침 후 데이터 유지 테스트
    console.log('\n6️⃣ Testing data persistence after refresh...');
    
    await page.reload();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/11-after-refresh.png', fullPage: true });
    
    // 새로고침 후에도 거래가 보이는지 확인
    const transactionAfterRefresh = await page.getByText('테스트 지출').first();
    if (await transactionAfterRefresh.isVisible()) {
      console.log('✅ Data persistence working - transaction visible after refresh');
    } else {
      console.log('❌ Data persistence issue - transaction lost after refresh');
      results.issues.push('페이지 새로고침 후 데이터 유실 - 추가한 거래가 사라짐');
    }
    
    results.tests.push({
      name: '새로고침 후 데이터 유지',
      status: 'completed',
      screenshots: ['11-after-refresh.png']
    });
    
    // 7. 카테고리 생성 및 표시 테스트
    console.log('\n7️⃣ Testing category creation and display...');
    
    // 거래 내역 페이지로 이동
    await page.goto('http://localhost:3002/transactions');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/12-transactions-page.png', fullPage: true });
    
    // 새 거래 추가해서 카테고리 생성 테스트
    try {
      const addTransactionButton2 = page.getByText('거래 추가').first();
      if (await addTransactionButton2.isVisible()) {
        await addTransactionButton2.click();
        await page.waitForTimeout(1000);
        
        // 새로운 카테고리로 거래 추가
        await page.click('input[value="expense"]');
        await page.fill('input[name="amount"]', '30000');
        await page.fill('input[name="description"]', '카테고리 테스트');
        
        // 결제 방법 선택
        await page.click('[role="combobox"]');
        await page.waitForTimeout(500);
        await page.getByText('현금').click();
        
        // 새로운 카테고리 추가
        const tagInput2 = page.locator('input[placeholder*="태그"]').first();
        if (await tagInput2.isVisible()) {
          await tagInput2.fill('새카테고리');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
          
          await page.screenshot({ path: 'test-results/13-new-category-added.png', fullPage: true });
          
          // 저장
          await page.getByText('저장').first().click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'test-results/14-second-transaction-saved.png', fullPage: true });
          
          // 다시 거래 추가 모달을 열어서 기존 카테고리가 보이는지 확인
          await page.getByText('거래 추가').first().click();
          await page.waitForTimeout(1000);
          
          const tagInput3 = page.locator('input[placeholder*="태그"]').first();
          await tagInput3.click();
          await page.waitForTimeout(500);
          
          await page.screenshot({ path: 'test-results/15-category-autocomplete.png', fullPage: true });
          
          // 기존 카테고리가 자동완성에 나타나는지 확인
          const existingCategory = page.getByText('새카테고리').first();
          if (await existingCategory.isVisible()) {
            console.log('✅ Category autocomplete working - existing categories visible');
          } else {
            console.log('❌ Category autocomplete not working - existing categories not visible');
            results.issues.push('카테고리 자동완성 안됨 - 기존 카테고리가 표시되지 않음');
          }
          
          // 모달 닫기
          await page.keyboard.press('Escape');
          
        } else {
          console.log('❌ Category input not found in second test');
          results.issues.push('두 번째 카테고리 테스트에서 입력 필드를 찾을 수 없음');
        }
      }
    } catch (error) {
      console.log('❌ Error testing category creation:', error.message);
      results.issues.push(`카테고리 생성 테스트 중 에러: ${error.message}`);
    }
    
    results.tests.push({
      name: '카테고리 생성 및 표시',
      status: 'completed',
      screenshots: ['12-transactions-page.png', '13-new-category-added.png', '14-second-transaction-saved.png', '15-category-autocomplete.png']
    });
    
  } catch (error) {
    console.log('❌ Test failed with error:', error);
    results.issues.push(`전체 테스트 실행 중 치명적 에러: ${error.message}`);
  }
  
  // 결과 저장
  fs.writeFileSync('test-results/comprehensive-test-results.json', JSON.stringify(results, null, 2));
  
  // 요약 출력
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Tests completed: ${results.tests.length}`);
  console.log(`❌ Issues found: ${results.issues.length}`);
  console.log(`🚨 Console errors: ${results.consoleErrors.length}`);
  console.log(`🌐 Network errors: ${results.networkErrors.length}`);
  
  if (results.issues.length > 0) {
    console.log('\n🐛 ISSUES FOUND:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  if (results.consoleErrors.length > 0) {
    console.log('\n🚨 CONSOLE ERRORS:');
    results.consoleErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (results.networkErrors.length > 0) {
    console.log('\n🌐 NETWORK ERRORS:');
    results.networkErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  await browser.close();
  
  return results;
}

// 테스트 결과 디렉토리 생성
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

// 테스트 실행
comprehensiveBugTest().then(results => {
  console.log('\n✅ Comprehensive bug test completed!');
  console.log('📁 Results saved to test-results/ directory');
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});