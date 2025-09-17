'use client'

import { useState } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { useBudget } from '@/contexts/BudgetContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Download, FileText, FileSpreadsheet, FileBarChart, Loader2 } from 'lucide-react'
import { generatePDFReport, generateExcelReport, generateCSVReport, downloadBlob, generateReportFilename, type ReportData, type ReportOptions } from '@/lib/reports'
import { formatKRW } from '@/lib/currency'
import { addDays } from 'date-fns'

export function ReportGenerator() {
  const { transactions } = useTransactions()
  const { budgets } = useBudget()
  const { currentHousehold } = useHousehold()
  
  // Form state
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date()
  })
  const [options, setOptions] = useState<ReportOptions>({
    includeCharts: true,
    includeTransactions: true,
    includeBudgets: true,
    includeAnalysis: true,
    format: 'pdf'
  })
  
  // Loading and error state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!currentHousehold) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>리포트 생성</CardTitle>
          <CardDescription>가계부 데이터를 다양한 형식으로 내보내세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              리포트를 생성하려면 먼저 가구를 선택하거나 생성하세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Filter transactions and budgets by date range
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate >= dateRange.from && transactionDate <= dateRange.to
  })

  const filteredBudgets = budgets.filter(b => {
    // Get budgets for the date range months
    const budgetDate = new Date(b.budget_month + '-01')
    const fromMonth = dateRange.from.toISOString().slice(0, 7)
    const toMonth = dateRange.to.toISOString().slice(0, 7)
    return b.budget_month >= fromMonth && b.budget_month <= toMonth
  })

  // Generate preview statistics
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalBudget = filteredBudgets.reduce((sum, b) => sum + b.budget_amount, 0)
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spent_amount, 0)

  const handleOptionChange = (key: keyof ReportOptions, value: boolean) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleFormatChange = (newFormat: 'pdf' | 'excel' | 'csv') => {
    setFormat(newFormat)
    setOptions(prev => ({
      ...prev,
      format: newFormat,
      // CSV doesn't support charts
      includeCharts: newFormat !== 'csv' ? prev.includeCharts : false
    }))
  }

  const generateReport = async () => {
    if (!dateRange.from || !dateRange.to) {
      setError('날짜 범위를 선택하세요.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const reportData: ReportData = {
        transactions: filteredTransactions,
        budgets: filteredBudgets,
        period: {
          start: dateRange.from,
          end: dateRange.to
        },
        householdName: currentHousehold.name,
        generatedAt: new Date()
      }

      const currentOptions = { ...options, format }
      let blob: Blob
      let extension: string

      switch (format) {
        case 'pdf':
          blob = await generatePDFReport(reportData, currentOptions)
          extension = 'pdf'
          break
        case 'excel':
          blob = generateExcelReport(reportData, currentOptions)
          extension = 'xlsx'
          break
        case 'csv':
          blob = generateCSVReport(reportData, 'transactions')
          extension = 'csv'
          break
        default:
          throw new Error('지원하지 않는 형식입니다.')
      }

      const filename = generateReportFilename(
        currentHousehold.name,
        { start: dateRange.from, end: dateRange.to },
        extension
      )

      downloadBlob(blob, filename)
      setSuccess(`${format.toUpperCase()} 리포트가 성공적으로 다운로드되었습니다.`)

    } catch (err: any) {
      console.error('Report generation error:', err)
      setError(`리포트 생성 중 오류가 발생했습니다: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            리포트 생성
          </CardTitle>
          <CardDescription>
            가계부 데이터를 PDF, Excel, CSV 형식으로 내보내세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Date Range Selection */}
          <div className="space-y-2">
            <Label>기간 선택</Label>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to })
                }
              }}
            />
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>파일 형식</Label>
            <Select value={format} onValueChange={handleFormatChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF 문서
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel 스프레드시트
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileBarChart className="w-4 h-4" />
                    CSV 파일
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Report Options */}
          <div className="space-y-4">
            <Label>포함할 내용</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTransactions"
                  checked={options.includeTransactions}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeTransactions', checked as boolean)
                  }
                />
                <Label htmlFor="includeTransactions">거래 내역</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeBudgets"
                  checked={options.includeBudgets}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeBudgets', checked as boolean)
                  }
                />
                <Label htmlFor="includeBudgets">예산 분석</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAnalysis"
                  checked={options.includeAnalysis}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeAnalysis', checked as boolean)
                  }
                />
                <Label htmlFor="includeAnalysis">재정 요약</Label>
              </div>

              {format !== 'csv' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={options.includeCharts}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeCharts', checked as boolean)
                    }
                  />
                  <Label htmlFor="includeCharts">차트 및 그래프</Label>
                </div>
              )}
            </div>
          </div>

          {/* Preview Statistics */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">리포트 미리보기</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">거래 수:</span>
                <span className="ml-2 font-medium">{filteredTransactions.length}건</span>
              </div>
              <div>
                <span className="text-gray-600">예산 항목:</span>
                <span className="ml-2 font-medium">{filteredBudgets.length}개</span>
              </div>
              <div>
                <span className="text-gray-600">총 수입:</span>
                <span className="ml-2 font-medium text-green-600">{formatKRW(totalIncome)}</span>
              </div>
              <div>
                <span className="text-gray-600">총 지출:</span>
                <span className="ml-2 font-medium text-red-600">{formatKRW(totalExpense)}</span>
              </div>
              <div>
                <span className="text-gray-600">순 수익:</span>
                <span className={`ml-2 font-medium ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatKRW(totalIncome - totalExpense)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">예산 사용률:</span>
                <span className="ml-2 font-medium">
                  {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateReport} 
            disabled={loading || !dateRange.from || !dateRange.to}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                리포트 생성 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {format.toUpperCase()} 리포트 다운로드
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}