'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-600">오류가 발생했습니다</CardTitle>
          <CardDescription>
            예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {error && process.env.NODE_ENV === 'development' && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                개발자 정보 (클릭하여 펼치기)
              </summary>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {error.message}
                {'\n'}
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button onClick={resetError} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
            <Button onClick={() => window.location.reload()}>
              페이지 새로고침
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific error fallbacks for different scenarios
export function APIErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          데이터 로딩 실패
        </CardTitle>
        <CardDescription>
          서버에서 데이터를 가져오는 중 오류가 발생했습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button onClick={resetError} size="sm" variant="outline">
            다시 시도
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ChartErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="h-64 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">차트를 표시할 수 없습니다</p>
        <Button onClick={resetError} size="sm" variant="ghost" className="mt-2">
          다시 시도
        </Button>
      </div>
    </div>
  )
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}