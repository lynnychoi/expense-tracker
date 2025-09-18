const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Mobile sizes to test for UI issues
const mobileViewports = [
  { width: 320, height: 568, name: 'iphone-se' },
  { width: 375, height: 667, name: 'iphone-8' },
  { width: 375, height: 812, name: 'iphone-x' },
  { width: 390, height: 844, name: 'iphone-14' },
  { width: 360, height: 640, name: 'android-small' },
  { width: 412, height: 915, name: 'pixel-6' }
];

async function testComprehensiveInteractions() {
  console.log('🚀 Starting Comprehensive Interaction Testing\n');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ 
    headless: false, // Set to false to see the browser
    slowMo: 100 // Slow down for visibility
  });

  const results = {
    timestamp: new Date().toISOString(),
    loginFlow: {},
    modals: {},
    toasts: {},
    mobileUI: {},
    forms: {},
    interactions: {}
  };

  try {
    // Test 1: Login Flow
    console.log('\n📱 Testing Login Flow...');
    const loginContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      locale: 'ko-KR'
    });
    
    const loginPage = await loginContext.newPage();
    await loginPage.goto('http://localhost:3002');
    
    // Take screenshot of initial login screen
    await loginPage.screenshot({ 
      path: 'screenshots/login-initial.png',
      fullPage: true 
    });
    
    // Test empty form submission
    const loginButton = await loginPage.$('button:has-text("로그인")');
    if (loginButton) {
      await loginButton.click();
      await loginPage.waitForTimeout(1000);
      await loginPage.screenshot({ 
        path: 'screenshots/login-validation-error.png',
        fullPage: true 
      });
    }
    
    // Test with credentials
    await loginPage.fill('input[type="email"]', 'test@example.com');
    await loginPage.fill('input[type="password"]', 'password123');
    await loginPage.screenshot({ 
      path: 'screenshots/login-filled.png',
      fullPage: true 
    });
    
    // Submit login
    if (loginButton) {
      await loginButton.click();
      await loginPage.waitForTimeout(2000);
      await loginPage.screenshot({ 
        path: 'screenshots/login-after-submit.png',
        fullPage: true 
      });
    }
    
    results.loginFlow = { tested: true, screenshots: 4 };
    await loginContext.close();
    
    // Test 2: Modal Dialogs
    console.log('\n🪟 Testing Modals and Dialogs...');
    const modalContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      locale: 'ko-KR',
      storageState: {
        cookies: [],
        origins: [{
          origin: 'http://localhost:3002',
          localStorage: [{
            name: 'auth',
            value: JSON.stringify({ user: { id: 1, name: 'Test User' } })
          }]
        }]
      }
    });
    
    const modalPage = await modalContext.newPage();
    
    // Test Transaction Modal
    await modalPage.goto('http://localhost:3002/transactions');
    await modalPage.waitForLoadState('networkidle');
    
    // Click add transaction button
    const addButton = await modalPage.$('button:has-text("거래 추가"), button:has-text("추가"), button:has-text("+")');
    if (addButton) {
      await addButton.click();
      await modalPage.waitForTimeout(1000);
      await modalPage.screenshot({ 
        path: 'screenshots/modal-add-transaction.png',
        fullPage: true 
      });
      
      // Test form validation
      const submitButton = await modalPage.$('button:has-text("저장"), button:has-text("확인")');
      if (submitButton) {
        await submitButton.click();
        await modalPage.waitForTimeout(500);
        await modalPage.screenshot({ 
          path: 'screenshots/modal-validation-errors.png',
          fullPage: true 
        });
      }
      
      // Close modal with ESC
      await modalPage.keyboard.press('Escape');
      await modalPage.waitForTimeout(500);
    }
    
    results.modals = { tested: true, screenshots: 2 };
    
    // Test 3: Toast Notifications
    console.log('\n🍞 Testing Toast Notifications...');
    
    // Try to trigger a toast by submitting form with errors
    if (addButton) {
      await addButton.click();
      await modalPage.waitForTimeout(500);
      
      // Fill partial data to trigger validation toast
      await modalPage.fill('input[name="amount"], input[placeholder*="금액"]', '10000');
      const saveButton = await modalPage.$('button:has-text("저장"), button:has-text("확인")');
      if (saveButton) {
        await saveButton.click();
        await modalPage.waitForTimeout(1000);
        
        // Check for toast
        const toast = await modalPage.$('.toast, [role="alert"], .notification');
        if (toast) {
          await modalPage.screenshot({ 
            path: 'screenshots/toast-validation-error.png',
            fullPage: true 
          });
        }
      }
    }
    
    results.toasts = { tested: true, screenshots: 1 };
    await modalContext.close();
    
    // Test 4: Mobile UI Layout Issues
    console.log('\n📱 Testing Mobile UI for Layout Issues...');
    
    for (const viewport of mobileViewports) {
      console.log(`  Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      const mobileContext = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: 'ko-KR',
        storageState: {
          cookies: [],
          origins: [{
            origin: 'http://localhost:3002',
            localStorage: [{
              name: 'auth',
              value: JSON.stringify({ user: { id: 1, name: 'Test User' } })
            }]
          }]
        }
      });
      
      const mobilePage = await mobileContext.newPage();
      
      // Test each page for overflow and layout issues
      const pagesToTest = [
        { url: '/transactions', name: 'transactions' },
        { url: '/analytics', name: 'analytics' },
        { url: '/budget', name: 'budget' }
      ];
      
      for (const page of pagesToTest) {
        await mobilePage.goto(`http://localhost:3002${page.url}`);
        await mobilePage.waitForLoadState('networkidle');
        
        // Check for horizontal scroll (indicates overflow)
        const hasHorizontalScroll = await mobilePage.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        // Check for overlapping elements
        const overlappingElements = await mobilePage.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const overlaps = [];
          
          for (let i = 0; i < elements.length; i++) {
            const rect1 = elements[i].getBoundingClientRect();
            if (rect1.width === 0 || rect1.height === 0) continue;
            
            for (let j = i + 1; j < Math.min(elements.length, i + 10); j++) {
              const rect2 = elements[j].getBoundingClientRect();
              if (rect2.width === 0 || rect2.height === 0) continue;
              
              // Check if elements overlap
              if (!(rect1.right < rect2.left || 
                    rect2.right < rect1.left || 
                    rect1.bottom < rect2.top || 
                    rect2.bottom < rect1.top)) {
                // Elements overlap
                const parent1 = elements[i].parentElement;
                const parent2 = elements[j].parentElement;
                if (parent1 !== parent2) {
                  overlaps.push({
                    elem1: elements[i].tagName,
                    elem2: elements[j].tagName
                  });
                }
              }
            }
          }
          
          return overlaps.length > 0;
        });
        
        // Check for text overflow
        const textOverflow = await mobilePage.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const overflows = [];
          
          for (const element of elements) {
            if (element.scrollWidth > element.clientWidth) {
              overflows.push({
                tag: element.tagName,
                text: element.textContent?.substring(0, 50)
              });
            }
          }
          
          return overflows.length > 0;
        });
        
        if (hasHorizontalScroll || overlappingElements || textOverflow) {
          console.log(`    ⚠️  ${page.name} has UI issues on ${viewport.name}`);
          await mobilePage.screenshot({ 
            path: `screenshots/mobile-issue-${page.name}-${viewport.name}.png`,
            fullPage: true 
          });
          
          if (!results.mobileUI[viewport.name]) {
            results.mobileUI[viewport.name] = {};
          }
          
          results.mobileUI[viewport.name][page.name] = {
            hasHorizontalScroll,
            overlappingElements,
            textOverflow
          };
        } else {
          console.log(`    ✅ ${page.name} OK`);
        }
      }
      
      await mobileContext.close();
    }
    
    // Test 5: Interactive Elements
    console.log('\n🎛️ Testing Interactive Elements...');
    
    const interactionContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      locale: 'ko-KR',
      storageState: {
        cookies: [],
        origins: [{
          origin: 'http://localhost:3002',
          localStorage: [{
            name: 'auth',
            value: JSON.stringify({ user: { id: 1, name: 'Test User' } })
          }]
        }]
      }
    });
    
    const interactionPage = await interactionContext.newPage();
    
    // Test dropdowns
    await interactionPage.goto('http://localhost:3002/transactions');
    await interactionPage.waitForLoadState('networkidle');
    
    // Test category dropdown
    const categoryDropdown = await interactionPage.$('select, [role="combobox"]');
    if (categoryDropdown) {
      await categoryDropdown.click();
      await interactionPage.waitForTimeout(500);
      await interactionPage.screenshot({ 
        path: 'screenshots/dropdown-category-open.png',
        fullPage: true 
      });
    }
    
    // Test date picker
    const datePicker = await interactionPage.$('input[type="date"], input[type="datetime-local"]');
    if (datePicker) {
      await datePicker.click();
      await interactionPage.waitForTimeout(500);
      await interactionPage.screenshot({ 
        path: 'screenshots/datepicker-open.png',
        fullPage: true 
      });
    }
    
    // Test navigation menu on mobile
    const menuButton = await interactionPage.$('button[aria-label*="menu"], button:has-text("☰"), button.hamburger');
    if (menuButton) {
      await menuButton.click();
      await interactionPage.waitForTimeout(500);
      await interactionPage.screenshot({ 
        path: 'screenshots/mobile-menu-open.png',
        fullPage: true 
      });
    }
    
    results.interactions = { tested: true, screenshots: 3 };
    await interactionContext.close();
    
    // Test 6: Form Validations
    console.log('\n📝 Testing Form Validations...');
    
    const formContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      locale: 'ko-KR',
      storageState: {
        cookies: [],
        origins: [{
          origin: 'http://localhost:3002',
          localStorage: [{
            name: 'auth',
            value: JSON.stringify({ user: { id: 1, name: 'Test User' } })
          }]
        }]
      }
    });
    
    const formPage = await formContext.newPage();
    await formPage.goto('http://localhost:3002/settings');
    await formPage.waitForLoadState('networkidle');
    
    // Test settings form
    const nameInput = await formPage.$('input[name="name"], input[placeholder*="이름"]');
    if (nameInput) {
      await nameInput.fill('');
      await nameInput.blur();
      await formPage.waitForTimeout(500);
      await formPage.screenshot({ 
        path: 'screenshots/form-validation-empty.png',
        fullPage: true 
      });
      
      // Test invalid email
      const emailInput = await formPage.$('input[type="email"]');
      if (emailInput) {
        await emailInput.fill('invalid-email');
        await emailInput.blur();
        await formPage.waitForTimeout(500);
        await formPage.screenshot({ 
          path: 'screenshots/form-validation-email.png',
          fullPage: true 
        });
      }
    }
    
    results.forms = { tested: true, screenshots: 2 };
    await formContext.close();
    
  } catch (error) {
    console.error('Error during testing:', error);
    results.error = error.message;
  } finally {
    await browser.close();
  }
  
  // Generate report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('=' .repeat(60));
  
  console.log('\n✅ Tests Completed:');
  console.log(`  • Login Flow: ${results.loginFlow.tested ? '✓' : '✗'}`);
  console.log(`  • Modals: ${results.modals.tested ? '✓' : '✗'}`);
  console.log(`  • Toasts: ${results.toasts.tested ? '✓' : '✗'}`);
  console.log(`  • Forms: ${results.forms.tested ? '✓' : '✗'}`);
  console.log(`  • Interactions: ${results.interactions.tested ? '✓' : '✗'}`);
  
  if (Object.keys(results.mobileUI).length > 0) {
    console.log('\n⚠️  Mobile UI Issues Found:');
    for (const [viewport, pages] of Object.entries(results.mobileUI)) {
      console.log(`\n  ${viewport}:`);
      for (const [page, issues] of Object.entries(pages)) {
        const issueTypes = [];
        if (issues.hasHorizontalScroll) issueTypes.push('horizontal scroll');
        if (issues.overlappingElements) issueTypes.push('overlapping elements');
        if (issues.textOverflow) issueTypes.push('text overflow');
        console.log(`    • ${page}: ${issueTypes.join(', ')}`);
      }
    }
  } else {
    console.log('\n✅ No Mobile UI Issues Found!');
  }
  
  // Save detailed report
  const reportPath = 'screenshots/interaction-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Detailed report saved to: ${reportPath}`);
  
  return results;
}

// Run the tests
testComprehensiveInteractions().catch(console.error);