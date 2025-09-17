import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  )
}

interface PageLoadingProps {
  text?: string
}

export function PageLoading({ text = '로딩 중...' }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{text}</p>
      </div>
    </div>
  )
}

interface InlineLoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
}

export function InlineLoading({ text = '처리 중...', size = 'sm' }: InlineLoadingProps) {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size={size} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}