'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react'

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error)
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full border-0 shadow-2xl backdrop-blur-sm bg-card/95">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">로그인</CardTitle>
        <CardDescription className="text-base">
          계정에 로그인하여 가계부를 시작하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
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
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
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
                로그인 중...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                로그인
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
              계정이 없으신가요? <span className="text-primary font-medium ml-1">회원가입</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}