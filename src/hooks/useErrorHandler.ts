import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface ErrorDetails {
  message: string
  code?: string
  status?: number
  details?: any
}

interface UseErrorHandlerReturn {
  error: ErrorDetails | null
  isError: boolean
  setError: (error: ErrorDetails | null) => void
  clearError: () => void
  handleError: (error: any) => void
  withErrorHandling: <T>(asyncFn: () => Promise<T>) => Promise<T | undefined>
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorDetails | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((error: any) => {
    console.error('Error caught by error handler:', error)

    let errorDetails: ErrorDetails

    if (error?.response) {
      // API response error
      const { status, data } = error.response
      errorDetails = {
        message: data?.message || getErrorMessageByStatus(status),
        code: data?.code,
        status,
        details: data
      }
    } else if (error?.message) {
      // JavaScript error or custom error
      errorDetails = {
        message: error.message,
        code: error.code,
        details: error
      }
    } else if (typeof error === 'string') {
      // String error
      errorDetails = {
        message: error
      }
    } else {
      // Unknown error
      errorDetails = {
        message: '알 수 없는 오류가 발생했습니다.'
      }
    }

    setError(errorDetails)

    // Show toast notification for user-friendly errors
    if (shouldShowToast(errorDetails)) {
      toast.error(errorDetails.message)
    }
  }, [])

  const withErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | undefined> => {
    try {
      clearError()
      const result = await asyncFn()
      return result
    } catch (error) {
      handleError(error)
      return undefined
    }
  }, [handleError, clearError])

  return {
    error,
    isError: error !== null,
    setError,
    clearError,
    handleError,
    withErrorHandling
  }
}

// Helper function to get user-friendly error messages by HTTP status
function getErrorMessageByStatus(status: number): string {
  switch (status) {
    case 400:
      return '잘못된 요청입니다. 입력 정보를 확인해 주세요.'
    case 401:
      return '로그인이 필요합니다.'
    case 403:
      return '접근 권한이 없습니다.'
    case 404:
      return '요청하신 데이터를 찾을 수 없습니다.'
    case 409:
      return '데이터 충돌이 발생했습니다.'
    case 422:
      return '입력 데이터를 확인해 주세요.'
    case 429:
      return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
    case 500:
      return '서버에 오류가 발생했습니다.'
    case 502:
      return '서버에 일시적인 문제가 발생했습니다.'
    case 503:
      return '서비스를 일시적으로 사용할 수 없습니다.'
    default:
      return '네트워크 오류가 발생했습니다.'
  }
}

// Helper function to determine if we should show a toast notification
function shouldShowToast(errorDetails: ErrorDetails): boolean {
  // Don't show toast for validation errors (they're usually handled in forms)
  if (errorDetails.status === 422) {
    return false
  }
  
  // Don't show toast for authentication errors (they're usually handled by auth flow)
  if (errorDetails.status === 401) {
    return false
  }
  
  return true
}

// Global error types for better error categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export function getErrorType(error: ErrorDetails): ErrorType {
  if (!error.status) {
    return ErrorType.UNKNOWN
  }

  if (error.status >= 500) {
    return ErrorType.SERVER
  }

  switch (error.status) {
    case 400:
    case 422:
      return ErrorType.VALIDATION
    case 401:
      return ErrorType.AUTHENTICATION
    case 403:
      return ErrorType.AUTHORIZATION
    case 404:
      return ErrorType.NOT_FOUND
    default:
      return ErrorType.UNKNOWN
  }
}

// Hook for handling specific error types
export function useTypedErrorHandler() {
  const { error, handleError, clearError, ...rest } = useErrorHandler()

  const handleTypedError = useCallback((error: any, type?: ErrorType) => {
    const errorDetails = typeof error === 'string' ? { message: error } : error
    
    if (type) {
      errorDetails.type = type
    }
    
    handleError(errorDetails)
  }, [handleError])

  const errorType = error ? getErrorType(error) : null

  return {
    error,
    errorType,
    handleError: handleTypedError,
    clearError,
    ...rest
  }
}