'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Calendar } from 'lucide-react'
import { formatKRW } from '@/lib/currency'

interface BudgetCategory {
  id: string
  name: string
  color: string | null
}

interface Budget {
  id: string
  budget_amount: number
  spent_amount: number
  category?: BudgetCategory
  category_name?: string
}

interface TransactionTag {
  id: string
  tag_name: string
  created_at: string
}

interface Transaction {
  id: string
  date: string
  amount: number
  type: 'income' | 'expense'
  description: string
  tags: TransactionTag[]
}

interface MonthlyInsightsProps {
  budgets: Budget[]
  transactions: Transaction[]
}

export function MonthlyInsights({ budgets, transactions }: MonthlyInsightsProps) {
  const insights = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const currentMonthTransactions = transactions.filter(t => 
      t.date.startsWith(currentMonth)
    )
    
    // Calculate spending insights
    const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0)
    const totalRemaining = totalBudget - totalSpent
    const averageDailySpent = totalSpent / new Date().getDate()
    
    // Days left in month
    const now = new Date()
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysLeftInMonth = lastDayOfMonth.getDate() - now.getDate()
    
    // Projected spending
    const projectedTotalSpent = totalSpent + (averageDailySpent * daysLeftInMonth)
    const projectedOverspend = Math.max(0, projectedTotalSpent - totalBudget)
    
    // Budget performance by category
    const overBudgetCategories = budgets.filter(b => b.spent_amount > b.budget_amount)
    const warningCategories = budgets.filter(b => 
      b.spent_amount > b.budget_amount * 0.8 && b.spent_amount <= b.budget_amount
    )
    const goodCategories = budgets.filter(b => b.spent_amount <= b.budget_amount * 0.8)
    
    // Top spending categories this month
    const categorySpending = new Map<string, number>()
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.tags?.[0]?.tag_name || '기타'
        categorySpending.set(category, (categorySpending.get(category) || 0) + t.amount)
      })
    
    const topSpendingCategories = Array.from(categorySpending.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
    
    // Savings rate calculation
    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const currentMonthExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    const savingsRate = currentMonthIncome > 0 ? 
      ((currentMonthIncome - currentMonthExpense) / currentMonthIncome * 100) : 0
    
    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      averageDailySpent,
      daysLeftInMonth,
      projectedTotalSpent,
      projectedOverspend,
      overBudgetCategories,
      warningCategories,
      goodCategories,
      topSpendingCategories,
      currentMonthIncome,
      currentMonthExpense,
      savingsRate
    }
  }, [budgets, transactions])

  const getSavingsRateColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600'
    if (rate >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSavingsRateBadge = (rate: number) => {
    if (rate >= 20) return { variant: 'default', text: '우수', color: 'bg-green-100 text-green-800' }
    if (rate >= 10) return { variant: 'secondary', text: '보통', color: 'bg-yellow-100 text-yellow-800' }
    return { variant: 'destructive', text: '개선 필요', color: 'bg-red-100 text-red-800' }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            예산 현황 요약
          </CardTitle>
          <CardDescription>이번 달 예산 사용 현황</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>예산 사용률</span>
              <span className="font-medium">
                {insights.totalBudget > 0 ? (insights.totalSpent / insights.totalBudget * 100).toFixed(1) : 0}%
              </span>
            </div>
            <Progress 
              value={insights.totalBudget > 0 ? Math.min(insights.totalSpent / insights.totalBudget * 100, 100) : 0}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatKRW(insights.totalSpent)} 사용</span>
              <span>{formatKRW(insights.totalBudget)} 예산</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{insights.goodCategories.length}</div>
              <div className="text-xs text-gray-500">안전</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{insights.warningCategories.length}</div>
              <div className="text-xs text-gray-500">주의</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{insights.overBudgetCategories.length}</div>
              <div className="text-xs text-gray-500">초과</div>
            </div>
          </div>

          {insights.projectedOverspend > 0 && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">예상 초과 지출</span>
              </div>
              <p className="text-red-600 text-sm mt-1">
                현재 패턴으로 이어지면 {formatKRW(insights.projectedOverspend)} 초과 예상
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            저축률 분석
          </CardTitle>
          <CardDescription>이번 달 수입 대비 저축 비율</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getSavingsRateColor(insights.savingsRate)}`}>
              {insights.savingsRate.toFixed(1)}%
            </div>
            <div className="mt-2">
              <Badge className={getSavingsRateBadge(insights.savingsRate).color}>
                {getSavingsRateBadge(insights.savingsRate).text}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span>수입:</span>
              <span className="font-medium text-green-600">{formatKRW(insights.currentMonthIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>지출:</span>
              <span className="font-medium text-red-600">{formatKRW(insights.currentMonthExpense)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span>저축:</span>
              <span className={insights.currentMonthIncome - insights.currentMonthExpense >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatKRW(insights.currentMonthIncome - insights.currentMonthExpense)}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-blue-700 text-sm font-medium">저축률 가이드</p>
            <ul className="text-blue-600 text-xs mt-1 space-y-1">
              <li>• 20% 이상: 우수한 저축률</li>
              <li>• 10-20%: 적절한 저축률</li>
              <li>• 10% 미만: 저축률 개선 필요</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Top Spending Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            이번 달 주요 지출
          </CardTitle>
          <CardDescription>지출이 많은 카테고리 TOP 5</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.topSpendingCategories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">지출 내역이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {insights.topSpendingCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatKRW(category.amount)}</div>
                    <div className="text-xs text-gray-500">
                      {insights.currentMonthExpense > 0 ? 
                        (category.amount / insights.currentMonthExpense * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            월말 예상
          </CardTitle>
          <CardDescription>현재 소비 패턴 기준 예측</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>일평균 지출:</span>
              <span className="font-medium">{formatKRW(insights.averageDailySpent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>남은 일수:</span>
              <span className="font-medium">{insights.daysLeftInMonth}일</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span>예상 총 지출:</span>
              <span className="font-medium">{formatKRW(insights.projectedTotalSpent)}</span>
            </div>
          </div>

          {insights.projectedTotalSpent > insights.totalBudget ? (
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">예산 초과 예상</span>
              </div>
              <p className="text-red-600 text-sm mt-1">
                {formatKRW(insights.projectedOverspend)} 초과될 것으로 예상됩니다
              </p>
            </div>
          ) : (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">예산 내 소비</span>
              </div>
              <p className="text-green-600 text-sm mt-1">
                {formatKRW(insights.totalBudget - insights.projectedTotalSpent)} 절약 가능
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}