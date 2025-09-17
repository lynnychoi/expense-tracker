'use client'

import { useState } from 'react'
import { useBudget } from '@/contexts/BudgetContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

export function BudgetCategoryManager() {
  const { budgetCategories, createBudgetCategory, updateBudgetCategory, deleteBudgetCategory, loading } = useBudget()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    icon: 'Wallet'
  })

  const availableIcons = [
    'Wallet', 'UtensilsCrossed', 'Car', 'Home', 'ShoppingCart', 
    'Heart', 'GraduationCap', 'Gamepad2', 'Gift', 'Plane'
  ]

  const availableColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#6b7280'
  ]

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('카테고리 이름을 입력해주세요')
      return
    }

    try {
      await createBudgetCategory({
        name: formData.name.trim(),
        color: formData.color,
        icon: formData.icon
      })
      toast.success('카테고리가 생성되었습니다')
      setIsCreateDialogOpen(false)
      setFormData({ name: '', color: '#3b82f6', icon: 'Wallet' })
    } catch (error) {
      toast.error('카테고리 생성에 실패했습니다')
      console.error('Failed to create budget category:', error)
    }
  }

  const handleEditCategory = async () => {
    if (!formData.name.trim() || !editingCategory) {
      toast.error('카테고리 이름을 입력해주세요')
      return
    }

    try {
      await updateBudgetCategory(editingCategory.id, {
        name: formData.name.trim(),
        color: formData.color,
        icon: formData.icon
      })
      toast.success('카테고리가 수정되었습니다')
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      setFormData({ name: '', color: '#3b82f6', icon: 'Wallet' })
    } catch (error) {
      toast.error('카테고리 수정에 실패했습니다')
      console.error('Failed to update budget category:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까? 관련된 예산 데이터도 함께 삭제됩니다.')) {
      return
    }

    try {
      await deleteBudgetCategory(categoryId)
      toast.success('카테고리가 삭제되었습니다')
    } catch (error) {
      toast.error('카테고리 삭제에 실패했습니다')
      console.error('Failed to delete budget category:', error)
    }
  }

  const openEditDialog = (category: any) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>예산 카테고리 관리</CardTitle>
              <CardDescription>
                예산 카테고리를 생성하고 관리합니다
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  카테고리 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 카테고리 추가</DialogTitle>
                  <DialogDescription>
                    예산 카테고리의 정보를 입력해주세요
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">카테고리 이름</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="예: 식비, 교통비, 주거비"
                    />
                  </div>
                  <div>
                    <Label>아이콘</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableIcons.map((icon) => (
                        <Button
                          key={icon}
                          variant={formData.icon === icon ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, icon })}
                        >
                          {icon}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>색상</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={loading}>
                    {loading ? '생성 중...' : '생성'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {budgetCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">등록된 카테고리가 없습니다</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                첫 카테고리 추가하기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgetCategories.map((category) => (
                <Card key={category.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: category.color || undefined }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {category.icon}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 수정</DialogTitle>
            <DialogDescription>
              카테고리 정보를 수정해주세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">카테고리 이름</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 식비, 교통비, 주거비"
              />
            </div>
            <div>
              <Label>아이콘</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableIcons.map((icon) => (
                  <Button
                    key={icon}
                    variant={formData.icon === icon ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, icon })}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>색상</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEditCategory} disabled={loading}>
              {loading ? '수정 중...' : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}