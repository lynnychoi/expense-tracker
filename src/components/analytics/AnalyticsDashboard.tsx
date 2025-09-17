'use client'

import { useState } from 'react'
import { useTransactions, type Transaction } from '@/contexts/TransactionContext'
import { useBudget, type Budget } from '@/contexts/BudgetContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SpendingTrendsChart } from './SpendingTrendsChart'
import { CategoryBreakdownChart } from './CategoryBreakdownChart'
import { BudgetComparisonChart } from './BudgetComparisonChart'
import { MonthlyInsights } from './MonthlyInsights'
import { AIInsights } from '../ai/AIInsights'
import { BarChart3, PieChart, TrendingUp, Calendar, Target, Wallet, Brain } from 'lucide-react'
import { formatKRW } from '@/lib/currency'

export function AnalyticsDashboard() {
  const { transactions } = useTransactions()
  const { budgets, getCurrentMonthBudgets } = useBudget()
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [activeTab, setActiveTab] = useState('overview')

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthBudgets = getCurrentMonthBudgets()

  // Calculate basic statistics
  const totalTransactions = transactions.length
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const netBalance = totalIncome - totalExpense

  const totalBudgetAmount = currentMonthBudgets.reduce((sum, b) => sum + b.budget_amount, 0)
  const totalSpentAmount = currentMonthBudgets.reduce((sum, b) => sum + b.spent_amount, 0)
  const budgetUtilization = totalBudgetAmount > 0 ? (totalSpentAmount / totalBudgetAmount) * 100 : 0

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()
    
    switch (selectedPeriod) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '6months':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 6)
    }
    
    return { startDate, endDate: now }
  }

  const { startDate, endDate } = getDateRange()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">재정 분석</h1>
          <p className="text-gray-600 mt-1">
            가계 수입과 지출을 분석하고 트렌드를 파악하세요
          </p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">최근 1개월</SelectItem>
            <SelectItem value="3months">최근 3개월</SelectItem>
            <SelectItem value="6months">최근 6개월</SelectItem>
            <SelectItem value="1year">최근 1년</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 거래 수</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              전체 거래 기록
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수입</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatKRW(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">
              누적 수입 합계
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 지출</CardTitle>
            <Wallet className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatKRW(totalExpense)}</div>
            <p className="text-xs text-muted-foreground">
              누적 지출 합계
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예산 달성률</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{budgetUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              이번 달 예산 사용률
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="trends">트렌드</TabsTrigger>
          <TabsTrigger value="categories">카테고리</TabsTrigger>
          <TabsTrigger value="budget">예산 분석</TabsTrigger>
          <TabsTrigger value="ai">AI 인사이트</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>월별 수입/지출 트렌드</CardTitle>
                <CardDescription>
                  최근 {selectedPeriod === '1month' ? '1개월' : 
                         selectedPeriod === '3months' ? '3개월' :
                         selectedPeriod === '6months' ? '6개월' : '1년'}간 수입과 지출 변화
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SpendingTrendsChart 
                  transactions={transactions as any}
                  startDate={startDate}
                  endDate={endDate}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>지출 카테고리 분포</CardTitle>
                <CardDescription>
                  주요 지출 카테고리별 비중
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBreakdownChart 
                  transactions={transactions.filter(t => 
                    t.type === 'expense' &&
                    new Date(t.date) >= startDate &&
                    new Date(t.date) <= endDate
                  ) as any}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>상세 트렌드 분석</CardTitle>
              <CardDescription>
                시간에 따른 지출 패턴과 트렌드 분석
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SpendingTrendsChart 
                transactions={transactions as any}
                startDate={startDate}
                endDate={endDate}
                showDetailed={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>지출 카테고리 분포</CardTitle>
                <CardDescription>
                  카테고리별 지출 비중 (원형 차트)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBreakdownChart 
                  transactions={transactions.filter(t => 
                    t.type === 'expense' &&
                    new Date(t.date) >= startDate &&
                    new Date(t.date) <= endDate
                  ) as any}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>수입 카테고리 분포</CardTitle>
                <CardDescription>
                  카테고리별 수입 비중 (원형 차트)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBreakdownChart 
                  transactions={transactions.filter(t => 
                    t.type === 'income' &&
                    new Date(t.date) >= startDate &&
                    new Date(t.date) <= endDate
                  ) as any}
                  type="income"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>예산 대비 실제 지출</CardTitle>
                <CardDescription>
                  이번 달 카테고리별 예산과 실제 지출 비교
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetComparisonChart budgets={currentMonthBudgets as any} />
              </CardContent>
            </Card>

            <MonthlyInsights 
              budgets={currentMonthBudgets as any}
              transactions={transactions as any}
            />
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <AIInsights />
        </TabsContent>
      </Tabs>
    </div>
  )
}