'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { formatKRW } from '@/lib/currency'

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

interface SpendingTrendsChartProps {
  transactions: Transaction[]
  startDate: Date
  endDate: Date
  showDetailed?: boolean
}

export function SpendingTrendsChart({ transactions, startDate, endDate, showDetailed = false }: SpendingTrendsChartProps) {
  const chartData = useMemo(() => {
    // Filter transactions within date range
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= startDate && transactionDate <= endDate
    })

    // Group transactions by month
    const monthlyData = new Map<string, { income: number; expense: number; net: number }>()
    
    filteredTransactions.forEach(transaction => {
      const monthKey = new Date(transaction.date).toISOString().slice(0, 7) // YYYY-MM format
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expense: 0, net: 0 })
      }
      
      const data = monthlyData.get(monthKey)!
      if (transaction.type === 'income') {
        data.income += transaction.amount
      } else {
        data.expense += transaction.amount
      }
      data.net = data.income - data.expense
    })

    // Convert to array and sort by month
    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month: formatMonth(month),
        monthKey: month,
        수입: data.income,
        지출: data.expense,
        순잔액: data.net
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }, [transactions, startDate, endDate])

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return `${year}년 ${parseInt(month || '1')}월`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatKRW(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">데이터가 없습니다</p>
          <p className="text-sm">선택한 기간에 거래 내역이 없습니다</p>
        </div>
      </div>
    )
  }

  if (showDetailed) {
    return (
      <div className="space-y-6">
        {/* Line Chart for Trends */}
        <div>
          <h4 className="text-sm font-medium mb-4">월별 트렌드 (선형 차트)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₩${(value / 10000).toFixed(0)}만`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="수입" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="지출" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="순잔액" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart for Comparison */}
        <div>
          <h4 className="text-sm font-medium mb-4">월별 비교 (막대 차트)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₩${(value / 10000).toFixed(0)}만`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="수입" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="지출" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `₩${(value / 10000).toFixed(0)}만`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="수입" 
          stroke="#22c55e" 
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="지출" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}