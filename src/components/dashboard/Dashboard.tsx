'use client'

import { useHousehold } from '@/contexts/HouseholdContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { formatKRW } from '@/lib/currency'
import { getTagColor, getNextAvailableColor } from '@/lib/colors'

export function Dashboard() {
  const { currentHousehold, householdMembers } = useHousehold()
  const { transactions, loadTransactions } = useTransactions()

  // Calculate monthly stats
  const currentMonth = new Date()
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  const monthlyTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    return transactionDate >= startOfMonth && transactionDate <= endOfMonth
  })

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = monthlyIncome - monthlyExpense

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5)

  if (!currentHousehold) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            가구를 선택하거나 생성하세요
          </h3>
          <p className="text-gray-500">
            가계부를 시작하려면 먼저 가구를 설정해야 합니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {currentHousehold.name} 가계부에 오신 것을 환영합니다!
        </h2>
        <p className="opacity-90">
          구성원 {householdMembers.length}명과 함께 가계를 관리하세요
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 수입</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatKRW(monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyIncome === 0 ? '아직 수입이 없습니다' : '이번 달 총 수입'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 지출</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatKRW(monthlyExpense)}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyExpense === 0 ? '아직 지출이 없습니다' : '이번 달 총 지출'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">잔액</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatKRW(balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              수입 - 지출
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예산 달성률</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">0%</div>
            <p className="text-xs text-muted-foreground">
              예산을 설정하세요
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>시작하기</CardTitle>
          <CardDescription>
            가계부 사용을 시작하기 위한 단계들입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">1. 첫 거래 추가하기</h4>
              <p className="text-sm text-gray-600 mb-3">
                수입이나 지출을 추가하여 가계부를 시작하세요
              </p>
              <AddTransactionModal onTransactionAdded={loadTransactions}>
                <Button size="sm">
                  거래 추가
                </Button>
              </AddTransactionModal>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">2. 예산 목표 설정하기</h4>
              <p className="text-sm text-gray-600 mb-3">
                카테고리별 월간 예산을 설정하세요
              </p>
              <Button size="sm" disabled>
                예산 설정 (곧 제공)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>
            가구의 최근 거래 내역입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 거래 내역이 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'income' ? '수입' : '지출'}
                      </span>
                      <span className="text-sm text-gray-500">{transaction.date}</span>
                    </div>
                    <p className="font-medium mt-1">{transaction.description}</p>
                    <div className="flex gap-2 mt-1">
                      {transaction.tags.map((tag, index) => {
                        const color = getNextAvailableColor([])
                        return (
                          <span 
                            key={tag.id} 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs border"
                            style={{
                              backgroundColor: color.bg,
                              color: color.text,
                              borderColor: color.hex
                            }}
                          >
                            {tag.tag_name}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatKRW(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}