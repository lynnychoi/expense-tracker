const { chromium } = require('playwright');

async function preciseOverlapTest() {
  console.log('🔍 Running Precise Overlap Detection...\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 300
  });

  const viewport = { width: 320, height: 568 }; // iPhone SE
  
  const context = await browser.newContext({
    viewport,
    locale: 'ko-KR'
  });
  
  const page = await context.newPage();

  try {
    // Test analytics page
    console.log('📊 Analyzing analytics page...');
    await page.goto('http://localhost:3002/analytics');
    await page.waitForLoadState('networkidle');
    
    const analyticsResult = await page.evaluate(() => {
      const overlaps = [];
      const allElements = Array.from(document.querySelectorAll('*'));
      
      // Get visible elements with actual size
      const visibleElements = allElements
        .map(el => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          return {
            element: el,
            rect,
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            zIndex: styles.zIndex,
            position: styles.position,
            text: el.textContent?.substring(0, 30)
          };
        })
        .filter(({ rect, element }) => {
          // Only include elements that are:
          // 1. Visible (width > 1 and height > 1)
          // 2. Not the body/html/head
          // 3. Not invisible due to CSS
          const styles = window.getComputedStyle(element);
          return rect.width > 1 && 
                 rect.height > 1 && 
                 !['HTML', 'HEAD', 'BODY'].includes(element.tagName) &&
                 styles.visibility !== 'hidden' &&
                 styles.display !== 'none' &&
                 styles.opacity !== '0';
        });

      console.log(`Found ${visibleElements.length} visible elements`);
      
      // Check overlaps between elements
      for (let i = 0; i < visibleElements.length; i++) {
        for (let j = i + 1; j < visibleElements.length; j++) {
          const el1 = visibleElements[i];
          const el2 = visibleElements[j];
          
          const rect1 = el1.rect;
          const rect2 = el2.rect;
          
          // Check if rectangles overlap
          const horizontalOverlap = !(rect1.right <= rect2.left || rect2.right <= rect1.left);
          const verticalOverlap = !(rect1.bottom <= rect2.top || rect2.bottom <= rect1.top);
          
          if (horizontalOverlap && verticalOverlap) {
            // Make sure one is not a parent/child of the other
            if (!el1.element.contains(el2.element) && !el2.element.contains(el1.element)) {
              // Calculate overlap area
              const overlapLeft = Math.max(rect1.left, rect2.left);
              const overlapRight = Math.min(rect1.right, rect2.right);
              const overlapTop = Math.max(rect1.top, rect2.top);
              const overlapBottom = Math.min(rect1.bottom, rect2.bottom);
              
              const overlapWidth = overlapRight - overlapLeft;
              const overlapHeight = overlapBottom - overlapTop;
              const overlapArea = overlapWidth * overlapHeight;
              
              // Only consider significant overlaps (> 10px area)
              if (overlapArea > 10) {
                overlaps.push({
                  element1: {
                    tag: el1.tagName,
                    class: el1.className,
                    id: el1.id,
                    text: el1.text,
                    rect: {
                      x: Math.round(rect1.x),
                      y: Math.round(rect1.y),
                      width: Math.round(rect1.width),
                      height: Math.round(rect1.height)
                    },
                    zIndex: el1.zIndex,
                    position: el1.position
                  },
                  element2: {
                    tag: el2.tagName,
                    class: el2.className,
                    id: el2.id,
                    text: el2.text,
                    rect: {
                      x: Math.round(rect2.x),
                      y: Math.round(rect2.y),
                      width: Math.round(rect2.width),
                      height: Math.round(rect2.height)
                    },
                    zIndex: el2.zIndex,
                    position: el2.position
                  },
                  overlapArea: Math.round(overlapArea),
                  overlapRect: {
                    x: Math.round(overlapLeft),
                    y: Math.round(overlapTop),
                    width: Math.round(overlapWidth),
                    height: Math.round(overlapHeight)
                  }
                });
                
                // Highlight overlapping elements
                el1.element.style.outline = '2px solid red';
                el2.element.style.outline = '2px solid red';
              }
            }
          }
        }
      }
      
      return {
        url: window.location.href,
        totalElements: allElements.length,
        visibleElements: visibleElements.length,
        overlaps: overlaps.slice(0, 10), // Limit to first 10 overlaps
        viewport: { width: window.innerWidth, height: window.innerHeight }
      };
    });
    
    console.log(`\n📊 Analytics Page Results:`);
    console.log(`   Total elements: ${analyticsResult.totalElements}`);
    console.log(`   Visible elements: ${analyticsResult.visibleElements}`);
    console.log(`   Overlaps found: ${analyticsResult.overlaps.length}`);
    
    if (analyticsResult.overlaps.length > 0) {
      console.log('\n⚠️  Overlapping Elements:');
      analyticsResult.overlaps.forEach((overlap, i) => {
        console.log(`\n${i + 1}. OVERLAP (${overlap.overlapArea}px²):`);
        console.log(`   Element 1: ${overlap.element1.tag}${overlap.element1.class ? '.' + String(overlap.element1.class).split(' ')[0] : ''}`);
        console.log(`   Position: (${overlap.element1.rect.x},${overlap.element1.rect.y}) ${overlap.element1.rect.width}×${overlap.element1.rect.height}`);
        console.log(`   Z-index: ${overlap.element1.zIndex}, Position: ${overlap.element1.position}`);
        if (overlap.element1.text?.trim()) {
          console.log(`   Text: "${overlap.element1.text.trim()}"`);
        }
        
        console.log(`   Element 2: ${overlap.element2.tag}${overlap.element2.class ? '.' + String(overlap.element2.class).split(' ')[0] : ''}`);
        console.log(`   Position: (${overlap.element2.rect.x},${overlap.element2.rect.y}) ${overlap.element2.rect.width}×${overlap.element2.rect.height}`);
        console.log(`   Z-index: ${overlap.element2.zIndex}, Position: ${overlap.element2.position}`);
        if (overlap.element2.text?.trim()) {
          console.log(`   Text: "${overlap.element2.text.trim()}"`);
        }
        
        console.log(`   Overlap area: (${overlap.overlapRect.x},${overlap.overlapRect.y}) ${overlap.overlapRect.width}×${overlap.overlapRect.height}`);
      });
    }
    
    await page.screenshot({ 
      path: 'screenshots/analytics-precise-overlaps.png',
      fullPage: true 
    });
    
    // Test settings page
    console.log('\n⚙️ Analyzing settings page...');
    await page.goto('http://localhost:3002/settings');
    await page.waitForLoadState('networkidle');
    
    const settingsResult = await page.evaluate(() => {
      const overlaps = [];
      const allElements = Array.from(document.querySelectorAll('*'));
      
      // Similar analysis for settings page
      const visibleElements = allElements
        .map(el => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          return {
            element: el,
            rect,
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            zIndex: styles.zIndex,
            position: styles.position,
            text: el.textContent?.substring(0, 30)
          };
        })
        .filter(({ rect, element }) => {
          const styles = window.getComputedStyle(element);
          return rect.width > 1 && 
                 rect.height > 1 && 
                 !['HTML', 'HEAD', 'BODY'].includes(element.tagName) &&
                 styles.visibility !== 'hidden' &&
                 styles.display !== 'none' &&
                 styles.opacity !== '0';
        });

      // Check overlaps
      for (let i = 0; i < visibleElements.length; i++) {
        for (let j = i + 1; j < visibleElements.length; j++) {
          const el1 = visibleElements[i];
          const el2 = visibleElements[j];
          
          const rect1 = el1.rect;
          const rect2 = el2.rect;
          
          const horizontalOverlap = !(rect1.right <= rect2.left || rect2.right <= rect1.left);
          const verticalOverlap = !(rect1.bottom <= rect2.top || rect2.bottom <= rect1.top);
          
          if (horizontalOverlap && verticalOverlap) {
            if (!el1.element.contains(el2.element) && !el2.element.contains(el1.element)) {
              const overlapLeft = Math.max(rect1.left, rect2.left);
              const overlapRight = Math.min(rect1.right, rect2.right);
              const overlapTop = Math.max(rect1.top, rect2.top);
              const overlapBottom = Math.min(rect1.bottom, rect2.bottom);
              
              const overlapWidth = overlapRight - overlapLeft;
              const overlapHeight = overlapBottom - overlapTop;
              const overlapArea = overlapWidth * overlapHeight;
              
              if (overlapArea > 10) {
                overlaps.push({
                  element1: {
                    tag: el1.tagName,
                    class: el1.className,
                    id: el1.id,
                    text: el1.text,
                    rect: {
                      x: Math.round(rect1.x),
                      y: Math.round(rect1.y),
                      width: Math.round(rect1.width),
                      height: Math.round(rect1.height)
                    },
                    zIndex: el1.zIndex,
                    position: el1.position
                  },
                  element2: {
                    tag: el2.tagName,
                    class: el2.className,
                    id: el2.id,
                    text: el2.text,
                    rect: {
                      x: Math.round(rect2.x),
                      y: Math.round(rect2.y),
                      width: Math.round(rect2.width),
                      height: Math.round(rect2.height)
                    },
                    zIndex: el2.zIndex,
                    position: el2.position
                  },
                  overlapArea: Math.round(overlapArea)
                });
                
                el1.element.style.outline = '2px solid red';
                el2.element.style.outline = '2px solid red';
              }
            }
          }
        }
      }
      
      return {
        url: window.location.href,
        totalElements: allElements.length,
        visibleElements: visibleElements.length,
        overlaps: overlaps.slice(0, 10)
      };
    });
    
    console.log(`\n⚙️ Settings Page Results:`);
    console.log(`   Total elements: ${settingsResult.totalElements}`);
    console.log(`   Visible elements: ${settingsResult.visibleElements}`);
    console.log(`   Overlaps found: ${settingsResult.overlaps.length}`);
    
    if (settingsResult.overlaps.length > 0) {
      console.log('\n⚠️  Overlapping Elements:');
      settingsResult.overlaps.forEach((overlap, i) => {
        console.log(`\n${i + 1}. OVERLAP (${overlap.overlapArea}px²):`);
        console.log(`   Element 1: ${overlap.element1.tag}${overlap.element1.class ? '.' + String(overlap.element1.class).split(' ')[0] : ''}`);
        console.log(`   Position: (${overlap.element1.rect.x},${overlap.element1.rect.y}) ${overlap.element1.rect.width}×${overlap.element1.rect.height}`);
        console.log(`   Z-index: ${overlap.element1.zIndex}, Position: ${overlap.element1.position}`);
        if (overlap.element1.text?.trim()) {
          console.log(`   Text: "${overlap.element1.text.trim()}"`);
        }
        
        console.log(`   Element 2: ${overlap.element2.tag}${overlap.element2.class ? '.' + String(overlap.element2.class).split(' ')[0] : ''}`);
        console.log(`   Position: (${overlap.element2.rect.x},${overlap.element2.rect.y}) ${overlap.element2.rect.width}×${overlap.element2.rect.height}`);
        console.log(`   Z-index: ${overlap.element2.zIndex}, Position: ${overlap.element2.position}`);
        if (overlap.element2.text?.trim()) {
          console.log(`   Text: "${overlap.element2.text.trim()}"`);
        }
      });
    }
    
    await page.screenshot({ 
      path: 'screenshots/settings-precise-overlaps.png',
      fullPage: true 
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Analytics page: ${analyticsResult.overlaps.length} overlaps`);
    console.log(`Settings page: ${settingsResult.overlaps.length} overlaps`);
    
    if (analyticsResult.overlaps.length === 0 && settingsResult.overlaps.length === 0) {
      console.log('\n✅ No significant overlaps detected!');
      console.log('The previous test might have detected false positives or very minor overlaps.');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

preciseOverlapTest().catch(console.error);