import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import html2canvas from 'html2canvas'
import { formatKRW } from './currency'

// jsPDF 타입 확장
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface ReportData {
  transactions: any[]
  budgets: any[]
  period: {
    start: Date
    end: Date
  }
  householdName: string
  generatedAt: Date
}

export interface ReportOptions {
  includeCharts: boolean
  includeTransactions: boolean
  includeBudgets: boolean
  includeAnalysis: boolean
  format: 'pdf' | 'excel' | 'csv'
}

// PDF 리포트 생성
export async function generatePDFReport(data: ReportData, options: ReportOptions): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // 한글 폰트 설정을 위한 임시 폰트 (기본 폰트 사용)
  pdf.setFont('helvetica')
  
  let yPosition = 20
  
  // 헤더
  pdf.setFontSize(20)
  pdf.text(`${data.householdName} 가계부 리포트`, 20, yPosition)
  yPosition += 10
  
  pdf.setFontSize(12)
  pdf.text(`기간: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`, 20, yPosition)
  yPosition += 5
  pdf.text(`생성일: ${formatDate(data.generatedAt)}`, 20, yPosition)
  yPosition += 15
  
  // 요약 정보
  const totalIncome = data.transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = data.transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const netAmount = totalIncome - totalExpense
  
  pdf.setFontSize(14)
  pdf.text('재정 요약', 20, yPosition)
  yPosition += 8
  
  pdf.setFontSize(11)
  pdf.text(`총 수입: ${formatKRW(totalIncome)}`, 20, yPosition)
  yPosition += 6
  pdf.text(`총 지출: ${formatKRW(totalExpense)}`, 20, yPosition)
  yPosition += 6
  pdf.text(`순 잔액: ${formatKRW(netAmount)}`, 20, yPosition)
  yPosition += 6
  pdf.text(`저축률: ${totalIncome > 0 ? ((netAmount / totalIncome) * 100).toFixed(1) : '0.0'}%`, 20, yPosition)
  yPosition += 15
  
  // 예산 분석 (옵션)
  if (options.includeBudgets && data.budgets.length > 0) {
    pdf.setFontSize(14)
    pdf.text('예산 분석', 20, yPosition)
    yPosition += 10
    
    const budgetTableData = data.budgets.map(budget => [
      budget.category?.name || budget.category_name || 'Unknown',
      formatKRW(budget.budget_amount),
      formatKRW(budget.spent_amount),
      `${budget.budget_amount > 0 ? ((budget.spent_amount / budget.budget_amount) * 100).toFixed(1) : '0.0'}%`
    ])
    
    pdf.autoTable({
      head: [['카테고리', '예산', '지출', '사용률']],
      body: budgetTableData,
      startY: yPosition,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    })
    
    yPosition = (pdf as any).lastAutoTable.finalY + 15
  }
  
  // 거래 내역 (옵션)
  if (options.includeTransactions && data.transactions.length > 0) {
    // 새 페이지 추가 (필요한 경우)
    if (yPosition > 200) {
      pdf.addPage()
      yPosition = 20
    }
    
    pdf.setFontSize(14)
    pdf.text('거래 내역', 20, yPosition)
    yPosition += 10
    
    const transactionTableData = data.transactions
      .slice(0, 50) // 최대 50개 거래만 표시
      .map(transaction => [
        formatDate(new Date(transaction.date)),
        transaction.transaction_type === 'income' ? '수입' : '지출',
        transaction.description || '',
        transaction.tags?.[0]?.name || '기타',
        formatKRW(transaction.amount)
      ])
    
    pdf.autoTable({
      head: [['날짜', '유형', '설명', '카테고리', '금액']],
      body: transactionTableData,
      startY: yPosition,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 15 },
        2: { cellWidth: 40 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 }
      }
    })
  }
  
  return pdf.output('blob')
}

// Excel 리포트 생성
export function generateExcelReport(data: ReportData, options: ReportOptions): Blob {
  const workbook = XLSX.utils.book_new()
  
  // 요약 시트
  const summaryData = [
    ['가구명', data.householdName],
    ['기간', `${formatDate(data.period.start)} - ${formatDate(data.period.end)}`],
    ['생성일', formatDate(data.generatedAt)],
    [''],
    ['재정 요약'],
    ['총 수입', data.transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0)],
    ['총 지출', data.transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0)],
    ['순 잔액', data.transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0) - data.transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0)]
  ]
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, '요약')
  
  // 거래 내역 시트
  if (options.includeTransactions) {
    const transactionData = [
      ['날짜', '유형', '설명', '카테고리', '금액', '결제방법'],
      ...data.transactions.map(t => [
        formatDate(new Date(t.date)),
        t.transaction_type === 'income' ? '수입' : '지출',
        t.description || '',
        t.tags?.[0]?.name || '기타',
        t.amount,
        t.payment_method?.name || ''
      ])
    ]
    
    const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData)
    XLSX.utils.book_append_sheet(workbook, transactionSheet, '거래내역')
  }
  
  // 예산 시트
  if (options.includeBudgets && data.budgets.length > 0) {
    const budgetData = [
      ['카테고리', '예산', '지출', '잔여', '사용률'],
      ...data.budgets.map(b => [
        b.category?.name || b.category_name || 'Unknown',
        b.budget_amount,
        b.spent_amount,
        b.budget_amount - b.spent_amount,
        b.budget_amount > 0 ? ((b.spent_amount / b.budget_amount) * 100).toFixed(1) + '%' : '0.0%'
      ])
    ]
    
    const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData)
    XLSX.utils.book_append_sheet(workbook, budgetSheet, '예산분석')
  }
  
  // Excel 파일을 Blob으로 변환
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// CSV 리포트 생성
export function generateCSVReport(data: ReportData, type: 'transactions' | 'budgets' = 'transactions'): Blob {
  let csvData: any[] = []
  
  if (type === 'transactions') {
    csvData = [
      ['날짜', '유형', '설명', '카테고리', '금액', '결제방법'],
      ...data.transactions.map(t => [
        formatDate(new Date(t.date)),
        t.transaction_type === 'income' ? '수입' : '지출',
        t.description || '',
        t.tags?.[0]?.name || '기타',
        t.amount,
        t.payment_method?.name || ''
      ])
    ]
  } else {
    csvData = [
      ['카테고리', '예산', '지출', '잔여', '사용률'],
      ...data.budgets.map(b => [
        b.category?.name || b.category_name || 'Unknown',
        b.budget_amount,
        b.spent_amount,
        b.budget_amount - b.spent_amount,
        b.budget_amount > 0 ? ((b.spent_amount / b.budget_amount) * 100).toFixed(1) + '%' : '0.0%'
      ])
    ]
  }
  
  const csv = Papa.unparse(csvData)
  return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }) // BOM 추가로 한글 지원
}

// 차트를 이미지로 캡처하여 PDF에 추가
export async function captureChartAsImage(elementId: string): Promise<string> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`)
  }
  
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2 // 고해상도
  })
  
  return canvas.toDataURL('image/png')
}

// 파일 다운로드 헬퍼
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 날짜 포맷팅 헬퍼
function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 리포트 파일명 생성
export function generateReportFilename(householdName: string, period: { start: Date; end: Date }, format: string): string {
  const startDate = period.start.toISOString().slice(0, 10)
  const endDate = period.end.toISOString().slice(0, 10)
  const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-')
  
  return `${householdName}_가계부_${startDate}_${endDate}_${timestamp}.${format}`
}