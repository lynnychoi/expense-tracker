import { useState, useCallback } from 'react'

interface UseLoadingReturn {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>
}

export function useLoading(initialState = false): UseLoadingReturn {
  const [isLoading, setIsLoading] = useState(initialState)

  const startLoading = useCallback(() => {
    setIsLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setIsLoading(true)
      const result = await asyncFn()
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  }
}

// Multiple loading states hook
interface UseMultipleLoadingReturn {
  loadingStates: Record<string, boolean>
  setLoading: (key: string, loading: boolean) => void
  isLoading: (key: string) => boolean
  isAnyLoading: boolean
  withLoading: <T>(key: string, asyncFn: () => Promise<T>) => Promise<T>
}

export function useMultipleLoading(): UseMultipleLoadingReturn {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }, [])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  const withLoading = useCallback(async <T>(key: string, asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setLoading(key, true)
      const result = await asyncFn()
      return result
    } finally {
      setLoading(key, false)
    }
  }, [setLoading])

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading
  }
}