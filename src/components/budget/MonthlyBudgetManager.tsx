'use client'

import { useState } from 'react'
import { useBudget } from '@/contexts/BudgetContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { formatKRW } from '@/lib/currency'
import { toast } from 'sonner'

export function MonthlyBudgetManager() {
  const { 
    budgets, 
    budgetCategories, 
    createBudget, 
    updateBudget, 
    deleteBudget, 
    getCurrentMonthBudgets,
    loading 
  } = useBudget()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [formData, setFormData] = useState({
    budget_category_id: '',
    budget_amount: '',
    notes: ''
  })

  const currentMonthBudgets = getCurrentMonthBudgets()

  const getMonthlyBudgets = (month: string) => {
    return budgets.filter(budget => budget.budget_month === month)
  }

  const handleCreateBudget = async () => {
    if (!formData.budget_category_id || !formData.budget_amount) {
      toast.error('카테고리와 예산 금액을 입력해주세요')
      return
    }

    const budgetAmount = parseInt(formData.budget_amount.replace(/,/g, ''))
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      toast.error('올바른 예산 금액을 입력해주세요')
      return
    }

    try {
      await createBudget({
        category_id: formData.budget_category_id,
        budget_month: selectedMonth,
        budget_amount: budgetAmount,
        notes: formData.notes.trim() || undefined
      })
      toast.success('예산이 설정되었습니다')
      setIsCreateDialogOpen(false)
      setFormData({ budget_category_id: '', budget_amount: '', notes: '' })
    } catch (error) {
      toast.error('예산 설정에 실패했습니다')
      console.error('Failed to create budget:', error)
    }
  }

  const handleEditBudget = async () => {
    if (!formData.budget_amount || !editingBudget) {
      toast.error('예산 금액을 입력해주세요')
      return
    }

    const budgetAmount = parseInt(formData.budget_amount.replace(/,/g, ''))
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      toast.error('올바른 예산 금액을 입력해주세요')
      return
    }

    try {
      await updateBudget(editingBudget.id, {
        budget_amount: budgetAmount,
        notes: formData.notes.trim() || undefined
      })
      toast.success('예산이 수정되었습니다')
      setIsEditDialogOpen(false)
      setEditingBudget(null)
      setFormData({ budget_category_id: '', budget_amount: '', notes: '' })
    } catch (error) {
      toast.error('예산 수정에 실패했습니다')
      console.error('Failed to update budget:', error)
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('이 예산을 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteBudget(budgetId)
      toast.success('예산이 삭제되었습니다')
    } catch (error) {
      toast.error('예산 삭제에 실패했습니다')
      console.error('Failed to delete budget:', error)
    }
  }

  const openEditDialog = (budget: any) => {
    setEditingBudget(budget)
    setFormData({
      budget_category_id: budget.budget_category_id,
      budget_amount: budget.budget_amount.toLocaleString(),
      notes: budget.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const formatBudgetAmount = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleAmountChange = (value: string) => {
    const formatted = formatBudgetAmount(value)
    setFormData({ ...formData, budget_amount: formatted })
  }

  const getUsedCategories = (month: string) => {
    const monthlyBudgets = getMonthlyBudgets(month)
    return monthlyBudgets.map(budget => budget.category_id)
  }

  const getAvailableCategories = () => {
    const usedCategories = getUsedCategories(selectedMonth)
    return budgetCategories.filter(category => !usedCategories.includes(category.id))
  }

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

  return (
    <div className="space-y-6">
      {/* Month Selector and Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label htmlFor="month-select">예산 월 선택:</Label>
          <Input
            id="month-select"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-48"
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={getAvailableCategories().length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              예산 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 예산 설정</DialogTitle>
              <DialogDescription>
                {selectedMonth} 월의 카테고리별 예산을 설정하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.budget_category_id}
                  onValueChange={(value) => setFormData({ ...formData, budget_category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableCategories().map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || undefined }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">예산 금액</Label>
                <Input
                  id="amount"
                  value={formData.budget_amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="예: 500,000"
                />
              </div>
              <div>
                <Label htmlFor="notes">메모 (선택사항)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="예산에 대한 메모를 입력하세요"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateBudget} disabled={loading}>
                {loading ? '설정 중...' : '설정'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Monthly Budget List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {selectedMonth} 예산 현황
          </CardTitle>
          <CardDescription>
            선택한 월의 카테고리별 예산 설정과 사용 현황입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getMonthlyBudgets(selectedMonth).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">이 월에 설정된 예산이 없습니다</p>
              {getAvailableCategories().length > 0 ? (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  첫 예산 설정하기
                </Button>
              ) : (
                <p className="text-sm">먼저 예산 카테고리를 생성해주세요</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {getMonthlyBudgets(selectedMonth).map((budget) => {
                const category = budgetCategories.find(c => c.id === budget.category_id)
                const status = getBudgetStatus(budget)
                const percentage = budget.budget_amount > 0 ? (budget.spent_amount / budget.budget_amount) * 100 : 0
                
                return (
                  <div key={budget.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {category && (
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: category.color || undefined }}
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{category?.name || '알 수 없음'}</h3>
                          {budget.notes && (
                            <p className="text-sm text-gray-500">{budget.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(budget)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBudget(budget.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>사용: {formatKRW(budget.spent_amount)}</span>
                        <span className={getStatusColor(status)}>
                          {percentage.toFixed(1)}%
                        </span>
                        <span>예산: {formatKRW(budget.budget_amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            status === 'over' ? 'bg-red-500' :
                            status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>잔여: {formatKRW(budget.budget_amount - budget.spent_amount)}</span>
                        {status === 'over' && (
                          <span className="text-red-600 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            초과됨
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예산 수정</DialogTitle>
            <DialogDescription>
              예산 정보를 수정해주세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-amount">예산 금액</Label>
              <Input
                id="edit-amount"
                value={formData.budget_amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="예: 500,000"
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">메모 (선택사항)</Label>
              <Input
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="예산에 대한 메모를 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEditBudget} disabled={loading}>
              {loading ? '수정 중...' : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary for Selected Month */}
      {getMonthlyBudgets(selectedMonth).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>월별 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const monthlyBudgets = getMonthlyBudgets(selectedMonth)
                const totalBudget = monthlyBudgets.reduce((sum, b) => sum + b.budget_amount, 0)
                const totalSpent = monthlyBudgets.reduce((sum, b) => sum + b.spent_amount, 0)
                const remaining = totalBudget - totalSpent
                
                return (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">총 예산</p>
                      <p className="text-2xl font-bold text-blue-600">{formatKRW(totalBudget)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">총 지출</p>
                      <p className="text-2xl font-bold text-red-600">{formatKRW(totalSpent)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">잔여 예산</p>
                      <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatKRW(Math.abs(remaining))}
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}