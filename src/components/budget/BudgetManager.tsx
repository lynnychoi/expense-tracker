'use client'

import { useState } from 'react'
import { useBudget } from '@/contexts/BudgetContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  PiggyBank, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { formatKRW } from '@/lib/currency'
import { BudgetCategoryManager } from './BudgetCategoryManager'
import { BudgetOverview } from './BudgetOverview'
import { BudgetGoalsManager } from './BudgetGoalsManager'
import { MonthlyBudgetManager } from './MonthlyBudgetManager'

export function BudgetManager() {
  const { 
    budgets, 
    budgetGoals, 
    getCurrentMonthBudgets,
    loading 
  } = useBudget()

  const [activeTab, setActiveTab] = useState('overview')
  
  const currentMonthBudgets = getCurrentMonthBudgets()
  const activeGoals = budgetGoals.filter(goal => goal.is_active && !goal.is_completed)
  
  // Calculate current month budget summary
  const totalBudgetAmount = currentMonthBudgets.reduce((sum, budget) => sum + budget.budget_amount, 0)
  const totalSpentAmount = currentMonthBudgets.reduce((sum, budget) => sum + budget.spent_amount, 0)
  const remainingAmount = totalBudgetAmount - totalSpentAmount
  const spentPercentage = totalBudgetAmount > 0 ? (totalSpentAmount / totalBudgetAmount) * 100 : 0

  // Count overbudget categories
  const overBudgetCount = currentMonthBudgets.filter(budget => budget.spent_amount > budget.budget_amount).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">예산 데이터를 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">예산 관리</h1>
          <p className="text-gray-600 mt-1">
            가계 예산을 설정하고 지출을 관리하세요
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 예산</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatKRW(totalBudgetAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {currentMonthBudgets.length}개 카테고리
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 지출</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatKRW(totalSpentAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {spentPercentage.toFixed(1)}% 사용
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">잔여 예산</CardTitle>
            {remainingAmount >= 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatKRW(Math.abs(remainingAmount))}
            </div>
            <p className="text-xs text-muted-foreground">
              {remainingAmount >= 0 ? '여유 있음' : '초과됨'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 목표</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">
              진행 중인 목표
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status Alert */}
      {overBudgetCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  {overBudgetCount}개 카테고리에서 예산을 초과했습니다
                </p>
                <p className="text-sm text-red-600">
                  지출을 검토하고 예산을 조정해보세요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      {totalBudgetAmount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>이번 달 예산 사용률</span>
                <span>{spentPercentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={Math.min(spentPercentage, 100)} 
                className="h-3"
                color={spentPercentage > 100 ? 'red' : spentPercentage > 80 ? 'yellow' : 'green'}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatKRW(totalSpentAmount)} 사용</span>
                <span>{formatKRW(totalBudgetAmount)} 예산</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="budgets">월별 예산</TabsTrigger>
          <TabsTrigger value="categories">카테고리</TabsTrigger>
          <TabsTrigger value="goals">목표</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <BudgetOverview />
        </TabsContent>

        <TabsContent value="budgets" className="mt-6">
          <MonthlyBudgetManager />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <BudgetCategoryManager />
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <BudgetGoalsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}