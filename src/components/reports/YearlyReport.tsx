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
import { Download, Calendar, TrendingUp, TrendingDown, Target, PiggyBank } from 'lucide-react'
import { generatePDFReport, generateExcelReport, downloadBlob, type ReportData, type ReportOptions } from '@/lib/reports'
import { formatKRW } from '@/lib/currency'

export function YearlyReport() {
  const { transactions } = useTransactions()
  const { budgets } = useBudget()
  const { currentHousehold } = useHousehold()
  
  // Form state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!currentHousehold) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>연간 리포트</CardTitle>
          <CardDescription>연간 재정 성과와 트렌드를 종합 분석하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              연간 리포트를 생성하려면 먼저 가구를 선택하거나 생성하세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Generate year options (current year and last 3 years)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const options = []
    
    for (let i = 0; i < 4; i++) {
      const year = currentYear - i
      options.push({ value: year.toString(), label: `${year}년` })
    }
    
    return options
  }

  // Filter data for selected year
  const yearStart = new Date(parseInt(selectedYear), 0, 1)
  const yearEnd = new Date(parseInt(selectedYear), 11, 31)

  const yearTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate >= yearStart && transactionDate <= yearEnd
  })

  const yearBudgets = budgets.filter(b => {
    const budgetYear = new Date(b.budget_month + '-01').getFullYear()
    return budgetYear === parseInt(selectedYear)
  })

  // Calculate yearly statistics
  const yearlyIncome = yearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const yearlyExpense = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netSavings = yearlyIncome - yearlyExpense
  const savingsRate = yearlyIncome > 0 ? (netSavings / yearlyIncome) * 100 : 0

  const totalBudgeted = yearBudgets.reduce((sum, b) => sum + b.budget_amount, 0)
  const totalSpent = yearBudgets.reduce((sum, b) => sum + b.spent_amount, 0)
  const budgetEfficiency = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  // Monthly breakdown
  const monthlyData = []
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(parseInt(selectedYear), month, 1)
    const monthEnd = new Date(parseInt(selectedYear), month + 1, 0)
    
    const monthTransactions = yearTransactions.filter(t => {
      const date = new Date(t.date)
      return date >= monthStart && date <= monthEnd
    })

    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const monthExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    monthlyData.push({
      month: month + 1,
      monthName: monthStart.toLocaleDateString('ko-KR', { month: 'long' }),
      income: monthIncome,
      expense: monthExpense,
      net: monthIncome - monthExpense,
      transactionCount: monthTransactions.length
    })
  }

  // Find best and worst months
  const bestMonth = monthlyData.reduce((best, current) => 
    current.net > best.net ? current : best
  )
  const worstMonth = monthlyData.reduce((worst, current) => 
    current.net < worst.net ? current : worst
  )

  // Previous year comparison
  const prevYear = parseInt(selectedYear) - 1
  const prevYearTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate.getFullYear() === prevYear
  })

  const prevYearIncome = prevYearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const prevYearExpense = prevYearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const incomeGrowth = prevYearIncome > 0 ? ((yearlyIncome - prevYearIncome) / prevYearIncome) * 100 : 0
  const expenseGrowth = prevYearExpense > 0 ? ((yearlyExpense - prevYearExpense) / prevYearExpense) * 100 : 0

  const generateYearlyReport = async () => {
    setLoading(true)
    setError('')

    try {
      const reportData: ReportData = {
        transactions: yearTransactions,
        budgets: yearBudgets,
        period: {
          start: yearStart,
          end: yearEnd
        },
        householdName: currentHousehold.name,
        generatedAt: new Date()
      }

      const options: ReportOptions = {
        includeCharts: true,
        includeTransactions: false, // Too many transactions for yearly report
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

      const filename = `${currentHousehold.name}_연간리포트_${selectedYear}_${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.${extension}`
      downloadBlob(blob, filename)

    } catch (err: any) {
      console.error('Yearly report generation error:', err)
      setError(`연간 리포트 생성 중 오류가 발생했습니다: ${err.message}`)
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
            연간 리포트
          </CardTitle>
          <CardDescription>
            연간 재정 성과와 트렌드를 종합적으로 분석하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Year and Format Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>분석할 연도 선택</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getYearOptions().map(option => (
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

          {/* Yearly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">연간 총수입</p>
                    <p className="text-lg font-semibold text-green-600">{formatKRW(yearlyIncome)}</p>
                    {incomeGrowth !== 0 && (
                      <p className={`text-xs flex items-center ${incomeGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {incomeGrowth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {Math.abs(incomeGrowth).toFixed(1)}% (전년 대비)
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
                    <p className="text-sm text-gray-600">연간 총지출</p>
                    <p className="text-lg font-semibold text-red-600">{formatKRW(yearlyExpense)}</p>
                    {expenseGrowth !== 0 && (
                      <p className={`text-xs flex items-center ${expenseGrowth > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {expenseGrowth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {Math.abs(expenseGrowth).toFixed(1)}% (전년 대비)
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
                    <p className="text-sm text-gray-600">연간 순저축</p>
                    <p className={`text-lg font-semibold ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatKRW(netSavings)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <PiggyBank className="w-3 h-3 mr-1" />
                      저축률: {savingsRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">예산 효율성</p>
                    <p className={`text-lg font-semibold ${budgetEfficiency <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {budgetEfficiency.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      {budgetEfficiency <= 100 ? '예산 내' : '예산 초과'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Best and Worst Months */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-green-600 mb-2">최고의 달</h4>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{bestMonth.monthName}</p>
                  <p className="text-sm text-gray-600">순수익: {formatKRW(bestMonth.net)}</p>
                  <p className="text-xs text-gray-500">거래 {bestMonth.transactionCount}건</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-red-600 mb-2">개선이 필요한 달</h4>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{worstMonth.monthName}</p>
                  <p className="text-sm text-gray-600">순수익: {formatKRW(worstMonth.net)}</p>
                  <p className="text-xs text-gray-500">거래 {worstMonth.transactionCount}건</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Summary */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">연간 데이터 요약</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">총 거래:</span>
                <span className="ml-2 font-medium">{yearTransactions.length}건</span>
              </div>
              <div>
                <span className="text-gray-600">월평균 거래:</span>
                <span className="ml-2 font-medium">{Math.round(yearTransactions.length / 12)}건</span>
              </div>
              <div>
                <span className="text-gray-600">예산 항목:</span>
                <span className="ml-2 font-medium">{yearBudgets.length}개</span>
              </div>
              <div>
                <span className="text-gray-600">활성 월수:</span>
                <span className="ml-2 font-medium">
                  {monthlyData.filter(m => m.transactionCount > 0).length}개월
                </span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateYearlyReport} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Calendar className="w-4 h-4 mr-2 animate-spin" />
                {selectedYear}년 연간 리포트 생성 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {selectedYear}년 연간 리포트 다운로드
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}