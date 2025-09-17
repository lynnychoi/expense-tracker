import { test, expect } from '@playwright/test'

test.describe('Full User Journey - Korean Household Expense Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Complete user workflow from homepage to analytics', async ({ page }) => {
    // 1. Homepage - verify initial state
    await expect(page.locator('h1')).toContainText('가계부 대시보드')
    await expect(page.locator('[data-testid="total-balance"]')).toBeVisible()
    await expect(page.locator('[data-testid="recent-transactions"]')).toBeVisible()

    // 2. Navigate to transactions page
    await page.getByRole('link', { name: '거래내역' }).click()
    await expect(page.locator('h1')).toContainText('거래내역')

    // 3. Add new transaction
    await page.getByRole('button', { name: '거래 추가' }).click()
    await expect(page.locator('[data-testid="transaction-form"]')).toBeVisible()
    
    // Fill transaction form
    await page.getByLabel('설명').fill('테스트 지출')
    await page.getByLabel('금액').fill('15000')
    await page.getByLabel('카테고리').selectOption('식비')
    await page.getByLabel('거래 유형').selectOption('지출')
    await page.getByRole('button', { name: '저장' }).click()
    
    // Verify transaction was added
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('테스트 지출')
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('15,000원')

    // 4. Navigate to budget page
    await page.getByRole('link', { name: '예산' }).click()
    await expect(page.locator('h1')).toContainText('예산 관리')
    
    // Add new budget
    await page.getByRole('button', { name: '예산 추가' }).click()
    await page.getByLabel('카테고리').selectOption('식비')
    await page.getByLabel('예산 금액').fill('500000')
    await page.getByRole('button', { name: '저장' }).click()
    
    // Verify budget progress
    await expect(page.locator('[data-testid="budget-progress"]')).toBeVisible()

    // 5. Navigate to analytics page
    await page.getByRole('link', { name: '분석' }).click()
    await expect(page.locator('h1')).toContainText('분석')
    
    // Test analytics tabs
    const tabs = ['개요', '트렌드', '카테고리', '예산', 'AI 인사이트']
    for (const tab of tabs) {
      await page.getByRole('tab', { name: tab }).click()
      await page.waitForTimeout(500) // Wait for chart animations
      await expect(page.locator('[data-testid="analytics-content"]')).toBeVisible()
    }

    // 6. Navigate to reports page
    await page.getByRole('link', { name: '리포트' }).click()
    await expect(page.locator('h1')).toContainText('리포트')
    
    // Test report generation
    await page.getByRole('tab', { name: '월간 리포트' }).click()
    await page.getByRole('button', { name: 'PDF 다운로드' }).click()
    
    // Verify download initiated (check for download event)
    const downloadPromise = page.waitForEvent('download')
    await downloadPromise

    // 7. Test PWA install prompt (if available)
    const installPrompt = page.locator('[data-testid="pwa-install-prompt"]')
    if (await installPrompt.isVisible()) {
      await expect(installPrompt).toContainText('앱 설치')
      await page.getByRole('button', { name: '나중에' }).click()
      await expect(installPrompt).not.toBeVisible()
    }
  })

  test('Responsive design across different screen sizes', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible()
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible()
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible()
    
    // Test mobile navigation menu
    await page.getByRole('button', { name: '메뉴' }).click()
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
  })

  test('Error handling and recovery', async ({ page }) => {
    // Test network failure simulation
    await page.route('**/api/transactions', route => route.abort())
    
    await page.getByRole('link', { name: '거래내역' }).click()
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('네트워크')
    
    // Test retry functionality
    await page.unroute('**/api/transactions')
    await page.getByRole('button', { name: '다시 시도' }).click()
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible()
  })

  test('Accessibility features', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Test screen reader support
    const mainContent = page.locator('main')
    await expect(mainContent).toHaveAttribute('role', 'main')
    
    // Test skip to content link
    await page.keyboard.press('Tab')
    const skipLink = page.locator('[data-testid="skip-to-content"]')
    if (await skipLink.isVisible()) {
      await skipLink.click()
      await expect(page.locator('main')).toBeFocused()
    }
    
    // Test high contrast mode
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await expect(page.locator('body')).toHaveClass(/reduced-motion/)
  })

  test('Data persistence and local storage', async ({ page }) => {
    // Add transaction
    await page.getByRole('link', { name: '거래내역' }).click()
    await page.getByRole('button', { name: '거래 추가' }).click()
    await page.getByLabel('설명').fill('테스트 거래')
    await page.getByLabel('금액').fill('10000')
    await page.getByRole('button', { name: '저장' }).click()
    
    // Refresh page and verify persistence
    await page.reload()
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('테스트 거래')
    
    // Test offline functionality
    await page.context().setOffline(true)
    await page.reload()
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Test that cached data is still available
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible()
  })

  test('Form validation and user feedback', async ({ page }) => {
    await page.getByRole('link', { name: '거래내역' }).click()
    await page.getByRole('button', { name: '거래 추가' }).click()
    
    // Test required field validation
    await page.getByRole('button', { name: '저장' }).click()
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    
    // Test invalid amount format
    await page.getByLabel('금액').fill('invalid')
    await page.getByRole('button', { name: '저장' }).click()
    await expect(page.locator('[data-testid="amount-error"]')).toBeVisible()
    
    // Test successful form submission
    await page.getByLabel('설명').fill('유효한 거래')
    await page.getByLabel('금액').fill('25000')
    await page.getByLabel('카테고리').selectOption('교통비')
    await page.getByRole('button', { name: '저장' }).click()
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('유효한 거래')
  })

  test('Search and filtering functionality', async ({ page }) => {
    await page.getByRole('link', { name: '거래내역' }).click()
    
    // Test search functionality
    await page.getByPlaceholder('거래 검색...').fill('테스트')
    await page.waitForTimeout(500) // Wait for debounced search
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // Test category filter
    await page.getByLabel('카테고리 필터').selectOption('식비')
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="filtered-transactions"]')).toBeVisible()
    
    // Test date range filter
    await page.getByLabel('시작 날짜').fill('2024-01-01')
    await page.getByLabel('종료 날짜').fill('2024-12-31')
    await page.getByRole('button', { name: '필터 적용' }).click()
    await expect(page.locator('[data-testid="date-filtered-results"]')).toBeVisible()
    
    // Clear filters
    await page.getByRole('button', { name: '필터 초기화' }).click()
    await expect(page.locator('[data-testid="all-transactions"]')).toBeVisible()
  })
})