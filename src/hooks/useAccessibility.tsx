import { useEffect, useRef, useState } from 'react'

// Hook for announcing content to screen readers
export function useScreenReaderAnnouncement() {
  const announcementRef = useRef<HTMLDivElement>(null)

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority)
      announcementRef.current.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = ''
        }
      }, 1000)
    }
  }

  const AnnouncementElement = () => (
    <div
      ref={announcementRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  )

  return { announce, AnnouncementElement }
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true)
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return { isKeyboardUser }
}

// Hook for managing focus
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }

  const focusElement = () => {
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
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
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  return {
    focusRef,
    saveFocus,
    restoreFocus,
    focusElement,
    trapFocus
  }
}

// Hook for accessible modal dialogs
export function useAccessibleModal(isOpen: boolean) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement()
  const { announce } = useScreenReaderAnnouncement()

  useEffect(() => {
    if (isOpen) {
      saveFocus()
      announce('모달이 열렸습니다')
      
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current)
        return cleanup
      }
    } else {
      restoreFocus()
      announce('모달이 닫혔습니다')
    }
  }, [isOpen, saveFocus, restoreFocus, trapFocus, announce])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        restoreFocus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, restoreFocus])

  return { modalRef }
}

// Hook for accessible form validation
export function useAccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { announce } = useScreenReaderAnnouncement()

  const setFieldError = (fieldName: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
    announce(`${fieldName} 필드에 오류: ${error}`, 'assertive')
  }

  const clearFieldError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const getFieldProps = (fieldName: string) => ({
    'aria-invalid': !!errors[fieldName],
    'aria-describedby': errors[fieldName] ? `${fieldName}-error` : undefined
  })

  const getErrorProps = (fieldName: string) => ({
    id: `${fieldName}-error`,
    role: 'alert',
    'aria-live': 'polite' as const
  })

  return {
    errors,
    setFieldError,
    clearFieldError,
    getFieldProps,
    getErrorProps
  }
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Hook for high contrast preference
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setPrefersHighContrast(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersHighContrast
}