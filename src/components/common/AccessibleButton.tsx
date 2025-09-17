'use client'

import { forwardRef } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AccessibleButtonProps extends ButtonProps {
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-controls'?: string
  'aria-pressed'?: boolean
  focusRing?: boolean
  announcement?: string // For screen reader announcements
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    children, 
    className, 
    focusRing = true, 
    announcement,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-pressed': ariaPressed,
    ...props 
  }, ref) => {
    return (
      <>
        <Button
          ref={ref}
          className={cn(
            // Enhanced focus ring for accessibility
            focusRing && 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            // Ensure minimum touch target size
            'min-h-[44px] min-w-[44px]',
            className
          )}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-expanded={ariaExpanded}
          aria-controls={ariaControls}
          aria-pressed={ariaPressed}
          {...props}
        >
          {children}
        </Button>
        
        {/* Hidden announcement for screen readers */}
        {announcement && (
          <div
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement}
          </div>
        )}
      </>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'

// Skip link component for keyboard navigation
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-black px-4 py-2 rounded shadow-lg z-50"
    >
      {children}
    </a>
  )
}

// Focus trap component for modals
export function FocusTrap({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isActive || event.key !== 'Tab') return

    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        event.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        event.preventDefault()
      }
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {children}
    </div>
  )
}