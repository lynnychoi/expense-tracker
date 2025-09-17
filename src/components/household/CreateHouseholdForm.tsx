'use client'

import { useState } from 'react'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CreateHouseholdFormProps {
  onSuccess?: () => void
}

export function CreateHouseholdForm({ onSuccess }: CreateHouseholdFormProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { createHousehold } = useHousehold()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (name.trim().length < 2) {
      setError('가구 이름은 최소 2자 이상이어야 합니다')
      setLoading(false)
      return
    }

    const { data, error } = await createHousehold(name.trim())
    
    if (error) {
      setError(error)
    } else if (data) {
      setName('')
      onSuccess?.()
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>새 가구 만들기</CardTitle>
        <CardDescription>
          가구를 만들어 가족과 함께 가계부를 관리하세요
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
            <Label htmlFor="name">가구 이름</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 김가네 가계부"
              required
              disabled={loading}
              maxLength={50}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? '만드는 중...' : '가구 만들기'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}