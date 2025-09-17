'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { User, LogOut } from 'lucide-react'

export function ProfileManager() {
  const { user, userProfile, updateProfile, signOut } = useAuth()
  const [name, setName] = useState(userProfile?.name || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (name.trim().length < 2) {
      setError('이름은 최소 2자 이상이어야 합니다')
      setLoading(false)
      return
    }

    const { error } = await updateProfile({ name: name.trim() })
    
    if (error) {
      setError(error)
    } else {
      setSuccess('프로필이 업데이트되었습니다')
      setTimeout(() => setSuccess(''), 3000)
    }
    
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    setShowLogoutDialog(false)
  }

  if (!user || !userProfile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">프로필 정보를 불러오는 중...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            프로필 정보
          </CardTitle>
          <CardDescription>
            개인 정보를 관리할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                이메일은 변경할 수 없습니다
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                maxLength={50}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || name.trim() === userProfile.name}
            >
              {loading ? '업데이트 중...' : '프로필 업데이트'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>계정 관리</CardTitle>
          <CardDescription>
            계정 관련 작업을 수행할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>로그아웃</DialogTitle>
                <DialogDescription>
                  정말 로그아웃하시겠습니까?
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
                  취소
                </Button>
                <Button variant="destructive" onClick={handleSignOut}>
                  로그아웃
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}