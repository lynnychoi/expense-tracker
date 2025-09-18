'use client'

import { useState, useMemo } from 'react'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useTransactions, type Transaction } from '@/contexts/TransactionContext'
import { usePaymentMethods } from '@/contexts/PaymentMethodContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Search, Filter, X, SortAsc, SortDesc } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { formatKRW } from '@/lib/currency'
import { DEFAULT_KOREAN_TAGS, getTagColor } from '@/lib/colors'
import type { DateRange } from 'react-day-picker'

interface TransactionSearchProps {
  onResultsChange: (transactions: Transaction[]) => void
  className?: string
}

type SortField = 'date' | 'amount' | 'description'
type SortDirection = 'asc' | 'desc'

interface SearchFilters {
  query: string
  type: 'all' | 'income' | 'expense'
  dateRange?: DateRange
  personType: 'all' | 'member' | 'household'
  personId: string
  paymentMethod: string
  tags: string[]
  amountMin: string
  amountMax: string
}

// Payment methods will be loaded from context

export function TransactionSearch({ onResultsChange, className }: TransactionSearchProps) {
  const { householdMembers } = useHousehold()
  const { transactions } = useTransactions()
  const { getAllPaymentMethods } = usePaymentMethods()
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    personType: 'all',
    personId: '',
    paymentMethod: '',
    tags: [],
    amountMin: '',
    amountMax: ''
  })
  
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Get all unique tags from transactions
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    transactions.forEach(transaction => {
      transaction.tags.forEach(tag => {
        tagSet.add(tag.tag_name)
      })
    })
    return Array.from(tagSet).sort()
  }, [transactions])

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(transaction => {
      // Text search in description
      if (filters.query && !transaction.description.toLowerCase().includes(filters.query.toLowerCase())) {
        return false
      }

      // Transaction type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false
      }

      // Date range filter
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const transactionDate = new Date(transaction.date)
        if (filters.dateRange.from && transactionDate < filters.dateRange.from) {
          return false
        }
        if (filters.dateRange.to && transactionDate > filters.dateRange.to) {
          return false
        }
      }

      // Person type filter
      if (filters.personType !== 'all' && transaction.person_type !== filters.personType) {
        return false
      }

      // Person ID filter
      if (filters.personId && transaction.person_id !== filters.personId) {
        return false
      }

      // Payment method filter
      if (filters.paymentMethod && transaction.payment_method !== filters.paymentMethod) {
        return false
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const transactionTags = transaction.tags.map(tag => tag.tag_name)
        const hasMatchingTag = filters.tags.some(filterTag => transactionTags.includes(filterTag))
        if (!hasMatchingTag) {
          return false
        }
      }

      // Amount range filter
      if (filters.amountMin) {
        const minAmount = parseInt(filters.amountMin.replace(/[^0-9]/g, ''))
        if (transaction.amount < minAmount) {
          return false
        }
      }
      if (filters.amountMax) {
        const maxAmount = parseInt(filters.amountMax.replace(/[^0-9]/g, ''))
        if (transaction.amount > maxAmount) {
          return false
        }
      }

      return true
    })

    // Sort results
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'description':
          comparison = a.description.localeCompare(b.description)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [transactions, filters, sortField, sortDirection])

  // Update results when filtered transactions change
  useMemo(() => {
    onResultsChange(filteredTransactions)
  }, [filteredTransactions, onResultsChange])

  const handleAmountChange = (value: string, field: 'amountMin' | 'amountMax') => {
    const digits = value.replace(/[^0-9]/g, '')
    const formatted = digits ? parseInt(digits).toLocaleString('ko-KR') : ''
    setFilters(prev => ({ ...prev, [field]: formatted }))
  }

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      setFilters(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFilters(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      type: 'all',
      personType: 'all',
      personId: '',
      paymentMethod: '',
      tags: [],
      amountMin: '',
      amountMax: ''
    })
  }

  const hasActiveFilters = filters.query || filters.type !== 'all' || filters.dateRange?.from || 
    filters.personType !== 'all' || filters.personId || filters.paymentMethod || 
    filters.tags.length > 0 || filters.amountMin || filters.amountMax

  return (
    <div className={cn("space-y-4", className)}>
      {/* Basic Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="거래 내용 검색..."
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={showAdvanced ? 'bg-gray-100' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          필터
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            초기화
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Transaction Type */}
            <div className="space-y-2">
              <Label>거래 유형</Label>
              <Select value={filters.type} onValueChange={(value: any) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="income">수입</SelectItem>
                  <SelectItem value="expense">지출</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>날짜 범위</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "yyyy-MM-dd", { locale: ko })} -{" "}
                          {format(filters.dateRange.to, "yyyy-MM-dd", { locale: ko })}
                        </>
                      ) : (
                        format(filters.dateRange.from, "yyyy-MM-dd", { locale: ko })
                      )
                    ) : (
                      "날짜 선택"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Person Type */}
            <div className="space-y-2">
              <Label>사용자 유형</Label>
              <Select value={filters.personType} onValueChange={(value: any) => setFilters(prev => ({ ...prev, personType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="member">개인</SelectItem>
                  <SelectItem value="household">가구 공통</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Person ID (if member type selected) */}
            {filters.personType === 'member' && (
              <div className="space-y-2">
                <Label>구성원</Label>
                <Select value={filters.personId} onValueChange={(value) => setFilters(prev => ({ ...prev, personId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="구성원 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체</SelectItem>
                    {householdMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user?.name || 'Unknown User'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>결제 방법</Label>
              <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="결제 방법 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  {getAllPaymentMethods().map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label>금액 범위</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="최소 금액"
                  value={filters.amountMin}
                  onChange={(e) => handleAmountChange(e.target.value, 'amountMin')}
                />
                <Input
                  placeholder="최대 금액"
                  value={filters.amountMax}
                  onChange={(e) => handleAmountChange(e.target.value, 'amountMax')}
                />
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <Label>태그</Label>
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {filters.tags.map((tag) => {
                  const color = getTagColor('blue')
                  return (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{
                        backgroundColor: color?.bg,
                        color: color?.text,
                        borderColor: color?.hex
                      }}
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {availableTags.filter(tag => !filters.tags.includes(tag)).map((tag) => {
                const color = getTagColor('gray')
                return (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tag)}
                    className="h-8"
                    style={{
                      backgroundColor: color?.bg,
                      color: color?.text,
                      borderColor: color?.hex
                    }}
                  >
                    {tag}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <Label className="text-sm">정렬:</Label>
        <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">날짜</SelectItem>
            <SelectItem value="amount">금액</SelectItem>
            <SelectItem value="description">설명</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
        >
          {sortDirection === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
        </Button>
        <span className="text-sm text-gray-500">
          {filteredTransactions.length}개 결과
        </span>
      </div>
    </div>
  )
}