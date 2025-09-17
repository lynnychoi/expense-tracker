'use client'

import { useState } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { useBudget } from '@/contexts/BudgetContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Calendar, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { generatePDFReport, generateExcelReport, downloadBlob, generateReportFilename, type ReportData, type ReportOptions } from '@/lib/reports'
import { formatKRW } from '@/lib/currency'

export function MonthlyReport() {
  const { transactions } = useTransactions()
  const { budgets } = useBudget()
  const { currentHousehold } = useHousehold()
  
  // Form state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  })
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!currentHousehold) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>월별 리포트</CardTitle>
          <CardDescription>특정 월의 상세한 재정 분석 리포트를 생성하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              월별 리포트를 생성하려면 먼저 가구를 선택하거나 생성하세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = []
    const now = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      const label = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
      options.push({ value, label })
    }
    
    return options
  }

  // Filter data for selected month
  const monthStart = new Date(selectedMonth + '-01')
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

  const monthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate >= monthStart && transactionDate <= monthEnd
  })

  const monthBudgets = budgets.filter(b => b.budget_month === selectedMonth)

  // Calculate monthly statistics
  const monthlyIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const monthlyExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBalance = monthlyIncome - monthlyExpense
  const totalBudget = monthBudgets.reduce((sum, b) => sum + b.budget_amount, 0)
  const totalSpent = monthBudgets.reduce((sum, b) => sum + b.spent_amount, 0)
  const budgetVariance = totalBudget - totalSpent

  // Previous month comparison
  const prevMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1)
  const prevMonthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0)
  const prevMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate >= prevMonth && transactionDate <= prevMonthEnd
  })

  const prevMonthIncome = prevMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const prevMonthExpense = prevMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const incomeChange = prevMonthIncome > 0 ? ((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0
  const expenseChange = prevMonthExpense > 0 ? ((monthlyExpense - prevMonthExpense) / prevMonthExpense) * 100 : 0

  const generateMonthlyReport = async () => {
    setLoading(true)
    setError('')

    try {
      const reportData: ReportData = {
        transactions: monthTransactions,
        budgets: monthBudgets,
        period: {
          start: monthStart,
          end: monthEnd
        },
        householdName: currentHousehold.name,
        generatedAt: new Date()
      }

      const options: ReportOptions = {
        includeCharts: true,
        includeTransactions: true,
        includeBudgets: true,
        includeAnalysis: true,
        format
      }

      let blob: Blob
      let extension: string

      if (format === 'pdf') {
        blob = await generatePDFReport(reportData, options)
        extension = 'pdf'
      } else {
        blob = generateExcelReport(reportData, options)
        extension = 'xlsx'
      }

      const filename = `${currentHousehold.name}_월별리포트_${selectedMonth}_${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.${extension}`
      downloadBlob(blob, filename)

    } catch (err: any) {
      console.error('Monthly report generation error:', err)
      setError(`월별 리포트 생성 중 오류가 발생했습니다: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            월별 리포트
          </CardTitle>
          <CardDescription>
            특정 월의 상세한 재정 분석과 예산 대비 실적을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Month and Format Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>분석할 월 선택</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>파일 형식</Label>
              <Select value={format} onValueChange={(value: 'pdf' | 'excel') => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF 문서</SelectItem>
                  <SelectItem value="excel">Excel 스프레드시트</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">월 수입</p>
                    <p className="text-lg font-semibold text-green-600">{formatKRW(monthlyIncome)}</p>
                    {incomeChange !== 0 && (
                      <p className={`text-xs flex items-center ${incomeChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {incomeChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {Math.abs(incomeChange).toFixed(1)}% (전월 대비)
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">월 지출</p>
                    <p className="text-lg font-semibold text-red-600">{formatKRW(monthlyExpense)}</p>
                    {expenseChange !== 0 && (
                      <p className={`text-xs flex items-center ${expenseChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {expenseChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {Math.abs(expenseChange).toFixed(1)}% (전월 대비)
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">순 잔액</p>
                    <p className={`text-lg font-semibold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatKRW(netBalance)}
                    </p>
                    <p className="text-xs text-gray-500">
                      저축률: {monthlyIncome > 0 ? ((netBalance / monthlyIncome) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">예산 현황</p>
                    <p className={`text-lg font-semibold ${budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatKRW(Math.abs(budgetVariance))} {budgetVariance >= 0 ? '절약' : '초과'}
                    </p>
                    <p className="text-xs text-gray-500">
                      사용률: {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Summary */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">리포트 포함 데이터</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">거래 건수:</span>
                <span className="ml-2 font-medium">{monthTransactions.length}건</span>
              </div>
              <div>
                <span className="text-gray-600">예산 항목:</span>
                <span className="ml-2 font-medium">{monthBudgets.length}개</span>
              </div>
              <div>
                <span className="text-gray-600">수입 건수:</span>
                <span className="ml-2 font-medium">
                  {monthTransactions.filter(t => t.type === 'income').length}건
                </span>
              </div>
              <div>
                <span className="text-gray-600">지출 건수:</span>
                <span className="ml-2 font-medium">
                  {monthTransactions.filter(t => t.type === 'expense').length}건
                </span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateMonthlyReport} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Wallet className="w-4 h-4 mr-2 animate-spin" />
                월별 리포트 생성 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {selectedMonth.replace('-', '년 ').replace(/^(\d{4})(\d{2})$/, '$1년 $2월')} 리포트 다운로드
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}