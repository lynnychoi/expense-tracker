'use client'

import { useState, useEffect } from 'react'
import { usePWAInstall, useServiceWorker, useOfflineStatus } from '@/hooks/usePWA'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Smartphone, X, Wifi, WifiOff, RefreshCw } from 'lucide-react'

export function PWAInstallPrompt() {
  const { isInstallable, isStandalone, promptInstall, dismissInstall } = usePWAInstall()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Show install prompt after a delay if app is installable
    if (isInstallable && !isStandalone && !isDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Show after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isStandalone, isDismissed])

  const handleInstall = async () => {
    await promptInstall()
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setIsDismissed(true)
    dismissInstall()
    
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setIsDismissed(true)
    }
  }, [])

  if (!showPrompt || !isInstallable || isStandalone || isDismissed) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg animate-slide-in-from-right">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">앱 설치</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          홈 화면에 가계부를 추가하고 더 빠르게 접근하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button onClick={handleInstall} size="sm" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            설치하기
          </Button>
          <Button onClick={handleDismiss} variant="outline" size="sm">
            나중에
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function PWAUpdatePrompt() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (updateAvailable) {
      setShowPrompt(true)
    }
  }, [updateAvailable])

  const handleUpdate = () => {
    updateServiceWorker()
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) {
    return null
  }

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 shadow-lg animate-slide-in-from-right">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-green-600" />
            <CardTitle className="text-base">업데이트 가능</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          새로운 버전이 준비되었습니다. 지금 업데이트하시겠습니까?
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button onClick={handleUpdate} size="sm" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            업데이트
          </Button>
          <Button onClick={handleDismiss} variant="outline" size="sm">
            나중에
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function OfflineStatus() {
  const isOnline = useOfflineStatus()
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true)
    } else {
      // Hide offline alert when coming back online
      if (showOfflineAlert) {
        setTimeout(() => setShowOfflineAlert(false), 3000)
      }
    }
  }, [isOnline, showOfflineAlert])

  if (!showOfflineAlert) {
    return null
  }

  return (
    <Alert 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 w-80 z-50 shadow-lg animate-slide-in-from-left ${
        isOnline ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-orange-600" />
        )}
        <AlertDescription className={isOnline ? 'text-green-700' : 'text-orange-700'}>
          {isOnline 
            ? '인터넷 연결이 복구되었습니다' 
            : '오프라인 모드입니다. 일부 기능이 제한될 수 있습니다'
          }
        </AlertDescription>
      </div>
    </Alert>
  )
}

export function PWAFeatures() {
  return (
    <div className="space-y-4">
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <OfflineStatus />
    </div>
  )
}