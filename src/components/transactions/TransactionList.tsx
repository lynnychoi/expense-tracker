'use client'

import { useState } from 'react'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useTransactions, type Transaction } from '@/contexts/TransactionContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Edit, Trash2, Calendar, CreditCard, User, Users } from 'lucide-react'
import { formatKRW } from '@/lib/currency'
import { getTagColor, getNextAvailableColor } from '@/lib/colors'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface TransactionListProps {
  transactions: Transaction[]
  className?: string
}

export function TransactionList({ transactions, className }: TransactionListProps) {
  const { householdMembers } = useHousehold()
  const { deleteTransaction } = useTransactions()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const getUserName = (personType: 'member' | 'household', personId?: string | null) => {
    if (personType === 'household') return '가구 공통'
    if (personId) {
      const member = householdMembers.find(m => m.user_id === personId)
      return member?.user.name || '알 수 없음'
    }
    return '알 수 없음'
  }

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowDetails(true)
  }

  const handleDelete = async (transaction: Transaction) => {
    if (confirm('이 거래를 삭제하시겠습니까?')) {
      await deleteTransaction(transaction.id)
    }
  }

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <div className="text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">거래 내역이 없습니다</p>
            <p className="text-sm text-gray-500">검색 조건을 변경하거나 새로운 거래를 추가해보세요</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                {/* Transaction Info */}
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={transaction.type === 'income' ? 'default' : 'secondary'}
                      className={transaction.type === 'income' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                      }
                    >
                      {transaction.type === 'income' ? '수입' : '지출'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {format(new Date(transaction.date), 'yyyy년 MM월 dd일', { locale: ko })}
                    </span>
                  </div>

                  {/* Description */}
                  <h3 className="font-medium text-lg">{transaction.description}</h3>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      {transaction.payment_method}
                    </div>
                    <div className="flex items-center gap-1">
                      {transaction.person_type === 'household' ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      {getUserName(transaction.person_type, transaction.person_id)}
                    </div>
                  </div>

                  {/* Tags */}
                  {transaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {transaction.tags.map((tag, index) => {
                        const color = getNextAvailableColor([])
                        return (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: color.bg,
                              color: color.text,
                              borderColor: color.hex
                            }}
                          >
                            {tag.tag_name}
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Amount and Actions */}
                <div className="text-right space-y-2">
                  <div className={`text-xl font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatKRW(transaction.amount)}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(transaction)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(transaction)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>거래 상세 정보</DialogTitle>
            <DialogDescription>
              거래의 세부 정보를 확인할 수 있습니다
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              {/* Type and Amount */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant={selectedTransaction.type === 'income' ? 'default' : 'secondary'}
                  className={selectedTransaction.type === 'income' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                  }
                >
                  {selectedTransaction.type === 'income' ? '수입' : '지출'}
                </Badge>
                <div className={`text-2xl font-bold ${
                  selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'}{formatKRW(selectedTransaction.amount)}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedTransaction.description}</h3>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">날짜</label>
                  <p>{format(new Date(selectedTransaction.date), 'yyyy년 MM월 dd일', { locale: ko })}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">결제 방법</label>
                  <p>{selectedTransaction.payment_method}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">사용자</label>
                  <p>{getUserName(selectedTransaction.person_type, selectedTransaction.person_id)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">생성일</label>
                  <p>{format(new Date(selectedTransaction.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedTransaction.tags.length > 0 && (
                <div>
                  <label className="font-medium text-gray-700 block mb-2">태그</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTransaction.tags.map((tag) => {
                      const color = getNextAvailableColor([])
                      return (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          style={{
                            backgroundColor: color.bg,
                            color: color.text,
                            borderColor: color.hex
                          }}
                        >
                          {tag.tag_name}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleDelete(selectedTransaction)}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="flex-1"
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}