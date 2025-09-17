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
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Printer, FileText, Eye } from 'lucide-react'
import { formatKRW } from '@/lib/currency'
import { addDays } from 'date-fns'

interface PrintOptions {
  fontSize: 'small' | 'medium' | 'large'
  orientation: 'portrait' | 'landscape'
  includeHeader: boolean
  includeFooter: boolean
  includePageNumbers: boolean
  includeCharts: boolean
  showColors: boolean
  compactMode: boolean
}

export function PrintOptimizedReport() {
  const { transactions } = useTransactions()
  const { budgets } = useBudget()
  const { currentHousehold } = useHousehold()
  
  // Form state
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date()
  })
  
  const [options, setOptions] = useState<PrintOptions>({
    fontSize: 'medium',
    orientation: 'portrait',
    includeHeader: true,
    includeFooter: true,
    includePageNumbers: true,
    includeCharts: false, // Charts don't print well
    showColors: false, // Better for printing
    compactMode: true
  })
  
  const [showPreview, setShowPreview] = useState(false)

  if (!currentHousehold) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>인쇄용 리포트</CardTitle>
          <CardDescription>인쇄에 최적화된 리포트를 생성하고 미리보기하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              인쇄용 리포트를 생성하려면 먼저 가구를 선택하거나 생성하세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Filter data by date range
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate >= dateRange.from && transactionDate <= dateRange.to
  })

  const filteredBudgets = budgets.filter(b => {
    const budgetDate = new Date(b.budget_month + '-01')
    const fromMonth = dateRange.from.toISOString().slice(0, 7)
    const toMonth = dateRange.to.toISOString().slice(0, 7)
    return b.budget_month >= fromMonth && b.budget_month <= toMonth
  })

  const handleOptionChange = (key: keyof PrintOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePrint = () => {
    setShowPreview(true)
    // Add a small delay to ensure the preview is rendered before printing
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      
      .print-content, .print-content * {
        visibility: visible;
      }
      
      .print-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        ${options.fontSize === 'small' ? 'font-size: 10px;' : ''}
        ${options.fontSize === 'medium' ? 'font-size: 12px;' : ''}
        ${options.fontSize === 'large' ? 'font-size: 14px;' : ''}
        ${!options.showColors ? 'color: black !important;' : ''}
      }
      
      .print-content h1, .print-content h2, .print-content h3 {
        ${!options.showColors ? 'color: black !important;' : ''}
        page-break-after: avoid;
      }
      
      .print-content table {
        page-break-inside: avoid;
        border-collapse: collapse;
        width: 100%;
      }
      
      .print-content th, .print-content td {
        border: 1px solid #000;
        padding: 4px;
        ${!options.showColors ? 'background: white !important; color: black !important;' : ''}
      }
      
      .no-print {
        display: none !important;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      @page {
        size: ${options.orientation === 'landscape' ? 'landscape' : 'portrait'};
        margin: 1cm;
        ${options.includeHeader ? `
          @top-center {
            content: "${currentHousehold.name} 가계부 리포트";
          }
        ` : ''}
        ${options.includeFooter && options.includePageNumbers ? `
          @bottom-right {
            content: "페이지 " counter(page);
          }
        ` : ''}
      }
    }
  `

  // Calculate summary data
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBalance = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            인쇄용 리포트
          </CardTitle>
          <CardDescription>
            인쇄에 최적화된 형식으로 리포트를 생성하고 미리보기하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
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

          {/* Print Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">인쇄 옵션</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Font Size */}
              <div className="space-y-2">
                <Label>글자 크기</Label>
                <Select 
                  value={options.fontSize} 
                  onValueChange={(value: 'small' | 'medium' | 'large') => 
                    handleOptionChange('fontSize', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">작게 (10px)</SelectItem>
                    <SelectItem value="medium">보통 (12px)</SelectItem>
                    <SelectItem value="large">크게 (14px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Orientation */}
              <div className="space-y-2">
                <Label>페이지 방향</Label>
                <Select 
                  value={options.orientation} 
                  onValueChange={(value: 'portrait' | 'landscape') => 
                    handleOptionChange('orientation', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">세로</SelectItem>
                    <SelectItem value="landscape">가로</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeHeader"
                    checked={options.includeHeader}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeHeader', checked)
                    }
                  />
                  <Label htmlFor="includeHeader">헤더 포함</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeFooter"
                    checked={options.includeFooter}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeFooter', checked)
                    }
                  />
                  <Label htmlFor="includeFooter">푸터 포함</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePageNumbers"
                    checked={options.includePageNumbers}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includePageNumbers', checked)
                    }
                  />
                  <Label htmlFor="includePageNumbers">페이지 번호</Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showColors"
                    checked={options.showColors}
                    onCheckedChange={(checked) => 
                      handleOptionChange('showColors', checked)
                    }
                  />
                  <Label htmlFor="showColors">컬러 인쇄</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compactMode"
                    checked={options.compactMode}
                    onCheckedChange={(checked) => 
                      handleOptionChange('compactMode', checked)
                    }
                  />
                  <Label htmlFor="compactMode">압축 모드</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => setShowPreview(!showPreview)} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? '미리보기 숨기기' : '미리보기'}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              인쇄하기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Print Preview */}
      {showPreview && (
        <div className="print-content">
          <div className="bg-white p-8 shadow-lg">
            {/* Header */}
            {options.includeHeader && (
              <div className="text-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold">{currentHousehold.name} 가계부 리포트</h1>
                <p className="text-gray-600 mt-2">
                  기간: {dateRange.from.toLocaleDateString('ko-KR')} - {dateRange.to.toLocaleDateString('ko-KR')}
                </p>
                <p className="text-gray-600">
                  생성일: {new Date().toLocaleDateString('ko-KR')}
                </p>
              </div>
            )}

            {/* Summary Section */}
            <div className={`mb-6 ${options.compactMode ? 'mb-4' : ''}`}>
              <h2 className="text-lg font-semibold mb-3">재정 요약</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">총 수입</div>
                  <div className="text-lg font-semibold">{formatKRW(totalIncome)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">총 지출</div>
                  <div className="text-lg font-semibold">{formatKRW(totalExpense)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">순 잔액</div>
                  <div className={`text-lg font-semibold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatKRW(netBalance)}
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className={`mb-6 ${options.compactMode ? 'mb-4' : ''}`}>
              <h2 className="text-lg font-semibold mb-3">거래 내역</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">날짜</th>
                    <th className="text-left p-2">설명</th>
                    <th className="text-left p-2">유형</th>
                    <th className="text-right p-2">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, options.compactMode ? 20 : 50).map((transaction, index) => (
                    <tr key={transaction.id || index} className="border-b">
                      <td className="p-2">{new Date(transaction.date).toLocaleDateString('ko-KR')}</td>
                      <td className="p-2">{transaction.description}</td>
                      <td className="p-2">{transaction.type === 'income' ? '수입' : '지출'}</td>
                      <td className="p-2 text-right">{formatKRW(transaction.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransactions.length > (options.compactMode ? 20 : 50) && (
                <p className="text-sm text-gray-600 mt-2">
                  * {options.compactMode ? 20 : 50}개 항목만 표시됨 (전체 {filteredTransactions.length}개)
                </p>
              )}
            </div>

            {/* Budget Analysis */}
            {filteredBudgets.length > 0 && (
              <div className={`mb-6 ${options.compactMode ? 'mb-4' : ''}`}>
                <h2 className="text-lg font-semibold mb-3">예산 분석</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2">카테고리</th>
                      <th className="text-right p-2">예산</th>
                      <th className="text-right p-2">지출</th>
                      <th className="text-right p-2">사용률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.map((budget, index) => (
                      <tr key={budget.id || index} className="border-b">
                        <td className="p-2">{budget.category?.name || '기타'}</td>
                        <td className="p-2 text-right">{formatKRW(budget.budget_amount)}</td>
                        <td className="p-2 text-right">{formatKRW(budget.spent_amount)}</td>
                        <td className="p-2 text-right">
                          {budget.budget_amount > 0 ? 
                            `${((budget.spent_amount / budget.budget_amount) * 100).toFixed(1)}%` : 
                            '0%'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            {options.includeFooter && (
              <div className="text-center pt-4 border-t text-sm text-gray-600">
                <p>이 리포트는 {currentHousehold.name} 가계부에서 생성되었습니다.</p>
                <p>생성 시간: {new Date().toLocaleString('ko-KR')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}