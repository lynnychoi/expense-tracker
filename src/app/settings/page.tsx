'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, Globe, Palette, Shield, Users, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const { currentHousehold, householdMembers } = useHousehold()
  const [notifications, setNotifications] = useState(true)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('ko')
  const [currency, setCurrency] = useState('KRW')

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">설정</h1>
          <p className="text-gray-600 mt-2">앱 환경설정 및 개인 정보를 관리하세요</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">일반</TabsTrigger>
            <TabsTrigger value="household">가구 관리</TabsTrigger>
            <TabsTrigger value="notifications">알림</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>일반 설정</CardTitle>
                <CardDescription>언어, 테마 및 통화 설정을 변경하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="theme" className="flex items-center">
                      <Palette className="w-4 h-4 mr-2" />
                      테마
                    </Label>
                    <p className="text-sm text-gray-500">앱 테마를 선택하세요</p>
                  </div>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">밝은 테마</SelectItem>
                      <SelectItem value="dark">어두운 테마</SelectItem>
                      <SelectItem value="system">시스템 설정</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="language" className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      언어
                    </Label>
                    <p className="text-sm text-gray-500">표시 언어를 선택하세요</p>
                  </div>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日본語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="currency">통화</Label>
                    <p className="text-sm text-gray-500">기본 통화를 선택하세요</p>
                  </div>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KRW">₩ 원화 (KRW)</SelectItem>
                      <SelectItem value="USD">$ 달러 (USD)</SelectItem>
                      <SelectItem value="EUR">€ 유로 (EUR)</SelectItem>
                      <SelectItem value="JPY">¥ 엔화 (JPY)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="household" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>가구 정보</CardTitle>
                <CardDescription>현재 가구 정보를 확인하고 관리하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentHousehold ? (
                  <>
                    <div>
                      <Label>가구명</Label>
                      <p className="text-lg font-medium mt-1">{currentHousehold.name}</p>
                    </div>
                    
                    <div>
                      <Label>가구 ID</Label>
                      <p className="text-sm text-gray-600 font-mono mt-1">{currentHousehold.id}</p>
                    </div>
                    
                    <div>
                      <Label className="flex items-center mb-2">
                        <Users className="w-4 h-4 mr-2" />
                        가구 구성원 ({householdMembers.length}명)
                      </Label>
                      <div className="space-y-2">
                        {householdMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{member.user?.name || member.user?.email || '알 수 없는 사용자'}</span>
                            <span className="text-xs text-gray-500">구성원</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      가구가 설정되지 않았습니다. 홈 화면에서 가구를 생성하세요.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>알림 환경설정을 관리하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications" className="flex items-center">
                      <Bell className="w-4 h-4 mr-2" />
                      푸시 알림
                    </Label>
                    <p className="text-sm text-gray-500">예산 초과 및 중요 업데이트 알림</p>
                  </div>
                  <Checkbox
                    id="notifications"
                    checked={notifications}
                    onCheckedChange={(checked) => setNotifications(!!checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">이메일 알림</Label>
                    <p className="text-sm text-gray-500">월별 리포트 및 요약 이메일</p>
                  </div>
                  <Checkbox id="email-notifications" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="budget-alerts">예산 경고</Label>
                    <p className="text-sm text-gray-500">예산의 80% 도달 시 알림</p>
                  </div>
                  <Checkbox id="budget-alerts" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>보안 설정</CardTitle>
                <CardDescription>계정 보안을 관리하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="flex items-center mb-2">
                    <Shield className="w-4 h-4 mr-2" />
                    계정 정보
                  </Label>
                  <p className="text-sm text-gray-600">이메일: {user?.email}</p>
                  <p className="text-sm text-gray-600">계정 ID: {user?.id}</p>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    비밀번호 변경
                  </Button>
                  <Button variant="outline" className="w-full">
                    2단계 인증 설정
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="destructive" className="w-full">
                    계정 삭제
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}