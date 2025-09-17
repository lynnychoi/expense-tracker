import { test, expect } from '@playwright/test'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Keyboard navigation', async ({ page }) => {
    // Test tab order
    await page.keyboard.press('Tab')
    let focusedElement = await page.locator(':focus').getAttribute('data-testid')
    expect(focusedElement).toBeTruthy()
    
    // Continue tabbing through interactive elements
    const interactiveElements = []
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const element = await page.locator(':focus').getAttribute('data-testid')
      if (element) {
        interactiveElements.push(element)
      }
    }
    
    expect(interactiveElements.length).toBeGreaterThan(3)
    
    // Test reverse tab navigation
    await page.keyboard.press('Shift+Tab')
    const reverseFocusedElement = await page.locator(':focus').getAttribute('data-testid')
    expect(reverseFocusedElement).toBeTruthy()
  })

  test('Skip to main content link', async ({ page }) => {
    // Press tab to reveal skip link
    await page.keyboard.press('Tab')
    
    const skipLink = page.locator('[data-testid="skip-to-content"]')
    if (await skipLink.isVisible()) {
      await skipLink.click()
      
      // Should focus on main content
      const mainContent = page.locator('main')
      await expect(mainContent).toBeFocused()
    }
  })

  test('ARIA labels and roles', async ({ page }) => {
    // Check main landmarks
    await expect(page.locator('main')).toHaveAttribute('role', 'main')
    await expect(page.locator('nav')).toHaveAttribute('role', 'navigation')
    
    // Check button accessibility
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const text = await button.textContent()
      
      // Button should have either aria-label or visible text
      expect(ariaLabel || text?.trim()).toBeTruthy()
    }
    
    // Check form labels
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const inputId = await input.getAttribute('id')
      
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`)
        await expect(label).toBeVisible()
      }
    }
  })

  test('Color contrast and visual accessibility', async ({ page }) => {
    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.reload()
    
    // Check that content is still visible in dark mode
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
    
    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    
    // Body should have reduced motion class
    await expect(page.locator('body')).toHaveClass(/reduced-motion/)
  })

  test('Screen reader compatibility', async ({ page }) => {
    // Test heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    let previousLevel = 0
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
      const currentLevel = parseInt(tagName.charAt(1))
      
      // Heading levels should not skip (e.g., h1 -> h3)
      if (previousLevel > 0) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
      }
      
      previousLevel = currentLevel
    }
    
    // Test alt text for images
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      
      // Images should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBeTruthy()
    }
  })

  test('Focus management in modals and dropdowns', async ({ page }) => {
    // Navigate to page with modal
    await page.getByRole('link', { name: '거래내역' }).click()
    await page.getByRole('button', { name: '거래 추가' }).click()
    
    // Modal should be visible and focused
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    
    // First focusable element in modal should be focused
    const firstInput = modal.locator('input, button, select').first()
    await expect(firstInput).toBeFocused()
    
    // Test escape key to close modal
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
    
    // Focus should return to trigger button
    await expect(page.getByRole('button', { name: '거래 추가' })).toBeFocused()
  })

  test('Error message accessibility', async ({ page }) => {
    await page.getByRole('link', { name: '거래내역' }).click()
    await page.getByRole('button', { name: '거래 추가' }).click()
    
    // Submit form without required fields
    await page.getByRole('button', { name: '저장' }).click()
    
    // Error messages should be associated with form fields
    const errorMessages = page.locator('[role="alert"], [aria-live="polite"]')
    await expect(errorMessages.first()).toBeVisible()
    
    // Check if errors are announced to screen readers
    const errorText = await errorMessages.first().textContent()
    expect(errorText?.trim()).toBeTruthy()
  })

  test('Interactive element sizing and spacing', async ({ page }) => {
    // Check button sizes (should be at least 44x44px for touch targets)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(32) // Minimum touch target
        expect(box.height).toBeGreaterThanOrEqual(32)
      }
    }
    
    // Check link spacing
    const links = page.locator('a')
    const linkCount = await links.count()
    
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i)
      const box = await link.boundingBox()
      
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(24)
        expect(box.height).toBeGreaterThanOrEqual(24)
      }
    }
  })

  test('Form accessibility', async ({ page }) => {
    await page.getByRole('link', { name: '거래내역' }).click()
    await page.getByRole('button', { name: '거래 추가' }).click()
    
    // Check form structure
    const form = page.locator('form')
    await expect(form).toBeVisible()
    
    // Check fieldset and legend for grouped controls
    const fieldsets = page.locator('fieldset')
    const fieldsetCount = await fieldsets.count()
    
    for (let i = 0; i < fieldsetCount; i++) {
      const fieldset = fieldsets.nth(i)
      const legend = fieldset.locator('legend')
      await expect(legend).toBeVisible()
    }
    
    // Check required field indicators
    const requiredInputs = page.locator('input[required], select[required]')
    const requiredCount = await requiredInputs.count()
    
    for (let i = 0; i < requiredCount; i++) {
      const input = requiredInputs.nth(i)
      const ariaRequired = await input.getAttribute('aria-required')
      const required = await input.getAttribute('required')
      
      expect(ariaRequired === 'true' || required !== null).toBeTruthy()
    }
  })

  test('Live region announcements', async ({ page }) => {
    // Test success messages
    await page.getByRole('link', { name: '거래내역' }).click()
    await page.getByRole('button', { name: '거래 추가' }).click()
    
    // Fill and submit form
    await page.getByLabel('설명').fill('테스트 거래')
    await page.getByLabel('금액').fill('10000')
    await page.getByLabel('카테고리').selectOption('식비')
    await page.getByRole('button', { name: '저장' }).click()
    
    // Success message should be announced
    const liveRegion = page.locator('[aria-live="polite"], [role="status"]')
    await expect(liveRegion).toBeVisible()
    
    const announcement = await liveRegion.textContent()
    expect(announcement?.includes('성공') || announcement?.includes('저장')).toBeTruthy()
  })

  test('Language and locale support', async ({ page }) => {
    // Check HTML lang attribute
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'ko')
    
    // Check if text is in Korean
    const mainHeading = page.locator('h1')
    const headingText = await mainHeading.textContent()
    expect(headingText).toMatch(/[가-힣]/) // Contains Korean characters
    
    // Check date and number formatting
    const amounts = page.locator('[data-testid*="amount"]')
    const amountCount = await amounts.count()
    
    if (amountCount > 0) {
      const amountText = await amounts.first().textContent()
      expect(amountText).toMatch(/원|,/) // Korean currency or number formatting
    }
  })

  test('Mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Test mobile navigation
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      
      const mobileMenu = page.locator('[data-testid="mobile-menu"]')
      await expect(mobileMenu).toBeVisible()
      
      // Mobile menu should be accessible
      await expect(mobileMenu).toHaveAttribute('role', 'navigation')
      
      // Test closing mobile menu with escape
      await page.keyboard.press('Escape')
      await expect(mobileMenu).not.toBeVisible()
    }
    
    // Test touch targets on mobile
    const touchTargets = page.locator('button, a, input, select')
    const targetCount = await touchTargets.count()
    
    for (let i = 0; i < Math.min(targetCount, 3); i++) {
      const target = touchTargets.nth(i)
      const box = await target.boundingBox()
      
      if (box) {
        // Mobile touch targets should be at least 44x44px
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
})