const { chromium } = require('playwright');
const fs = require('fs');

async function detailedMobileTest() {
  console.log('🔍 Running Detailed Mobile UI Analysis...\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500
  });

  const viewport = { width: 320, height: 568 }; // iPhone SE - smallest common size
  
  const context = await browser.newContext({
    viewport,
    locale: 'ko-KR'
  });
  
  const page = await context.newPage();
  
  // Add CSS to highlight overlapping elements
  await page.addStyleTag({
    content: `
      .debug-overlap { 
        outline: 3px solid red !important; 
        background: rgba(255, 0, 0, 0.1) !important; 
      }
      .debug-overflow { 
        outline: 3px solid orange !important; 
        background: rgba(255, 165, 0, 0.1) !important; 
      }
    `
  });

  try {
    // Test 1: Check logged-in state with real navigation
    console.log('📱 Testing authenticated state...');
    await page.goto('http://localhost:3002/transactions');
    await page.waitForLoadState('networkidle');
    
    // Test mobile menu
    console.log('🍔 Testing mobile menu...');
    const mobileMenuButton = await page.$('button:has-text("☰"), button.md\\:hidden, [aria-label*="menu"]');
    if (mobileMenuButton) {
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'screenshots/mobile-menu-open-detailed.png',
        fullPage: true 
      });
      
      // Test navigation
      const navLink = await page.$('a:has-text("분석")');
      if (navLink) {
        await navLink.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Analyze current page layout issues
    console.log('🔍 Analyzing layout issues...');
    
    const analysisResult = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('*');
      
      // Check for overlapping elements
      const rects = [];
      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          rects.push({
            element: el,
            rect,
            index,
            tagName: el.tagName,
            className: el.className,
            id: el.id
          });
        }
      });
      
      // Find overlaps
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const rect1 = rects[i].rect;
          const rect2 = rects[j].rect;
          
          // Check if rectangles overlap
          if (!(rect1.right <= rect2.left || 
                rect2.right <= rect1.left || 
                rect1.bottom <= rect2.top || 
                rect2.bottom <= rect1.top)) {
            
            // Make sure they're not parent/child
            const el1 = rects[i].element;
            const el2 = rects[j].element;
            
            if (!el1.contains(el2) && !el2.contains(el1)) {
              issues.push({
                type: 'overlap',
                element1: {
                  tag: rects[i].tagName,
                  class: rects[i].className,
                  id: rects[i].id
                },
                element2: {
                  tag: rects[j].tagName,
                  class: rects[j].className,
                  id: rects[j].id
                }
              });
              
              // Highlight overlapping elements
              el1.classList.add('debug-overlap');
              el2.classList.add('debug-overlap');
            }
          }
        }
      }
      
      // Check for horizontal overflow
      const body = document.body;
      const html = document.documentElement;
      const hasHorizontalScroll = Math.max(
        body.scrollWidth, html.scrollWidth
      ) > Math.max(body.clientWidth, html.clientWidth);
      
      if (hasHorizontalScroll) {
        issues.push({
          type: 'horizontal_scroll',
          bodyWidth: body.scrollWidth,
          htmlWidth: html.scrollWidth,
          clientWidth: body.clientWidth
        });
      }
      
      // Check for text overflow
      elements.forEach(el => {
        if (el.scrollWidth > el.clientWidth && el.textContent?.trim()) {
          issues.push({
            type: 'text_overflow',
            element: {
              tag: el.tagName,
              class: el.className,
              id: el.id,
              text: el.textContent.substring(0, 50)
            }
          });
          el.classList.add('debug-overflow');
        }
      });
      
      return {
        issues,
        pageWidth: window.innerWidth,
        pageHeight: window.innerHeight,
        bodyRect: body.getBoundingClientRect(),
        url: window.location.href
      };
    });
    
    console.log(`\n📊 Analysis Results for ${analysisResult.url}:`);
    console.log(`   Viewport: ${analysisResult.pageWidth}x${analysisResult.pageHeight}`);
    console.log(`   Total Issues: ${analysisResult.issues.length}`);
    
    const overlapIssues = analysisResult.issues.filter(i => i.type === 'overlap');
    const overflowIssues = analysisResult.issues.filter(i => i.type === 'text_overflow');
    const scrollIssues = analysisResult.issues.filter(i => i.type === 'horizontal_scroll');
    
    if (overlapIssues.length > 0) {
      console.log(`   ⚠️  Overlapping Elements: ${overlapIssues.length}`);
      overlapIssues.slice(0, 3).forEach((issue, i) => {
        console.log(`      ${i+1}. ${issue.element1.tag}.${issue.element1.class} overlaps ${issue.element2.tag}.${issue.element2.class}`);
      });
    }
    
    if (overflowIssues.length > 0) {
      console.log(`   ⚠️  Text Overflow: ${overflowIssues.length}`);
      overflowIssues.slice(0, 3).forEach((issue, i) => {
        console.log(`      ${i+1}. ${issue.element.tag}: "${issue.element.text}..."`);
      });
    }
    
    if (scrollIssues.length > 0) {
      console.log(`   ⚠️  Horizontal Scroll: Body width ${scrollIssues[0].bodyWidth}px > Client width ${scrollIssues[0].clientWidth}px`);
    }
    
    // Take screenshot with highlighted issues
    await page.screenshot({ 
      path: 'screenshots/mobile-issues-highlighted.png',
      fullPage: true 
    });
    
    // Test other critical pages
    const pagesToTest = [
      '/analytics',
      '/budget', 
      '/settings'
    ];
    
    const allResults = { [analysisResult.url]: analysisResult };
    
    for (const pagePath of pagesToTest) {
      console.log(`\n📄 Testing ${pagePath}...`);
      await page.goto(`http://localhost:3002${pagePath}`);
      await page.waitForLoadState('networkidle');
      
      const pageResult = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('*');
        
        // Quick overlap check
        const rects = Array.from(elements)
          .map(el => ({ el, rect: el.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 0 && rect.height > 0);
        
        let overlapCount = 0;
        for (let i = 0; i < rects.length && overlapCount < 5; i++) {
          for (let j = i + 1; j < rects.length && overlapCount < 5; j++) {
            const rect1 = rects[i].rect;
            const rect2 = rects[j].rect;
            
            if (!(rect1.right <= rect2.left || 
                  rect2.right <= rect1.left || 
                  rect1.bottom <= rect2.top || 
                  rect2.bottom <= rect1.top)) {
              
              if (!rects[i].el.contains(rects[j].el) && !rects[j].el.contains(rects[i].el)) {
                overlapCount++;
                issues.push({ type: 'overlap' });
              }
            }
          }
        }
        
        return {
          url: window.location.href,
          issues,
          hasOverlaps: overlapCount > 0
        };
      });
      
      allResults[pageResult.url] = pageResult;
      console.log(`   ${pageResult.hasOverlaps ? '❌' : '✅'} ${pageResult.issues.length} issues found`);
      
      if (pageResult.hasOverlaps) {
        await page.screenshot({ 
          path: `screenshots/mobile-issue-${pagePath.replace('/', '')}.png`,
          fullPage: true 
        });
      }
    }
    
    // Generate recommendations
    console.log('\n' + '='.repeat(60));
    console.log('🛠️  MOBILE UI FIX RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    const totalOverlaps = Object.values(allResults).reduce((sum, result) => 
      sum + result.issues.filter(i => i.type === 'overlap').length, 0
    );
    
    if (totalOverlaps > 0) {
      console.log('\n1. Fix Overlapping Elements:');
      console.log('   • Add proper spacing between components');
      console.log('   • Check z-index values for positioned elements');
      console.log('   • Ensure mobile navigation doesn\'t overlap content');
      console.log('   • Review grid/flexbox layouts for mobile breakpoints');
    }
    
    const totalOverflows = Object.values(allResults).reduce((sum, result) => 
      sum + result.issues.filter(i => i.type === 'text_overflow').length, 0
    );
    
    if (totalOverflows > 0) {
      console.log('\n2. Fix Text Overflow:');
      console.log('   • Add text truncation with ellipsis');
      console.log('   • Use responsive font sizes');
      console.log('   • Implement word wrapping');
      console.log('   • Consider shorter labels for mobile');
    }
    
    console.log('\n3. General Mobile Improvements:');
    console.log('   • Add proper touch targets (min 44px)');
    console.log('   • Ensure adequate spacing between clickable elements');
    console.log('   • Test on actual devices');
    console.log('   • Implement proper mobile-first responsive design');
    
    // Save detailed report
    fs.writeFileSync('screenshots/mobile-analysis-detailed.json', JSON.stringify(allResults, null, 2));
    console.log('\n📁 Detailed analysis saved to: screenshots/mobile-analysis-detailed.json');
    
  } catch (error) {
    console.error('Error during mobile testing:', error);
  } finally {
    await browser.close();
  }
}

detailedMobileTest().catch(console.error);