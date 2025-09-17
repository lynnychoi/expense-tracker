'use client'

import { useState, useEffect } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { useBudget } from '@/contexts/BudgetContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { 
  analyzeSpendingPatterns, 
  recommendBudget, 
  generateFinancialAdvice,
  SpendingPattern,
  BudgetRecommendation,
  FinancialAdvice
} from '@/lib/ai'
import { formatKRW } from '@/lib/currency'

export function AIInsights() {
  const { transactions } = useTransactions()
  const { budgets, getCurrentMonthBudgets } = useBudget()
  
  const [spendingPatterns, setSpendingPatterns] = useState<SpendingPattern[]>([])
  const [budgetRecommendations, setBudgetRecommendations] = useState<BudgetRecommendation[]>([])
  const [financialAdvice, setFinancialAdvice] = useState<FinancialAdvice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentMonthBudgets = getCurrentMonthBudgets()
  
  // 저축률 계산
  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthTransactions = transactions.filter(t => 
    t.date.startsWith(currentMonth)
  )
  
  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const currentMonthExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const savingsRate = currentMonthIncome > 0 ? 
    ((currentMonthIncome - currentMonthExpense) / currentMonthIncome * 100) : 0

  const generateInsights = async () => {
    if (transactions.length === 0) {
      setError('거래 내역이 없어 AI 분석을 할 수 없습니다.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 병렬로 AI 분석 실행
      const [patterns, recommendations, advice] = await Promise.all([
        analyzeSpendingPatterns(transactions),
        recommendBudget(transactions, currentMonthBudgets),
        generateFinancialAdvice(transactions, currentMonthBudgets, savingsRate)
      ])

      setSpendingPatterns(patterns)
      setBudgetRecommendations(recommendations)
      setFinancialAdvice(advice)
    } catch (err) {
      console.error('AI 분석 오류:', err)
      setError('AI 분석 중 오류가 발생했습니다. OpenAI API 키를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (transactions.length > 0) {
      generateInsights()
    }
  }, [transactions.length, currentMonthBudgets.length])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowUp className="h-4 w-4 text-red-500" />
      case 'decreasing':
        return <ArrowDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'increasing': return '증가'
      case 'decreasing': return '감소'
      default: return '안정'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'saving': return <Target className="h-4 w-4" />
      case 'budgeting': return <TrendingUp className="h-4 w-4" />
      case 'spending': return <AlertTriangle className="h-4 w-4" />
      case 'investment': return <CheckCircle className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  if (transactions.length === 0) {
    return (
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          거래 내역을 추가하면 AI가 지출 패턴을 분석하고 맞춤형 조언을 제공합니다.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            AI 재정 인사이트
          </h2>
          <p className="text-gray-600 mt-1">
            인공지능이 분석한 맞춤형 재정 조언
          </p>
        </div>
        <Button
          onClick={generateInsights}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '분석 중...' : '새로고침'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 지출 패턴 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            지출 패턴 분석
          </CardTitle>
          <CardDescription>
            AI가 분석한 카테고리별 지출 트렌드
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2">패턴 분석 중...</span>
            </div>
          ) : spendingPatterns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spendingPatterns.map((pattern, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{pattern.category}</h4>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(pattern.trend)}
                      <span className="text-sm text-gray-600">
                        {getTrendLabel(pattern.trend)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>평균 지출: {formatKRW(pattern.amount)}</p>
                    <p>월간 빈도: {pattern.frequency}회</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              분석할 데이터가 부족합니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 예산 추천 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI 예산 추천
          </CardTitle>
          <CardDescription>
            지출 패턴을 기반으로 한 맞춤형 예산 제안
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2">예산 분석 중...</span>
            </div>
          ) : budgetRecommendations.length > 0 ? (
            <div className="space-y-4">
              {budgetRecommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{rec.category}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority === 'high' ? '높음' : 
                         rec.priority === 'medium' ? '보통' : '낮음'}
                      </Badge>
                      <span className="font-bold text-blue-600">
                        {formatKRW(rec.recommendedAmount)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              예산 추천을 생성할 수 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 재정 조언 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            맞춤형 재정 조언
          </CardTitle>
          <CardDescription>
            AI가 제안하는 실용적인 재정 관리 팁
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2">조언 생성 중...</span>
            </div>
          ) : financialAdvice.length > 0 ? (
            <div className="space-y-6">
              {financialAdvice.map((advice, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      {getCategoryIcon(advice.category)}
                      {advice.title}
                    </h4>
                    <Badge className={getImpactColor(advice.impact)}>
                      {advice.impact === 'high' ? '높은 효과' : 
                       advice.impact === 'medium' ? '보통 효과' : '낮은 효과'}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-3">{advice.description}</p>
                  <div>
                    <h5 className="font-medium mb-2">실행 방법:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {advice.actionItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              재정 조언을 생성할 수 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}