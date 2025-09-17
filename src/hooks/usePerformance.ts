import { useCallback, useEffect, useRef, useState } from 'react'

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef<number>(Date.now())
  const mountTime = useRef<number | null>(null)

  useEffect(() => {
    // Record mount time
    mountTime.current = Date.now()
    const mountDuration = mountTime.current - renderStartTime.current
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} mounted in ${mountDuration}ms`)
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        const unmountTime = Date.now()
        const totalLifetime = mountTime.current ? unmountTime - mountTime.current : 0
        console.log(`[Performance] ${componentName} unmounted after ${totalLifetime}ms`)
      }
    }
  }, [componentName])

  // Reset render start time on each render
  renderStartTime.current = Date.now()
}

// Hook for debouncing values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook for throttling function calls
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useRef<T>()
  const lastCall = useRef<number>(0)

  throttledCallback.current = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall.current >= delay) {
        lastCall.current = now
        return callback(...args)
      }
    },
    [callback, delay]
  ) as T

  return throttledCallback.current
}

// Hook for measuring API call performance
export function useApiPerformance() {
  const measureApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const duration = performance.now() - startTime
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Performance] ${operationName} completed in ${duration.toFixed(2)}ms`)
      }
      
      // Log slow API calls in production
      if (duration > 2000) {
        console.warn(`[Slow API] ${operationName} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`[API Error] ${operationName} failed after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }, [])

  return { measureApiCall }
}

// Hook for intersection observer (for lazy loading)
export function useIntersectionObserver(
  targetRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
  freezeOnceVisible = false
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting
        setIsIntersecting(isVisible)
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true)
        }
        
        if (freezeOnceVisible && hasIntersected) {
          observer.unobserve(target)
        }
      },
      options
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [targetRef, options, freezeOnceVisible, hasIntersected])

  return { isIntersecting, hasIntersected }
}

// Hook for virtual scrolling performance
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleStartIndex = Math.floor(scrollTop / itemHeight)
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length - 1
  )
  
  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex + 1)
  
  const totalHeight = items.length * itemHeight
  const offsetY = visibleStartIndex * itemHeight
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleStartIndex,
    visibleEndIndex
  }
}

// Hook for memory usage monitoring
export function useMemoryMonitoring(intervalMs = 10000) {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)

  useEffect(() => {
    if (!('memory' in performance)) {
      return
    }

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      })
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs])

  return memoryInfo
}

