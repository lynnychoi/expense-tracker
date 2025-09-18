'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Lock, User, UserPlus, Loader2, CheckCircle } from 'lucide-react'

interface SignupFormProps {
  onToggleMode: () => void
}

export function SignupForm({ onToggleMode }: SignupFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password, name)
    
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      // Don't set success state - let AuthContext handle the redirect
      // The user should be automatically logged in and redirected
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full border-0 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">회원가입 완료</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Alert className="animate-fade-in border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              회원가입이 완료되었습니다. 이메일을 확인하여 계정을 인증하세요.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full mt-6 h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
            onClick={onToggleMode}
          >
            로그인하기
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-0 shadow-2xl backdrop-blur-sm bg-card/95">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
        <CardDescription className="text-base">
          새 계정을 만들어 가계부를 시작하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">이름</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="pl-10 h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="pl-10 h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="pl-10 h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">비밀번호 확인</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="pl-10 h-11"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                회원가입 중...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                회원가입
              </>
            )}
          </Button>
          
          <div className="text-center pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onToggleMode}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              이미 계정이 있으신가요? <span className="text-primary font-medium ml-1">로그인</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}