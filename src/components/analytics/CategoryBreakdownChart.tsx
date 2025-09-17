'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatKRW } from '@/lib/currency'

interface TransactionTag {
  id: string
  tag_name: string
  created_at: string
}

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  tags: TransactionTag[]
}

interface CategoryBreakdownChartProps {
  transactions: Transaction[]
  type?: 'expense' | 'income'
}

// Colors for different categories
const EXPENSE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#6b7280'
]

const INCOME_COLORS = [
  '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  '#10b981', '#059669', '#047857', '#065f46', '#064e3b'
]

export function CategoryBreakdownChart({ transactions, type = 'expense' }: CategoryBreakdownChartProps) {
  const chartData = useMemo(() => {
    const categoryTotals = new Map<string, number>()

    transactions.forEach(transaction => {
      // Get category from tags (use first tag as primary category)
      const category = transaction.tags?.[0]?.tag_name || '기타'
      const currentTotal = categoryTotals.get(category) || 0
      categoryTotals.set(category, currentTotal + transaction.amount)
    })

    // Convert to array and sort by amount (descending)
    const data = Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Limit to top 10 categories, group others as "기타"
    if (data.length > 10) {
      const top9 = data.slice(0, 9)
      const othersTotal = data.slice(9).reduce((sum, item) => sum + item.value, 0)
      return [...top9, { name: '기타', value: othersTotal }]
    }

    return data
  }, [transactions])

  const colors = type === 'expense' ? EXPENSE_COLORS : INCOME_COLORS

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = chartData.reduce((sum, item) => sum + item.value, 0)
      const percentage = total > 0 ? (data.value / total * 100).toFixed(1) : '0.0'
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-1">{data.name}</p>
          <p className="text-sm text-blue-600">{formatKRW(data.value)}</p>
          <p className="text-xs text-gray-500">{percentage}%</p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">데이터가 없습니다</p>
          <p className="text-sm">
            {type === 'expense' ? '지출' : '수입'} 내역이 없습니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with amounts */}
      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
        {chartData.map((entry, index) => {
          const total = chartData.reduce((sum, item) => sum + item.value, 0)
          const percentage = total > 0 ? (entry.value / total * 100).toFixed(1) : '0.0'
          
          return (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="flex-1 truncate">{entry.name}</span>
              <div className="text-right">
                <div className="font-medium">{formatKRW(entry.value)}</div>
                <div className="text-gray-500">{percentage}%</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="border-t pt-3 mt-4">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">
            총 {type === 'expense' ? '지출' : '수입'}:
          </span>
          <span className="font-bold text-lg">
            {formatKRW(chartData.reduce((sum, item) => sum + item.value, 0))}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
          <span>카테고리 수:</span>
          <span>{chartData.length}개</span>
        </div>
      </div>
    </div>
  )
}