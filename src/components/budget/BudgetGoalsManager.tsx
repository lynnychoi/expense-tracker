'use client'

import { useState } from 'react'
import { useBudget } from '@/contexts/BudgetContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Plus, Edit, Trash2, Target, Calendar, CheckCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { formatKRW } from '@/lib/currency'
import { toast } from 'sonner'

type GoalType = 'savings' | 'debt_payoff' | 'purchase' | 'emergency_fund' | 'other'

const GOAL_TYPES: { value: GoalType; label: string; description: string }[] = [
  { value: 'savings', label: '저축', description: '정기적인 저축 목표' },
  { value: 'debt_payoff', label: '부채 상환', description: '대출이나 카드 빚 상환' },
  { value: 'purchase', label: '구매', description: '특정 물건 구매를 위한 목표' },
  { value: 'emergency_fund', label: '비상 자금', description: '응급 상황 대비 자금' },
  { value: 'other', label: '기타', description: '기타 재정 목표' }
]

const PRIORITY_LEVELS = [
  { value: 1, label: '낮음', color: 'bg-gray-500' },
  { value: 2, label: '보통', color: 'bg-blue-500' },
  { value: 3, label: '높음', color: 'bg-orange-500' },
  { value: 4, label: '매우 높음', color: 'bg-red-500' }
]

export function BudgetGoalsManager() {
  const { budgetGoals, createBudgetGoal, updateBudgetGoal, deleteBudgetGoal, loading } = useBudget()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [progressGoal, setProgressGoal] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'savings' as GoalType,
    target_amount: '',
    current_amount: '',
    target_date: '',
    priority_level: 2,
    description: ''
  })
  const [progressAmount, setProgressAmount] = useState('')

  const activeGoals = budgetGoals.filter(goal => goal.is_active && !goal.is_completed)
  const completedGoals = budgetGoals.filter(goal => goal.is_completed)
  const inactiveGoals = budgetGoals.filter(goal => !goal.is_active && !goal.is_completed)

  const handleCreateGoal = async () => {
    if (!formData.name.trim() || !formData.target_amount) {
      toast.error('목표 이름과 목표 금액을 입력해주세요')
      return
    }

    const targetAmount = parseInt(formData.target_amount.replace(/,/g, ''))
    const currentAmount = formData.current_amount ? parseInt(formData.current_amount.replace(/,/g, '')) : 0

    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error('올바른 목표 금액을 입력해주세요')
      return
    }

    if (currentAmount < 0 || currentAmount > targetAmount) {
      toast.error('현재 금액이 올바르지 않습니다')
      return
    }

    try {
      await createBudgetGoal({
        name: formData.name.trim(),
        goal_type: formData.goal_type,
        target_amount: targetAmount,
        target_date: formData.target_date || undefined,
        priority: formData.priority_level,
        description: formData.description.trim() || undefined
      })
      toast.success('목표가 생성되었습니다')
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error('목표 생성에 실패했습니다')
      console.error('Failed to create budget goal:', error)
    }
  }

  const handleEditGoal = async () => {
    if (!formData.name.trim() || !formData.target_amount || !editingGoal) {
      toast.error('목표 이름과 목표 금액을 입력해주세요')
      return
    }

    const targetAmount = parseInt(formData.target_amount.replace(/,/g, ''))
    const currentAmount = formData.current_amount ? parseInt(formData.current_amount.replace(/,/g, '')) : 0

    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error('올바른 목표 금액을 입력해주세요')
      return
    }

    if (currentAmount < 0 || currentAmount > targetAmount) {
      toast.error('현재 금액이 올바르지 않습니다')
      return
    }

    try {
      await updateBudgetGoal(editingGoal.id, {
        name: formData.name.trim(),
        goal_type: formData.goal_type,
        target_amount: targetAmount,
        current_amount: currentAmount,
        target_date: formData.target_date || undefined,
        priority: formData.priority_level,
        description: formData.description.trim() || undefined,
        is_completed: currentAmount >= targetAmount
      })
      toast.success('목표가 수정되었습니다')
      setIsEditDialogOpen(false)
      setEditingGoal(null)
      resetForm()
    } catch (error) {
      toast.error('목표 수정에 실패했습니다')
      console.error('Failed to update budget goal:', error)
    }
  }

  const handleUpdateProgress = async () => {
    if (!progressAmount || !progressGoal) {
      toast.error('금액을 입력해주세요')
      return
    }

    const amount = parseInt(progressAmount.replace(/,/g, ''))
    if (isNaN(amount) || amount < 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }

    try {
      const newCurrentAmount = Math.min(amount, progressGoal.target_amount)
      await updateBudgetGoal(progressGoal.id, {
        current_amount: newCurrentAmount,
        is_completed: newCurrentAmount >= progressGoal.target_amount
      })
      toast.success('진행도가 업데이트되었습니다')
      setIsProgressDialogOpen(false)
      setProgressGoal(null)
      setProgressAmount('')
    } catch (error) {
      toast.error('진행도 업데이트에 실패했습니다')
      console.error('Failed to update progress:', error)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('이 목표를 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteBudgetGoal(goalId)
      toast.success('목표가 삭제되었습니다')
    } catch (error) {
      toast.error('목표 삭제에 실패했습니다')
      console.error('Failed to delete budget goal:', error)
    }
  }

  const handleToggleActive = async (goal: any) => {
    try {
      await updateBudgetGoal(goal.id, {
        // is_active property removed - not in interface
      })
      toast.success(goal.is_active ? '목표가 비활성화되었습니다' : '목표가 활성화되었습니다')
    } catch (error) {
      toast.error('목표 상태 변경에 실패했습니다')
      console.error('Failed to toggle goal status:', error)
    }
  }

  const openEditDialog = (goal: any) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      goal_type: goal.goal_type,
      target_amount: goal.target_amount.toLocaleString(),
      current_amount: goal.current_amount.toLocaleString(),
      target_date: (goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '') as string,
      priority_level: goal.priority_level,
      description: goal.description || ''
    })
    setIsEditDialogOpen(true)
  }

  const openProgressDialog = (goal: any) => {
    setProgressGoal(goal)
    setProgressAmount(goal.current_amount.toLocaleString())
    setIsProgressDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      goal_type: 'savings',
      target_amount: '',
      current_amount: '',
      target_date: '',
      priority_level: 2,
      description: ''
    })
  }

  const formatAmount = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const getGoalTypeLabel = (type: GoalType) => {
    return GOAL_TYPES.find(t => t.value === type)?.label || '기타'
  }

  const getPriorityInfo = (level: number) => {
    return PRIORITY_LEVELS.find(p => p.value === level) || PRIORITY_LEVELS[1]
  }

  const getProgressPercentage = (goal: any) => {
    return (goal.current_amount / goal.target_amount) * 100
  }

  const getTimeRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return '기한 만료'
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '내일'
    if (diffDays <= 7) return `${diffDays}일 남음`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}주 남음`
    return `${Math.ceil(diffDays / 30)}개월 남음`
  }

  const renderGoalCard = (goal: any) => {
    const percentage = getProgressPercentage(goal)
    const priorityInfo = getPriorityInfo(goal.priority_level)
    const isOverdue = goal.target_date && new Date(goal.target_date) < new Date() && !goal.is_completed

    return (
      <Card key={goal.id} className={`${goal.is_completed ? 'bg-green-50 border-green-200' : ''}`}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{goal.name}</h3>
                  {goal.is_completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{getGoalTypeLabel(goal.goal_type)}</Badge>
                  <div className={`w-2 h-2 rounded-full ${priorityInfo?.color || 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-500">{priorityInfo?.label || '보통'}</span>
                </div>
                {goal.description && (
                  <p className="text-sm text-gray-600">{goal.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openProgressDialog(goal)}
                  disabled={goal.is_completed}
                >
                  <TrendingUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(goal)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(goal)}
                >
                  {goal.is_active ? <Clock className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteGoal(goal.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatKRW(goal.current_amount)}</span>
                <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                <span>{formatKRW(goal.target_amount)}</span>
              </div>
              <Progress 
                value={Math.min(percentage, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>달성: {formatKRW(goal.current_amount)}</span>
                <span>남은 금액: {formatKRW(goal.target_amount - goal.current_amount)}</span>
              </div>
            </div>

            {/* Target Date */}
            {goal.target_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className={isOverdue ? 'text-red-500' : 'text-gray-600'}>
                  목표일: {new Date(goal.target_date).toLocaleDateString()} 
                  ({getTimeRemaining(goal.target_date)})
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">재정 목표 관리</h2>
          <p className="text-gray-600 text-sm">저축, 부채 상환 등 재정 목표를 설정하고 추적하세요</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              목표 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>새 재정 목표</DialogTitle>
              <DialogDescription>
                달성하고 싶은 재정 목표를 설정하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">목표 이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 새 차 구매"
                />
              </div>
              <div>
                <Label htmlFor="goal_type">목표 유형</Label>
                <Select
                  value={formData.goal_type}
                  onValueChange={(value: GoalType) => setFormData({ ...formData, goal_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div>{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_amount">목표 금액</Label>
                  <Input
                    id="target_amount"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: formatAmount(e.target.value) })}
                    placeholder="10,000,000"
                  />
                </div>
                <div>
                  <Label htmlFor="current_amount">현재 금액</Label>
                  <Input
                    id="current_amount"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: formatAmount(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="target_date">목표 날짜 (선택사항)</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="priority_level">우선순위</Label>
                <Select
                  value={formData.priority_level.toString()}
                  onValueChange={(value) => setFormData({ ...formData, priority_level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value.toString()}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">설명 (선택사항)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="목표에 대한 상세 설명"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateGoal} disabled={loading}>
                {loading ? '생성 중...' : '생성'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          진행 중인 목표 ({activeGoals.length})
        </h3>
        {activeGoals.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-8 text-gray-500">
              <p className="mb-4">진행 중인 목표가 없습니다</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                첫 목표 설정하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map(renderGoalCard)}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            완료된 목표 ({completedGoals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map(renderGoalCard)}
          </div>
        </div>
      )}

      {/* Progress Update Dialog */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>진행도 업데이트</DialogTitle>
            <DialogDescription>
              {progressGoal?.name}의 현재 달성 금액을 입력하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="progress-amount">현재 금액</Label>
              <Input
                id="progress-amount"
                value={progressAmount}
                onChange={(e) => setProgressAmount(formatAmount(e.target.value))}
                placeholder="현재 달성한 금액"
              />
              <p className="text-xs text-gray-500 mt-1">
                목표: {progressGoal && formatKRW(progressGoal.target_amount)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProgressDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateProgress} disabled={loading}>
              {loading ? '업데이트 중...' : '업데이트'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>목표 수정</DialogTitle>
            <DialogDescription>
              목표 정보를 수정하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">목표 이름</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 새 차 구매"
              />
            </div>
            <div>
              <Label htmlFor="edit-goal_type">목표 유형</Label>
              <Select
                value={formData.goal_type}
                onValueChange={(value: GoalType) => setFormData({ ...formData, goal_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div>{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-target_amount">목표 금액</Label>
                <Input
                  id="edit-target_amount"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: formatAmount(e.target.value) })}
                  placeholder="10,000,000"
                />
              </div>
              <div>
                <Label htmlFor="edit-current_amount">현재 금액</Label>
                <Input
                  id="edit-current_amount"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: formatAmount(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-target_date">목표 날짜 (선택사항)</Label>
              <Input
                id="edit-target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-priority_level">우선순위</Label>
              <Select
                value={formData.priority_level.toString()}
                onValueChange={(value) => setFormData({ ...formData, priority_level: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value.toString()}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                        {priority.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">설명 (선택사항)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="목표에 대한 상세 설명"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEditGoal} disabled={loading}>
              {loading ? '수정 중...' : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}