import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('Page load performance', async ({ page }) => {
    // Start performance measurement
    await page.goto('/', { waitUntil: 'load' })
    
    // Measure First Contentful Paint
    const fcpMetric = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
          if (fcpEntry) {
            resolve(fcpEntry.startTime)
          }
        }).observe({ entryTypes: ['paint'] })
      })
    })
    
    // FCP should be under 2 seconds
    expect(fcpMetric).toBeLessThan(2000)
    
    // Measure Largest Contentful Paint
    const lcpMetric = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(5000), 5000)
      })
    })
    
    // LCP should be under 2.5 seconds
    expect(lcpMetric).toBeLessThan(2500)
  })

  test('Bundle size analysis', async ({ page }) => {
    // Navigate to page and check resource sizes
    const resourceSizes = new Map()
    
    page.on('response', async (response) => {
      const url = response.url()
      const contentLength = response.headers()['content-length']
      if (contentLength && (url.includes('.js') || url.includes('.css'))) {
        resourceSizes.set(url, parseInt(contentLength))
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check main bundle size (should be under 500KB)
    let totalJSSize = 0
    let totalCSSSize = 0
    
    for (const [url, size] of resourceSizes.entries()) {
      if (url.includes('.js')) {
        totalJSSize += size
      } else if (url.includes('.css')) {
        totalCSSSize += size
      }
    }
    
    console.log(`Total JS size: ${totalJSSize / 1024}KB`)
    console.log(`Total CSS size: ${totalCSSSize / 1024}KB`)
    
    expect(totalJSSize).toBeLessThan(500 * 1024) // 500KB
    expect(totalCSSSize).toBeLessThan(100 * 1024) // 100KB
  })

  test('Virtual scrolling performance with large datasets', async ({ page }) => {
    await page.goto('/transactions')
    
    // Mock large dataset
    await page.route('**/api/transactions', async route => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `transaction-${i}`,
        description: `Transaction ${i}`,
        amount: Math.floor(Math.random() * 100000),
        category: 'test',
        date: new Date().toISOString(),
        type: 'expense'
      }))
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeDataset)
      })
    })
    
    await page.reload()
    await page.waitForSelector('[data-testid="virtual-list"]')
    
    // Measure scrolling performance
    const scrollStart = Date.now()
    
    // Scroll through the list
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500)
      await page.waitForTimeout(100)
    }
    
    const scrollEnd = Date.now()
    const scrollDuration = scrollEnd - scrollStart
    
    // Scrolling should complete within reasonable time
    expect(scrollDuration).toBeLessThan(2000)
    
    // Check that only visible items are rendered
    const renderedItems = await page.locator('[data-testid="transaction-item"]').count()
    expect(renderedItems).toBeLessThan(50) // Should virtualize to show only ~20-30 items
  })

  test('Memory usage during navigation', async ({ page }) => {
    // Start memory measurement
    await page.goto('/')
    
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Navigate through all pages
    const pages = ['/transactions', '/budget', '/analytics', '/reports']
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000) // Allow for component mounting
    }
    
    // Go back to home and measure memory
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory
      const memoryIncreasePercentage = (memoryIncrease / initialMemory) * 100
      
      console.log(`Memory increase: ${memoryIncrease / 1024 / 1024}MB (${memoryIncreasePercentage.toFixed(2)}%)`)
      
      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercentage).toBeLessThan(50)
    }
  })

  test('Image loading optimization', async ({ page }) => {
    await page.goto('/')
    
    // Track image loading
    const imageLoadTimes = new Map()
    
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp')) {
        const timing = response.timing()
        imageLoadTimes.set(url, timing.responseEnd - timing.requestStart)
      }
    })
    
    await page.waitForLoadState('networkidle')
    
    // Check lazy loading implementation
    const lazyImages = await page.locator('img[loading="lazy"]').count()
    expect(lazyImages).toBeGreaterThan(0)
    
    // Check that images load within reasonable time
    for (const [url, loadTime] of imageLoadTimes.entries()) {
      console.log(`Image ${url} loaded in ${loadTime}ms`)
      expect(loadTime).toBeLessThan(2000) // 2 seconds max per image
    }
  })

  test('Debounced search performance', async ({ page }) => {
    await page.goto('/transactions')
    await page.waitForSelector('[data-testid="search-input"]')
    
    let requestCount = 0
    page.on('request', (request) => {
      if (request.url().includes('/api/search')) {
        requestCount++
      }
    })
    
    const searchInput = page.locator('[data-testid="search-input"]')
    
    // Type quickly to test debouncing
    await searchInput.fill('test search query')
    await page.waitForTimeout(1000) // Wait for debounce
    
    // Should have made minimal requests due to debouncing
    expect(requestCount).toBeLessThanOrEqual(2)
    
    // Clear and test again
    requestCount = 0
    await searchInput.clear()
    await searchInput.fill('another query')
    await page.waitForTimeout(1000)
    
    expect(requestCount).toBeLessThanOrEqual(2)
  })

  test('Chart rendering performance', async ({ page }) => {
    await page.goto('/analytics')
    
    // Wait for charts to load
    await page.waitForSelector('[data-testid="analytics-chart"]')
    
    // Measure chart rendering time
    const chartRenderStart = Date.now()
    
    // Switch between tabs to test chart re-rendering
    const tabs = ['트렌드', '카테고리', '예산']
    
    for (const tab of tabs) {
      await page.getByRole('tab', { name: tab }).click()
      await page.waitForSelector('[data-testid="analytics-chart"]')
      await page.waitForTimeout(500) // Allow for animations
    }
    
    const chartRenderEnd = Date.now()
    const totalRenderTime = chartRenderEnd - chartRenderStart
    
    // Chart rendering should be smooth
    expect(totalRenderTime).toBeLessThan(3000)
    
    // Check for Canvas/SVG elements (chart libraries typically use these)
    const chartElements = await page.locator('canvas, svg').count()
    expect(chartElements).toBeGreaterThan(0)
  })

  test('Offline performance and caching', async ({ page }) => {
    // Load page while online
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Go offline
    await page.context().setOffline(true)
    
    // Navigate to cached pages
    const cachedPages = ['/transactions', '/budget', '/analytics']
    
    for (const pagePath of cachedPages) {
      const navigationStart = Date.now()
      await page.goto(pagePath)
      const navigationEnd = Date.now()
      
      const loadTime = navigationEnd - navigationStart
      console.log(`Offline load time for ${pagePath}: ${loadTime}ms`)
      
      // Offline pages should load quickly from cache
      expect(loadTime).toBeLessThan(1000)
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    }
  })

  test('Bundle splitting and code splitting effectiveness', async ({ page }) => {
    const loadedChunks = new Set()
    
    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('.js') && !url.includes('node_modules')) {
        const chunkName = url.split('/').pop()
        loadedChunks.add(chunkName)
      }
    })
    
    // Load home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const homeChunks = new Set(loadedChunks)
    
    // Navigate to analytics (should load additional chunks)
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    const analyticsChunks = new Set(loadedChunks)
    
    // Check that analytics page loaded additional chunks
    const newChunks = [...analyticsChunks].filter(chunk => !homeChunks.has(chunk))
    expect(newChunks.length).toBeGreaterThan(0)
    
    console.log('Home chunks:', homeChunks.size)
    console.log('Analytics additional chunks:', newChunks.length)
    
    // Should have reasonable chunk splitting
    expect(homeChunks.size).toBeLessThan(10) // Not too many chunks on initial load
    expect(newChunks.length).toBeLessThan(5) // Reasonable additional chunks
  })
})