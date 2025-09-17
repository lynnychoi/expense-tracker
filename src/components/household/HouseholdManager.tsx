'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Copy, UserMinus, Users, Settings, CreditCard } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { PaymentMethodManager } from '@/components/payment/PaymentMethodManager'

export function HouseholdManager() {
  const { user } = useAuth()
  const { currentHousehold, householdMembers, removeMember } = useHousehold()
  const [copiedCode, setCopiedCode] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'members' | 'payment-methods'>('members')

  const isCreator = currentHousehold?.created_by === user?.id

  const copyInviteCode = async () => {
    if (!currentHousehold?.invite_code) return
    
    try {
      await navigator.clipboard.writeText(currentHousehold.invite_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      console.error('Failed to copy invite code:', error)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!currentHousehold) return
    
    setRemovingMember(userId)
    const { error } = await removeMember(currentHousehold.id, userId)
    
    if (error) {
      alert(`구성원 제거 실패: ${error}`)
    }
    
    setRemovingMember(null)
  }

  if (!currentHousehold) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">가구를 먼저 선택하세요</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('members')}
        >
          <Users className="w-4 h-4" />
          구성원 관리
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'payment-methods'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('payment-methods')}
        >
          <CreditCard className="w-4 h-4" />
          결제 방법 관리
        </button>
      </div>

      {activeTab === 'members' && (
        <>
          {/* Household Info */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            가구 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">가구 이름</p>
            <p className="text-lg">{currentHousehold.name}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium">생성일</p>
            <p className="text-sm text-gray-600">
              {formatDistanceToNow(new Date(currentHousehold.created_at), {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>

          {isCreator && (
            <div>
              <p className="text-sm font-medium mb-2">초대 코드</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                  {currentHousehold.invite_code}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyInviteCode}
                  disabled={copiedCode}
                >
                  <Copy className="h-4 w-4" />
                  {copiedCode ? '복사됨!' : '복사'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                이 코드를 공유하여 가족을 초대하세요
              </p>
            </div>
          )}
        </CardContent>
      </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                구성원 ({householdMembers.length}/7)
              </CardTitle>
              <CardDescription>
                가구 구성원들을 관리할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
            {householdMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.user?.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.user?.name}</p>
                    <p className="text-sm text-gray-600">{member.user?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {member.user_id === currentHousehold.created_by && (
                    <Badge variant="outline">생성자</Badge>
                  )}
                  
                  {member.user_id === user?.id && (
                    <Badge variant="secondary">나</Badge>
                  )}
                  
                  {isCreator && member.user_id !== user?.id && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          disabled={removingMember === member.user_id}
                        >
                          <UserMinus className="h-4 w-4" />
                          {removingMember === member.user_id ? '제거 중...' : '제거'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>구성원 제거</DialogTitle>
                          <DialogDescription>
                            {member.user?.name}님을 가구에서 제거하시겠습니까?
                            제거된 구성원은 더 이상 가구 데이터에 접근할 수 없습니다.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2 mt-4">
                          <DialogTrigger asChild>
                            <Button variant="outline">취소</Button>
                          </DialogTrigger>
                          <Button
                            variant="destructive"
                            onClick={() => handleRemoveMember(member.user_id)}
                            disabled={removingMember === member.user_id}
                          >
                            제거하기
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>

          {householdMembers.length >= 7 && (
            <Alert className="mt-4">
              <AlertDescription>
                가구 구성원 수가 최대치에 도달했습니다 (7명)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      </>
      )}

      {activeTab === 'payment-methods' && (
        <PaymentMethodManager />
      )}
    </div>
  )
}