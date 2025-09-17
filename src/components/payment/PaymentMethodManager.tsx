'use client'

import { useState } from 'react'
import { usePaymentMethods, type PaymentMethod } from '@/contexts/PaymentMethodContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, Star, CreditCard, Wallet, Banknote, Building, DollarSign } from 'lucide-react'

const PAYMENT_ICONS = [
  { value: 'CreditCard', label: '신용카드', icon: CreditCard },
  { value: 'Wallet', label: '지갑', icon: Wallet },
  { value: 'Banknote', label: '현금', icon: Banknote },
  { value: 'Building', label: '은행', icon: Building },
  { value: 'DollarSign', label: '달러', icon: DollarSign }
]

const PAYMENT_COLORS = [
  { value: '#ef4444', label: '빨강' },
  { value: '#f97316', label: '주황' },
  { value: '#eab308', label: '노랑' },
  { value: '#22c55e', label: '초록' },
  { value: '#3b82f6', label: '파랑' },
  { value: '#8b5cf6', label: '보라' },
  { value: '#ec4899', label: '분홍' },
  { value: '#6b7280', label: '회색' }
]

interface PaymentMethodFormData {
  name: string
  description: string
  icon: string
  color: string
  is_default: boolean
}

export function PaymentMethodManager() {
  const { 
    paymentMethods, 
    loading,
    createPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod,
    getDefaultPaymentMethods 
  } = usePaymentMethods()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    name: '',
    description: '',
    icon: 'CreditCard',
    color: '#3b82f6',
    is_default: false
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const defaultMethods = getDefaultPaymentMethods()

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'CreditCard',
      color: '#3b82f6',
      is_default: false
    })
    setFormError('')
    setFormLoading(false)
  }

  const handleAdd = () => {
    resetForm()
    setShowAddModal(true)
  }

  const handleEdit = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setFormData({
      name: method.name,
      description: method.description || '',
      icon: method.icon || 'CreditCard',
      color: method.color || '#3b82f6',
      is_default: method.is_default
    })
    setFormError('')
    setFormLoading(false)
    setShowEditModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    try {
      if (!formData.name.trim()) {
        setFormError('결제 방법 이름을 입력하세요')
        return
      }

      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
        is_default: formData.is_default
      }

      let result
      if (selectedMethod) {
        result = await updatePaymentMethod(selectedMethod.id, data)
      } else {
        result = await createPaymentMethod(data)
      }

      if (result.error) {
        setFormError(result.error)
        return
      }

      // Success
      setShowAddModal(false)
      setShowEditModal(false)
      resetForm()
      setSelectedMethod(null)
    } catch (error: any) {
      setFormError(error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`"${method.name}" 결제 방법을 삭제하시겠습니까?`)) {
      return
    }

    const result = await deletePaymentMethod(method.id)
    if (result.error) {
      alert(result.error)
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconData = PAYMENT_ICONS.find(icon => icon.value === iconName)
    return iconData ? iconData.icon : CreditCard
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">결제 방법 관리</h2>
          <p className="text-gray-600 mt-1">
            가구의 결제 방법을 추가하고 관리하세요
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          결제 방법 추가
        </Button>
      </div>

      {/* Default Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>기본 결제 방법</CardTitle>
          <CardDescription>
            시스템에서 제공하는 기본 결제 방법들입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {defaultMethods.map((method) => (
              <div key={method} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">{method}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 정의 결제 방법</CardTitle>
          <CardDescription>
            가구에서 추가한 사용자 정의 결제 방법들입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              사용자 정의 결제 방법이 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((method) => {
                const IconComponent = getIconComponent(method.icon || 'CreditCard')
                return (
                  <div key={method.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: method.color ? `${method.color}20` : undefined, color: method.color || undefined }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium flex items-center gap-1">
                            {method.name}
                            {method.is_default && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </h3>
                          {method.description && (
                            <p className="text-sm text-gray-600">{method.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(method)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(method)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>생성: {new Date(method.created_at).toLocaleDateString()}</span>
                      {method.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          기본값
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false)
          setShowEditModal(false)
          resetForm()
          setSelectedMethod(null)
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMethod ? '결제 방법 수정' : '결제 방법 추가'}
            </DialogTitle>
            <DialogDescription>
              새로운 결제 방법을 추가하거나 기존 방법을 수정하세요
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 삼성카드, 카카오페이"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="선택사항: 결제 방법에 대한 설명"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>아이콘</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_ICONS.map((icon) => {
                      const IconComponent = icon.icon
                      return (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>색상</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_default">기본 결제 방법으로 설정</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  resetForm()
                  setSelectedMethod(null)
                }}
                disabled={formLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? '저장 중...' : selectedMethod ? '수정' : '추가'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}