'use client'

import { useState } from 'react'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { usePaymentMethods } from '@/contexts/PaymentMethodContext'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CalendarIcon, PlusIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatKRW } from '@/lib/currency'
import { ReceiptUpload } from '@/components/receipts/ReceiptUpload'
import { uploadReceiptImage } from '@/lib/storage'
import { TagAutocomplete } from '@/components/tags/TagAutocomplete'
import { DEFAULT_KOREAN_TAGS } from '@/lib/colors'
import { DuplicateWarning } from './DuplicateWarning'
import { detectDuplicates, type DuplicateMatch } from '@/lib/duplicateDetection'

interface AddTransactionModalProps {
  children: React.ReactNode
  onTransactionAdded?: () => void
}

// Payment methods will be loaded from context

export function AddTransactionModal({ children, onTransactionAdded }: AddTransactionModalProps) {
  const { user } = useAuth()
  const { currentHousehold, householdMembers } = useHousehold()
  const { createTransaction, transactions } = useTransactions()
  const { getAllPaymentMethods } = usePaymentMethods()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [personType, setPersonType] = useState<'member' | 'household'>('member')
  const [personId, setPersonId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  // Check for duplicates when key fields change
  const checkForDuplicates = () => {
    if (!amount || !description.trim() || !paymentMethod || !currentHousehold) {
      setDuplicateMatches([])
      setShowDuplicateWarning(false)
      return
    }

    const amountNum = parseInt(amount.replace(/[^0-9]/g, ''))
    if (amountNum <= 0) return

    const transactionData = {
      type,
      amount: amountNum,
      description,
      date: (date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]) as string,
      person_type: personType,
      person_id: personType === 'household' ? undefined : personId,
      payment_method: paymentMethod,
      household_id: currentHousehold.id,
      created_by: user?.id || '',
      updated_by: user?.id || ''
    }

    const matches = detectDuplicates(transactionData, transactions)
    setDuplicateMatches(matches)
    setShowDuplicateWarning(matches.length > 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHousehold || !user) return

    setError('')
    setLoading(true)

    try {
      // Validation
      const amountNum = parseInt(amount.replace(/[^0-9]/g, ''))
      if (!amountNum || amountNum <= 0) {
        throw new Error('올바른 금액을 입력하세요')
      }
      
      if (!description.trim()) {
        throw new Error('설명을 입력하세요')
      }
      
      if (!paymentMethod) {
        throw new Error('결제 방법을 선택하세요')
      }
      
      if (personType === 'member' && !personId) {
        throw new Error('구성원을 선택하세요')
      }

      // First create the transaction
      const result = await createTransaction({
        type,
        amount: amountNum,
        description,
        date: (date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]) as string,
        person_type: personType,
        person_id: personType === 'household' ? undefined : personId,
        payment_method: paymentMethod,
        tags
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Upload receipt if provided
      if (receiptFile && result.data) {
        const uploadResult = await uploadReceiptImage(
          receiptFile,
          user.id,
          result.data.id
        )
        
        if (uploadResult.error) {
          console.warn('Receipt upload failed:', uploadResult.error)
          // Don't fail the transaction creation, just warn
        } else if (uploadResult.data) {
          // Update transaction with receipt URL
          // Note: We'll need to add receipt_url field to updateTransaction later
          console.log('Receipt uploaded successfully:', uploadResult.data.publicUrl)
        }
      }

      // Reset form
      setType('expense')
      setAmount('')
      setDescription('')
      setDate(new Date())
      setPersonType('member')
      setPersonId('')
      setPaymentMethod('')
      setTags([])
      setReceiptFile(null)
      setUploadError('')
      setDuplicateMatches([])
      setShowDuplicateWarning(false)
      
      setOpen(false)
      onTransactionAdded?.()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAmountChange = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/[^0-9]/g, '')
    
    // Format with commas
    if (digits) {
      const formatted = parseInt(digits).toLocaleString('ko-KR')
      setAmount(formatted)
    } else {
      setAmount('')
    }
    
    // Trigger duplicate check after amount change
    setTimeout(checkForDuplicates, 500)
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>거래 추가</DialogTitle>
          <DialogDescription>
            새로운 수입 또는 지출을 기록하세요
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Duplicate Warning */}
          {showDuplicateWarning && (
            <DuplicateWarning
              matches={duplicateMatches}
              onDismiss={() => setShowDuplicateWarning(false)}
              className="mb-4"
            />
          )}

          {/* Transaction Type */}
          <div className="space-y-3">
            <Label>거래 유형</Label>
            <RadioGroup value={type} onValueChange={(value: 'expense' | 'income') => setType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense">지출</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income">수입</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액</Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="pl-8"
                required
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₩</span>
            </div>
            {amount && (
              <p className="text-sm text-gray-500">
                {formatKRW(parseInt(amount.replace(/[^0-9]/g, '')) || 0)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setTimeout(checkForDuplicates, 500)
              }}
              placeholder="예: 마트에서 장보기"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">날짜</Label>
            <Input
              id="date"
              type="date"
              value={date ? date.toISOString().split('T')[0] : ''}
              onChange={(e) => setDate(new Date(e.target.value))}
              required
            />
          </div>

          {/* Person */}
          <div className="space-y-3">
            <Label>사용자</Label>
            <RadioGroup value={personType} onValueChange={(value: 'member' | 'household') => setPersonType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member">개인</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="household" id="household" />
                <Label htmlFor="household">가구 공통</Label>
              </div>
            </RadioGroup>
            
            {personType === 'member' && (
              <Select value={personId} onValueChange={setPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder="구성원을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {householdMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user?.name || 'Unknown User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>결제 방법</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="결제 방법을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {getAllPaymentMethods().map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <TagAutocomplete
            value={tags}
            onChange={setTags}
            existingTags={DEFAULT_KOREAN_TAGS.map(tag => tag.name)}
            disabled={loading}
            label="태그"
            placeholder="태그를 선택하거나 새로 만들어보세요"
            maxTags={5}
          />

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>영수증 (선택사항)</Label>
            <ReceiptUpload
              onFileSelect={(file) => {
                setReceiptFile(file)
                setUploadError('')
              }}
              onFileRemove={() => {
                setReceiptFile(null)
                setUploadError('')
              }}
              currentFile={receiptFile || undefined}
              disabled={loading}
              error={uploadError}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}