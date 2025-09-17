'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatKRW } from '@/lib/currency'

interface Budget {
  id: string
  budget_amount: number
  spent_amount: number
  category?: { name: string; color?: string }
  category_name?: string
}

interface BudgetComparisonChartProps {
  budgets: Budget[]
}

export function BudgetComparisonChart({ budgets }: BudgetComparisonChartProps) {
  const chartData = budgets.map(budget => {
    const categoryName = budget.category?.name || budget.category_name || '알 수 없음'
    const remaining = Math.max(0, budget.budget_amount - budget.spent_amount)
    const overBudget = Math.max(0, budget.spent_amount - budget.budget_amount)
    
    return {
      name: categoryName.length > 10 ? categoryName.substring(0, 10) + '...' : categoryName,
      fullName: categoryName,
      예산: budget.budget_amount,
      지출: budget.spent_amount,
      잔여: remaining,
      초과: overBudget,
      percentage: budget.budget_amount > 0 ? (budget.spent_amount / budget.budget_amount * 100).toFixed(1) : '0.0'
    }
  }).sort((a, b) => b.지출 - a.지출) // Sort by spending amount

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <p>예산: <span className="font-medium text-blue-600">{formatKRW(data.예산)}</span></p>
            <p>지출: <span className="font-medium text-red-600">{formatKRW(data.지출)}</span></p>
            <p>사용률: <span className="font-medium">{data.percentage}%</span></p>
            {data.초과 > 0 ? (
              <p>초과: <span className="font-medium text-red-500">{formatKRW(data.초과)}</span></p>
            ) : (
              <p>잔여: <span className="font-medium text-green-600">{formatKRW(data.잔여)}</span></p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  if (budgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">예산 데이터가 없습니다</p>
          <p className="text-sm">이번 달 설정된 예산이 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
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
          <Bar 
            dataKey="예산" 
            fill="#3b82f6" 
            radius={[2, 2, 0, 0]}
            name="예산"
          />
          <Bar 
            dataKey="지출" 
            fill="#ef4444" 
            radius={[2, 2, 0, 0]}
            name="지출"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Budget Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {budgets.filter(b => b.spent_amount <= b.budget_amount * 0.8).length}
          </p>
          <p className="text-sm text-green-700">안전 범위 (80% 이하)</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">
            {budgets.filter(b => b.spent_amount > b.budget_amount * 0.8 && b.spent_amount <= b.budget_amount).length}
          </p>
          <p className="text-sm text-yellow-700">주의 범위 (80-100%)</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-600">
            {budgets.filter(b => b.spent_amount > b.budget_amount).length}
          </p>
          <p className="text-sm text-red-700">예산 초과 (100% 이상)</p>
        </div>
      </div>

      {/* Detailed List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h4 className="font-medium">카테고리별 상세 현황</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {chartData.map((item, index) => {
            const isOverBudget = item.초과 > 0
            const percentage = parseFloat(item.percentage)
            
            return (
              <div key={index} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.fullName}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>예산: {formatKRW(item.예산)}</span>
                      <span>지출: {formatKRW(item.지출)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      percentage > 100 ? 'text-red-600' :
                      percentage > 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {item.percentage}%
                    </div>
                    {isOverBudget ? (
                      <p className="text-xs text-red-500">
                        {formatKRW(item.초과)} 초과
                      </p>
                    ) : (
                      <p className="text-xs text-green-600">
                        {formatKRW(item.잔여)} 남음
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      percentage > 100 ? 'bg-red-500' :
                      percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}