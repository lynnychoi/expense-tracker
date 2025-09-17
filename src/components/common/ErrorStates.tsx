import { AlertCircle, RefreshCw, Wifi, WifiOff, AlertTriangle, FileX, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <WifiOff className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>네트워크 연결 오류</CardTitle>
          <CardDescription>
            인터넷 연결을 확인하고 다시 시도해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function NotFoundError({ 
  title = "데이터를 찾을 수 없습니다",
  description = "요청하신 데이터가 존재하지 않거나 삭제되었습니다.",
  onGoBack
}: {
  title?: string
  description?: string
  onGoBack?: () => void
}) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <FileX className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {onGoBack && (
          <CardContent>
            <Button onClick={onGoBack} variant="outline" className="w-full">
              돌아가기
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export function NoDataError({ 
  title = "데이터가 없습니다",
  description = "표시할 데이터가 없습니다.",
  actionLabel,
  onAction
}: {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

export function ServerError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>서버 오류</CardTitle>
          <CardDescription>
            서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function UnauthorizedError({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle>로그인이 필요합니다</CardTitle>
          <CardDescription>
            이 기능을 사용하려면 로그인이 필요합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onLogin} className="w-full">
            로그인하기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function PermissionError({ 
  title = "접근 권한이 없습니다",
  description = "이 작업을 수행할 권한이 없습니다.",
  onGoBack
}: {
  title?: string
  description?: string
  onGoBack?: () => void
}) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {onGoBack && (
          <CardContent>
            <Button onClick={onGoBack} variant="outline" className="w-full">
              돌아가기
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// Generic error state component
export function ErrorState({ 
  title, 
  description, 
  action, 
  className 
}: ErrorStateProps) {
  return (
    <div className={`min-h-[200px] flex items-center justify-center p-4 ${className}`}>
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        {title && <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>}
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}