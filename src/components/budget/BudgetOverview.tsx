'use client'

import { useBudget } from '@/contexts/BudgetContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Plus } from 'lucide-react'
import { formatKRW } from '@/lib/currency'

export function BudgetOverview() {
  const { getCurrentMonthBudgets, budgetGoals } = useBudget()
  
  const currentMonthBudgets = getCurrentMonthBudgets()
  const activeGoals = budgetGoals.filter(goal => goal.is_active && !goal.is_completed)

  const getBudgetStatus = (budget: any) => {
    const percentage = budget.budget_amount > 0 ? (budget.spent_amount / budget.budget_amount) * 100 : 0
    if (percentage > 100) return 'over'
    if (percentage > 80) return 'warning'
    return 'good'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-green-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over': return <AlertTriangle className="h-4 w-4" />
      case 'warning': return <TrendingUp className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Monthly Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle>이번 달 예산 현황</CardTitle>
          <CardDescription>
            카테고리별 예산 사용 현황을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentMonthBudgets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">설정된 예산이 없습니다</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                첫 예산 설정하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentMonthBudgets.map((budget) => {
                const status = getBudgetStatus(budget)
                const percentage = budget.budget_amount > 0 ? (budget.spent_amount / budget.budget_amount) * 100 : 0
                const categoryName = budget.category?.name || budget.category_name || '알 수 없음'
                
                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{categoryName}</span>
                        <div className={getStatusColor(status)}>
                          {getStatusIcon(status)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatKRW(budget.spent_amount)} / {formatKRW(budget.budget_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {percentage.toFixed(1)}% 사용
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className="h-2"
                    />
                    {budget.notes && (
                      <p className="text-xs text-gray-500">{budget.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Goals */}
      <Card>
        <CardHeader>
          <CardTitle>진행 중인 목표</CardTitle>
          <CardDescription>
            설정한 재정 목표의 달성 현황입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeGoals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">설정된 목표가 없습니다</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                첫 목표 설정하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeGoals.slice(0, 3).map((goal) => {
                const percentage = (goal.current_amount / goal.target_amount) * 100
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{goal.name}</span>
                        <Badge variant="outline">
                          {goal.goal_type === 'savings' ? '저축' : 
                           goal.goal_type === 'debt_payoff' ? '부채 상환' :
                           goal.goal_type === 'purchase' ? '구매' :
                           goal.goal_type === 'emergency_fund' ? '비상 자금' : '기타'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatKRW(goal.current_amount)} / {formatKRW(goal.target_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {percentage.toFixed(1)}% 달성
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className="h-2"
                    />
                    {goal.target_date && (
                      <p className="text-xs text-gray-500">
                        목표일: {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )
              })}
              {activeGoals.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  +{activeGoals.length - 3}개의 추가 목표가 있습니다
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}