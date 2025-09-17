'use client'

import { useState } from 'react'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface JoinHouseholdFormProps {
  onSuccess?: () => void
}

export function JoinHouseholdForm({ onSuccess }: JoinHouseholdFormProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { joinHousehold } = useHousehold()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (inviteCode.trim().length < 6) {
      setError('초대 코드를 정확히 입력하세요')
      setLoading(false)
      return
    }

    const { error } = await joinHousehold(inviteCode.trim())
    
    if (error) {
      setError(error)
    } else {
      setInviteCode('')
      onSuccess?.()
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>가구 참여하기</CardTitle>
        <CardDescription>
          초대 코드를 입력하여 기존 가구에 참여하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="inviteCode">초대 코드</Label>
            <Input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toLowerCase())}
              placeholder="초대 코드를 입력하세요"
              required
              disabled={loading}
              maxLength={10}
            />
            <p className="text-sm text-gray-500">
              가구 생성자로부터 받은 7자리 초대 코드를 입력하세요
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading || !inviteCode.trim()}>
            {loading ? '참여 중...' : '가구 참여하기'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}